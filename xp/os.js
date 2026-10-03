/* ============================================================
   Sandhu XP: core (utilities, window manager, boot, login,
   desktop, taskbar, start menu, wallpaper, sound, routing)
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- Utilities ---------------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (name) => (window.ICONS && ICONS[name]) || ICONS.folder;
  const isTouch = () => matchMedia('(pointer: coarse)').matches || innerWidth <= 760;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
    sget(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    sset(k, v) { try { sessionStorage.setItem(k, v); } catch {} },
  };

  /** Build an element from an HTML string. */
  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  const linkify = (s) => esc(s).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');

  /** Turn a free-text field into HTML: "- item" lines become lists, blank lines split paragraphs. */
  function fmt(text) {
    if (!text) return '';
    const out = [];
    let list = null, para = [];
    const flushPara = () => { para.forEach((p) => out.push('<p>' + linkify(p) + '</p>')); para = []; };
    const flushList = () => { if (list) { out.push('<ul>' + list.map((li) => '<li>' + linkify(li) + '</li>').join('') + '</ul>'); list = null; } };
    for (const line of String(text).split('\n')) {
      const m = line.match(/^\s*[-•*]\s*(.*)$/);
      if (m) { flushPara(); if (m[1].trim()) (list ||= []).push(m[1]); }
      else if (!line.trim()) { flushPara(); flushList(); }
      else { flushList(); para.push(line.trim()); }
    }
    flushPara(); flushList();
    return out.join('');
  }

  /** Parse a LINKS field: "Label | url" or a bare url per line. */
  function parseLinks(text) {
    return String(text || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
      const parts = l.split('|').map((s) => s.trim());
      const url = parts.find((p) => /^(https?:|mailto:)/.test(p));
      if (!url) return null;
      const label = parts.find((p) => p !== url) || url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
      return { label, url };
    }).filter(Boolean);
  }
  const youtubeId = (url) => (url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/) || [])[1];

  /* ---------------- Content helpers ---------------- */
  const CONTENT = window.CONTENT || { children: [] };
  const slug = (n) => n.name.replace(/^\d+[_\-. ]+/, '').toLowerCase();
  const child = (parent, key) => parent && parent.children.find((c) => slug(c) === key);
  const section = (key) => child(CONTENT, key);
  const hasInfo = (n) => n && Object.values(n.info || {}).some((v) => v && v.trim());
  const about = () => section('about-me') || { info: {}, images: [], docs: [], children: [] };
  const avatarSrc = () => (about().images.find((i) => /^photo\./i.test(i.file)) || about().images[0] || {}).src || '';
  const resumeSrc = () => (about().docs.find((d) => d.ext === 'pdf') || {}).src || '';

  /* ---------------- Sound (synthesised, off by default) ---------------- */
  const Sound = {
    on: store.get('xp-sound') === 'on',
    ctx: null,
    set(on) { this.on = on; store.set('xp-sound', on ? 'on' : 'off'); renderTraySound(); if (on) this.play('ding'); },
    play(kind) {
      if (!this.on) return;
      try {
        this.ctx ||= new (window.AudioContext || window.webkitAudioContext)();
        const notes = { startup: [[392, 0], [523.25, .18], [659.25, .36], [783.99, .54], [1046.5, .78]], shutdown: [[783.99, 0], [659.25, .2], [523.25, .4], [392, .62]], ding: [[880, 0], [1318.5, .09]] }[kind] || [];
        const t0 = this.ctx.currentTime + .02;
        for (const [f, at] of notes) {
          const o = this.ctx.createOscillator(), g = this.ctx.createGain();
          o.type = 'sine'; o.frequency.value = f;
          g.gain.setValueAtTime(0, t0 + at); g.gain.linearRampToValueAtTime(.13, t0 + at + .03); g.gain.exponentialRampToValueAtTime(.001, t0 + at + .9);
          o.connect(g).connect(this.ctx.destination); o.start(t0 + at); o.stop(t0 + at + 1);
        }
      } catch {}
    },
  };
  function renderTraySound() {
    const b = $('#tray-sound');
    if (!b) return;
    b.innerHTML = icon(Sound.on ? 'speaker' : 'speakerOff');
    b.title = Sound.on ? 'Sound is on. Click to mute.' : 'Sound is off. Click to turn on.';
  }

  /* ---------------- Window manager ---------------- */
  const WM = {
    wins: new Map(),
    z: 100,
    cascade: 0,
    open(o) {
      if (this.wins.has(o.id)) { const w = this.wins.get(o.id); if (o.onReopen) o.onReopen(w); this.restore(o.id); return w; }
      const area = $('#windows').getBoundingClientRect();
      const W = Math.min(o.width || 640, area.width - 20), H = Math.min(o.height || 460, area.height - 20);
      const step = (this.cascade++ % 8) * 26;
      const x = o.center ? (area.width - W) / 2 : Math.min(110 + step, area.width - W - 10);
      const y = o.center ? Math.max(10, (area.height - H) / 2.4) : Math.min(24 + step, area.height - H - 10);
      const node = el(`
        <div class="window xpwin" role="dialog" aria-label="${esc(o.title)}" style="left:${x}px;top:${y}px;width:${W}px;height:${H}px">
          <div class="title-bar">
            <div class="title-bar-text">${icon(o.icon)}<span>${esc(o.title)}</span></div>
            <div class="title-bar-controls">
              <button aria-label="Minimize"></button>
              ${o.resizable === false ? '' : '<button aria-label="Maximize"></button>'}
              <button aria-label="Close"></button>
            </div>
          </div>
          <div class="window-body"></div>
          ${o.resizable === false ? '' : '<div class="resize"></div>'}
        </div>`);
      const body = $('.window-body', node);
      if (o.menu) body.appendChild(el(`<div class="menubar">${o.menu.map((m) => `<span>${esc(m)}</span>`).join('')}</div>`));
      if (typeof o.content === 'string') body.insertAdjacentHTML('beforeend', o.content); else if (o.content) body.appendChild(o.content);
      if (o.status) body.appendChild(el(`<div class="statusbar">${[].concat(o.status).map((s) => `<div>${esc(s)}</div>`).join('')}</div>`));

      const win = { ...o, node, body };
      this.wins.set(o.id, win);
      $('#windows').appendChild(node);

      node.addEventListener('pointerdown', () => this.focus(o.id), true);
      $('[aria-label=Minimize]', node).onclick = () => this.minimize(o.id);
      $('[aria-label=Close]', node).onclick = () => this.close(o.id);
      const max = $('[aria-label=Maximize]', node);
      if (max) max.onclick = () => this.toggleMax(o.id);
      const bar = $('.title-bar', node);
      bar.addEventListener('dblclick', (e) => { if (!e.target.closest('button') && max) this.toggleMax(o.id); });
      drag(bar, node, 'move');
      const rz = $('.resize', node);
      if (rz) drag(rz, node, 'resize');
      if (o.maximized) this.toggleMax(o.id);

      const task = el(`<button class="task" title="${esc(o.title)}">${icon(o.icon)}<span>${esc(o.title)}</span></button>`);
      task.onclick = () => (win.node.classList.contains('active') && !win.node.classList.contains('minimized') ? this.minimize(o.id) : this.restore(o.id));
      win.task = task;
      $('#tasks').appendChild(task);

      this.focus(o.id);
      if (o.onOpen) o.onOpen(win);
      return win;
    },
    focus(id) {
      const w = this.wins.get(id);
      if (!w) return;
      this.wins.forEach((x) => { x.node.classList.remove('active'); x.task.classList.remove('on'); });
      w.node.style.zIndex = ++this.z;
      w.node.classList.add('active');
      w.task.classList.add('on');
      Router.set(w.hash || '');
    },
    restore(id) { const w = this.wins.get(id); if (!w) return; w.node.classList.remove('minimized'); this.focus(id); },
    minimize(id) {
      const w = this.wins.get(id);
      if (!w) return;
      w.node.classList.add('minimized');
      w.node.classList.remove('active'); w.task.classList.remove('on');
      this.focusTop();
    },
    toggleMax(id) {
      const w = this.wins.get(id);
      if (!w) return;
      const m = w.node.classList.toggle('maximized');
      const b = $('[aria-label=Maximize], [aria-label=Restore]', w.node);
      if (b) b.setAttribute('aria-label', m ? 'Restore' : 'Maximize');
    },
    close(id) {
      const w = this.wins.get(id);
      if (!w) return;
      this.wins.delete(id);
      w.task.remove();
      if (w.onClose) w.onClose(w);
      w.node.classList.add('closing');
      setTimeout(() => w.node.remove(), 120);
      this.focusTop();
    },
    closeAll() { [...this.wins.keys()].forEach((id) => this.close(id)); },
    focusTop() {
      let top = null;
      this.wins.forEach((w) => { if (!w.node.classList.contains('minimized') && (!top || +w.node.style.zIndex > +top.node.style.zIndex)) top = w; });
      if (top) this.focus(top.id); else Router.set('');
    },
    setTitle(id, title) {
      const w = this.wins.get(id);
      if (!w) return;
      $('.title-bar-text span', w.node).textContent = title;
      $('span', w.task).textContent = title;
      w.task.title = title;
    },
  };

  function drag(handle, node, mode) {
    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('button') || node.classList.contains('maximized') || innerWidth <= 760) return;
      e.preventDefault();
      const sx = e.clientX, sy = e.clientY, r = node.getBoundingClientRect(), area = $('#windows').getBoundingClientRect();
      const move = (ev) => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (mode === 'move') {
          node.style.left = Math.max(-r.width + 80, Math.min(area.width - 80, r.left + dx)) + 'px';
          node.style.top = Math.max(0, Math.min(area.height - 30, r.top + dy)) + 'px';
        } else {
          node.style.width = Math.max(260, r.width + dx) + 'px';
          node.style.height = Math.max(160, r.height + dy) + 'px';
        }
      };
      const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
      addEventListener('pointermove', move);
      addEventListener('pointerup', up);
    });
  }

  /* ---------------- Routing (#/projects/happy-plug deep links) ---------------- */
  const Router = {
    routes: {},
    set(hash) { const h = hash ? '#/' + hash : location.pathname + location.search; if (('#/' + hash) !== location.hash) history.replaceState(null, '', h); },
    go(hash) {
      const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
      for (let i = parts.length; i > 0; i--) {
        const key = parts.slice(0, i).join('/');
        if (this.routes[key]) { this.routes[key](parts.slice(i)); return true; }
      }
      return false;
    },
  };

  /* ---------------- Selectable icon grids (desktop + explorer) ---------------- */
  /** Wires click-to-select, double-click (or tap on touch) to open, Enter to open, arrows to move. */
  function wireIcons(container, selector, onOpen, onSelect) {
    container.addEventListener('click', (e) => {
      const it = e.target.closest(selector);
      $$(selector + '.selected', container).forEach((x) => x.classList.remove('selected'));
      if (!it) { onSelect && onSelect(null); return; }
      it.classList.add('selected');
      onSelect && onSelect(it);
      if (isTouch()) onOpen(it);
    });
    container.addEventListener('dblclick', (e) => { const it = e.target.closest(selector); if (it && !isTouch()) onOpen(it); });
    container.addEventListener('keydown', (e) => {
      const it = e.target.closest(selector);
      if (!it) return;
      if (e.key === 'Enter') { e.preventDefault(); onOpen(it); }
      const items = $$(selector, container), i = items.indexOf(it);
      const nxt = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (nxt && items[i + nxt]) { e.preventDefault(); items[i + nxt].focus(); items[i + nxt].click(); }
    });
  }

  /* ---------------- Wallpaper + Tao Te Ching ---------------- */
  function renderWallpaper() {
    $('#wallpaper').innerHTML = `
      <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="wp-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c56c8"/><stop offset=".5" stop-color="#3f86e3"/><stop offset="1" stop-color="#78b6f0"/></linearGradient>
          <linearGradient id="wp-hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6cc531"/><stop offset=".4" stop-color="#46a51b"/><stop offset="1" stop-color="#27740f"/></linearGradient>
          <linearGradient id="wp-hill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f9e26"/><stop offset="1" stop-color="#2a7215"/></linearGradient>
        </defs>
        <rect width="1600" height="1000" fill="url(#wp-sky)"/>
        <path d="M0 640 C 260 560 520 600 820 640 S 1350 610 1600 560 V1000 H0z" fill="url(#wp-hill2)"/>
        <path d="M-40 760 C 220 610 560 560 900 620 C 1180 670 1380 700 1640 640 V1000 H-40z" fill="url(#wp-hill)"/>
        <path d="M-40 760 C 220 610 560 560 900 620 C 1180 670 1380 700 1640 640" fill="none" stroke="#9fe360" stroke-width="2"/>
      </svg>`;
  }

  function taoToday() {
    const now = new Date();
    const day = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);
    const n = ((day - 1) % 81) + 1;
    return { n, paras: (window.TAO || [])[n - 1] || [] };
  }
  function renderTao() {
    const { n, paras } = taoToday();
    if (!paras.length) return;
    let q = paras[0];
    if (q.length > 260) q = q.slice(0, q.lastIndexOf(' ', 250)) + '…';
    $('#tao').innerHTML = `<blockquote>${esc(q)}</blockquote><cite>Tao Te Ching · Chapter ${n} · verse of the day</cite>`;
  }
  function openTao() {
    const { n, paras } = taoToday();
    const text = `Tao Te Ching, Chapter ${n}\nTranslated by James Legge (1891)\n${'-'.repeat(40)}\n\n${paras.join('\n\n')}\n\n\n(A new chapter appears on the desktop every day.)`;
    WM.open({ id: 'tao', title: `Chapter ${n}.txt - Notepad`, icon: 'notepad', width: 520, height: 440, menu: ['File', 'Edit', 'Format', 'View', 'Help'],
      content: `<pre class="notepad">${esc(text)}</pre>`, hash: 'tao' });
  }

  /* ---------------- Desktop ---------------- */
  const DESKTOP = [];
  function addDesktopIcon(def) { DESKTOP.push(def); }

  function renderDesktop() {
    const box = $('#icons');
    box.innerHTML = DESKTOP.map((d, i) => `<button class="icon" role="listitem" data-i="${i}" title="${esc(d.tip || d.label)}">${icon(typeof d.icon === 'function' ? d.icon() : d.icon)}<span>${esc(d.label)}</span></button>`).join('');
    wireIcons(box, '.icon', (it) => DESKTOP[it.dataset.i].open());
  }

  function tickClock() {
    $('#clock').textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  /* ---------------- Start menu ---------------- */
  const START = { left: [], right: [] };
  function renderStart() {
    const a = about().info;
    const item = (d, i, side) => d === '-' ? '<div class="sm-sep"></div>'
      : `<button class="sm-item" role="menuitem" data-side="${side}" data-i="${i}">${icon(d.icon)}<span><b>${esc(d.label)}</b>${d.sub ? `<small>${esc(d.sub)}</small>` : ''}</span></button>`;
    const m = $('#start-menu');
    m.innerHTML = `
      <div class="sm-head"><img src="${esc(avatarSrc())}" alt="">${esc(a.name || 'Satinder Sandhu')}</div>
      <div class="sm-body" role="menu">
        <div class="sm-left">${START.left.map((d, i) => item(d, i, 'left')).join('')}</div>
        <div class="sm-right">${START.right.map((d, i) => item(d, i, 'right')).join('')}</div>
      </div>
      <div class="sm-foot">
        <button data-act="logoff">${icon('logoff')}Log Off</button>
        <button data-act="off">${icon('power')}Turn Off Computer</button>
      </div>`;
    m.onclick = (e) => {
      const b = e.target.closest('.sm-item, [data-act]');
      if (!b) return;
      toggleStart(false);
      if (b.dataset.act === 'logoff') return logOff();
      if (b.dataset.act === 'off') return turnOffDialog();
      START[b.dataset.side][b.dataset.i].open();
    };
  }
  function toggleStart(force) {
    const m = $('#start-menu'), open = force ?? m.hidden;
    m.hidden = !open;
    $('#start-btn').classList.toggle('open', open);
  }

  /* ---------------- Balloon tip ---------------- */
  function balloon(title, text, ms = 14000) {
    const b = el(`<div class="balloon" role="status"><b>${icon('help')}${esc(title)}</b>${esc(text)}<button class="x" aria-label="Close">✕</button></div>`);
    $('#desktop').appendChild(b);
    const tray = $('#tray').getBoundingClientRect();
    b.style.right = Math.max(8, innerWidth - tray.right + 10) + 'px';
    b.style.bottom = (innerHeight - tray.top + 14) + 'px';
    const kill = () => b.remove();
    $('.x', b).onclick = kill;
    b.onclick = kill;
    setTimeout(kill, ms);
  }

  /* ---------------- Boot / login / logoff / shutdown ---------------- */
  function boot() {
    const b = $('#boot');
    let done = false;
    const finish = () => { if (done) return; done = true; b.hidden = true; showLogin(); };
    b.onclick = finish;
    setTimeout(finish, 2800);
  }

  function showLogin() {
    const a = about().info;
    $('#login').hidden = false;
    $('#desktop').hidden = true;
    const av = $('#login-avatar');
    if (av) { if (avatarSrc()) av.src = avatarSrc(); else av.remove(); }
    $('#login-name').textContent = a.name ? a.name.replace(/ Pal Singh/, '') : 'Satinder Sandhu';
    $('#login-headline').textContent = a.headline || '';
    $('#user-tile').focus();
  }

  function logIn(fast) {
    store.sset('xp-in', '1');
    $('#login').hidden = true;
    $('#boot').hidden = true;
    const show = () => {
      $('#desktop').hidden = false;
      Sound.play('startup');
      if (!store.sget('xp-tip')) {
        store.sset('xp-tip', '1');
        setTimeout(() => balloon('Welcome to Sandhu XP', (isTouch() ? 'Tap' : 'Double-click') + ' any icon to open it. Start with My Projects, or About Me if you\'re in a hurry.'), 900);
      }
    };
    if (fast) return show();
    const w = el('<div class="login-welcome">welcome</div>');
    document.body.appendChild(w);
    setTimeout(() => { w.remove(); show(); }, 900);
  }

  function logOff() {
    WM.closeAll();
    store.sset('xp-in', '');
    Router.set('');
    showLogin();
  }

  function turnOffDialog() {
    const o = el(`
      <div class="overlay dim">
        <div class="turnoff" role="dialog" aria-label="Turn off computer">
          <header><span>Turn off computer</span>${icon('orb').replace('<svg', '<svg width="26" height="26"')}</header>
          <main>
            <button data-a="classic">${icon('classic')}<span>Classic Mode</span></button>
            <button data-a="off">${icon('power')}<span>Turn Off</span></button>
            <button data-a="restart">${icon('logoff')}<span>Restart</span></button>
          </main>
          <footer><button data-a="cancel">Cancel</button></footer>
        </div>
      </div>`);
    document.body.appendChild(o);
    o.onclick = (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (!a && e.target !== o) return;
      o.remove();
      if (a === 'classic') location.href = 'classic/';
      if (a === 'restart') { store.sset('xp-in', ''); location.href = location.pathname; }
      if (a === 'off') {
        Sound.play('shutdown');
        WM.closeAll();
        const s = el(`<div class="overlay safe"><div>It's now safe to close this tab.</div><button>Turn it back on</button></div>`);
        document.body.appendChild(s);
        $('button', s).onclick = () => { store.sset('xp-in', ''); location.href = location.pathname; };
      }
    };
  }

  /* ---------------- Start-up ---------------- */
  function init() {
    $$('[data-icon]').forEach((s) => (s.outerHTML = icon(s.dataset.icon)));
    renderWallpaper();
    renderTao();
    renderTraySound();
    renderDesktop();
    renderStart();
    tickClock();
    setInterval(tickClock, 15000);

    $('#user-tile').onclick = () => logIn();
    $('#classic-btn').onclick = () => (location.href = 'classic/');
    $('#tao').onclick = openTao;
    $('#tao').onkeydown = (e) => e.key === 'Enter' && openTao();
    $('#tray-sound').onclick = () => Sound.set(!Sound.on);
    $('#start-btn').onclick = (e) => { e.stopPropagation(); toggleStart(); };
    document.addEventListener('pointerdown', (e) => { if (!e.target.closest('#start-menu, #start-btn')) toggleStart(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleStart(false); });

    Router.routes.tao = openTao;
    const deep = location.hash.startsWith('#/');
    if (deep || store.sget('xp-in')) {
      $('#boot').hidden = true;
      logIn(true);
      if (deep) Router.go(location.hash);
    } else {
      boot();
    }
  }

  window.XP = { $, $$, el, esc, icon, fmt, linkify, parseLinks, youtubeId, isTouch, store, WM, Router, Sound, wireIcons, balloon,
    CONTENT, slug, child, section, hasInfo, about, avatarSrc, resumeSrc, addDesktopIcon, START, openTao, toggleStart };
  document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0));
})();

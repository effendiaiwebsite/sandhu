/* ============================================================
   Sandhu XP: applications
   Explorer · Project viewer · Picture viewer · Media player ·
   Music player · Messenger (socials) · Outlook (ideas) ·
   WordPad / PDF reader · System Properties (about me)
   ============================================================ */
(function () {
  'use strict';
  const { $, $$, el, esc, icon, fmt, parseLinks, youtubeId, isTouch, WM, Router, wireIcons, CONTENT, slug, child, section, hasInfo, about, avatarSrc, resumeSrc } = XP;

  /* ---------------- Lookups ---------------- */
  const walk = (n, fn, parent = null) => { fn(n, parent); n.children.forEach((c) => walk(c, fn, n)); };
  const parents = new Map();
  walk(CONTENT, (n, p) => parents.set(n, p));
  const pathOf = (n) => { const out = []; for (let x = n; x && x !== CONTENT; x = parents.get(x)) out.unshift(slug(x)); return out; };
  const nodeAt = (parts) => parts.reduce((n, s) => n && child(n, s), CONTENT);
  const findProject = (s) => { let hit = null; walk(CONTENT, (n) => { if (!hit && slug(n) === s && hasInfo(n)) hit = n; }); return hit; };
  const empty = (msg, ic = 'folder') => `<div class="empty">${icon(ic)}${msg}</div>`;

  /** Theme icon for a node, chosen by its folder name. */
  function iconFor(n) {
    const s = slug(n);
    const map = [[/drone/, 'drone'], [/plug/, 'plug'], [/chile|frieden/, 'globePlant'], [/aeropon|farm|plant/, 'plant'], [/labour|labor/, 'hardhat'], [/traffic/, 'cone'], [/safety/, 'vest'],
      [/sales|pitch/, 'chart'], [/stirling|engine/, 'engine'], [/drawing/, 'palette'], [/cyber|security|ctf/, 'shield'], [/music/, 'music'], [/writing|linkedin|facebook|school/, 'documents'], [/recycle/, 'recycle']];
    for (const [re, ic] of map) if (re.test(s)) return ic;
    const p = parents.get(n);
    if (p && slug(p) === 'software') return 'software';
    if (p && slug(p) === 'cybersecurity') return 'shield';
    return hasInfo(n) ? 'projects' : 'folder';
  }
  const docIcon = (d) => ({ pdf: 'pdf', docx: 'word', md: 'text', txt: 'text' }[d.ext] || 'text');
  const coverOf = (n) => (n.images[0] || {}).src;
  const isWebsite = (n) => n.info.url && slug(parents.get(n) || n) === 'freelance-websites';
  const isStage = (c) => /^\d/.test(c.name) && !c.docs.length;
  // Fields the project overview already renders in a fixed place; anything else gets its own heading
  const KNOWN_FIELDS = ['title', 'dates', 'where', 'my role', 'team', 'one-line summary', 'the problem', 'what i built / did', 'tools / tech / skills used', 'results', 'what went wrong / what i learned', 'links', 'url', 'github', 'demo login'];
  // Every folder inside these sections is a project, even before it has an info.txt
  const COLLECTIONS = ['projects', 'software', 'cybersecurity', 'construction'];
  const isProject = (c) => hasInfo(c) || COLLECTIONS.includes(slug(parents.get(c) || c));

  const BLURBS = {
    projects: 'Things I designed and built with my own hands, from drones to farms. Double-click a project to see the full story.',
    cybersecurity: 'Labs, investigations and security tools from my Digital Forensics & Cybersecurity studies.',
    'work-experience': 'Every job taught me something. Construction, sales and freelance development.',
    construction: 'Started as a labourer, moved to traffic control, then became a Construction Safety Officer.',
    sales: 'My take on selling, plus sample pitches.',
    'freelance-websites': 'Websites I built for clients. Double-click one to open the live site in a new tab.',
    software: 'Apps and tools I built. Open one for screenshots and a launch link.',
    writing: 'Writing from school, LinkedIn, Facebook and elsewhere, all in one place.',
    'recycle-bin-bloopers': 'Crashes, burnt boards and things that didn\'t work. Every one taught me something.',
  };

  /* ================================================================
     Explorer
     ================================================================ */
  function itemsFor(node) {
    const items = [];
    for (const c of node.children) {
      if (isWebsite(c)) {
        items.push({ label: c.title, thumb: coverOf(c), ic: 'globe', node: c, kind: 'website', open: () => window.open(c.info.url, '_blank', 'noopener') });
      } else if (isProject(c)) {
        items.push({ label: c.title, sub: c.info.dates, ic: iconFor(c), node: c, kind: 'project', open: () => openProject(c) });
      } else {
        items.push({ label: c.title, ic: iconFor(c), node: c, kind: 'folder', open: null });
      }
    }
    node.docs.forEach((d) => items.push({ label: d.title, sub: d.ext.toUpperCase(), ic: docIcon(d), doc: d, kind: 'doc', open: () => openDoc(d) }));
    node.images.forEach((im, i) => items.push({ label: im.caption || im.file, thumb: im.src, ic: 'image', img: im, kind: 'image', open: () => openPictures(node.images, i, node.title) }));
    node.videos.forEach((v) => items.push({ label: v.caption || v.file, ic: 'video', kind: 'video', open: () => openVideo(v) }));
    node.audio.forEach((a, i) => items.push({ label: a.title, ic: 'audio', kind: 'audio', open: () => openMusic(i) }));
    // Virtual shortcuts so related sections are one click away
    const s = slug(node);
    const shortcut = (key, ic) => { const t = section(key); if (t) items.push({ label: t.title, ic, node: t, kind: 'folder', open: null }); };
    if (s === 'projects') shortcut('cybersecurity', 'cyberFolder');
    if (s === 'work-experience') shortcut('freelance-websites', 'globe');
    return items;
  }

  function openExplorer(node, opts = {}) {
    if (!node) return;
    const rootKey = opts.root || pathOf(node)[0] || 'root';
    const id = 'ex-' + rootKey;
    const existing = WM.wins.get(id);
    if (existing) { existing.navigate(node, true); WM.restore(id); return; }

    const ui = el(`
      <div style="display:flex;flex-direction:column;flex:1;min-height:0">
        <div class="ex-toolbar">
          <button data-nav="back">◀ Back</button>
          <button data-nav="up">⬆ Up</button>
        </div>
        <div class="ex-address"><span>Address</span><div></div></div>
        <div class="ex-main">
          <aside class="ex-side"></aside>
          <div class="ex-items" tabindex="-1"></div>
        </div>
      </div>`);
    const history = [];
    let current = null, items = [];

    const win = WM.open({ id, title: node.title, icon: opts.icon || iconFor(node), width: 760, height: 500, content: ui,
      menu: ['File', 'Edit', 'View', 'Favorites', 'Tools', 'Help'], status: ' ' });
    const status = $('.statusbar div', win.body);

    function side(sel) {
      const s = slug(current);
      const blurb = BLURBS[s] || (current.info['one-line summary'] || '');
      let details = '';
      if (sel) {
        const n = sel.node;
        const prev = sel.thumb || (n && coverOf(n));
        details = `<div class="ex-panel"><b>Details</b><div>
          ${prev ? `<img class="preview" src="${esc(prev)}" alt="">` : ''}
          <strong>${esc(sel.label)}</strong><br>
          ${n && n.info.dates ? esc(n.info.dates) + '<br>' : ''}
          ${n && n.info['one-line summary'] ? `<p style="margin:6px 0 0">${esc(n.info['one-line summary'])}</p>` : ''}
          ${sel.kind === 'website' ? `<p style="margin:6px 0 0"><a href="${esc(n.info.url)}" target="_blank" rel="noopener">${icon('globe')}Visit ${esc(n.info.url.replace(/^https?:\/\//, ''))}</a></p>
             ${n.images.length ? `<button class="linkish" data-shots>${icon('image')}View screenshots</button>` : ''}` : ''}
        </div></div>`;
      }
      const places = [['about-me', 'About Me', 'about'], ['projects', 'My Projects', 'projects'], ['work-experience', 'Work Experience', 'work'], ['software', 'Software', 'software'], ['writing', 'My Writing', 'documents']]
        .filter(([k]) => k !== pathOf(current)[0])
        .map(([k, label, ic]) => `<button class="linkish" data-place="${k}">${icon(ic)}${label}</button>`).join('');
      $('.ex-side', ui).innerHTML = `
        <div class="ex-panel primary"><b>${esc(current.title)}</b><div>${esc(blurb) || 'Double-click an item to open it.'}</div></div>
        ${details}
        <div class="ex-panel"><b>Other Places</b><div>${places}</div></div>`;
      const shots = $('[data-shots]', ui);
      if (shots) shots.onclick = () => openPictures(sel.node.images, 0, sel.node.title);
      $$('[data-place]', ui).forEach((b) => (b.onclick = () => (b.dataset.place === 'about-me' ? openAbout() : openExplorer(section(b.dataset.place)))));
    }

    function render() {
      items = itemsFor(current);
      const box = $('.ex-items', ui);
      box.classList.toggle('path', slug(current) === 'construction');
      box.classList.toggle('sites', items.some((it) => it.kind === 'website') || (items.length > 0 && items.every((it) => it.kind === 'image')));
      box.innerHTML = items.length ? items.map((it, i) => `
        <button class="ex-item" data-i="${i}" title="${esc(it.label)}">
          <div class="thumb">${it.thumb ? `<img src="${esc(it.thumb)}" alt="" loading="lazy">` : icon(it.ic)}</div>
          <span>${esc(it.label)}</span>${it.sub ? `<small>${esc(it.sub)}</small>` : ''}
        </button>`).join('') : empty('This folder is empty.<br>Content coming soon.');
      $('.ex-address div', ui).innerHTML = icon(iconFor(current)) + esc('C:\\Satinder\\' + pathOf(current).map((s, k, arr) => nodeAt(arr.slice(0, k + 1)).title).join('\\'));
      $('[data-nav=back]', ui).disabled = !history.length;
      $('[data-nav=up]', ui).disabled = !parents.get(current) || parents.get(current) === CONTENT;
      WM.setTitle(id, current.title);
      status.textContent = `${items.length} object${items.length === 1 ? '' : 's'}`;
      win.hash = 'f/' + pathOf(current).join('/');
      Router.set(win.hash);
      side(null);
    }

    win.navigate = (n, push) => { if (push && current && n !== current) history.push(current); current = n; render(); };
    $('[data-nav=back]', ui).onclick = () => history.length && ((current = history.pop()), render());
    $('[data-nav=up]', ui).onclick = () => { const p = parents.get(current); if (p && p !== CONTENT) win.navigate(p, true); };
    wireIcons($('.ex-items', ui), '.ex-item', (b) => {
      const it = items[b.dataset.i];
      if (it.open) it.open(); else win.navigate(it.node, true);
    }, (b) => side(b ? items[b.dataset.i] : null));
    win.navigate(node, false);
  }

  /* ================================================================
     Project viewer
     ================================================================ */
  function openProject(n) {
    if (!n) return;
    const i = n.info;
    const stages = n.children.filter(isStage);
    const docGroups = n.children.filter((c) => !isStage(c));
    const links = parseLinks(i.links);
    const ytLinks = links.filter((l) => youtubeId(l.url));
    const otherLinks = links.filter((l) => !youtubeId(l.url));
    const videos = [...n.videos, ...ytLinks.map((l) => ({ youtube: youtubeId(l.url), caption: l.label }))];
    const field = (label, key) => { const h = fmt(i[key]); return h ? `<h3>${label}</h3>${h}` : ''; };
    const tagList = (s, cls = '', sep = /,(?![^(]*\))|·|\n/) => `<div class="tags">${s.split(sep).map((t) => t.trim()).filter(Boolean).map((t) => `<span class="tag ${cls}">${esc(t)}</span>`).join('')}</div>`;
    const results = i.results ? (/[·]/.test(i.results) && !i.results.includes('\n') ? '<h3>Highlights</h3>' + tagList(i.results, 'gold', /·/) : field('Results', 'results')) : '';

    const cover = n.images[0];
    const facts = [['When', i.dates], ['Where', i.where], ['Role', i['my role']], ['Team', i.team], ['Demo login', i['demo login']]].filter(([, v]) => v);
    const buttons = [
      i.url && `<a class="xpbtn" href="${esc(i.url)}" target="_blank" rel="noopener"><button tabindex="-1">${icon('globe')}${isWebsite(n) ? 'Visit website' : 'Launch'}</button></a>`,
      i.github && `<a class="xpbtn" href="${esc(i.github)}" target="_blank" rel="noopener"><button tabindex="-1">${icon('software')}Source code</button></a>`,
    ].filter(Boolean).join('');

    const overview = `
      <div class="pv-overview">
        <div>
          ${cover ? `<img class="pv-cover" src="${esc(cover.src)}" alt="${esc(cover.caption || n.title)}" data-pic="0">`
                  : `<div class="pv-cover-ph"><div>${icon(iconFor(n))}Photos coming soon</div></div>`}
          ${facts.length ? `<dl class="pv-facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
          ${buttons ? `<div class="btnrow">${buttons}</div>` : ''}
        </div>
        <div class="prose">
          <h2 class="pv-title">${esc(n.title)}</h2>
          ${i['one-line summary'] ? `<p class="pv-summary">${esc(i['one-line summary'])}</p>` : ''}
          ${field('The problem', 'the problem')}
          ${field('What I did', 'what i built / did')}
          ${i['tools / tech / skills used'] ? '<h3>Tools &amp; skills</h3>' + tagList(i['tools / tech / skills used']) : ''}
          ${results}
          ${field('What went wrong &amp; what I learned', 'what went wrong / what i learned')}
          ${Object.keys(i).filter((k) => !KNOWN_FIELDS.includes(k) && !k.endsWith('captions')).map((k) => field(esc(k.replace(/\b\w/g, (c) => c.toUpperCase())), k)).join('')}
          ${otherLinks.length ? '<h3>Links</h3><ul>' + otherLinks.map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`).join('') + '</ul>' : ''}
        </div>
      </div>`;

    const galleryHTML = (imgs, base = 0) => `<div class="gallery">${imgs.map((im, k) => `<figure data-pic="${base + k}"><img src="${esc(im.src)}" alt="${esc(im.caption)}" loading="lazy">${im.caption ? `<figcaption>${esc(im.caption)}</figcaption>` : ''}</figure>`).join('')}</div>`;
    const videoHTML = (vs) => `<div class="videos">${vs.map((v) => `<figure>${v.youtube
      ? `<iframe src="https://www.youtube-nocookie.com/embed/${esc(v.youtube)}" title="${esc(v.caption)}" allowfullscreen loading="lazy"></iframe>`
      : `<video src="${esc(v.src)}" controls preload="metadata" playsinline></video>`}${v.caption ? `<figcaption>${esc(v.caption)}</figcaption>` : ''}</figure>`).join('')}</div>`;

    // All pictures in this project, in order, so the viewer can page through stages too
    const allPics = [...n.images, ...stages.flatMap((s) => s.images)];
    let offset = n.images.length;
    const timeline = `<div class="timeline">${stages.map((s, k) => {
      const html = `<div class="tl-step" data-n="${k + 1}"><h4>${esc(s.title)}</h4>
        ${s.notes ? `<p>${esc(s.notes)}</p>` : ''}
        ${s.images.length ? galleryHTML(s.images, offset) : (!s.notes && !s.videos.length ? '<p style="color:#888">Photos and notes coming soon.</p>' : '')}
        ${s.videos.length ? videoHTML(s.videos) : ''}</div>`;
      offset += s.images.length;
      return html;
    }).join('')}</div>`;

    const docsHTML = () => {
      const groups = [...(n.docs.length ? [{ title: 'Documents', docs: n.docs }] : []), ...docGroups];
      return '<div class="pad prose">' + groups.map((g) => `<h3>${esc(g.title)}</h3>${g.docs.length
        ? '<ul style="list-style:none;padding:0">' + g.docs.map((d) => `<li><button class="xpbtn" data-doc="${esc(d.src)}" style="margin:2px 0">${icon(docIcon(d))}${esc(d.title)}</button></li>`).join('') + '</ul>'
        : '<p style="color:#888">Coming soon.</p>'}`).join('') + '</div>';
    };

    const tabs = [['Overview', overview]];
    if (stages.length) tabs.push(['Build Timeline', timeline]);
    if (n.images.length > 1) tabs.push([`Gallery (${n.images.length})`, galleryHTML(n.images)]);
    if (videos.length) tabs.push([`Videos (${videos.length})`, videoHTML(videos)]);
    if (docGroups.length || n.docs.length) tabs.push(['Documents', docsHTML()]);

    const ui = el(`<div class="pv">
      <menu role="tablist">${tabs.map(([t], k) => `<button role="tab" ${k ? '' : 'aria-selected="true"'}>${t}</button>`).join('')}</menu>
      ${tabs.map(([, h], k) => `<article role="tabpanel" ${k ? 'hidden' : ''}>${h}</article>`).join('')}
    </div>`);
    tabsWire(ui);
    ui.addEventListener('click', (e) => {
      const pic = e.target.closest('[data-pic]');
      if (pic) openPictures(allPics, +pic.dataset.pic, n.title);
      const d = e.target.closest('[data-doc]');
      if (d) { const all = [...n.docs, ...docGroups.flatMap((g) => g.docs)]; openDoc(all.find((x) => x.src === d.dataset.doc)); }
    });
    WM.open({ id: 'pv-' + n.path, title: n.title, icon: iconFor(n), width: 820, height: 560, content: ui, hash: 'p/' + slug(n) });
  }

  function tabsWire(root) {
    const tabs = $$('[role=tab]', root), panels = $$(':scope > [role=tabpanel]', root);
    tabs.forEach((t, k) => (t.onclick = () => {
      tabs.forEach((x) => x.removeAttribute('aria-selected'));
      t.setAttribute('aria-selected', 'true');
      panels.forEach((p, j) => (p.hidden = j !== k));
      panels.forEach((p) => p.querySelectorAll('video').forEach((v) => v.pause()));
    }));
  }

  /* ================================================================
     Picture viewer
     ================================================================ */
  function openPictures(images, index = 0, title = 'Pictures') {
    if (!images || !images.length) return;
    WM.close('pics');
    let i = index;
    const ui = el(`<div class="pic">
      <div class="pic-stage"><img alt=""></div>
      <div class="pic-cap"></div>
      <div class="pic-bar"><button data-d="-1">◀ Previous</button><button data-d="1">Next ▶</button><a target="_blank" rel="noopener"><button tabindex="-1">Open full size</button></a></div>
    </div>`);
    const show = () => {
      const im = images[i];
      $('img', ui).src = im.src;
      $('img', ui).alt = im.caption || '';
      $('.pic-cap', ui).textContent = `${im.caption || ''}${images.length > 1 ? `   (${i + 1} of ${images.length})` : ''}`;
      $('a', ui).href = im.src;
      WM.setTitle('pics', `${im.file || 'Picture'} - Picture Viewer`);
    };
    const step = (d) => { i = (i + d + images.length) % images.length; show(); };
    $$('[data-d]', ui).forEach((b) => (b.onclick = () => step(+b.dataset.d)));
    ui.tabIndex = 0;
    ui.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); });
    WM.open({ id: 'pics', title: 'Picture Viewer', icon: 'image', width: 760, height: 560, content: ui, center: true });
    show();
    ui.focus();
  }

  /* ================================================================
     Video player
     ================================================================ */
  function openVideo(v) {
    WM.close('wmp');
    const media = v.youtube ? `<iframe src="https://www.youtube-nocookie.com/embed/${esc(v.youtube)}?autoplay=1" allow="autoplay; fullscreen" allowfullscreen></iframe>`
      : `<video src="${esc(v.src)}" controls autoplay playsinline></video>`;
    WM.open({ id: 'wmp', title: (v.caption || v.file || 'Video') + ' - Media Player', icon: 'video', width: 720, height: 480, center: true,
      content: `<div class="wmp">${media}${v.caption ? `<div class="wmp-cap">${esc(v.caption)}</div>` : ''}</div>` });
  }

  /* ================================================================
     Music player
     ================================================================ */
  const Music = { audio: null, i: 0, ctx: null, analyser: null, raf: 0 };
  function openMusic(start) {
    const node = section('music') || { audio: [], images: [], info: {} };
    // Video files dropped in the music folder play as audio tracks too
    const tracks = [...node.audio, ...node.videos.map((v) => ({ ...v, title: v.caption || v.file }))];
    if (WM.wins.has('music')) { WM.restore('music'); if (start != null) Music.play(start); return; }
    const ui = el(`<div class="amp">
      <div class="amp-display">
        <div class="amp-lcd"><div class="amp-time">00:00</div><div class="amp-title"><span>Satinder's Music *** ${tracks.length ? 'Press play' : 'No tracks yet'} ***</span></div></div>
        <canvas class="amp-vis" width="120" height="64"></canvas>
      </div>
      <input class="amp-seek" type="range" min="0" max="1000" value="0" aria-label="Seek">
      <div class="amp-controls">
        <button data-c="prev" title="Previous">⏮</button><button data-c="play" title="Play">▶</button><button data-c="pause" title="Pause">⏸</button>
        <button data-c="stop" title="Stop">⏹</button><button data-c="next" title="Next">⏭</button><button data-c="watch" title="Watch the video" hidden>📺</button>
        <input type="range" min="0" max="100" value="80" aria-label="Volume" title="Volume">
      </div>
      <div class="amp-list">${tracks.length
        ? tracks.map((t, k) => `<div data-k="${k}"><span>${k + 1}. ${esc(t.title)}</span><span class="dur"></span></div>`).join('')
        : '<div class="amp-empty">Original music by Satinder is coming soon.<br>Check back later!</div>'}</div>
    </div>`);
    const audio = new Audio();
    audio.preload = 'metadata';
    Music.audio = audio;
    const cvs = $('canvas', ui), g = cvs.getContext('2d');
    const fmtT = (s) => (isFinite(s) ? `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '00:00');
    const seek = $('.amp-seek', ui);

    Music.play = (k) => {
      if (!tracks.length) return;
      Music.i = (k + tracks.length) % tracks.length;
      audio.src = tracks[Music.i].src;
      audio.play().catch(() => {});
      $('.amp-title span', ui).textContent = `${Music.i + 1}. ${tracks[Music.i].title} *** `.repeat(2);
      $$('.amp-list [data-k]', ui).forEach((d) => d.classList.toggle('on', +d.dataset.k === Music.i));
      $('[data-c=watch]', ui).hidden = !/\.(mp4|webm|mov|m4v)$/i.test(tracks[Music.i].file || '');
      setupVis();
    };
    function setupVis() {
      if (Music.analyser) return;
      try {
        Music.ctx = new (window.AudioContext || window.webkitAudioContext)();
        const src = Music.ctx.createMediaElementSource(audio);
        Music.analyser = Music.ctx.createAnalyser();
        Music.analyser.fftSize = 64;
        src.connect(Music.analyser).connect(Music.ctx.destination);
      } catch {}
    }
    function draw() {
      Music.raf = requestAnimationFrame(draw);
      g.fillStyle = '#000'; g.fillRect(0, 0, 120, 64);
      const data = new Uint8Array(32);
      if (Music.analyser && !audio.paused) Music.analyser.getByteFrequencyData(data);
      for (let b = 0; b < 20; b++) {
        const h = (data[b] / 255) * 60;
        const grd = g.createLinearGradient(0, 64, 0, 0); grd.addColorStop(0, '#00c000'); grd.addColorStop(.6, '#e0e000'); grd.addColorStop(1, '#e00000');
        g.fillStyle = grd; g.fillRect(2 + b * 6, 62 - h, 4, h);
      }
    }
    audio.ontimeupdate = () => { $('.amp-time', ui).textContent = fmtT(audio.currentTime); if (audio.duration) seek.value = (audio.currentTime / audio.duration) * 1000; };
    audio.onended = () => Music.play(Music.i + 1);
    seek.oninput = () => { if (audio.duration) audio.currentTime = (seek.value / 1000) * audio.duration; };
    $('[aria-label=Volume]', ui).oninput = (e) => (audio.volume = e.target.value / 100);
    $('.amp-controls', ui).onclick = (e) => {
      const c = e.target.closest('[data-c]')?.dataset.c;
      if (!c || !tracks.length) return;
      Music.ctx && Music.ctx.resume();
      if (c === 'play') audio.src ? audio.play() : Music.play(Music.i);
      if (c === 'pause') audio.pause();
      if (c === 'stop') { audio.pause(); audio.currentTime = 0; }
      if (c === 'next') Music.play(Music.i + 1);
      if (c === 'prev') Music.play(Music.i - 1);
      if (c === 'watch') { audio.pause(); openVideo(tracks[Music.i]); }
    };
    $('.amp-list', ui).ondblclick = (e) => { const d = e.target.closest('[data-k]'); if (d) Music.play(+d.dataset.k); };
    $('.amp-list', ui).onclick = (e) => { const d = e.target.closest('[data-k]'); if (d && isTouch()) Music.play(+d.dataset.k); };
    tracks.forEach((t, k) => { const a = new Audio(); a.preload = 'metadata'; a.src = t.src; a.onloadedmetadata = () => { const d = $(`[data-k="${k}"] .dur`, ui); if (d) d.textContent = fmtT(a.duration); }; });

    WM.open({ id: 'music', title: 'Satinder Amp', icon: 'music', width: 380, height: 420, content: ui, hash: 'music',
      onClose: () => { audio.pause(); cancelAnimationFrame(Music.raf); Music.analyser = null; Music.ctx && Music.ctx.close(); } });
    draw();
    if (start != null) Music.play(start);
  }

  /* ================================================================
     Messenger (socials)
     ================================================================ */
  function openMessenger() {
    const node = section('socials') || { links: [] };
    const a = about().info;
    const contacts = node.links.map((l) => {
      const m = (l.status || '').match(/^\((online|busy|away|offline)\)\s*(.*)$/i);
      return { ...l, state: m ? m[1].toLowerCase() : 'online', msg: m ? m[2] : l.status };
    });
    const row = (c) => `<a class="msn-contact" href="${esc(c.url)}" target="_blank" rel="noopener"><i class="msn-dot ${c.state}"></i><span>${esc(c.label)}</span>${c.msg ? `<small>${esc(c.msg)}</small>` : ''}</a>`;
    const on = contacts.filter((c) => c.state !== 'offline'), off = contacts.filter((c) => c.state === 'offline');
    const ui = el(`<div class="msn">
      <div class="msn-head"><img src="${esc(avatarSrc())}" alt=""><div><b>${esc(a.name || 'Satinder')}</b><small>(Online)</small><em>${esc(a.headline || '')}</em></div></div>
      <div class="msn-group">Online (${on.length})</div>${on.map(row).join('') || '<div class="empty">No contacts yet.</div>'}
      ${off.length ? `<div class="msn-group">Offline (${off.length})</div>${off.map(row).join('')}` : ''}
      <div class="msn-ad">Got an idea to build together? <a href="#" data-ideas>Open Ideas &amp; Collabs</a></div>
    </div>`);
    $('[data-ideas]', ui).onclick = (e) => { e.preventDefault(); openOutlook(); };
    WM.open({ id: 'msn', title: 'Messenger: Socials', icon: 'messenger', width: 320, height: 470, content: ui, hash: 'socials' });
  }

  /* ================================================================
     Outlook (ideas & collabs)
     ================================================================ */
  function openOutlook() {
    const node = section('ideas-and-collabs') || { docs: [] };
    const ideas = node.docs;
    const a = about().info;
    const ui = el(`<div class="ol">
      <div class="ol-tools"><button data-new>${icon('mail')}Create Mail</button><button data-reply disabled>↩ Reply</button></div>
      <div class="ol-main">
        <div class="ol-folders"><div class="on">${icon('mail')}Inbox (${ideas.length})</div><div>${icon('folder')}Drafts</div><div>${icon('folder')}Sent Items</div></div>
        <div class="ol-right">
          <div class="ol-list"><table><thead><tr><th>From</th><th>Subject</th><th>Received</th></tr></thead><tbody>${ideas.map((d, k) =>
            `<tr class="unread" data-k="${k}"><td>${esc(a.name || 'Satinder')}</td><td>${esc(d.title)}</td><td>${esc(d.fields?.date || '')}</td></tr>`).join('')}</tbody></table>
            ${ideas.length ? '' : empty('No ideas posted yet.<br>Have one? Click <b>Create Mail</b> and tell me about it.', 'idea')}</div>
          <div class="ol-preview">${ideas.length ? empty('Select an idea to read it.', 'mail') : ''}</div>
        </div>
      </div>
    </div>`);
    let sel = null;
    const show = (k) => {
      sel = ideas[k];
      $$('tr[data-k]', ui).forEach((r) => r.classList.toggle('on', +r.dataset.k === k));
      $(`tr[data-k="${k}"]`, ui).classList.remove('unread');
      const f = sel.fields || {};
      const extra = Object.entries(f).filter(([key]) => !['title', 'date'].includes(key)).map(([key, v]) => `<h3>${esc(key)}</h3>${fmt(v)}`).join('');
      $('.ol-preview', ui).innerHTML = `<div class="hdr"><b>From:</b> ${esc(a.name || 'Satinder')}<br><b>Subject:</b> ${esc(sel.title)}</div><div class="pad prose">${extra}${fmt(sel.text)}</div>`;
      $('[data-reply]', ui).disabled = false;
    };
    $('tbody', ui).onclick = (e) => { const r = e.target.closest('tr'); if (r) show(+r.dataset.k); };
    $('[data-new]', ui).onclick = () => compose('');
    $('[data-reply]', ui).onclick = () => sel && compose('Re: ' + sel.title);
    WM.open({ id: 'outlook', title: 'Ideas & Collabs - Outlook', icon: 'mail', width: 780, height: 520, content: ui, hash: 'ideas' });
  }

  function compose(subject) {
    const to = about().info.email || '';
    const ui = el(`<div class="compose">
      <label><span>To:</span><input value="${esc(to)}" readonly></label>
      <label><span>Subject:</span><input data-s value="${esc(subject || 'Let\'s collaborate')}"></label>
      <textarea data-b placeholder="Hi Satinder, I have an idea..."></textarea>
      <div style="display:flex;justify-content:flex-end;gap:6px"><button data-send>Send</button></div>
    </div>`);
    $('[data-send]', ui).onclick = () => {
      location.href = `mailto:${to}?subject=${encodeURIComponent($('[data-s]', ui).value)}&body=${encodeURIComponent($('[data-b]', ui).value)}`;
      WM.close('compose');
    };
    WM.close('compose');
    WM.open({ id: 'compose', title: 'New Message', icon: 'mail', width: 480, height: 380, content: ui, center: true });
  }

  /* ================================================================
     Documents: WordPad (txt/md/docx) and PDF
     ================================================================ */
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  function openDoc(d) {
    if (!d) return;
    const id = 'doc-' + d.src;
    if (d.ext === 'pdf') {
      if (isTouch()) { window.open(d.src, '_blank', 'noopener'); return; }
      const ui = el(`<div style="flex:1;display:flex;flex-direction:column;min-height:0">
        <div class="ex-toolbar"><a href="${esc(d.src)}" target="_blank" rel="noopener"><button tabindex="-1">Open in new tab</button></a><a href="${esc(d.src)}" download><button tabindex="-1">Download</button></a></div>
        <iframe class="pdf-frame" src="${esc(d.src)}" title="${esc(d.title)}"></iframe></div>`);
      WM.open({ id, title: d.title + ' - PDF', icon: 'pdf', width: 760, height: 600, content: ui });
      return;
    }
    const f = d.fields || {};
    const meta = [f.date, f.where || f['published on'] || f.source].filter(Boolean).join(' · ');
    const page = el(`<div class="doc-wrap"><div class="doc-page"></div></div>`);
    const p = $('.doc-page', page);
    if (d.ext === 'docx') {
      p.classList.add('html');
      p.innerHTML = '<p>Opening document…</p>';
      (window.mammoth ? Promise.resolve() : loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js'))
        .then(() => fetch(d.src)).then((r) => r.arrayBuffer())
        .then((buf) => mammoth.convertToHtml({ arrayBuffer: buf }))
        .then((r) => (p.innerHTML = `<h1>${esc(d.title)}</h1>` + r.value))
        .catch(() => (p.innerHTML = `<p>Couldn't open this document. <a href="${esc(d.src)}" download>Download it instead</a>.</p>`));
    } else {
      const extra = Object.entries(f).filter(([k]) => !['title', 'date', 'where', 'published on', 'source'].includes(k));
      p.classList.add('html');
      p.innerHTML = `<h1>${esc(d.title)}</h1>${meta ? `<div class="meta">${esc(meta)}</div>` : ''}
        ${extra.map(([k, v]) => `<p><b>${esc(k.replace(/\b\w/g, (c) => c.toUpperCase()))}:</b></p>${fmt(v)}`).join('')}${fmt(d.text)}`;
    }
    WM.open({ id, title: d.title + ' - WordPad', icon: docIcon(d), width: 760, height: 580, content: page, menu: ['File', 'Edit', 'View', 'Insert', 'Format', 'Help'] });
  }

  /* ================================================================
     About Me (System Properties)
     ================================================================ */
  function openAbout(tab = 0) {
    const n = about(), i = n.info;
    const certs = (child(n, 'certificates') || { images: [] }).images;
    const skills = Object.entries(i).filter(([k]) => k.startsWith('skills ')).map(([k, v]) => [k.slice(7).replace(/\b\w/g, (c) => c.toUpperCase()), v]);
    const resume = XP.resumeSrc();
    const panels = [
      ['General', `<div class="sp-general">
          <div>${avatarSrc() ? `<img class="sp-photo" src="${esc(avatarSrc())}" alt="Photo of ${esc(i.name || 'Satinder')}">` : icon('user')}</div>
          <div class="prose">
            <h2>${esc(i.name || 'Satinder Pal Singh Sandhu')}</h2>
            <div class="hl">${esc(i.headline || '')}</div>
            <div class="sp-reg">${i.location ? `📍 ${esc(i.location)}<br>` : ''}${i.email ? `✉ <a href="mailto:${esc(i.email)}">${esc(i.email)}</a>` : ''}</div>
            ${fmt(i.bio)}
            ${i.education ? '<h3>Education</h3>' + fmt(i.education) : ''}
          </div></div>`],
      ['Skills', `<div class="pad"><p style="margin:0 0 8px">Installed hardware &amp; software (a.k.a. my skills). Expand a category:</p>
          <ul class="tree-view">${skills.map(([k, v], j) => `<li><details ${j < 2 ? 'open' : ''}><summary>${esc(k)}</summary><ul>${v.split(/,(?![^(]*\))/).map((s) => `<li>${esc(s.trim())}</li>`).join('')}</ul></details></li>`).join('') || '<li>Coming soon</li>'}</ul></div>`],
      ['Certificates', certs.length ? `<div class="cert-grid">${certs.map((c, k) => `<figure data-cert="${k}"><img src="${esc(c.src)}" alt="${esc(c.caption)}" loading="lazy"><figcaption>${esc(c.caption || c.file)}</figcaption></figure>`).join('')}</div>` : empty('Certificates coming soon.')],
      ['Resume', `<div class="pad prose"><p>Want the one-page version? Here's my resume.</p>
          ${resume ? `<div class="btnrow"><a class="xpbtn" href="${esc(resume)}" target="_blank" rel="noopener"><button tabindex="-1">${icon('pdf')}Open resume (PDF)</button></a>
          <a class="xpbtn" href="${esc(resume)}" download><button tabindex="-1">Download</button></a></div>` : '<p>Resume coming soon.</p>'}
          ${i.email ? `<p>Or just <a href="mailto:${esc(i.email)}">email me</a>. I reply fast.</p>` : ''}</div>`],
    ];
    const ui = el(`<div class="sp">
      <menu role="tablist">${panels.map(([t], k) => `<button role="tab" ${k === tab ? 'aria-selected="true"' : ''}>${t}</button>`).join('')}</menu>
      ${panels.map(([, h], k) => `<article role="tabpanel" ${k === tab ? '' : 'hidden'}>${h}</article>`).join('')}
      <div class="sp-foot"><button data-ok>OK</button></div>
    </div>`);
    tabsWire(ui);
    $('[data-ok]', ui).onclick = () => WM.close('about');
    ui.addEventListener('click', (e) => { const c = e.target.closest('[data-cert]'); if (c) openPictures(certs, +c.dataset.cert, 'Certificates'); });
    WM.open({ id: 'about', title: 'System Properties: About Me', icon: 'about', width: 640, height: 540, content: ui, hash: 'about', center: true });
  }

  function openResume() {
    const src = resumeSrc();
    if (!src) return openAbout(3);
    openDoc({ src, ext: 'pdf', title: 'Resume' });
  }

  /* ================================================================
     Desktop, Start menu, routes
     ================================================================ */
  const ex = (key) => () => openExplorer(section(key));
  const recycleFull = () => { const r = section('recycle-bin-bloopers'); return r && (r.images.length || r.videos.length) ? 'recycleFull' : 'recycle'; };
  const apps = {
    about: { label: 'About Me', icon: 'about', open: () => openAbout(), sub: 'Who I am, skills, certificates' },
    projects: { label: 'My Projects', icon: 'projects', open: ex('projects'), sub: 'Drone, Happy Plug, Aeroponics…' },
    work: { label: 'Work Experience', icon: 'work', open: ex('work-experience'), sub: 'Construction, sales, freelance' },
    software: { label: 'Software', icon: 'software', open: ex('software'), sub: 'Apps I built' },
    writing: { label: 'My Writing', icon: 'documents', open: ex('writing') },
    music: { label: 'My Music', icon: 'music', open: () => openMusic() },
    socials: { label: 'Socials', icon: 'messenger', open: openMessenger, tip: 'Messenger: find me online' },
    ideas: { label: 'Ideas & Collabs', icon: 'mail', open: openOutlook },
    resume: { label: 'Resume.pdf', icon: 'pdf', open: openResume, sub: 'One-page version' },
    recycle: { label: 'Recycle Bin', icon: recycleFull, open: ex('recycle-bin-bloopers') },
    drawings: { label: 'My Drawings', icon: 'palette', open: ex('drawings'), sub: 'Sketches and portraits' },
    cyber: { label: 'Cybersecurity', icon: 'shield', open: ex('cybersecurity') },
    websites: { label: 'Freelance Websites', icon: 'globe', open: ex('freelance-websites') },
    classic: { label: 'Classic Mode', icon: 'classic', open: () => (location.href = 'classic/'), sub: 'The old-school scrolling site' },
    tao: { label: 'Verse of the Day', icon: 'notepad', open: XP.openTao },
  };

  const DESK = ['about', 'projects', 'work', 'software', 'writing', 'drawings', 'music', 'socials', 'ideas', 'resume', 'recycle'];
  DESK.filter((k) => k !== 'drawings' || section('drawings')).forEach((k) => XP.addDesktopIcon(apps[k]));

  // Any new top-level folder in content/ gets its own desktop icon automatically
  const KNOWN = ['about-me', 'projects', 'cybersecurity', 'work-experience', 'freelance-websites', 'software', 'writing', 'music', 'socials', 'ideas-and-collabs', 'recycle-bin-bloopers', 'drawings'];
  CONTENT.children.filter((n) => !KNOWN.includes(slug(n)))
    .forEach((n) => XP.addDesktopIcon({ label: n.title, icon: n.images.length && !n.children.length ? 'palette' : 'folder', open: () => openExplorer(n) }));

  const sm = (k) => ({ ...apps[k], icon: typeof apps[k].icon === 'function' ? apps[k].icon() : apps[k].icon });
  XP.START.left.push(sm('about'), sm('projects'), sm('work'), sm('software'), '-', sm('resume'), sm('classic'));
  XP.START.right.push(sm('writing'), sm('music'), sm('socials'), sm('ideas'), '-', sm('cyber'), sm('websites'), ...(section('drawings') ? [sm('drawings')] : []), sm('recycle'), '-', sm('tao'));

  const R = Router.routes;
  R.about = () => openAbout();
  R.music = () => openMusic();
  R.socials = openMessenger;
  R.ideas = openOutlook;
  R.p = ([s]) => openProject(findProject(s));
  R.f = (parts) => openExplorer(nodeAt(parts) || section('projects'));
  $('#tray-net') && ($('#tray-net').onclick = openMessenger);

  Object.assign(XP, { openExplorer, openProject, openPictures, openVideo, openMusic, openMessenger, openOutlook, openDoc, openAbout });
})();

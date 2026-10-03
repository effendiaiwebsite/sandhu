#!/usr/bin/env node
/*
 * Scans the content/ folder and writes xp/data/content.js, which the site reads.
 * Run after adding photos or editing info.txt files:   node tools/build-content.js
 *
 * Rules
 *  - info.txt / notes.txt / links.txt are parsed as "KEY: value" text (lines starting with # are ignored).
 *  - Files and folders starting with _ or . are hidden. Folders containing "name-here" are skipped.
 *  - Subfolders named photos / videos / images / screenshots are merged into their parent.
 *  - Files sort by name, so prefix them 01_, 02_ ... to control order. cover.* always comes first.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONTENT = path.join(ROOT, 'content');
const OUT = path.join(ROOT, 'xp', 'data', 'content.js');
const INDEX = path.join(ROOT, 'index.html');

const IMG = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
const VID = ['.mp4', '.webm', '.mov', '.m4v'];
const AUD = ['.mp3', '.wav', '.ogg', '.m4a'];
const DOC = ['.pdf', '.docx', '.txt', '.md'];
const MEDIA_DIRS = ['photos', 'videos', 'images', 'screenshots', 'pictures'];
const SPECIAL_TXT = ['info.txt', 'notes.txt', 'links.txt'];

const hidden = (n) => n.startsWith('_') || n.startsWith('.') || n.includes('name-here') || n === 'PLAN.md';
const natural = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
const coverFirst = (a, b) => (/^cover\./i.test(b) - /^cover\./i.test(a)) || natural(a, b);

function prettify(name) {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/^\d+[_\-. ]+/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Za-z])(\d+)$/, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/(?!^)\b(And|Or|Of|In|On|With|The|A|An|To|For|At)\b/g, (w) => w.toLowerCase())
    .replace(/\bLinkedin\b/g, 'LinkedIn').replace(/\bGithub\b/g, 'GitHub').replace(/\bYoutube\b/g, 'YouTube');
}

/** Parse "KEY: value" text. Keys are upper-case words; following lines continue the value. */
function parseFields(text) {
  const fields = {};
  let key = null;
  const body = [];
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    if (raw.trim().startsWith('#')) continue;
    const m = raw.match(/^([A-Z][A-Z0-9 /&\-]*[A-Z0-9])\s*(?:\([^)]*\))?\s*:\s*(.*)$/);
    if (m) {
      key = m[1].toLowerCase().replace(/\s+/g, ' ');
      fields[key] = m[2].trim();
    } else if (key) {
      fields[key] += (fields[key] ? '\n' : '') + raw.trimEnd();
    } else {
      body.push(raw);
    }
  }
  for (const k of Object.keys(fields)) fields[k] = fields[k].trim();
  return { fields, body: body.join('\n').trim() };
}

/** Collect "file.ext - caption" lines from any *captions field. */
function captionsFrom(fields) {
  const caps = {};
  for (const [k, v] of Object.entries(fields)) {
    if (!k.endsWith('captions')) continue;
    for (const line of v.split('\n')) {
      const m = line.match(/^\s*([^\s].*?\.[a-z0-9]{2,4})\s*[-–:]\s*(.+)$/i);
      if (m) caps[m[1].toLowerCase()] = m[2].trim();
    }
  }
  return caps;
}

/** Default caption from a descriptive filename; generic camera names (01.jpg, IMG_1234) get none. */
const autoCaption = (f) => (/^(\d+|cover|photo|img[_-]?\d+|dsc\w*|pxl_\w+|\d{8}[_-]\d+|screenshot.*)$/i.test(f.replace(/\.[^.]+$/, '')) ? '' : prettify(f));

const rel = (abs) => path.relative(ROOT, abs).split(path.sep).map(encodeURIComponent).join('/');

function scan(dir, inheritedCaps = {}) {
  const name = path.basename(dir);
  const node = { name, title: prettify(name), path: rel(dir), info: {}, notes: '', images: [], videos: [], audio: [], docs: [], links: [], children: [] };

  const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
  const entries = fs.readdirSync(dir, { withFileTypes: true }).filter((e) => !hidden(e.name));

  if (entries.some((e) => e.name.toLowerCase() === 'info.txt')) node.info = parseFields(read('info.txt')).fields;
  if (entries.some((e) => e.name.toLowerCase() === 'notes.txt')) {
    const p = parseFields(read('notes.txt'));
    node.notes = [p.body, ...Object.values(p.fields)].filter(Boolean).join('\n');
  }
  if (entries.some((e) => e.name.toLowerCase() === 'links.txt')) {
    node.links = read('links.txt').replace(/\r/g, '').split('\n')
      .filter((l) => l.trim() && !l.trim().startsWith('#'))
      .map((l) => { const [label, url, status] = l.split('|').map((s) => (s || '').trim()); return { label, url, status }; })
      .filter((l) => l.url);
  }
  if (node.info.title) node.title = node.info.title;

  const caps = { ...inheritedCaps, ...captionsFrom(node.info) };
  const addFiles = (d, files) => {
    for (const f of files.sort(coverFirst)) {
      const ext = path.extname(f).toLowerCase();
      const abs = path.join(d, f);
      const item = { src: rel(abs), file: f, caption: caps[f.toLowerCase()] || autoCaption(f) };
      if (IMG.includes(ext)) node.images.push(item);
      else if (VID.includes(ext)) node.videos.push(item);
      else if (AUD.includes(ext)) node.audio.push({ ...item, title: item.caption || prettify(f) });
      else if (DOC.includes(ext) && !(d === dir && SPECIAL_TXT.includes(f.toLowerCase()))) {
        const doc = { ...item, ext: ext.slice(1), title: prettify(f) };
        if (ext === '.txt' || ext === '.md') {
          const p = parseFields(fs.readFileSync(abs, 'utf8'));
          doc.fields = p.fields;
          doc.text = p.body;
          if (p.fields.title) doc.title = p.fields.title;
          if (!p.body && !Object.keys(p.fields).length) continue; // all comments: skip
        }
        node.docs.push(doc);
      }
    }
  };

  addFiles(dir, entries.filter((e) => e.isFile()).map((e) => e.name));
  for (const e of entries.filter((e) => e.isDirectory()).sort((a, b) => natural(a.name, b.name))) {
    if (MEDIA_DIRS.includes(e.name.toLowerCase())) {
      const sub = path.join(dir, e.name);
      addFiles(sub, fs.readdirSync(sub).filter((f) => !hidden(f) && fs.statSync(path.join(sub, f)).isFile()));
    } else {
      node.children.push(scan(path.join(dir, e.name), caps));
    }
  }
  return node;
}

const tree = scan(CONTENT);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, '// AUTO-GENERATED by tools/build-content.js. Do not edit; edit content/ and re-run.\nwindow.CONTENT = ' + JSON.stringify(tree, null, 1) + ';\n');

/* ---- Plain-HTML copy of everything for search engines & no-JS visitors ---- */
const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function seo(node, depth) {
  const h = Math.min(depth + 2, 6);
  let out = `<section><h${h}>${esc(node.title)}</h${h}>`;
  const i = node.info;
  for (const k of ['headline', 'one-line summary', 'bio', 'what i built / did', 'results']) if (i[k]) out += `<p>${esc(i[k])}</p>`;
  if (i.url) out += `<p><a href="${esc(i.url)}">${esc(i.url)}</a></p>`;
  for (const d of node.docs) if (d.text) out += `<article><h${Math.min(h + 1, 6)}>${esc(d.title)}</h${Math.min(h + 1, 6)}><p>${esc(d.text.slice(0, 2000))}</p></article>`;
  for (const l of node.links) out += `<p><a href="${esc(l.url)}">${esc(l.label)}</a></p>`;
  for (const c of node.children) out += seo(c, depth + 1);
  return out + '</section>';
}
if (fs.existsSync(INDEX)) {
  const html = fs.readFileSync(INDEX, 'utf8');
  const block = `<!--SEO-START-->\n<div id="seo-content">${tree.children.map((c) => seo(c, 0)).join('\n')}</div>\n<!--SEO-END-->`;
  fs.writeFileSync(INDEX, html.replace(/<!--SEO-START-->[\s\S]*?<!--SEO-END-->/, block));
}

const count = (n, k) => n[k].length + n.children.reduce((s, c) => s + count(c, k), 0);
console.log(`content.js written: ${count(tree, 'images')} images, ${count(tree, 'videos')} videos, ${count(tree, 'audio')} tracks, ${count(tree, 'docs')} documents.`);

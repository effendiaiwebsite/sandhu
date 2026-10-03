/* Original XP-flavoured SVG icon set. Gradients live in one shared <defs> block injected at load. */
(function () {
  const defs = `
  <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <linearGradient id="g-folder" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a3"/><stop offset="1" stop-color="#e8b830"/></linearGradient>
    <linearGradient id="g-folder-back" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3cf63"/><stop offset="1" stop-color="#c99417"/></linearGradient>
    <linearGradient id="g-blue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fc3ff"/><stop offset="1" stop-color="#1d5fd1"/></linearGradient>
    <linearGradient id="g-green" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9be27a"/><stop offset="1" stop-color="#2f8f1f"/></linearGradient>
    <linearGradient id="g-red" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a8a"/><stop offset="1" stop-color="#c62d1a"/></linearGradient>
    <linearGradient id="g-orange" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd27a"/><stop offset="1" stop-color="#e5780b"/></linearGradient>
    <linearGradient id="g-purple" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d5b4ff"/><stop offset="1" stop-color="#6b3fc4"/></linearGradient>
    <linearGradient id="g-grey" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfbfb"/><stop offset="1" stop-color="#b9bfc9"/></linearGradient>
    <linearGradient id="g-screen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5aa7ff"/><stop offset="1" stop-color="#0c3a9c"/></linearGradient>
    <linearGradient id="g-paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e3e8f0"/></linearGradient>
    <radialGradient id="g-orb" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#d9ffc9"/><stop offset=".5" stop-color="#4bbf2c"/><stop offset="1" stop-color="#1c6e10"/></radialGradient>
  </defs></svg>`;
  document.addEventListener('DOMContentLoaded', () => document.body.insertAdjacentHTML('afterbegin', defs));

  const S = (body) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  const shadow = '<ellipse cx="24" cy="44" rx="18" ry="2.5" fill="#000" opacity=".18"/>';
  const folderBase = (badge = '') => S(`${shadow}
    <path d="M4 12a3 3 0 0 1 3-3h11l4 4h19a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="url(#g-folder-back)" stroke="#a57a10" stroke-width="1"/>
    <path d="M4 19a3 3 0 0 1 3-3h34a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="url(#g-folder)" stroke="#b58712" stroke-width="1"/>
    <path d="M6 18h36" stroke="#fff6cf" stroke-width="1.5" opacity=".9"/>${badge}`);
  const doc = (fold, inner) => S(`${shadow}
    <path d="M11 4h19l9 9v29a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="url(#g-paper)" stroke="#8a97ab"/>
    <path d="M30 4v9h9" fill="${fold}" stroke="#8a97ab"/>${inner}`);
  const lines = '<path d="M14 20h18M14 25h20M14 30h16M14 35h19" stroke="#9aa6b8" stroke-width="2"/>';

  window.ICONS = {
    folder: folderBase(),
    projects: folderBase('<circle cx="34" cy="31" r="8" fill="url(#g-blue)" stroke="#164aa8"/><path d="M34 26v10M29 31h10" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>'),
    work: S(`${shadow}<rect x="5" y="14" width="38" height="26" rx="4" fill="url(#g-orange)" stroke="#9c4d06"/>
      <path d="M17 14v-4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" fill="none" stroke="#7a3b04" stroke-width="2.5"/>
      <path d="M5 25h38" stroke="#9c4d06"/><rect x="20" y="22" width="8" height="6" rx="1" fill="#ffe3a8" stroke="#7a3b04"/>`),
    documents: folderBase('<path d="M26 22h12l4 4v14H26z" fill="#fff" stroke="#7d8aa0"/><path d="M29 29h9M29 33h9M29 37h6" stroke="#5b7bd5" stroke-width="1.5"/>'),
    software: S(`${shadow}<rect x="5" y="7" width="38" height="32" rx="3" fill="#fff" stroke="#3b5ea8"/>
      <rect x="5" y="7" width="38" height="8" rx="3" fill="url(#g-blue)"/><circle cx="37" cy="11" r="2" fill="#e8442e"/>
      <path d="M13 22l-4 5 4 5M35 22l4 5-4 5M27 20l-6 14" stroke="#1d5fd1" stroke-width="2.5" fill="none" stroke-linecap="round"/>`),
    about: S(`${shadow}<rect x="6" y="6" width="36" height="26" rx="3" fill="url(#g-grey)" stroke="#6d7684"/>
      <rect x="9" y="9" width="30" height="20" fill="url(#g-screen)"/>
      <circle cx="24" cy="16" r="4" fill="#ffd9b0"/><path d="M16 28c1-5 4-7 8-7s7 2 8 7z" fill="#ffffff" opacity=".9"/>
      <path d="M18 32h12l2 6H16z" fill="url(#g-grey)" stroke="#6d7684"/><rect x="12" y="38" width="24" height="4" rx="1.5" fill="url(#g-grey)" stroke="#6d7684"/>`),
    music: S(`${shadow}<circle cx="24" cy="24" r="19" fill="url(#g-purple)" stroke="#4b2694"/>
      <circle cx="24" cy="24" r="6" fill="#efe5ff" stroke="#4b2694"/><circle cx="24" cy="24" r="2" fill="#4b2694"/>
      <path d="M12 14a16 16 0 0 1 10-6" stroke="#fff" stroke-width="2" opacity=".7" fill="none"/>`),
    messenger: S(`${shadow}<circle cx="17" cy="14" r="6" fill="url(#g-green)" stroke="#1f6b12"/><path d="M6 34c0-8 5-12 11-12s11 4 11 12z" fill="url(#g-green)" stroke="#1f6b12"/>
      <circle cx="31" cy="17" r="6" fill="url(#g-blue)" stroke="#164aa8"/><path d="M20 38c0-8 5-12 11-12s11 4 11 12z" fill="url(#g-blue)" stroke="#164aa8"/>`),
    mail: S(`${shadow}<rect x="4" y="11" width="40" height="28" rx="3" fill="url(#g-paper)" stroke="#5e6f8c"/>
      <path d="M5 13l19 15 19-15" fill="none" stroke="#5e6f8c" stroke-width="1.5"/><circle cx="37" cy="13" r="7" fill="url(#g-orange)" stroke="#9c4d06"/>
      <path d="M37 9.5v4.5M37 16.2v.6" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>`),
    recycle: S(`${shadow}<path d="M12 12h24l-3 30H15z" fill="url(#g-grey)" stroke="#6d7684"/><ellipse cx="24" cy="12" rx="13" ry="3.5" fill="#dfe4ea" stroke="#6d7684"/>
      <path d="M18 18l1.5 19M24 18v19M30 18l-1.5 19" stroke="#9ba4b1" stroke-width="1.5"/>
      <path d="M19 27a5 5 0 0 1 9-2l1.5-2v5h-5l1.8-1.5a3 3 0 0 0-5.3 1.3z" fill="#2f8f1f"/>`),
    recycleFull: S(`${shadow}<path d="M12 14h24l-3 28H15z" fill="url(#g-grey)" stroke="#6d7684"/>
      <path d="M13 13l6-6 5 4 6-5 6 7z" fill="url(#g-paper)" stroke="#8a97ab"/><ellipse cx="24" cy="14" rx="13" ry="3" fill="#dfe4ea" stroke="#6d7684"/>
      <path d="M18 20l1.5 18M24 20v18M30 20l-1.5 18" stroke="#9ba4b1" stroke-width="1.5"/>`),
    classic: S(`${shadow}<rect x="7" y="5" width="34" height="28" rx="2" fill="#e8e2cf" stroke="#8b8268"/><rect x="11" y="9" width="26" height="19" fill="#0b0f1f"/>
      <path d="M14 14h4M14 18h10M14 22h7" stroke="#4dff7a" stroke-width="1.6"/><circle cx="31" cy="16" r="1" fill="#fff"/><circle cx="27" cy="22" r=".8" fill="#fff"/>
      <rect x="9" y="34" width="30" height="8" rx="1.5" fill="#e8e2cf" stroke="#8b8268"/>`),
    shield: S(`${shadow}<path d="M24 4l17 6v12c0 11-7 18-17 22C14 40 7 33 7 22V10z" fill="url(#g-blue)" stroke="#123f93"/>
      <rect x="17" y="21" width="14" height="11" rx="2" fill="#ffd34d" stroke="#8c6a00"/><path d="M20 21v-3a4 4 0 0 1 8 0v3" fill="none" stroke="#fff" stroke-width="2.5"/>`),
    cyberFolder: folderBase('<path d="M34 22l8 3v5c0 5-3 8-8 10-5-2-8-5-8-10v-5z" fill="url(#g-blue)" stroke="#123f93"/>'),
    drone: S(`${shadow}<path d="M13 13l22 22M35 13L13 35" stroke="#3d4450" stroke-width="3"/>
      ${[[13,13],[35,13],[13,35],[35,35]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="9" ry="2.2" fill="#9fc8ff" opacity=".8" stroke="#3a6fc4"/><circle cx="${x}" cy="${y}" r="2.5" fill="#222"/>`).join('')}
      <rect x="18" y="19" width="12" height="10" rx="3" fill="url(#g-red)" stroke="#7b1a0e"/><circle cx="24" cy="24" r="2" fill="#bff"/>`),
    plug: S(`${shadow}<rect x="10" y="12" width="28" height="28" rx="8" fill="url(#g-paper)" stroke="#7d8aa0"/>
      <rect x="18" y="20" width="3" height="8" rx="1" fill="#3d4450"/><rect x="27" y="20" width="3" height="8" rx="1" fill="#3d4450"/>
      <path d="M20 33q4 4 8 0" stroke="#e5780b" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M17 7q7-5 14 0M20 10q4-3 8 0" stroke="#2a8bea" stroke-width="2" fill="none" stroke-linecap="round"/>`),
    plant: S(`${shadow}<path d="M14 30h20l-3 12H17z" fill="url(#g-orange)" stroke="#9c4d06"/>
      <path d="M24 30V14" stroke="#2f8f1f" stroke-width="2.5"/><path d="M24 20c-9 1-12-5-12-10 7 0 12 3 12 10zM24 17c2-7 8-10 14-9 0 6-5 10-14 9z" fill="url(#g-green)" stroke="#1f6b12"/>
      <path d="M18 42v3M24 42v4M30 42v3" stroke="#9fc8ff" stroke-width="2" stroke-linecap="round"/>`),
    globePlant: S(`${shadow}<circle cx="24" cy="25" r="17" fill="url(#g-blue)" stroke="#123f93"/>
      <path d="M12 18c5 1 6 5 4 8s1 7 4 8M30 10c-2 4 2 6 5 6s5 4 3 7" fill="none" stroke="#9be27a" stroke-width="3"/>
      <path d="M24 8c-10 0-10 34 0 34M7 25h34" stroke="#cfe3ff" stroke-width="1" fill="none" opacity=".7"/>`),
    hardhat: S(`${shadow}<path d="M8 32c0-10 7-17 16-17s16 7 16 17z" fill="url(#g-orange)" stroke="#9c4d06"/>
      <rect x="4" y="31" width="40" height="6" rx="3" fill="#f7a823" stroke="#9c4d06"/><path d="M24 15v16M18 17l2 14M30 17l-2 14" stroke="#c96a00" stroke-width="2"/>`),
    cone: S(`${shadow}<path d="M20 6h8l9 32H11z" fill="url(#g-orange)" stroke="#9c4d06"/><path d="M17 18h14l2 8H15z" fill="#fff"/>
      <rect x="6" y="37" width="36" height="5" rx="1.5" fill="#e5780b" stroke="#9c4d06"/>`),
    vest: S(`${shadow}<path d="M14 6l6 4h8l6-4 8 8-4 6v22H10V20l-4-6z" fill="#d4f53c" stroke="#7d9410"/>
      <path d="M10 26h28M10 33h28" stroke="#c9ccd1" stroke-width="3"/><path d="M24 10v32" stroke="#7d9410"/>`),
    chart: S(`${shadow}<rect x="6" y="6" width="36" height="34" rx="2" fill="url(#g-paper)" stroke="#7d8aa0"/>
      <rect x="11" y="26" width="6" height="10" fill="url(#g-blue)"/><rect x="21" y="19" width="6" height="17" fill="url(#g-green)"/><rect x="31" y="12" width="6" height="24" fill="url(#g-orange)"/>
      <path d="M10 22l10-6 8 3 10-9" stroke="#c62d1a" stroke-width="2" fill="none"/>`),
    engine: S(`${shadow}<rect x="6" y="20" width="22" height="14" rx="2" fill="url(#g-grey)" stroke="#555"/>
      <rect x="10" y="12" width="8" height="8" fill="url(#g-grey)" stroke="#555"/><circle cx="36" cy="22" r="9" fill="none" stroke="#3d4450" stroke-width="3"/>
      <path d="M36 22l7-5M18 16h18" stroke="#3d4450" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M10 42c0-4 3-4 3-8 2 2 4 4 4 8M20 42c0-3 2-3 2-6 2 2 3 3 3 6" fill="url(#g-orange)" stroke="#c62d1a"/>`),
    palette: S(`${shadow}<path d="M24 5C12 5 4 13 4 23c0 9 7 16 15 16 3 0 4-2 4-4s-2-3-2-5 2-4 5-4h6c6 0 10-4 10-10C42 10 34 5 24 5z" fill="url(#g-paper)" stroke="#8a6d3b" stroke-width="1.2"/>
      <circle cx="14" cy="18" r="3.5" fill="#e8442e"/><circle cx="23" cy="12" r="3.5" fill="#ffc72c"/><circle cx="32" cy="14" r="3.5" fill="#2f8f1f"/><circle cx="12" cy="28" r="3.5" fill="#1d5fd1"/>
      <path d="M44 6 30 30" stroke="#7a3b04" stroke-width="3" stroke-linecap="round"/><path d="M30 30l-3 6 5-4z" fill="#333"/>`),
    globe: S(`${shadow}<circle cx="24" cy="24" r="18" fill="url(#g-blue)" stroke="#123f93"/>
      <path d="M24 6c-8 6-8 30 0 36M24 6c8 6 8 30 0 36M6 24h36M9 15h30M9 33h30" stroke="#d9ebff" stroke-width="1.4" fill="none"/>
      <path d="M8 30c10-3 22-1 32-8" stroke="#ffd34d" stroke-width="3" fill="none" opacity=".9"/>`),
    image: doc('#dbe6f5', '<rect x="13" y="17" width="22" height="18" fill="url(#g-blue)" stroke="#3b5ea8"/><path d="M13 35l7-9 5 6 4-4 6 7z" fill="url(#g-green)"/><circle cx="29" cy="22" r="2.5" fill="#ffe36b"/>'),
    video: doc('#e3dcf5', '<rect x="13" y="18" width="22" height="16" rx="2" fill="#2b2f3a"/><path d="M21 22v8l7-4z" fill="#fff"/>'),
    audio: doc('#efe5ff', '<path d="M21 34V20l11-3v14" stroke="#4b2694" stroke-width="2" fill="none"/><circle cx="18.5" cy="34" r="3" fill="#6b3fc4"/><circle cx="29.5" cy="31" r="3" fill="#6b3fc4"/>'),
    text: doc('#e6eaf0', lines),
    word: doc('#d6e3fb', lines + '<rect x="6" y="26" width="16" height="14" rx="2" fill="url(#g-blue)" stroke="#123f93"/><text x="14" y="37" font-size="11" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial">W</text>'),
    pdf: doc('#fbd9d4', lines + '<rect x="6" y="26" width="20" height="14" rx="2" fill="url(#g-red)" stroke="#7b1a0e"/><text x="16" y="36.5" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial">PDF</text>'),
    notepad: S(`${shadow}<rect x="9" y="7" width="30" height="36" rx="2" fill="#fff" stroke="#7d8aa0"/><rect x="9" y="7" width="30" height="6" fill="url(#g-blue)"/>
      ${lines}<path d="M13 5v5M19 5v5M25 5v5M31 5v5M35 5v5" stroke="#555" stroke-width="1.5"/>`),
    idea: S(`${shadow}<circle cx="24" cy="19" r="13" fill="#fff3a6" stroke="#b99700"/><path d="M19 30h10v6H19z" fill="url(#g-grey)" stroke="#6d7684"/>
      <path d="M20 39h8" stroke="#6d7684" stroke-width="2.5" stroke-linecap="round"/><path d="M20 22q4-6 8 0" stroke="#e5a400" stroke-width="2" fill="none"/>
      <path d="M17 12a8 8 0 0 1 6-4" stroke="#fff" stroke-width="2" fill="none"/>`),
    user: S(`${shadow}<rect x="4" y="4" width="40" height="40" rx="6" fill="url(#g-orange)" stroke="#9c4d06"/><circle cx="24" cy="19" r="7" fill="#fff"/><path d="M11 40c1-9 6-13 13-13s12 4 13 13z" fill="#fff"/>`),
    help: S(`${shadow}<circle cx="24" cy="24" r="18" fill="url(#g-blue)" stroke="#123f93"/><text x="24" y="32" font-size="22" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Georgia">?</text>`),
    power: S(`<rect x="4" y="4" width="40" height="40" rx="8" fill="url(#g-red)" stroke="#7b1a0e"/><path d="M17 15a12 12 0 1 0 14 0" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M24 10v14" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`),
    logoff: S(`<rect x="4" y="4" width="40" height="40" rx="8" fill="url(#g-orange)" stroke="#9c4d06"/><path d="M14 14h12v20H14z" fill="none" stroke="#fff" stroke-width="3"/><path d="M22 24h16m-5-5 5 5-5 5" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>`),
    orb: S(`<circle cx="24" cy="24" r="20" fill="url(#g-orb)" stroke="#155c0b"/><text x="24" y="32" font-size="24" font-weight="bold" font-style="italic" fill="#fff" text-anchor="middle" font-family="Trebuchet MS, Arial">S</text>`),
    speaker: S(`<path d="M8 18h8l10-8v28l-10-8H8z" fill="url(#g-grey)" stroke="#555"/><path d="M31 17q5 7 0 14M35 13q9 11 0 22" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>`),
    speakerOff: S(`<path d="M8 18h8l10-8v28l-10-8H8z" fill="url(#g-grey)" stroke="#555"/><path d="M31 18l10 12M41 18 31 30" stroke="#ff5a4a" stroke-width="3" stroke-linecap="round"/>`),
    network: S(`<rect x="6" y="8" width="20" height="15" rx="2" fill="url(#g-screen)" stroke="#fff"/><rect x="22" y="22" width="20" height="15" rx="2" fill="url(#g-screen)" stroke="#fff"/><path d="M16 23v8h6" stroke="#fff" stroke-width="2" fill="none"/>`),
  };
})();

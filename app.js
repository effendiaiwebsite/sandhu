/* ==========================================================
   SATINDER PAL SINGH SANDHU - Portfolio
   Three.js Starfield + 3D Timeline Camera Journey + GSAP
   ========================================================== */

// ==================== THREE.JS SCENE SETUP ====================
(function initScene() {
    const canvas = document.getElementById('starfield');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();

    // Fog for depth — fades distant objects into the dark
    scene.fog = new THREE.FogExp2(0x06070f, 0.002);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 0, 300);

    // ---- Glow texture helper ----
    function makeGlowTexture(color) {
        const size = 256;
        const c    = document.createElement('canvas');
        c.width = c.height = size;
        const ctx = c.getContext('2d');
        const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        grad.addColorStop(0,    color + 'ff');
        grad.addColorStop(0.3,  color + '88');
        grad.addColorStop(0.7,  color + '22');
        grad.addColorStop(1,    color + '00');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        return new THREE.CanvasTexture(c);
    }

    // ---- Parse milestone data ----
    const milestones = [];
    document.querySelectorAll('#timeline-data > div').forEach((el) => {
        milestones.push({
            year:        el.dataset.year,
            title:       el.dataset.title,
            desc:        el.dataset.desc,
            link:        el.dataset.link,
            linkLabel:   el.dataset.linkLabel,
            images:      el.dataset.images      ? el.dataset.images.split('|').filter(Boolean)      : [],
            imageAlts:   el.dataset.imageAlts   ? el.dataset.imageAlts.split('|').filter(Boolean)   : [],
            imageLinks:  el.dataset.imageLinks  ? el.dataset.imageLinks.split('|').filter(Boolean)  : [],
            badges:      el.dataset.badges      ? el.dataset.badges.split('|').filter(Boolean)      : [],
            parade:          el.dataset.parade === 'true',
            appDescs:        el.dataset.appDescs        ? el.dataset.appDescs.split('|')                                                 : [],
            secondaryImages: el.dataset.secondaryImages ? el.dataset.secondaryImages.split('||').map(g => g.split('|').filter(Boolean)) : [],
        });
    });

    // Index of the parade milestone (-1 if none)
    let paradeIdx = -1;
    milestones.forEach((m, mi) => { if (m.parade) paradeIdx = mi; });

    // ---- Camera path: a gentle S-curve through 3D space ----
    // Each milestone is placed further along the -Z axis, with gentle X/Y weaves
    const MILESTONE_Z_SPACING = 280;
    const pathPoints = [];
    milestones.forEach((m, i) => {
        const t = milestones.length > 1 ? i / (milestones.length - 1) : 0;
        const x = Math.sin(t * Math.PI * 2.5) * 80;
        const y = Math.cos(t * Math.PI * 1.2) * 40 - i * 15;
        const z = 200 - i * MILESTONE_Z_SPACING;
        m.worldPos = new THREE.Vector3(x, y, z);
        pathPoints.push(new THREE.Vector3(x, y, z + 80)); // camera arrives slightly before node
    });

    // Catmull-Rom spline for smooth camera travel
    const cameraSpline = new THREE.CatmullRomCurve3(pathPoints, false, 'catmullrom', 0.5);

    // ---- Starfield ----
    const STAR_COUNT = 3000;
    const starGeo = new THREE.BufferGeometry();
    const sPos = new Float32Array(STAR_COUNT * 3);
    const sSize = new Float32Array(STAR_COUNT);
    const sColor = new Float32Array(STAR_COUNT * 3);

    for (let i = 0; i < STAR_COUNT; i++) {
        const i3 = i * 3;
        sPos[i3]     = (Math.random() - 0.5) * 2000;
        sPos[i3 + 1] = (Math.random() - 0.5) * 2000;
        sPos[i3 + 2] = (Math.random() - 0.5) * 2000 - 500;
        sSize[i] = Math.random() * 3 + 0.8;   // smaller — less flare
        const c = Math.random();
        // Warm white (most stars), pale blue-white, soft amber — like real night sky
        if (c < 0.55)      { sColor[i3] = 0.92; sColor[i3+1] = 0.93; sColor[i3+2] = 0.98; }  // white-blue
        else if (c < 0.78) { sColor[i3] = 0.98; sColor[i3+1] = 0.95; sColor[i3+2] = 0.88; }  // warm white
        else if (c < 0.92) { sColor[i3] = 0.72; sColor[i3+1] = 0.78; sColor[i3+2] = 0.92; }  // pale periwinkle
        else               { sColor[i3] = 0.95; sColor[i3+1] = 0.88; sColor[i3+2] = 0.72; }  // soft gold
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    starGeo.setAttribute('size',     new THREE.BufferAttribute(sSize, 1));
    starGeo.setAttribute('color',    new THREE.BufferAttribute(sColor, 3));

    const starMat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            varying float vAlpha;
            uniform float uTime;
            void main() {
                vColor = color;
                vec3 pos = position;
                pos.x += sin(uTime * 0.25 + position.y * 0.01) * 1.5;
                pos.y += cos(uTime * 0.18 + position.x * 0.01) * 1.5;
                vAlpha = 0.72 + 0.18 * sin(uTime * 0.18 + position.x * 0.06 + position.z * 0.04);
                vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * (350.0 / -mvPos.z);
                gl_Position = projectionMatrix * mvPos;
            }`,
        fragmentShader: `
            varying vec3 vColor; varying float vAlpha;
            void main() {
                float d = length(gl_PointCoord - vec2(0.5));
                if (d > 0.5) discard;
                float a = smoothstep(0.5, 0.1, d) * vAlpha;
                gl_FragColor = vec4(vColor, a * 0.65);
            }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    scene.add(new THREE.Points(starGeo, starMat));

    // ---- Nebula ----
    const NEBULA_COUNT = 50;
    const nebGeo = new THREE.BufferGeometry();
    const nPos = new Float32Array(NEBULA_COUNT * 3);
    const nSize = new Float32Array(NEBULA_COUNT);
    const nColor = new Float32Array(NEBULA_COUNT * 3);
    for (let i = 0; i < NEBULA_COUNT; i++) {
        const i3 = i * 3;
        nPos[i3]     = (Math.random() - 0.5) * 1200;
        nPos[i3 + 1] = (Math.random() - 0.5) * 1200;
        nPos[i3 + 2] = -300 - Math.random() * 1200;
        nSize[i] = 120 + Math.random() * 180;
        const t = Math.random();
        // Dusty rose, muted slate-blue, deep indigo — no vivid magentas
        if (t < 0.4) {
            // Dusty rose / terracotta nebula
            nColor[i3] = 0.32 + t * 0.15; nColor[i3+1] = 0.18 + t * 0.08; nColor[i3+2] = 0.28 + t * 0.12;
        } else if (t < 0.75) {
            // Slate blue / cool indigo
            nColor[i3] = 0.12 + t * 0.08; nColor[i3+1] = 0.16 + t * 0.1;  nColor[i3+2] = 0.38 + t * 0.2;
        } else {
            // Deep teal-blue
            nColor[i3] = 0.1 + t * 0.05;  nColor[i3+1] = 0.22 + t * 0.12; nColor[i3+2] = 0.35 + t * 0.18;
        }
    }
    nebGeo.setAttribute('position', new THREE.BufferAttribute(nPos, 3));
    nebGeo.setAttribute('size',     new THREE.BufferAttribute(nSize, 1));
    nebGeo.setAttribute('color',    new THREE.BufferAttribute(nColor, 3));
    const nebMat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
            attribute float size; attribute vec3 color; varying vec3 vColor; uniform float uTime;
            void main() {
                vColor = color;
                vec3 pos = position;
                pos.x += sin(uTime * 0.08 + position.y * 0.004) * 8.0;
                vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * (300.0 / -mvPos.z);
                gl_Position = projectionMatrix * mvPos;
            }`,
        fragmentShader: `
            varying vec3 vColor;
            void main() {
                float d = length(gl_PointCoord - vec2(0.5));
                if (d > 0.5) discard;
                float a = smoothstep(0.5, 0.0, d) * 0.038;
                gl_FragColor = vec4(vColor, a);
            }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    scene.add(new THREE.Points(nebGeo, nebMat));

    // ---- Build 3D milestone nodes ----
    // Soft amber-gold + cool slate-blue — natural space palette, no neon
    const ACCENT   = new THREE.Color(0xc8a96e);   // warm gold
    const ACCENT2  = new THREE.Color(0x7090b8);   // muted steel-blue
    const nodeGroups = [];

    milestones.forEach((m, i) => {
        const group = new THREE.Group();
        group.position.copy(m.worldPos);

        // Core glowing sphere
        const coreMesh = new THREE.Mesh(
            new THREE.SphereGeometry(6, 32, 32),
            new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? ACCENT : ACCENT2 })
        );
        group.add(coreMesh);

        // Outer pulsing ring
        const ringGeo = new THREE.TorusGeometry(14, 1.2, 16, 60);
        const ringMat = new THREE.MeshBasicMaterial({
            color: i % 2 === 0 ? ACCENT : ACCENT2,
            transparent: true, opacity: 0.45
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);

        // Second tilted ring
        const ring2 = new THREE.Mesh(
            new THREE.TorusGeometry(20, 0.6, 16, 60),
            new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? ACCENT2 : ACCENT, transparent: true, opacity: 0.18 })
        );
        ring2.rotation.x = Math.PI / 3;
        ring2.rotation.z = Math.PI / 5;
        group.add(ring2);

        // Glow halo — large additive sprite
        const spriteMat = new THREE.SpriteMaterial({
            map: makeGlowTexture(i % 2 === 0 ? '#c8a96e' : '#7090b8'),
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: 0.3
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(70, 70, 1);
        group.add(sprite);

        // Connecting tunnel tube along the path between nodes
        if (i < milestones.length - 1) {
            const next = milestones[i + 1].worldPos;
            const mid  = m.worldPos.clone().lerp(next, 0.5);
            mid.x += (Math.random() - 0.5) * 30;
            mid.y += (Math.random() - 0.5) * 20;
            const tubeCurve = new THREE.QuadraticBezierCurve3(m.worldPos.clone(), mid, next.clone());
            const tubeGeo = new THREE.TubeGeometry(tubeCurve, 60, 0.8, 8, false);
            const tubeMat = new THREE.MeshBasicMaterial({
                color: 0x7090b8, transparent: true, opacity: 0.12,
                blending: THREE.AdditiveBlending, depthWrite: false
            });
            scene.add(new THREE.Mesh(tubeGeo, tubeMat));
        }

        // Floating debris particles around each node
        const debrisGeo = new THREE.BufferGeometry();
        const DEBRIS = 60;
        const dPos   = new Float32Array(DEBRIS * 3);
        const dSize  = new Float32Array(DEBRIS);
        for (let d = 0; d < DEBRIS; d++) {
            const theta = Math.random() * Math.PI * 2;
            const phi   = Math.acos(2 * Math.random() - 1);
            const r     = 30 + Math.random() * 60;
            dPos[d*3]   = r * Math.sin(phi) * Math.cos(theta);
            dPos[d*3+1] = r * Math.sin(phi) * Math.sin(theta);
            dPos[d*3+2] = r * Math.cos(phi);
            dSize[d] = Math.random() * 3 + 1;
        }
        debrisGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
        debrisGeo.setAttribute('size',     new THREE.BufferAttribute(dSize, 1));
        const debrisMat = new THREE.ShaderMaterial({
            uniforms: { uColor: { value: i % 2 === 0 ? new THREE.Color(0xc8a96e) : new THREE.Color(0x7090b8) } },
            vertexShader: `
                attribute float size;
                void main() {
                    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (200.0 / -mvPos.z);
                    gl_Position  = projectionMatrix * mvPos;
                }`,
            fragmentShader: `
                uniform vec3 uColor;
                void main() {
                    float d = length(gl_PointCoord - vec2(0.5));
                    if (d > 0.5) discard;
                    float a = smoothstep(0.5, 0.1, d) * 0.7;
                    gl_FragColor = vec4(uColor, a);
                }`,
            transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
        });
        group.add(new THREE.Points(debrisGeo, debrisMat));

        scene.add(group);
        nodeGroups.push({ group, ring, ring2, coreMesh, sprite, m });
    });

    // ---- Build HTML image cards — cinematic fly-in system ----
    // Each card has its own screen-space "resting" position and a unique
    // off-screen launch point. When the camera enters a milestone's range the
    // cards fly in one-by-one along a smooth arc, then breathe gently in place.
    const imgLayer = document.getElementById('timeline-img-layer');
    const imgCards = [];

    // Resting positions per image index within a milestone (% of screen, 0–1).
    // Cards land on the RIGHT half of the screen, staggered vertically.
    // Odd milestones mirror to the left half.
    const REST_SLOTS = [
        { rx: 0.58, ry: 0.28 },   // top-right
        { rx: 0.72, ry: 0.55 },   // mid-right
        { rx: 0.56, ry: 0.72 },   // bottom-right
    ];
    // Off-screen launch origins (where the card starts before flying in)
    const LAUNCH_SLOTS = [
        { lx: 1.25, ly: -0.15 },  // from top-right corner
        { lx: 1.30, ly:  0.50 },  // from far right
        { lx: 1.20, ly:  1.15 },  // from bottom-right
    ];

    milestones.forEach((m, mi) => {
        const n = m.images.length;
        if (!n) return;
        if (m.parade) return;          // parade milestone uses its own card system
        const isLeft = mi % 2 !== 0;   // alternate which side cards rest on

        m.images.forEach((src, ii) => {
            const slotIdx  = ii % REST_SLOTS.length;
            const restSlot = REST_SLOTS[slotIdx];
            const launchSlot = LAUNCH_SLOTS[slotIdx];

            // Degree certificate: bigger and centered
            const isDegreeCard = mi === 0 && ii === 0;
            // Startup Chile group photo: bigger and positioned center-right
            const isStartupChileCard = mi === 1 && ii === 0;

            // Mirror X for left-side milestones; feature cards get custom positions
            const restX   = isDegreeCard        ? 0.50
                          : isStartupChileCard  ? 0.61
                          : (isLeft ? (1 - restSlot.rx) : restSlot.rx);
            const launchX = isLeft ? (1 - launchSlot.lx) : launchSlot.lx;
            const launchY = launchSlot.ly;

            // Card size — big and cinematic; degree + startup chile get extra width
            const cardW = isDegreeCard ? 520 : isStartupChileCard ? 490 : (ii === 0 ? 380 : 300);

            const card = document.createElement('div');
            card.className = 'img-card' + (isLeft ? ' accent2' : '');

            const link = m.imageLinks[ii] || '';
            const alt  = m.imageAlts[ii]  || m.title;

            const img = document.createElement('img');
            img.src      = src;
            img.alt      = alt;
            img.draggable = false;
            img.onerror  = () => { card.style.display = 'none'; };
            // Pre-decode so first-scroll never stalls on image decode
            img.decode().catch(() => {});

            if (link) {
                card.classList.add('clickable');
                card.title = 'Visit ' + link;
                card.addEventListener('click', () => window.open(link, '_blank'));
            }

            card.appendChild(img);

            if (alt) {
                const label = document.createElement('div');
                label.className = 'img-card-label';
                label.textContent = alt;
                card.appendChild(label);
            }

            imgLayer.appendChild(card);

            // Unique slow-drift offsets so each card moves independently
            const seed = mi * 7 + ii * 3;
            imgCards.push({
                el:          card,
                milestoneIdx: mi,
                // Resting screen position (0–1 fraction)
                restX, restY: isDegreeCard ? 0.42 : isStartupChileCard ? 0.40 : restSlot.ry,
                // Off-screen launch position
                launchX, launchY,
                cardW,
                // Fly-in stagger delay in seconds
                flyDelay:    ii * 0.28,
                // Slow breath offsets
                driftOffX:   seed % 10,
                driftOffY:   (seed * 3) % 10,
                driftSpeed:  0.28 + (seed % 5) * 0.04,
                // Runtime state
                shown:       false,   // has fly-in been triggered?
                flyT:        0,       // 0→1 fly-in progress
                flying:      false,
                flyStart:    0,
            });
        });
    });

    // ---- Build parade cards (horizontal scroll showcase for software milestone) ----
    // Each card = one app: screenshot on top, name + description below.
    // They fly horizontally across the screen, driven by scroll progress.
    const paradeCards = [];
    if (paradeIdx >= 0) {
        const pm = milestones[paradeIdx];
        // Vertical lane for each card — all near vertical center so they read clearly
        const laneYFracs = [0.42, 0.44, 0.40, 0.43];

        pm.images.forEach((src, ii) => {
            const wrap = document.createElement('div');
            wrap.className = 'parade-card';

            // Screenshot
            const imgWrap = document.createElement('div');
            imgWrap.className = 'parade-img-wrap';
            const img = document.createElement('img');
            img.src = src;
            img.alt = pm.imageAlts[ii] || '';
            img.draggable = false;
            img.onerror = () => {
                // Keep the card visible — just replace the broken image with a subtle placeholder
                img.style.display = 'none';
                imgWrap.style.background = 'linear-gradient(135deg, rgba(139,143,216,0.10), rgba(126,184,212,0.06))';
            };
            // Pre-decode at startup so first-scroll never stalls on image decode
            img.decode().catch(() => {});
            imgWrap.appendChild(img);

            const link = pm.imageLinks[ii] || '';
            if (link) {
                // Prominent click-to-visit badge overlaid on the screenshot
                const badge = document.createElement('div');
                badge.className = 'parade-visit-badge';
                badge.innerHTML = '<span class="badge-arrow">↗</span><span class="badge-label">Visit Site</span>';
                imgWrap.appendChild(badge);
            }

            wrap.appendChild(imgWrap);

            // Info panel
            const info = document.createElement('div');
            info.className = 'parade-info';

            const h3 = document.createElement('h3');
            h3.textContent = pm.imageAlts[ii] || '';
            info.appendChild(h3);

            const p = document.createElement('p');
            p.textContent = pm.appDescs[ii] || '';
            info.appendChild(p);

            if (link) {
                const a = document.createElement('a');
                a.href = link; a.target = '_blank'; a.rel = 'noopener';
                a.className = 'parade-link';
                a.textContent = 'Visit site →';
                wrap.classList.add('clickable');
                wrap.addEventListener('click', (e) => {
                    if (e.target.tagName !== 'A') window.open(link, '_blank');
                });
                info.appendChild(a);
            }

            wrap.appendChild(info);
            imgLayer.appendChild(wrap);

            paradeCards.push({
                el:       wrap,
                appIdx:   ii,
                laneY:    laneYFracs[ii % laneYFracs.length],
            });
        });
    }

    // ---- Build flyby cards (secondary screenshots that fly across during each app's dwell) ----
    // Y lanes chosen to avoid overlapping the main parade card lanes ([0.30, 0.50, 0.28, 0.48])
    const FLYBY_LANE_Y = [0.14, 0.72, 0.82, 0.44];
    const flybyByApp = {};
    if (paradeIdx >= 0) {
        const pm = milestones[paradeIdx];
        pm.secondaryImages.forEach((secImgs, appIdx) => {
            flybyByApp[appIdx] = [];
            secImgs.forEach((src, si) => {
                const el = document.createElement('div');
                el.className = 'flyby-card';
                el.style.opacity = '0';
                const img = document.createElement('img');
                img.src = src;
                img.alt = '';
                img.draggable = false;
                img.onerror = () => { el.style.display = 'none'; };
                // Pre-decode at startup so first-scroll never stalls on image decode
                img.decode().catch(() => {});
                el.appendChild(img);
                imgLayer.appendChild(el);
                flybyByApp[appIdx].push({
                    el,
                    laneY: FLYBY_LANE_Y[(appIdx * 2 + si) % FLYBY_LANE_Y.length],
                    speed: 65 + si * 18 + appIdx * 10,    // px/s — slower for longer screen time
                    phase: si * 3.8 + appIdx * 1.4,       // time offset so they stagger
                });
            });
        });
    }

    // ---- Pre-compute parade app time slices (one-time, not per-frame) ----
    // Non-uniform weights: IJT and Gator each get 30% of scroll time,
    // Houses in BC and SalesCRM each get 20%.
    const APP_WEIGHTS = [1.5, 1.5, 1.0, 1.0];
    const TOTAL_W = APP_WEIGHTS.reduce((s, w) => s + w, 0); // 5.0
    const appSlices = [];
    (function () {
        let cumW = 0;
        APP_WEIGHTS.forEach(w => {
            const start = cumW / TOTAL_W;
            cumW += w;
            const end = cumW / TOTAL_W;
            appSlices.push({ start, end, center: (start + end) / 2, half: (end - start) / 2 });
        });
    })();
    // Resulting slice ranges (adjustedLocalT):
    //   IJT        0.00 → 0.30
    //   Gator      0.30 → 0.60
    //   HousesinBC 0.60 → 0.80
    //   SalesCRM   0.80 → 1.00

    // ---- HUD elements ----
    const hudYear     = document.getElementById('hud-year');
    const hudTitle    = document.getElementById('hud-title');
    const hudDesc     = document.getElementById('hud-desc');
    const hudLinkWrap = document.getElementById('hud-link-wrap');
    const hudBadges   = document.getElementById('hud-badges');
    const hudBar      = document.getElementById('hud-progress-bar');
    const hudDotsCont = document.getElementById('hud-progress-dots');

    // Build progress dots
    milestones.forEach((m, i) => {
        const dot = document.createElement('div');
        dot.className = 'hud-dot';
        dot.dataset.idx = i;
        hudDotsCont.appendChild(dot);
    });

    let currentHudIdx = -1;

    function updateHUD(idx, progress) {
        hudBar.style.width = (progress * 100) + '%';
        const dots = hudDotsCont.querySelectorAll('.hud-dot');
        dots.forEach((d, i) => d.classList.toggle('active', i <= idx));

        if (idx === currentHudIdx) return;
        currentHudIdx = idx;
        if (idx < 0 || idx >= milestones.length) return;

        const m = milestones[idx];

        // Animate out then in
        gsap.to([hudYear, hudTitle, hudDesc, hudLinkWrap, hudBadges], {
            opacity: 0, y: -15, duration: 0.25, ease: 'power2.in',
            onComplete: () => {
                hudYear.textContent  = m.year;
                hudTitle.innerHTML   = m.title.replace(/\n/g, '<br>');
                hudDesc.textContent  = m.desc;

                hudLinkWrap.innerHTML = '';
                if (m.link) {
                    const a = document.createElement('a');
                    a.href = m.link; a.target = '_blank'; a.rel = 'noopener';
                    a.className = 'hud-link'; a.textContent = m.linkLabel;
                    hudLinkWrap.appendChild(a);
                }

                hudBadges.innerHTML = '';
                m.badges.forEach(b => {
                    const sp = document.createElement('span');
                    sp.className = 'hud-badge'; sp.textContent = b;
                    hudBadges.appendChild(sp);
                });

                gsap.fromTo([hudYear, hudTitle, hudDesc, hudLinkWrap, hudBadges],
                    { opacity: 0, y: 15 },
                    { opacity: 1, y: 0, duration: 0.4, stagger: 0.07, ease: 'power3.out' }
                );
            }
        });
    }

    // ---- Scroll-to-3D mapping ----
    // #timeline-scroll-track height drives camera progress
    let scrollProgress = 0; // 0 → 1 across the timeline section
    let targetProgress = 0;

    // Cached DOM refs — queried once at init, never inside animate()
    const trackEl = document.getElementById('timeline-scroll-track');
    const hudEl   = document.getElementById('timeline-hud');

    // Cached viewport dimensions and track rect — updated on resize/scroll, not per-frame
    let VW = window.innerWidth, VH = window.innerHeight;
    let trackRect = trackEl ? trackEl.getBoundingClientRect() : null;

    function updateScrollProgress() {
        if (!trackEl) return;
        trackRect = trackEl.getBoundingClientRect();
        const totalScroll = trackEl.offsetHeight - VH;
        const scrolled = -trackRect.top;
        targetProgress = Math.max(0, Math.min(1, scrolled / totalScroll));
    }
    window.addEventListener('scroll', updateScrollProgress);
    updateScrollProgress();

    // ---- Mouse parallax ----
    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / VW - 0.5) * 2;
        mouseY = (e.clientY / VH - 0.5) * 2;
    });

    // Image clicks are handled by direct event listeners on each .img-card element

    // ---- Resize ----
    window.addEventListener('resize', () => {
        VW = window.innerWidth;
        VH = window.innerHeight;
        camera.aspect = VW / VH;
        camera.updateProjectionMatrix();
        renderer.setSize(VW, VH);
        if (trackEl) trackRect = trackEl.getBoundingClientRect();
        updateScrollProgress();
    });

    // ---- Non-linear scroll remapping ----
    // 2016 + 2017 milestones : raw 0    → 0.09  maps to spline 0    → 0.50  (~72vh, ~36vh each)
    // Labour 2019            : raw 0.09 → 0.11  maps to spline 0.50 → 0.625 (~16vh — quick glimpse)
    // Parade 2021            : raw 0.11 → 11/12 maps to spline 0.625→ 0.875 (~645vh — dominant zone, ~40× Labour)
    // 2025 milestone         : raw 11/12→ 1     maps to spline 0.875→ 1.0   (~67vh)
    const REMAP_LABOUR_START = 0.09;  // 2016+2017 end / Labour begins
    const REMAP_PRE          = 0.11;  // Labour ends  / Parade begins
    const REMAP_POST         = 11 / 12; // Parade ends / 2025 begins  ≈ 0.9167
    function remapProgress(raw) {
        if (raw <= REMAP_LABOUR_START) {
            // 2016 + 2017 — comfortable pace
            return raw * (0.50 / REMAP_LABOUR_START);
        }
        if (raw <= REMAP_PRE) {
            // Labour 2019 — very brief, quick glimpse only
            return 0.50 + (raw - REMAP_LABOUR_START) * ((0.625 - 0.50) / (REMAP_PRE - REMAP_LABOUR_START));
        }
        if (raw <= REMAP_POST) {
            // Parade — dominant zone, ~40× more scroll space than Labour
            return 0.625 + (raw - REMAP_PRE) * (0.25 / (REMAP_POST - REMAP_PRE));
        }
        // 2025 milestone
        return 0.875 + (raw - REMAP_POST) * (0.125 / (1 - REMAP_POST));
    }

    // ---- Easing helpers ----
    function easeOutCubic(x)    { return 1 - Math.pow(1 - x, 3); }
    function easeInCubic(x)     { return x * x * x; }
    function easeInOutCubic(x)  { return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3) / 2; }

    // ---- Main render loop ----
    const clock = new THREE.Clock();
    let   lookAtTarget = new THREE.Vector3();
    const lookOffset   = new THREE.Vector3(); // pre-allocated — reused every frame, avoids GC
    let   prevT        = 0;                   // for frame-rate independent delta time

    // Tracks the localT value at which closestIdx first became paradeIdx.
    // adjustedLocalT is computed from this, so IJT always starts at 0 when the
    // parade gate opens — no matter how long the camera lerp takes.
    let paradeActivatedAtLocalT = null;

    function animate() {
        requestAnimationFrame(animate);
        const t  = clock.getElapsedTime();
        const dt = t - prevT;
        prevT    = t;
        starMat.uniforms.uTime.value = t;
        nebMat.uniforms.uTime.value  = t;

        // Smooth scroll lerp — 0.06 is snappier on first scroll while staying silky
        scrollProgress += (targetProgress - scrollProgress) * 0.06;

        // Check if we're in the timeline section (uses cached rect — no reflow)
        const inTimeline = trackRect !== null && trackRect.top < VH && trackRect.bottom > 0;

        if (inTimeline) {
            // Show HUD
            hudEl.style.opacity = '1';

            // Remap raw scroll to spline position — parade section gets 3× more room
            const remappedProgress = remapProgress(scrollProgress);

            // Camera follows spline — lower lerp = smoother glide
            const camPt = cameraSpline.getPoint(Math.max(0, Math.min(1, remappedProgress)));
            camera.position.lerp(camPt, 0.05);

            // Look-at: slightly ahead on the curve (in remapped space) + mouse offset
            const lookT  = Math.min(1, remappedProgress + 0.02);
            const lookPt = cameraSpline.getPoint(lookT);
            lookAtTarget.lerp(lookPt, 0.05);
            // Add mouse parallax tilt — reuse pre-allocated lookOffset, no GC pressure
            lookOffset.set(lookAtTarget.x + mouseX * 5, lookAtTarget.y - mouseY * 3, lookAtTarget.z);
            camera.lookAt(lookOffset);

            // Which milestone are we at?
            // Use scroll-based thresholds (not camera.position distance) so HUD + cards
            // switch instantly at the correct scroll position — no camera-lerp lag.
            // Each milestone i sits at spline-T = i/(n-1); boundary is at the midpoint.
            const closestIdx = Math.max(0, Math.min(milestones.length - 1,
                Math.round(remappedProgress * (milestones.length - 1))
            ));
            updateHUD(closestIdx, remappedProgress);

            // Parade zone progress (localT) — used only by the parade card system below.
            // The imgCard system uses closestIdx exclusively, which naturally switches
            // away from Canada (milestoneIdx 2) to the parade node (milestoneIdx 3).
            // Since the parade milestone has NO imgCards built (skipped by "if m.parade return"),
            // closestIdx === paradeIdx means ALL imgCards are inactive — no blank gap, no overlap.
            const localT = paradeIdx >= 0 ? THREE.MathUtils.clamp(
                (scrollProgress - REMAP_PRE) / (REMAP_POST - REMAP_PRE), 0, 1
            ) : 0;

            // ---- Cinematic image card fly-in ----
            const W = VW;
            const H = VH;

            imgCards.forEach((card) => {
                // Active when camera is closest to this milestone.
                // Parade milestone has no imgCards so this cleanly deactivates on switch.
                const isActive = card.milestoneIdx === closestIdx;

                if (isActive && !card.shown) {
                    // Trigger fly-in after stagger delay
                    if (!card.flying) {
                        card.flying   = true;
                        card.flyStart = t + card.flyDelay;
                    }
                    if (t >= card.flyStart) {
                        card.flyT = Math.min(1, card.flyT + dt * 1.0); // frame-rate independent (~1s duration)
                        if (card.flyT >= 1) card.shown = true;
                    }
                }

                // When a different milestone becomes active, reset this card
                if (!isActive && card.shown) {
                    card.shown   = false;
                    card.flying  = false;
                    card.flyT    = 0;
                }
                if (!isActive && !card.shown) {
                    card.el.style.opacity = '0';
                    return;
                }

                // Compute current position along fly-in arc
                const easedT = easeOutCubic(card.flyT);

                // Launch → rest interpolation
                const curX = card.launchX + (card.restX - card.launchX) * easedT;
                const curY = card.launchY + (card.restY - card.launchY) * easedT;

                // Resting breath drift — very slow, small amplitude
                const driftX = Math.sin(t * card.driftSpeed       + card.driftOffX) * 0.006;
                const driftY = Math.cos(t * card.driftSpeed * 0.7 + card.driftOffY) * 0.005;

                const finalX = (curX + (card.shown ? driftX : 0)) * W;
                const finalY = (curY + (card.shown ? driftY : 0)) * H;

                const w = card.cardW;

                // Slight 3D tilt: leans back during fly-in, settles to near-flat
                const flyRotY  = (1 - easedT) * (card.restX > 0.5 ? -18 : 18); // swings in
                const restTiltX = ((finalY / H) - 0.5) * -3;
                const restTiltY = ((finalX / W) - 0.5) * -4;

                const rx = (restTiltX * easedT).toFixed(2);
                const ry = (flyRotY + restTiltY * easedT).toFixed(2);

                // Opacity: fade in during first 30% of fly-in
                const opacity = Math.min(1, card.flyT * 3.5);

                const tx = (finalX - w * 0.5).toFixed(1);
                const ty = (finalY - w * 0.42).toFixed(1);

                card.el.style.opacity   = opacity.toFixed(3);
                card.el.style.width     = w + 'px';
                card.el.style.transform = `translate(${tx}px,${ty}px) perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
                card.el.style.zIndex    = 10 + card.milestoneIdx;
            });

            // ---- Parade cards: horizontal scroll-driven showcase ----
            if (paradeIdx >= 0 && paradeCards.length > 0) {
                // Self-calibrating parade start:
                // Record localT the first time closestIdx becomes paradeIdx (camera has
                // physically left Canada). adjustedLocalT starts from 0 at that exact moment,
                // so IJT always gets its full window with zero overlap with 2019.
                if (closestIdx === paradeIdx && paradeActivatedAtLocalT === null) {
                    paradeActivatedAtLocalT = localT;
                }
                if (closestIdx !== paradeIdx) {
                    paradeActivatedAtLocalT = null; // reset if user scrolls back
                }

                const remaining = paradeActivatedAtLocalT !== null
                    ? Math.max(0.01, 1 - paradeActivatedAtLocalT)
                    : 1;
                const adjustedLocalT = paradeActivatedAtLocalT !== null
                    ? THREE.MathUtils.clamp((localT - paradeActivatedAtLocalT) / remaining, 0, 1)
                    : 0;

                // APP_WEIGHTS and appSlices are pre-computed once at init (not per-frame)
                const PW = VW, PH = VH;
                const CARD_W = Math.min(580, PW * 0.52);  // main card bigger than flyby cards
                const CARD_H = CARD_W * 0.82;             // proportional height
                const nCards = paradeCards.length;

                // Show parade cards only when camera has confirmed it's at the Freelance node.
                // adjustedLocalT starts from 0 at that exact moment → IJT never missed.
                if (closestIdx === paradeIdx && paradeActivatedAtLocalT !== null) {
                    paradeCards.forEach((card, idx) => {
                        // Each card owns its non-uniform slice of adjustedLocalT
                        const slice   = appSlices[idx];
                        const centerT = slice.center;
                        const span    = slice.half;
                        const appT    = (adjustedLocalT - centerT) / span; // -1→0→1
                        const posT    = (appT + 1) / 2;                    // 0→1

                        if (posT <= 0 || posT >= 1) {
                            card.el.style.opacity = '0';
                            return;
                        }

                        // X: sweep right → long dwell → sweep left
                        // Entry 0-0.20, dwell 0.20-0.80 (60% at rest), exit 0.80-1.0
                        const startX = PW + CARD_W * 0.6 + 20;
                        const restX  = PW * 0.50 - CARD_W * 0.5;   // true horizontal center
                        const endX   = -CARD_W - 20;
                        let x;
                        if (posT < 0.20) {
                            x = startX + (restX - startX) * easeInOutCubic(posT / 0.20);
                        } else if (posT <= 0.80) {
                            // Long dwell — subtle sway so card feels alive, not frozen
                            x = restX + Math.sin(t * 0.6 + idx * 2.4) * 4;
                        } else {
                            x = restX + (endX - restX) * easeInCubic((posT - 0.80) / 0.20);
                        }

                        // Y: centered vertically with a gentle float arc on entry/exit
                        const baseY   = card.laneY * PH - CARD_H * 0.5;
                        const arcY    = -Math.sin(posT * Math.PI) * 14;        // gentle float at peak
                        const aliveY  = Math.sin(t * 0.35 + idx * 1.8) * 4;   // slow breath
                        const y = baseY + arcY + aliveY;

                        // 3D tilt: banks in from right, flattens immediately at rest, banks out left
                        const rotY = posT < 0.20
                            ? (1 - easeInOutCubic(posT / 0.20)) * 12
                            : posT > 0.80
                                ? -(easeInCubic((posT - 0.80) / 0.20) * 12)
                                : Math.sin(t * 0.4 + idx) * 0.4;  // nearly flat at rest
                        const rotZ = posT < 0.20
                            ? (1 - easeInOutCubic(posT / 0.20)) * 2.5
                            : posT > 0.80
                                ? easeInCubic((posT - 0.80) / 0.20) * -2.5
                                : 0;   // perfectly upright at rest

                        // Scale: grows in quickly, full size for the whole dwell
                        const scaleT = posT < 0.20 ? posT / 0.20 : posT > 0.80 ? (1 - posT) / 0.20 : 1;
                        const sc = 0.84 + 0.16 * easeInOutCubic(scaleT);

                        // Opacity: quick fade in/out over narrow 10% windows at each end
                        const op = posT < 0.10 ? posT / 0.10 : posT > 0.90 ? (1 - posT) / 0.10 : 1;

                        card.el.style.opacity   = op.toFixed(3);
                        card.el.style.width     = CARD_W + 'px';
                        card.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) perspective(1000px) rotateY(${rotY.toFixed(1)}deg) rotateZ(${rotZ.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
                        card.el.style.zIndex    = '30';
                    });
                } else {
                    paradeCards.forEach(c => { c.el.style.opacity = '0'; });
                }

                // ---- Flyby secondary screenshots: fly across while main card dwells ----
                const FLYBY_W = Math.min(500, PW * 0.40);   // ~2× bigger
                const FLYBY_H = FLYBY_W * 0.68;

                paradeCards.forEach((card, idx) => {
                    const slice2    = appSlices[idx];
                    const appT2     = (adjustedLocalT - slice2.center) / slice2.half;
                    const posT      = (appT2 + 1) / 2;
                    // Wide dwell window — matches the same PARADE_START gate as main cards
                    const inDwell   = closestIdx === paradeIdx && paradeActivatedAtLocalT !== null && posT > 0.05 && posT < 0.95;
                    const dwellProg = THREE.MathUtils.clamp((posT - 0.05) / 0.90, 0, 1);

                    const flyCards = flybyByApp[idx] || [];
                    flyCards.forEach((fc) => {
                        if (!inDwell) { fc.el.style.opacity = '0'; return; }

                        const cycleW = PW + FLYBY_W + 100;
                        // Use fc.phase * 50 (instead of 100) so images are spaced closer together
                        const x = PW + 50 - ((t * fc.speed + fc.phase * 50) % cycleW);
                        const y = fc.laneY * PH - FLYBY_H * 0.5;

                        // Fade at screen edges so images appear/disappear smoothly
                        const edgeFade = Math.min(1, (x + FLYBY_W) / 100) *
                                         Math.min(1, (PW + FLYBY_W - x) / 100);
                        // Fade in/out over first/last 10% of dwell window
                        const dwellFade = Math.min(dwellProg / 0.10, 1) *
                                          Math.min((1 - dwellProg) / 0.10, 1);
                        const op = Math.max(0, Math.min(1, edgeFade * dwellFade * 0.88));

                        // Slight rotation based on horizontal position (tilts as it flies)
                        const tiltZ = ((x / PW) - 0.5) * -2.5;

                        fc.el.style.opacity   = op.toFixed(3);
                        fc.el.style.width     = FLYBY_W + 'px';
                        fc.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotateZ(${tiltZ.toFixed(2)}deg)`;
                        fc.el.style.zIndex    = '25';
                    });
                });
            }

        } else {
            // Outside timeline: default hero camera
            hudEl.style.opacity = '0';
            camera.position.x += (mouseX * 20 - camera.position.x) * 0.02;
            camera.position.y += (-mouseY * 15 - camera.position.y) * 0.02;
            camera.position.z += (300 - camera.position.z) * 0.02;
            camera.lookAt(0, 0, 0);

            imgCards.forEach((card) => {
                card.el.style.opacity = '0';
                card.shown  = false;
                card.flying = false;
                card.flyT   = 0;
            });
            paradeCards.forEach(c => { c.el.style.opacity = '0'; });
            Object.values(flybyByApp).forEach(grp => grp.forEach(fc => { fc.el.style.opacity = '0'; }));
        }

        // Animate milestone nodes — slowed, smaller pulse range for elegance
        nodeGroups.forEach(({ group, ring, ring2, sprite }, i) => {
            ring.rotation.z  = t * 0.18 + i;
            ring2.rotation.y = t * 0.1  + i * 1.3;
            ring2.rotation.x = Math.PI / 3 + Math.sin(t * 0.12 + i) * 0.06;
            const pulse = 0.96 + 0.04 * Math.sin(t * 0.7 + i);
            group.scale.setScalar(pulse);
            sprite.material.opacity = 0.22 + 0.06 * Math.sin(t * 0.5 + i);
        });

        renderer.render(scene, camera);
    }
    animate();

})();


// ==================== GSAP SCROLL ANIMATIONS ====================
gsap.registerPlugin(ScrollTrigger);

// --- Hero entrance ---
gsap.timeline({ defaults: { ease: 'power3.out' } })
    .to('.hero-greeting',      { opacity: 1, y: 0, duration: 0.8, delay: 0.3 })
    .to('.hero-name',          { opacity: 1, y: 0, duration: 1   }, '-=0.5')
    .to('.hero-degrees',       { opacity: 1, y: 0, duration: 0.8 }, '-=0.6')
    .to('.hero-tagline',       { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
    .to('.hero-cta',           { opacity: 1, y: 0, duration: 0.8 }, '-=0.4');

gsap.from('.hero-image-wrapper', {
    opacity: 0, scale: 0.8, rotation: 5, duration: 1.2, delay: 0.5, ease: 'power3.out'
});

// --- Contact section ---
gsap.fromTo('.contact-title',
    { opacity: 0, y: 50, scale: 0.9 },
    { opacity: 1, y: 0, scale: 1, duration: 1,
      scrollTrigger: { trigger: '#contact', start: 'top 75%', toggleActions: 'play none none reverse' } }
);
gsap.fromTo('.contact-subtitle',
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.8, delay: 0.2,
      scrollTrigger: { trigger: '#contact', start: 'top 75%', toggleActions: 'play none none reverse' } }
);
gsap.fromTo('.contact-btn',
    { opacity: 0, y: 30, scale: 0.9 },
    { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, delay: 0.4, ease: 'power3.out',
      scrollTrigger: { trigger: '.contact-links', start: 'top 85%', toggleActions: 'play none none reverse' } }
);


// ==================== LIGHTBOX ====================
(function initLightbox() {
    const lightbox     = document.getElementById('lightbox');
    const lightboxImg  = lightbox.querySelector('.lightbox-img');
    const lightboxClose = lightbox.querySelector('.lightbox-close');

    document.querySelectorAll('.clickable-img').forEach((img) => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            lightboxImg.src = img.src; lightboxImg.alt = img.alt;
            lightbox.classList.add('open');
            document.body.style.overflow = 'hidden';
        });
    });

    function closeLightbox() {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
    }
    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
    });
})();

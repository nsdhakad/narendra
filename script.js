(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Theme preference is shared across every page in this GitHub Pages site.
  const themeButton = document.getElementById('themeToggle');
  const themeRoot = document.documentElement;
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  let savedTheme = null;
  try { savedTheme = localStorage.getItem('narendra-portfolio-theme'); } catch (_) {}
  const systemPrefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const initialTheme = savedTheme === 'light' || savedTheme === 'dark'
    ? savedTheme
    : (systemPrefersLight ? 'light' : 'dark');
  const applyTheme = theme => {
    const safeTheme = theme === 'light' ? 'light' : 'dark';
    themeRoot.dataset.theme = safeTheme;
    if (themeMeta) themeMeta.setAttribute('content', safeTheme === 'light' ? '#f5f7fb' : '#080e18');
    if (themeButton) {
      const lightMode = safeTheme === 'light';
      themeButton.setAttribute('aria-label', lightMode ? 'Switch to dark mode' : 'Switch to light mode');
      themeButton.setAttribute('title', lightMode ? 'Switch to dark mode' : 'Switch to light mode');
      themeButton.setAttribute('aria-pressed', String(lightMode));
      const icon = themeButton.querySelector('.theme-toggle-icon');
      const label = themeButton.querySelector('.theme-toggle-label');
      if (icon) icon.textContent = lightMode ? '☾' : '☼';
      if (label) label.textContent = lightMode ? 'Dark mode' : 'Light mode';
    }
  };
  applyTheme(initialTheme);
  if (themeButton) themeButton.addEventListener('click', () => {
    const next = themeRoot.dataset.theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    try { localStorage.setItem('narendra-portfolio-theme', next); } catch (_) {}
  });
  window.addEventListener('storage', event => {
    if (event.key !== 'narendra-portfolio-theme') return;
    if (event.newValue === 'light' || event.newValue === 'dark') applyTheme(event.newValue);
  });
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  // Section reveals, progress bar, and navigation affordances.
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -25px 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
  } else revealEls.forEach(el => el.classList.add('is-visible'));

  const progress = $('#readingProgress');
  function updateProgress() {
    const range = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${range > 0 ? Math.max(0, Math.min(100, window.scrollY / range * 100)) : 0}%`;
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
  $('#year').textContent = new Date().getFullYear();

  const toggle = $('#menuToggle');
  const nav = $('#nav');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    nav.classList.toggle('open', open);
  });
  $$('#nav a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
  }));

  const sections = $$('main section[id]');
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        $$('#nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    sections.forEach(s => sectionObserver.observe(s));
  }

  // Research topic selector: keeps the page in place, updates the detail region.
  const topics = {
    memory: {
      title: 'In-/Near-Memory Computing',
      text: 'Exploring 6T SRAM, 10T SRAM, and configurable multi-port memory architectures that support computing where data lives.',
      link: 'https://www.narendradhakad.com/research'
    },
    soc: {
      title: 'SoC for AI',
      text: 'Exploring system-on-chip integration of RISC-V with in-memory computing, alongside emerging memory technologies for AI workloads.',
      link: 'https://www.narendradhakad.com/research/projects'
    },
    edge: {
      title: 'Emerging Memory & Edge AI',
      text: 'Research interests include emerging memory technologies for in-memory computing and resource-efficient AI algorithm implementation on edge devices.',
      link: 'https://www.narendradhakad.com/research'
    }
  };
  $$('.research-card').forEach(card => card.addEventListener('click', () => {
    const data = topics[card.dataset.research];
    if (!data) return;
    $$('.research-card').forEach(item => item.setAttribute('aria-pressed', String(item === card)));
    $('#detailTitle').textContent = data.title;
    $('#detailText').textContent = data.text;
    $('#detailLink').href = data.link;
  }));

  // External institutional logos: show a readable label when a remote image host is unavailable.
  $$('.org-logo-mini img, .edu-logo img, .edu-card-logo img, .sponsor-logo img').forEach(img => {
    const wrapper = img.closest('.org-logo-mini, .edu-logo, .edu-card-logo, .sponsor-logo');
    const setFallback = () => { if (wrapper) wrapper.classList.add('logo-failed'); };
    img.addEventListener('error', setFallback, { once: true });
    if (img.complete && img.naturalWidth === 0) setFallback();
  });

  // Three.js interactive die / package stack. If WebGL or the CDN is unavailable,
  // the CSS chip illustration remains visible and all page content still works.
  const canvas = $('#chipCanvas');
  const fallback = $('#sceneFallback');
  const sceneWrap = $('#sceneWrap');
  const autoButton = $('#autoRotate');
  const resetButton = $('#resetView');
  if (!canvas || !window.THREE) {
    if (canvas) canvas.style.display = 'none';
    if (fallback) fallback.style.display = 'grid';
    const status = $('.scene-version');
    if (status) status.textContent = 'CSS FALLBACK';
    if (autoButton) { autoButton.disabled = true; autoButton.title = '3D library unavailable'; }
    if (resetButton) { resetButton.disabled = true; resetButton.title = '3D library unavailable'; }
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (err) {
    canvas.style.display = 'none';
    fallback.style.display = 'grid';
    $('.scene-version').textContent = 'CSS FALLBACK';
    autoButton.disabled = resetButton.disabled = true;
    return;
  }
  fallback.style.display = 'none';
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b1624, 0.035);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(6.4, 5.1, 7.2);
  const root = new THREE.Group();
  const boardGroup = new THREE.Group();
  root.add(boardGroup);
  scene.add(root);

  scene.add(new THREE.AmbientLight(0xacc9de, 0.68));
  const keyLight = new THREE.DirectionalLight(0x8af2df, 2.0); keyLight.position.set(4, 7, 5); scene.add(keyLight);
  const rimLight = new THREE.PointLight(0x8c7bff, 1.9, 18); rimLight.position.set(-4, 3, -2); scene.add(rimLight);
  const warmLight = new THREE.PointLight(0xe6b783, 0.9, 14); warmLight.position.set(2, 1, -4); scene.add(warmLight);

  const mat = (color, roughness = .4, metalness = .3, emissive = 0x000000, intensity = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity: intensity });
  const substrateMat = mat(0x16293b, .34, .72);
  const darkMat = mat(0x0a1320, .26, .55);
  const edgeMat = mat(0x34576b, .3, .68);
  const goldMat = mat(0xb78b58, .26, .75, 0x5d3916, .18);
  const traceMat = mat(0x49bdb3, .28, .4, 0x2b9e98, .75);
  const violetMat = mat(0x8d83ff, .3, .35, 0x6658ff, .6);
  const dieMat = mat(0x183445, .22, .35, 0x09232d, .4);
  const glowMat = mat(0x7ceadb, .2, .25, 0x65e7d4, 1.0);

  const box = (w, h, d, material, x, y, z, parent = boardGroup) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z); mesh.castShadow = false; mesh.receiveShadow = false; parent.add(mesh); return mesh;
  };
  const lineBar = (x1, z1, x2, z2, y, width, material, parent = boardGroup) => {
    const dx = x2 - x1, dz = z2 - z1;
    const length = Math.hypot(dx, dz);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, .018, width), material);
    mesh.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
    mesh.rotation.y = -Math.atan2(dz, dx);
    parent.add(mesh); return mesh;
  };

  // Floating floor grid, gives the chip a sense of scale without distracting from it.
  const floorGrid = new THREE.GridHelper(15, 34, 0x315063, 0x22374a);
  floorGrid.position.y = -1.23; floorGrid.material.transparent = true; floorGrid.material.opacity = .25; scene.add(floorGrid);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(5.6, 80), new THREE.MeshBasicMaterial({ color: 0x0c1926, transparent: true, opacity: .42 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.25; scene.add(floor);

  // PCB base and layered package.
  box(4.35, .22, 3.9, substrateMat, 0, -.42, 0);
  box(4.12, .05, 3.67, darkMat, 0, -.285, 0);
  box(3.54, .08, 3.08, edgeMat, 0, -.22, 0);
  box(3.42, .06, 2.96, substrateMat, 0, -.15, 0);
  box(2.65, .22, 2.65, darkMat, 0, .005, 0);
  box(2.48, .08, 2.48, edgeMat, 0, .15, 0);
  box(2.35, .08, 2.35, dieMat, 0, .22, 0);
  box(2.16, .018, 2.16, mat(0x102535, .2, .3, 0x123944, .4), 0, .272, 0);

  // Fine perimeter pins on each side.
  for (let i = -9; i <= 9; i++) {
    const p = i * .19;
    box(.085, .07, .12, goldMat, p, -.31, 1.91);
    box(.085, .07, .12, goldMat, p, -.31, -1.91);
    box(.12, .07, .085, goldMat, 2.12, -.31, p * .88);
    box(.12, .07, .085, goldMat, -2.12, -.31, p * .88);
  }
  // Board traces route from the package to perimeter contacts.
  const routes = [
    [[-1.48,-1.38],[-1.12,-1.38],[-1.12,-1.03],[-.86,-1.03]],
    [[1.48,-1.35],[1.12,-1.35],[1.12,-.93],[.86,-.93]],
    [[-1.5,.25],[-1.22,.25],[-1.22,.65],[-.88,.65]],
    [[1.48,.54],[1.2,.54],[1.2,.95],[.9,.95]],
    [[-.48,-1.57],[-.48,-1.24],[-.1,-1.24]],
    [[.45,1.56],[.45,1.25],[.12,1.25]],
    [[-1.6,.93],[-1.35,.93],[-1.35,1.44],[-.98,1.44]],
    [[1.6,-.78],[1.36,-.78],[1.36,-1.47],[.95,-1.47]]
  ];
  routes.forEach((route, idx) => {
    for (let i = 0; i < route.length - 1; i++) lineBar(route[i][0], route[i][1], route[i+1][0], route[i+1][1], -.102, .024, idx % 3 === 0 ? violetMat : traceMat);
    const end = route[route.length - 1];
    const node = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .02, 12), idx % 3 === 0 ? violetMat : glowMat);
    node.rotation.x = Math.PI / 2; node.position.set(end[0], -.075, end[1]); boardGroup.add(node);
  });

  // Matrix-like cell pattern on top of the die.
  for (let ix = -4; ix <= 4; ix++) {
    for (let iz = -4; iz <= 4; iz++) {
      if (Math.abs(ix) < 2 && Math.abs(iz) < 2) continue;
      const cell = box(.13, .016, .13, (ix + iz) % 4 === 0 ? violetMat : edgeMat, ix * .205, .292, iz * .205);
      cell.userData.baseY = cell.position.y;
    }
  }
  // Central die tile and inner routing motifs.
  box(1.12, .026, 1.12, darkMat, 0, .3, 0);
  box(1.00, .018, 1.00, mat(0x122b3a, .18, .3, 0x0c3340, .55), 0, .322, 0);
  const innerRoutes = [
    [[-.39,-.35],[-.17,-.35],[-.17,-.1],[0,-.1]],
    [[.39,.35],[.17,.35],[.17,.1],[0,.1]],
    [[-.39,.27],[-.26,.27],[-.26,.37]],
    [[.39,-.27],[.26,-.27],[.26,-.37]],
    [[0,-.44],[0,-.28]],[[0,.28],[0,.44]],
    [[-.44,0],[-.28,0]],[[.28,0],[.44,0]]
  ];
  innerRoutes.forEach((r, idx) => {
    for(let i=0;i<r.length-1;i++) lineBar(r[i][0], r[i][1], r[i+1][0], r[i+1][1], .342, .025, idx % 2 ? violetMat : traceMat, boardGroup);
  });
  // Central emissive square and physical pins visually define the compute core.
  box(.43, .025, .43, glowMat, 0, .36, 0);
  box(.31, .012, .31, darkMat, 0, .38, 0);
  // Add glowing vias along key circuit paths.
  const viaPositions = [[-.17,-.35],[.17,.35],[-.26,.37],[.26,-.37],[0,-.44],[0,.44],[-.44,0],[.44,0]];
  viaPositions.forEach((p,i) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.022,12), i % 2 ? violetMat : glowMat);
    m.position.set(p[0], .36, p[1]); boardGroup.add(m);
  });

  // Sparse luminous particles drifting around the package.
  const particleCount = 170;
  const particlePositions = new Float32Array(particleCount * 3);
  const particleColors = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    particlePositions[i*3] = (Math.random() - .5) * 10;
    particlePositions[i*3+1] = Math.random() * 4.5 - 1.1;
    particlePositions[i*3+2] = (Math.random() - .5) * 9;
    const c = i % 6 === 0 ? new THREE.Color(0xa59bff) : new THREE.Color(0x75e3d3);
    particleColors[i*3] = c.r; particleColors[i*3+1] = c.g; particleColors[i*3+2] = c.b;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
  const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ size: .025, vertexColors: true, transparent: true, opacity: .72, sizeAttenuation: true }));
  scene.add(particles);

  // Top label via a small canvas texture (no external image dependency).
  const textureCanvas = document.createElement('canvas'); textureCanvas.width = 512; textureCanvas.height = 256;
  const ctx = textureCanvas.getContext('2d');
  ctx.clearRect(0,0,512,256); ctx.textAlign = 'center';
  ctx.fillStyle = '#c7f8ef'; ctx.font = '500 100px monospace'; ctx.fillText('AI', 256, 116);
  ctx.fillStyle = '#82a8b9'; ctx.font = '22px monospace'; ctx.fillText('IN-MEMORY CORE', 256, 163);
  ctx.strokeStyle = '#417f86'; ctx.lineWidth = 2; ctx.strokeRect(76, 34, 360, 156);
  const texture = new THREE.CanvasTexture(textureCanvas);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(.64,.32), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, opacity: .96 }));
  label.rotation.x = -Math.PI/2; label.position.set(0,.397,0); boardGroup.add(label);

  const defaultRot = { x: -0.18, y: -0.5, z: 0.02 };
  root.rotation.set(defaultRot.x, defaultRot.y, defaultRot.z);
  let autoRotate = !reduceMotion;
  let dragging = false, moved = false, pointerX = 0, pointerY = 0;
  let targetRotX = defaultRot.x, targetRotY = defaultRot.y;
  let targetCamZ = 7.8;
  const clock = new THREE.Clock();

  function resize() {
    const width = Math.max(1, sceneWrap.clientWidth);
    const height = Math.max(1, sceneWrap.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(sceneWrap); resize();

  sceneWrap.addEventListener('pointerdown', event => {
    if (event.target.closest('.scene-label') || event.target.closest('.scene-hint')) return;
    dragging = true; moved = false; pointerX = event.clientX; pointerY = event.clientY;
    sceneWrap.setPointerCapture?.(event.pointerId);
  });
  sceneWrap.addEventListener('pointermove', event => {
    if (!dragging) return;
    const dx = event.clientX - pointerX, dy = event.clientY - pointerY;
    if (Math.abs(dx) + Math.abs(dy) > 1) moved = true;
    targetRotY += dx * .008;
    targetRotX += dy * .006;
    targetRotX = Math.max(-.75, Math.min(.55, targetRotX));
    pointerX = event.clientX; pointerY = event.clientY;
  });
  const endDrag = () => { dragging = false; };
  sceneWrap.addEventListener('pointerup', endDrag);
  sceneWrap.addEventListener('pointercancel', endDrag);
  sceneWrap.addEventListener('lostpointercapture', endDrag);

  autoButton.setAttribute('aria-pressed', String(autoRotate));
  autoButton.addEventListener('click', () => {
    autoRotate = !autoRotate;
    autoButton.setAttribute('aria-pressed', String(autoRotate));
  });
  resetButton.addEventListener('click', () => {
    targetRotX = defaultRot.x; targetRotY = defaultRot.y; targetCamZ = 7.8;
  });
  sceneWrap.addEventListener('wheel', event => {
    if (Math.abs(event.deltaY) < 2) return;
    targetCamZ = Math.max(6.2, Math.min(10.0, targetCamZ + event.deltaY * .006));
  }, { passive: true });

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();
    if (autoRotate && !dragging) targetRotY += .0028;
    root.rotation.x += (targetRotX - root.rotation.x) * .065;
    root.rotation.y += (targetRotY - root.rotation.y) * .065;
    root.rotation.z += (defaultRot.z - root.rotation.z) * .035;
    root.position.y = Math.sin(elapsed * .7) * .045;
    camera.position.z += (targetCamZ - camera.position.z) * .06;
    camera.lookAt(0,0,0);
    particles.rotation.y = elapsed * .012;
    particles.position.y = Math.sin(elapsed * .23) * .08;
    renderer.render(scene, camera);
  }
  animate();
})();

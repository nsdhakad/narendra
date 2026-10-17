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
      link: 'chip-gallery.html'
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
  const sceneWrap = $('#systemStage') || $('#sceneWrap');
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
  // Frame the package larger so it is clearly visible in the open upper part of the explorer.
  camera.position.set(4.3, 3.7, 7.25);
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
  // Subtle floating telemetry particles around the package. This animated object is
  // intentionally defined here because the render loop updates its rotation every frame.
  const particles = new THREE.Group();
  const particleMaterial = new THREE.MeshBasicMaterial({
    color: 0x5bcfc8, transparent: true, opacity: 0.36, depthWrite: false
  });
  for (let i = 0; i < 42; i++) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.014 + (i % 3) * 0.004, 6, 5), particleMaterial);
    const angle = i * 2.399963229728653;
    const radius = 2.7 + (i % 7) * 0.31;
    dot.position.set(
      Math.cos(angle) * radius,
      -0.1 + ((i * 7) % 17) * 0.105,
      Math.sin(angle) * radius * 0.62
    );
    particles.add(dot);
  }
  scene.add(particles);

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


  // System package: independent IMC array, RISC-V control core, image input and output display.
  const imcGroup=new THREE.Group(),riscvGroup=new THREE.Group(),inputGroup=new THREE.Group(),outputGroup=new THREE.Group();
  boardGroup.add(imcGroup,riscvGroup,inputGroup,outputGroup);
  imcGroup.position.set(-.53,.448,0);riscvGroup.position.set(.54,.448,0);inputGroup.position.set(-1.57,.12,0);outputGroup.position.set(1.57,.12,0);
  const imcBaseMat=mat(0x102a37,.25,.48,0x092c31,.22),riscvBaseMat=mat(0x221f43,.25,.5,0x2a1f6c,.22),inputBaseMat=mat(0x102333,.3,.42,0x0e3a4a,.28),outputBaseMat=mat(0x1b2835,.3,.48,0x123a4c,.28);
  const imcFrameMat=mat(0x1b4b52,.25,.45,0x176b70,.35),riscvFrameMat=mat(0x463b7c,.25,.45,0x5544b7,.38),inputFrameMat=mat(0x2c6674,.25,.4,0x217a84,.48),outputFrameMat=mat(0x2d5c67,.25,.4,0x267f80,.5);
  const imcFrame=box(.99,.065,1.29,imcBaseMat,0,0,0,imcGroup);box(.95,.025,1.25,imcFrameMat,0,.045,0,imcGroup);
  const riscvFrame=box(.99,.065,1.29,riscvBaseMat,0,0,0,riscvGroup);box(.95,.025,1.25,riscvFrameMat,0,.045,0,riscvGroup);
  const memoryCellMeshes=[];
  for(let row=0;row<8;row++)for(let col=0;col<8;col++){const cellMat=mat(0x23505b,.3,.28,0x0a3638,.18),cell=box(.083,.028,.105,cellMat,(col-3.5)*.112,.073,(row-3.5)*.139,imcGroup);cell.userData.weightIndex=row*8+col;memoryCellMeshes.push(cell);}
  for(let i=0;i<8;i++){box(.045,.025,.075,i%2?violetMat:traceMat,-.465,.073,(i-3.5)*.139,imcGroup);box(.045,.025,.075,i%2?traceMat:violetMat,.465,.073,(i-3.5)*.139,imcGroup);}
  box(.68,.075,.73,darkMat,0,.065,0,riscvGroup);
  const coreBody=box(.48,.07,.48,dieMat,0,.12,0,riscvGroup);coreBody.material.emissive.setHex(0x20175c);
  const riscCoreMat=mat(0x4e43a6,.22,.38,0x6a5cff,.8);box(.39,.028,.39,riscCoreMat,0,.168,0,riscvGroup);
  for(let row=0;row<3;row++)for(let col=0;col<3;col++){if(row===1&&col===1)continue;box(.09,.022,.085,(row+col)%2?violetMat:traceMat,(col-1)*.14,.104,(row-1)*.14,riscvGroup);}
  const riscTraces=[[[ -.39,-.43],[-.28,-.43],[-.28,-.27],[-.2,-.27]],[[.39,-.43],[.28,-.43],[.28,-.27],[.2,-.27]],[[-.39,.43],[-.28,.43],[-.28,.27],[-.2,.27]],[[.39,.43],[.28,.43],[.28,.27],[.2,.27]],[[0,-.52],[0,-.4]],[[0,.4],[0,.52]]];
  riscTraces.forEach((route,i)=>{for(let j=0;j<route.length-1;j++)lineBar(route[j][0],route[j][1],route[j+1][0],route[j+1][1],.061,.018,i%2?violetMat:traceMat,riscvGroup);});
  box(.58,.055,.76,inputBaseMat,0,0,0,inputGroup);box(.52,.025,.69,inputFrameMat,0,.04,0,inputGroup);
  const inputPixels=[];for(let row=0;row<5;row++)for(let col=0;col<5;col++){const p=box(.066,.018,.075,mat(0x2d8b95,.3,.2,0x174e5c,.35),(col-2)*.087,.064,(row-2)*.108,inputGroup);inputPixels.push(p);}
  box(.24,.018,.045,glowMat,0,.064,.33,inputGroup);
  box(.58,.055,.76,outputBaseMat,0,0,0,outputGroup);box(.52,.025,.69,outputFrameMat,0,.04,0,outputGroup);box(.35,.018,.32,darkMat,0,.064,-.08,outputGroup);
  const outputBars=[],barMats=[traceMat,violetMat,goldMat];for(let i=0;i<3;i++)outputBars.push(box(.065,.026,.055,barMats[i],(i-1)*.11,.082,.01,outputGroup));box(.31,.018,.045,glowMat,0,.064,.31,outputGroup);
  const busMat=mat(0x3d9eac,.22,.35,0x2bc4c5,.9);
  lineBar(-1.25,0,-1.03,0,.22,.035,busMat,boardGroup);lineBar(-.02,0,.035,0,.50,.04,busMat,boardGroup);lineBar(1.05,0,1.27,0,.22,.035,busMat,boardGroup);
  const dataPackets=[];for(let i=0;i<3;i++){const packet=new THREE.Mesh(new THREE.SphereGeometry(.045,12,10),i===1?violetMat:glowMat);packet.visible=false;boardGroup.add(packet);dataPackets.push(packet);}
  const basePositions={input:inputGroup.position.clone(),imc:imcGroup.position.clone(),riscv:riscvGroup.position.clone(),output:outputGroup.position.clone()};
  let selectedModule='imc',demoStep=-1,exploded=false,visualizationMode='architecture';
  const setFrameHighlights=()=>{imcFrame.material.emissive.setHex(selectedModule==='imc'?0x24b9ab:0x092c31);imcFrame.material.emissiveIntensity=selectedModule==='imc'?1.15:.22;riscvFrame.material.emissive.setHex(selectedModule==='riscv'?0x8c7aff:0x2a1f6c);riscvFrame.material.emissiveIntensity=selectedModule==='riscv'?1.15:.22;inputFrameMat.emissive.setHex(selectedModule==='input'?0x27d2e3:0x217a84);outputFrameMat.emissive.setHex(selectedModule==='output'?0x36e0c1:0x267f80);};
  window.systemArchitectureScene={
    highlight(name){selectedModule=name;setFrameHighlights();memoryCellMeshes.forEach(cell=>{cell.material.emissiveIntensity=name==='imc'?.78:.18;});},
    setStep(step){demoStep=step;selectedModule=step<0?'imc':step===0?'input':step===1?'imc':step===2?'riscv':'output';setFrameHighlights();inputPixels.forEach((pixel,i)=>{pixel.material.emissive.setHex(step===0&&i%3===0?0x42e7ec:0x174e5c);pixel.material.emissiveIntensity=step===0?1:.25;});outputBars.forEach((bar,i)=>{bar.scale.y=step===3?[1.2,2,.85][i]:1;bar.material.emissiveIntensity=step===3?1.2:.6;});},
    explode(open){exploded=Boolean(open);},
    setMode(mode){visualizationMode=mode==='inference'?'inference':'architecture';},
    reset(){exploded=false;demoStep=-1;visualizationMode='architecture';selectedModule='imc';root.rotation.set(defaultRot.x,defaultRot.y,defaultRot.z);targetRotX=defaultRot.x;targetRotY=defaultRot.y;targetCamZ=7.25;setFrameHighlights();}
  };
  setFrameHighlights();

  const defaultRot = { x: -0.18, y: -0.5, z: 0.02 };
  root.rotation.set(defaultRot.x, defaultRot.y, defaultRot.z);
  // Scale the complete assembly and lift it into the unobstructed area above the pipeline overlay.
  root.scale.setScalar(0.60);
  let autoRotate = !reduceMotion;
  let dragging = false, moved = false, pointerX = 0, pointerY = 0;
  let targetRotX = defaultRot.x, targetRotY = defaultRot.y;
  let targetCamZ = 7.25;
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
    if (event.target.closest('.scene-label') || event.target.closest('.scene-hint') || event.target.closest('.system-stage-badge') || event.target.closest('.system-stage-callout') || event.target.closest('.system-stage-hint')) return;
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
    targetRotX = defaultRot.x; targetRotY = defaultRot.y; targetCamZ = 7.25;
  });
  sceneWrap.addEventListener('wheel', event => {
    if (Math.abs(event.deltaY) < 2) return;
    targetCamZ = Math.max(5.2, Math.min(8.8, targetCamZ + event.deltaY * .006));
  }, { passive: true });

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();
    if (autoRotate && !dragging) targetRotY += .0028;
    root.rotation.x += (targetRotX - root.rotation.x) * .065;
    root.rotation.y += (targetRotY - root.rotation.y) * .065;
    root.rotation.z += (defaultRot.z - root.rotation.z) * .035;
    root.position.y = 0.92 + Math.sin(elapsed * .7) * .018;
    camera.position.z += (targetCamZ - camera.position.z) * .06;
    camera.lookAt(0,0,0);
    particles.rotation.y=elapsed*.012;particles.position.y=Math.sin(elapsed*.23)*.08;
    const shift=exploded?1:0;
    [[inputGroup,new THREE.Vector3(basePositions.input.x-.25*shift,basePositions.input.y+.10*shift,basePositions.input.z)],[imcGroup,new THREE.Vector3(basePositions.imc.x-.28*shift,basePositions.imc.y+.24*shift,basePositions.imc.z-.12*shift)],[riscvGroup,new THREE.Vector3(basePositions.riscv.x+.28*shift,basePositions.riscv.y+.24*shift,basePositions.riscv.z+.12*shift)],[outputGroup,new THREE.Vector3(basePositions.output.x+.25*shift,basePositions.output.y+.10*shift,basePositions.output.z)]].forEach(([group,target])=>group.position.lerp(target,.09));
    const seg=visualizationMode==='inference'?Math.max(0,demoStep):demoStep,flow=visualizationMode==='inference'||demoStep>=1;
    const pts=seg<=1?[new THREE.Vector3(-1.57,.22,0),new THREE.Vector3(-.53,.54,0)]:seg===2?[new THREE.Vector3(-.53,.54,0),new THREE.Vector3(.54,.54,0)]:[new THREE.Vector3(.54,.54,0),new THREE.Vector3(1.57,.22,0)];
    dataPackets.forEach((packet,i)=>{packet.visible=flow;if(!flow)return;const t=(elapsed*.35+i*.29)%1;packet.position.lerpVectors(pts[0],pts[1],t);packet.position.y+=Math.sin(t*Math.PI)*.07;});
    renderer.render(scene,camera);
  }
  animate();
})();


// Education abstract previews: hover/focus on desktop; tap to toggle on touch devices.
document.querySelectorAll('.abstract-button').forEach((button) => {
  const wrap = button.closest('.abstract-wrap');
  if (!wrap) return;
  button.addEventListener('click', (event) => {
    event.preventDefault();
    const opening = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(opening));
    wrap.classList.toggle('is-open', opening);
  });
  document.addEventListener('click', (event) => {
    if (!wrap.contains(event.target)) {
      button.setAttribute('aria-expanded', 'false');
      wrap.classList.remove('is-open');
    }
  });
  button.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      button.setAttribute('aria-expanded', 'false');
      wrap.classList.remove('is-open');
      button.focus();
    }
  });
});

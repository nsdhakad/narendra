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
      text: 'Exploring 6T/8T/10T SRAM, and configurable multi-port memory architectures that support computing where data lives.',
      link: 'https://www.narendradhakad.com/research'
    },
    soc: {
      title: 'SoC for AI',
      text: 'Exploring system-on-chip integration of RISC-V with in-memory computing, alongside emerging memory technologies for AI workloads.',
      link: 'chip-gallery.html'
    },
    edge: {
      title: 'Emerging Memory & Edge AI',
      text: 'Exploring emerging memory technologies (RRAM, FeFET) for in-memory computing and resource-efficient AI algorithm implementation on edge devices.',
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

  // Defer the Three.js download and scene initialization until the explorer is near view.
  const sceneCanvas = $('#chipCanvas');
  if (sceneCanvas) {
    const sceneTarget = $('#systemStage') || sceneCanvas;
    let sceneLoadStarted = false;

    const showStaticSceneFallback = () => {
      sceneCanvas.style.display = 'none';
      const fallback = $('#sceneFallback');
      if (fallback) fallback.style.display = 'grid';
      const version = $('.scene-version');
      if (version) version.textContent = 'CSS FALLBACK';
      ['autoRotate', 'resetView'].forEach(id => {
        const button = $('#' + id);
        if (button) {
          button.disabled = true;
          button.title = '3D engine unavailable';
        }
      });
    };

    const loadSceneBundle = () => {
      const sceneScript = document.createElement('script');
      sceneScript.src = 'system-scene.js';
      sceneScript.async = true;
      sceneScript.onload = () => window.dispatchEvent(new Event('system-scene-ready'));
      sceneScript.onerror = showStaticSceneFallback;
      document.head.appendChild(sceneScript);
    };

    const startSceneLoad = () => {
      if (sceneLoadStarted) return;
      sceneLoadStarted = true;
      if (window.THREE) {
        loadSceneBundle();
        return;
      }
      const engine = document.createElement('script');
      engine.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      engine.async = true;
      engine.onload = loadSceneBundle;
      engine.onerror = showStaticSceneFallback;
      document.head.appendChild(engine);
    };

    if ('IntersectionObserver' in window) {
      const sceneObserver = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        sceneObserver.disconnect();
        startSceneLoad();
      }, { rootMargin: '1000px 0px' });
      sceneObserver.observe(sceneTarget);
    } else {
      startSceneLoad();
    }
  }
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


// Always-on animated research hero with pointer-reactive parallax.
(() => {
  const init = () => {
    const visual = document.querySelector('.hero-visual.hero-parallax#heroVisual');
    if (!visual || visual.dataset.pointerReady === 'true') return;
    visual.dataset.pointerReady = 'true';
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;
    const layers = visual.querySelectorAll('[data-depth]');
    let frame = 0, targetX = 0, targetY = 0, currentX = 0, currentY = 0;
    let pointerActive = false;
    const render = () => {
      // Gentle autonomous drift means the scene stays visibly alive before any interaction.
      const t = performance.now() / 1000;
      const idleX = pointerActive ? 0 : Math.sin(t * 0.65) * 0.14;
      const idleY = pointerActive ? 0 : Math.cos(t * 0.48) * 0.12;
      const x = targetX + idleX, y = targetY + idleY;
      currentX += (x - currentX) * 0.085;
      currentY += (y - currentY) * 0.085;
      visual.style.setProperty('--hero-shift-x', (currentX * 19).toFixed(2) + 'px');
      visual.style.setProperty('--hero-shift-y', (currentY * 19).toFixed(2) + 'px');
      visual.style.setProperty('--hero-x', (currentX * 17).toFixed(2) + 'deg');
      visual.style.setProperty('--hero-y', (currentY * -14).toFixed(2) + 'deg');
      visual.style.setProperty('--hero-glow-x', (50 + currentX * 23) + '%');
      visual.style.setProperty('--hero-glow-y', (48 + currentY * 20) + '%');
      layers.forEach((layer) => {
        const depth = Number(layer.dataset.depth) || 18;
        layer.style.setProperty('--layer-x', (currentX * depth * 0.55).toFixed(2) + 'px');
        layer.style.setProperty('--layer-y', (currentY * depth * 0.55).toFixed(2) + 'px');
      });
      // Keep animating for idle drift as well as while easing toward the cursor.
      frame = requestAnimationFrame(render);
    };
    const setPointer = (event) => {
      const rect = visual.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointerActive = true;
      targetX = Math.max(-0.9, Math.min(0.9, ((event.clientX - rect.left) / rect.width - 0.5) * 1.8));
      targetY = Math.max(-0.9, Math.min(0.9, ((event.clientY - rect.top) / rect.height - 0.5) * 1.8));
      if (!frame) frame = requestAnimationFrame(render);
    };
    const resetPointer = () => { pointerActive = false; targetX = 0; targetY = 0; };
    visual.addEventListener('pointermove', setPointer, { passive: true });
    visual.addEventListener('pointerleave', resetPointer, { passive: true });
    const hero = visual.closest('.hero');
    if (hero) hero.addEventListener('pointermove', (event) => {
      if (event.target.closest('a,button')) return;
      setPointer(event);
    }, { passive: true });
    frame = requestAnimationFrame(render);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

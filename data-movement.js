/* data-movement.js
 * Self-contained widget: "Why in-memory computing?"
 * Animates conventional (memory <-> CPU) vs in-memory compute data movement
 * and shows an ILLUSTRATIVE relative-energy counter.
 * Injects its own section after #system-showcase. No dependencies.
 */
(function () {
  'use strict';

  // Illustrative relative energy units (NOT measured silicon numbers).
  var E_MAC = 1;        // arithmetic for one multiply-accumulate
  var E_MOVE = 20;      // moving one word between memory and processor
  var E_IMC_MAC = 1.5;  // in-array MAC (analog/digital in-memory), per cell
  var E_IMC_OUT = 6;    // peripheral/readout cost per output column

  var css = '\
.dm-section{max-width:1180px;margin:0 auto;padding:clamp(48px,8vw,96px) clamp(16px,4vw,32px)}\
.dm-kicker{font:500 12px/1 "DM Mono",monospace;letter-spacing:.14em;opacity:.7;margin:0 0 14px}\
.dm-title{font-size:clamp(26px,4vw,42px);line-height:1.1;margin:0 0 12px;font-weight:700}\
.dm-title em{font-style:italic;opacity:.85}\
.dm-sub{max-width:62ch;opacity:.8;margin:0 0 28px}\
.dm-card{border:1px solid rgba(127,140,160,.35);border-radius:18px;padding:clamp(14px,3vw,26px);background:rgba(127,140,160,.07)}\
.dm-controls{display:flex;flex-wrap:wrap;gap:16px 28px;align-items:center;margin-bottom:20px}\
.dm-controls label{font:500 12px/1 "DM Mono",monospace;letter-spacing:.08em}\
.dm-controls input[type=range]{width:min(260px,70vw);vertical-align:middle;accent-color:#3dd6c6}\
.dm-btn{font:600 14px/1 inherit;padding:11px 18px;border-radius:999px;border:1px solid currentColor;background:transparent;color:inherit;cursor:pointer}\
.dm-btn:hover,.dm-btn:focus-visible{background:rgba(61,214,198,.18);outline:none}\
.dm-lanes{display:grid;grid-template-columns:1fr 1fr;gap:18px}\
@media(max-width:760px){.dm-lanes{grid-template-columns:1fr}}\
.dm-lane h3{font-size:15px;margin:0 0 4px}\
.dm-lane p{font-size:13px;opacity:.75;margin:0 0 10px}\
.dm-canvas{width:100%;height:150px;display:block;border-radius:12px;background:rgba(8,14,24,.55)}\
.dm-stats{display:flex;justify-content:space-between;gap:10px;margin-top:10px;font:500 12px/1.4 "DM Mono",monospace}\
.dm-stats strong{display:block;font-size:20px;font-weight:600}\
.dm-result{margin-top:18px;padding:14px 16px;border-radius:12px;border:1px dashed rgba(127,140,160,.5);font-size:14px}\
.dm-note{margin-top:12px;font-size:12px;opacity:.65}\
';

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (html) e.innerHTML = html;
    return e;
  }
  function fmt(n) { return n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : String(Math.round(n)); }

  function build() {
    var anchor = document.getElementById('system-showcase');
    if (!anchor || document.getElementById('data-movement')) return;

    var style = el('style'); style.textContent = css; document.head.appendChild(style);

    var sec = el('section', { id: 'data-movement', 'class': 'dm-section', 'aria-labelledby': 'dmTitle' });
    sec.innerHTML =
      '<p class="dm-kicker">WHY IN-MEMORY COMPUTING?</p>' +
      '<h2 class="dm-title" id="dmTitle">Moving data costs more than <em>computing on it.</em></h2>' +
      '<p class="dm-sub">Run a matrix–vector multiply both ways. In a conventional system every weight travels from memory to the processor. In an in-memory design, the weights stay put and only inputs and results move.</p>' +
      '<div class="dm-card">' +
        '<div class="dm-controls">' +
          '<div><label for="dmSize">MATRIX SIZE: <span id="dmSizeOut">64 × 64</span></label><br>' +
          '<input id="dmSize" type="range" min="3" max="9" value="6" step="1" aria-describedby="dmNote"></div>' +
          '<button class="dm-btn" id="dmRun" type="button">Run comparison ▶</button>' +
          '<button class="dm-btn" id="dmReset" type="button">Reset</button>' +
        '</div>' +
        '<div class="dm-lanes">' +
          '<div class="dm-lane"><h3>Conventional (memory ↔ processor)</h3><p>Every weight crosses the bus.</p>' +
            '<canvas class="dm-canvas" id="dmConv" aria-label="Animation of weights moving from memory to processor"></canvas>' +
            '<div class="dm-stats"><span>WORDS MOVED<strong id="dmConvMoved">0</strong></span><span>REL. ENERGY<strong id="dmConvE">0</strong></span></div></div>' +
          '<div class="dm-lane"><h3>In-memory computing</h3><p>Weights stay in the array; compute happens in place.</p>' +
            '<canvas class="dm-canvas" id="dmImc" aria-label="Animation of computation inside the memory array"></canvas>' +
            '<div class="dm-stats"><span>WORDS MOVED<strong id="dmImcMoved">0</strong></span><span>REL. ENERGY<strong id="dmImcE">0</strong></span></div></div>' +
        '</div>' +
        '<div class="dm-result" id="dmResult" aria-live="polite">Press <b>Run comparison</b> to see the difference.</div>' +
        '<p class="dm-note" id="dmNote">Illustrative model in relative units (compute = 1, word move = 20, in-array MAC = 1.5). Not measured silicon data; real savings depend on technology, precision, and peripheral circuits.</p>' +
      '</div>';
    anchor.insertAdjacentElement('afterend', sec);

    var $ = function (id) { return document.getElementById(id); };
    var size = $('dmSize'), sizeOut = $('dmSizeOut');
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var raf = null, t0 = 0;

    function N() { return Math.pow(2, +size.value); }
    function model(n) {
      var macs = n * n;
      return {
        conv: { moved: macs + 2 * n, e: macs * E_MAC + (macs + 2 * n) * E_MOVE },
        imc:  { moved: 2 * n,        e: macs * E_IMC_MAC + n * E_IMC_OUT + 2 * n * E_MOVE }
      };
    }
    size.addEventListener('input', function () { var n = N(); sizeOut.textContent = n + ' × ' + n; reset(); });

    function fit(c) {
      var r = c.getBoundingClientRect(), d = window.devicePixelRatio || 1;
      c.width = Math.max(1, r.width * d); c.height = Math.max(1, r.height * d);
      return { ctx: c.getContext('2d'), w: c.width, h: c.height, d: d };
    }
    function drawLane(c, kind, p) {
      var f = fit(c), g = f.ctx, w = f.w, h = f.h, d = f.d;
      g.clearRect(0, 0, w, h);
      var teal = '#3dd6c6', violet = '#a78bfa', dim = 'rgba(160,175,200,.35)';
      var mx = w * 0.06, mw = w * (kind === 'conv' ? 0.26 : 0.58), my = h * 0.18, mh = h * 0.64;
      // memory block (grid)
      g.strokeStyle = dim; g.lineWidth = d;
      var cols = 8, rows = 5, cw = mw / cols, rh = mh / rows;
      for (var i = 0; i < rows; i++) for (var j = 0; j < cols; j++) {
        var lit = kind === 'imc' && p > 0 && ((i * cols + j) / (rows * cols)) < p;
        g.fillStyle = lit ? 'rgba(61,214,198,.75)' : 'rgba(160,175,200,.12)';
        g.fillRect(mx + j * cw + d, my + i * rh + d, cw - 2 * d, rh - 2 * d);
      }
      g.fillStyle = 'rgba(200,210,225,.9)'; g.font = (11 * d) + 'px "DM Mono",monospace';
      g.fillText(kind === 'conv' ? 'MEMORY' : 'MEMORY + MAC', mx, my - 6 * d);
      if (kind === 'conv') {
        var px = w * 0.72, pw = w * 0.22;
        g.strokeStyle = violet; g.strokeRect(px, my, pw, mh);
        g.fillStyle = violet; g.fillText('CPU', px + 6 * d, my - 6 * d);
        // bus + packets
        g.strokeStyle = dim; g.beginPath(); g.moveTo(mx + mw, h / 2); g.lineTo(px, h / 2); g.stroke();
        var count = 14;
        for (var k = 0; k < count; k++) {
          var q = ((p * 3 + k / count) % 1);
          if (p <= 0 || p >= 1) q = -1;
          if (q < 0) continue;
          var x = mx + mw + q * (px - mx - mw), y = h / 2 + ((k % 5) - 2) * 9 * d;
          g.fillStyle = teal; g.fillRect(x, y - 2 * d, 6 * d, 4 * d);
        }
      } else {
        // small in/out arrows only
        var ox = mx + mw + 14 * d;
        g.fillStyle = violet; g.fillText('RESULT', ox, h / 2 - 8 * d);
        g.fillRect(ox, h / 2, Math.min(w - ox - 8 * d, 70 * d) * Math.min(1, p * 1.2), 5 * d);
      }
    }
    function render(p) {
      var n = N(), m = model(n);
      drawLane($('dmConv'), 'conv', p); drawLane($('dmImc'), 'imc', p);
      $('dmConvMoved').textContent = fmt(m.conv.moved * p); $('dmConvE').textContent = fmt(m.conv.e * p);
      $('dmImcMoved').textContent = fmt(m.imc.moved * p);   $('dmImcE').textContent = fmt(m.imc.e * p);
      if (p >= 1) {
        $('dmResult').innerHTML = 'For a <b>' + n + ' × ' + n + '</b> multiply, the conventional path moves <b>' + fmt(m.conv.moved) +
          '</b> words versus <b>' + fmt(m.imc.moved) + '</b> in memory, about <b>' + (m.conv.e / m.imc.e).toFixed(1) +
          '×</b> lower relative energy in this illustrative model.';
      }
    }
    function run() {
      cancelAnimationFrame(raf);
      if (reduce) { render(1); return; }
      t0 = performance.now();
      (function tick(t) {
        var p = Math.min(1, (t - t0) / 3200);
        render(p);
        if (p < 1) raf = requestAnimationFrame(tick);
      })(t0);
    }
    function reset() {
      cancelAnimationFrame(raf); render(0);
      $('dmResult').innerHTML = 'Press <b>Run comparison</b> to see the difference.';
    }
    $('dmRun').addEventListener('click', run);
    $('dmReset').addEventListener('click', reset);
    window.addEventListener('resize', function () { render(0); });

    // Draw first frame when scrolled into view (cheap lazy init)
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { render(0); io.disconnect(); }
      }, { rootMargin: '200px' });
      io.observe(sec);
    } else { render(0); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();

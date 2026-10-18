/* data-movement.js
 * Self-contained "Why in-memory computing?" comparison widget.
 * Animates a matrix-vector multiply in phases and reports illustrative relative energy.
 * Injects the section after #system-showcase. No dependencies.
 */
(function () {
  'use strict';

  // Illustrative relative-energy units, not measured silicon figures.
  var E_MAC = 1;       // one conventional multiply-accumulate
  var E_MOVE = 20;     // one word transfer between memory and CPU
  var E_IMC_MAC = 1.5; // one in-array MAC
  var E_IMC_OUT = 6;   // peripheral/readout cost per output
  var RUN_MS = 5200;

  var css = '\
.dm-section{max-width:1180px;margin:0 auto;padding:clamp(28px,4vw,48px) clamp(16px,3vw,28px);color:var(--text,inherit);font-family:inherit}\
.dm-kicker{font:500 12px/1 "DM Mono",monospace;letter-spacing:.14em;color:var(--muted,#8ea3b9);margin:0 0 14px}\
.dm-title{font-family:inherit;font-size:clamp(22px,2.8vw,32px);line-height:1.12;margin:0 0 9px;font-weight:700;letter-spacing:-.035em;color:inherit}\
.dm-title em{font-style:italic;color:var(--accent,#3dd6c6);opacity:1}\
.dm-sub{max-width:none;width:100%;box-sizing:border-box;color:var(--muted,inherit);margin:0 0 18px;line-height:1.55;font-size:13px}\
.dm-card{border:1px solid rgba(127,140,160,.35);border-radius:14px;padding:clamp(12px,2vw,18px);background:rgba(127,140,160,.07)}\
.dm-controls{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;margin-bottom:14px}\
.dm-controls label{font:500 12px/1 "DM Mono",monospace;letter-spacing:.08em}\
.dm-controls input[type=range]{width:min(220px,65vw);vertical-align:middle;accent-color:#3dd6c6}\
.dm-btn{font:600 12px/1.2 Manrope,system-ui,sans-serif;padding:8px 13px;border-radius:999px;border:1px solid currentColor;background:transparent;color:inherit;cursor:pointer}\
.dm-btn:hover,.dm-btn:focus-visible{background:rgba(61,214,198,.18);outline:2px solid #3dd6c6;outline-offset:2px}\
.dm-lanes{display:grid;grid-template-columns:1fr 1fr;gap:12px}\
@media(max-width:760px){.dm-lanes{grid-template-columns:1fr}}\
.dm-lane{min-width:0}.dm-lane h3{font-size:13px;margin:0 0 4px}\
.dm-lane p{font-size:12px;opacity:.75;margin:0 0 7px;min-height:2.4em}\
.dm-phase{display:flex;align-items:center;gap:7px;min-height:23px;margin:0 0 7px;font:10px/1.3 "DM Mono",monospace;color:#8ea3b9}\
.dm-phase-dot{width:7px;height:7px;flex:0 0 7px;border-radius:50%;background:#53677c}\
.dm-lane[data-state="transfer"] .dm-phase-dot{background:#3dd6c6;box-shadow:0 0 10px #3dd6c6}\
.dm-lane[data-state="compute"] .dm-phase-dot{background:#a78bfa;box-shadow:0 0 10px #a78bfa}\
.dm-lane[data-state="done"] .dm-phase-dot{background:#3dd6c6}\
.dm-canvas{width:100%;height:150px;display:block;border-radius:10px;background:rgba(8,14,24,.68);border:1px solid rgba(127,140,160,.16)}\
.dm-stats{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px;font:500 10px/1.4 "DM Mono",monospace}\
.dm-stat{padding:7px 8px;border-radius:8px;background:rgba(127,140,160,.07)}\
.dm-stats strong{display:block;font-size:clamp(15px,2vw,19px);font-weight:600;margin-top:3px;overflow-wrap:anywhere}\
.dm-stats small{display:block;font:10px/1.45 "DM Mono",monospace;color:#8398ae;margin-top:2px}\
.dm-progress{height:4px;border-radius:4px;background:rgba(127,140,160,.18);overflow:hidden;margin-top:10px}\
.dm-progress span{display:block;width:0;height:100%;background:#3dd6c6;transition:width .08s linear}\
.dm-lane[data-state="compute"] .dm-progress span{background:#a78bfa}\
.dm-result{margin-top:14px;padding:11px 12px;border-radius:10px;border:1px dashed rgba(127,140,160,.5);font-size:12px}\
.dm-result strong{color:#75e3d3}.dm-result-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:9px}\
.dm-result-metric{padding:8px;border-radius:8px;background:rgba(127,140,160,.08)}\
.dm-result-metric span{display:block;font:10px/1.4 "DM Mono",monospace;color:#8ea3b9}\
.dm-result-metric b{display:block;font-size:16px;margin-top:3px}\
.dm-latency{margin-top:14px;padding:12px;border:1px solid rgba(61,214,198,.28);border-radius:10px;background:rgba(8,14,24,.34)}\
.dm-latency-title{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:baseline;justify-content:space-between;font-size:12px;font-weight:700;margin-bottom:10px}\
.dm-latency-title small{font:10px/1.4 "DM Mono",monospace;color:#8ea3b9;font-weight:400}\
.dm-latency-row{display:grid;grid-template-columns:minmax(94px,130px) minmax(0,1fr) auto;gap:9px;align-items:center;margin:10px 0}\
.dm-latency-name{font:10px/1.3 "DM Mono",monospace;color:#9fb3c7}\
.dm-latency-track{height:15px;border-radius:4px;background:rgba(127,140,160,.16);overflow:hidden;position:relative}\
.dm-latency-fill{height:100%;width:0;border-radius:4px;background:linear-gradient(90deg,#a78bfa,#6e64d8);transition:width .08s linear;position:relative;min-width:0}\
.dm-latency-row[data-kind="imc"] .dm-latency-fill{background:linear-gradient(90deg,#3dd6c6,#80f0ce)}\
.dm-latency-value{font:600 11px/1.3 "DM Mono",monospace;white-space:nowrap;color:#d9e6f2}\
.dm-latency-speedup{margin-top:10px;font-size:12px;color:#75e3d3;font-weight:700}\
.dm-latency-note{margin:5px 0 0;font-size:10px;line-height:1.5;color:#8ea3b9}\
@media(max-width:520px){.dm-latency-row{grid-template-columns:90px minmax(0,1fr);gap:6px}.dm-latency-value{grid-column:2}.dm-latency-title{align-items:flex-start}}\
@media(max-width:520px){.dm-result-grid{grid-template-columns:1fr}.dm-stats strong{font-size:17px}}\
.dm-note{margin-top:9px;font-size:11px;opacity:.65}\
@media(prefers-reduced-motion:reduce){.dm-progress span{transition:none}}\
';

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (html) e.innerHTML = html;
    return e;
  }
  function fmt(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
    return String(Math.round(n));
  }

  function build() {
    var anchor = document.getElementById('researchDetail');
    if (!anchor || document.getElementById('data-movement')) return;
    var style = el('style');
    style.textContent = css;
    document.head.appendChild(style);

    var sec = el('section', { id: 'data-movement', 'class': 'dm-section', 'aria-labelledby': 'dmTitle' });
    sec.innerHTML =
      '<p class="dm-kicker">WHY IN-MEMORY COMPUTING?</p>' +
      '<h2 class="dm-title" id="dmTitle">Moving data costs more than <em>computing on it.</em></h2>' +
      '<p class="dm-sub">Compare a matrix–vector multiply at different matrix sizes. Conventional computing streams weights from memory to the CPU before arithmetic begins. In-memory computing performs the multiply-accumulates in the memory array, so weights do not make that round trip.</p>' +
      '<div class="dm-card">' +
        '<div class="dm-controls">' +
          '<div><label for="dmSize">MATRIX SIZE: <span id="dmSizeOut">64 × 64</span></label><br>' +
          '<input id="dmSize" type="range" min="3" max="9" value="6" step="1" aria-describedby="dmNote" aria-label="Matrix dimension"></div>' +
          '<button class="dm-btn" id="dmRun" type="button">Run comparison ▶</button>' +
          '<button class="dm-btn" id="dmReset" type="button">Reset</button>' +
        '</div>' +
        '<div class="dm-lanes">' +
          '<div class="dm-lane" id="dmConvLane" data-state="idle"><h3>Conventional computing</h3><p>Memory → CPU transfer first, then compute in the CPU.</p>' +
            '<div class="dm-phase"><i class="dm-phase-dot"></i><span id="dmConvPhase">Ready to transfer weights</span></div>' +
            '<canvas class="dm-canvas" id="dmConv" aria-label="Memory-to-CPU word transfer followed by CPU computation"></canvas>' +
            '<div class="dm-progress" aria-hidden="true"><span id="dmConvProgress"></span></div>' +
            '<div class="dm-stats"><div class="dm-stat">WORDS MOVED<strong id="dmConvMoved">0</strong><small id="dmConvMovedDetail">of total transfers</small></div><div class="dm-stat">REL. ENERGY<strong id="dmConvE">0</strong><small id="dmConvEDetail">illustrative units</small></div></div></div>' +
          '<div class="dm-lane" id="dmImcLane" data-state="idle"><h3>In-memory computing</h3><p>Weights remain in place; compute lights up inside the array.</p>' +
            '<div class="dm-phase"><i class="dm-phase-dot"></i><span id="dmImcPhase">Ready for in-array compute</span></div>' +
            '<canvas class="dm-canvas" id="dmImc" aria-label="Input movement and computation within the memory array, without moving the weights to a CPU"></canvas>' +
            '<div class="dm-progress" aria-hidden="true"><span id="dmImcProgress"></span></div>' +
            '<div class="dm-stats"><div class="dm-stat">WORDS MOVED<strong id="dmImcMoved">0</strong><small id="dmImcMovedDetail">inputs + outputs only</small></div><div class="dm-stat">REL. ENERGY<strong id="dmImcE">0</strong><small id="dmImcEDetail">illustrative units</small></div></div></div>' +
        '</div>' +
        '<div class="dm-latency" aria-label="Illustrative latency comparison">' +
          '<div class="dm-latency-title">LATENCY COMPARISON <small>illustrative relative time units</small></div>' +
          '<div class="dm-latency-row" data-kind="conv"><span class="dm-latency-name">CONVENTIONAL</span><div class="dm-latency-track"><div class="dm-latency-fill" id="dmConvLatencyBar"></div></div><span class="dm-latency-value" id="dmConvLatency">—</span></div>' +
          '<div class="dm-latency-row" data-kind="imc"><span class="dm-latency-name">IN-MEMORY</span><div class="dm-latency-track"><div class="dm-latency-fill" id="dmImcLatencyBar"></div></div><span class="dm-latency-value" id="dmImcLatency">—</span></div>' +
          '<div class="dm-latency-speedup" id="dmLatencySpeedup">Run the comparison to animate the latency difference.</div>' +
          '<p class="dm-latency-note">Bar length compares modeled end-to-end latency; the sweep animates progress. This conceptual model assumes weight-transfer latency scales with N² for the CPU path, while in-array MACs execute in parallel. Actual latency depends on memory technology, array size, converters, precision, and implementation.</p>' +
        '</div>' +
        '<div class="dm-result" id="dmResult" aria-live="polite">Choose a matrix size, then press <b>Run comparison</b>. Watch the transfer phase finish before CPU computation starts.</div>' +
        '<p class="dm-note" id="dmNote">Illustrative model only—not measured silicon data. This simplified model counts N² weights plus 2N input/output words for the conventional path, and 2N input/output words for in-memory computing. Relative energy uses compute = 1, word transfer = 20, in-array MAC = 1.5, and readout = 6 per output. Real results depend on architecture, precision, data reuse, and peripheral circuits.</p>' +
      '</div>';
    anchor.insertAdjacentElement('afterend', sec);

    var $ = function (id) { return document.getElementById(id); };
    var size = $('dmSize'), sizeOut = $('dmSizeOut');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var raf = null, startedAt = 0, running = false;

    function N() { return Math.pow(2, +size.value); }
    function model(n) {
      var macs = n * n;
      // Simplified latency model: moving N² weights dominates the conventional path;
      // IMC performs the array MACs in parallel, with input and output transfer overhead.
      var convLatency = macs * 1.0 + n * n * 0.12 + n * 0.5;
      var imcLatency = n * 0.5 + 8 + n * 0.5;
      return {
        conv: { moved: macs + 2 * n, e: macs * E_MAC + (macs + 2 * n) * E_MOVE, transferE: macs * E_MOVE, latency: convLatency },
        imc: { moved: 2 * n, e: macs * E_IMC_MAC + n * E_IMC_OUT + 2 * n * E_MOVE, latency: imcLatency }
      };
    }
    function dims(canvas) {
      var r = canvas.getBoundingClientRect(), d = window.devicePixelRatio || 1;
      var w = Math.max(1, r.width), h = Math.max(1, r.height);
      canvas.width = Math.round(w * d);
      canvas.height = Math.round(h * d);
      return { ctx: canvas.getContext('2d'), w: w, h: h, d: d };
    }
    function rounded(g, x, y, w, h, r, fill, stroke) {
      g.beginPath();
      g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r);
      g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r);
      g.arcTo(x, y, x + w, y, r); g.closePath();
      if (fill) { g.fillStyle = fill; g.fill(); }
      if (stroke) { g.strokeStyle = stroke; g.stroke(); }
    }
    function drawMemory(g, x, y, w, h, n, activeFraction, mode, d) {
      rounded(g, x, y, w, h, 7, '#0c1b29', '#2b465b');
      var cols = n >= 128 ? 12 : n >= 64 ? 10 : 8;
      var rows = Math.max(4, Math.min(7, Math.ceil(cols * .55)));
      var gap = 3, cellW = (w - 16 - gap * (cols - 1)) / cols, cellH = (h - 28 - gap * (rows - 1)) / rows;
      g.font = '10px "DM Mono",monospace'; g.fillStyle = '#9fb3c7';
      g.fillText('MEMORY ARRAY  ' + n + '×' + n, x + 8, y + 15);
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
        var idx = r * cols + c, frac = idx / (rows * cols);
        var on = mode === 'compute' && frac <= activeFraction;
        var sent = mode === 'transfer' && frac <= activeFraction;
        g.fillStyle = on ? '#3dd6c6' : sent ? 'rgba(61,214,198,.42)' : 'rgba(120,151,175,.19)';
        rounded(g, x + 8 + c * (cellW + gap), y + 24 + r * (cellH + gap), cellW, cellH, 2, g.fillStyle, null);
        if (on) {
          g.fillStyle = 'rgba(61,214,198,.16)';
          g.fillRect(x + 8 + c * (cellW + gap) - 1, y + 24 + r * (cellH + gap) - 1, cellW + 2, cellH + 2);
        }
      }
    }
    function drawCpu(g, x, y, w, h, n, compute, phaseP) {
      rounded(g, x, y, w, h, 7, '#17152b', '#6558a8');
      g.fillStyle = '#b6aaff'; g.font = 'bold 12px "DM Mono",monospace'; g.fillText('CPU', x + 10, y + 19);
      g.fillStyle = '#8e83c4'; g.font = '10px "DM Mono",monospace'; g.fillText(compute ? 'MAC ENGINE' : 'WAITING', x + 10, y + 34);
      var bx = x + 10, by = y + 45, bw = Math.max(5, w - 20), bh = Math.max(8, h - 57);
      rounded(g, bx, by, bw, bh, 3, '#0c1120', '#3f375f');
      var count = Math.max(2, Math.min(12, Math.ceil(Math.sqrt(n))));
      for (var i = 0; i < count; i++) {
        var xx = bx + 4 + (bw - 8) * (i / count);
        g.fillStyle = compute && (i / count) <= phaseP ? '#a78bfa' : '#322d4a';
        g.fillRect(xx, by + 3, Math.max(2, bw / count - 2), Math.max(3, bh - 6));
      }
    }
    function drawBus(g, x1, x2, y, phaseP, active, direction, d) {
      g.strokeStyle = '#30465a'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(x1, y); g.lineTo(x2, y); g.stroke();
      g.fillStyle = '#8ba1b7'; g.font = '9px "DM Mono",monospace'; g.textAlign = 'center';
      g.fillText(direction === 'reverse' ? 'CPU → MEMORY' : 'MEMORY → CPU', (x1 + x2) / 2, y - 9); g.textAlign = 'start';
      if (!active) return;
      var count = 12;
      for (var i = 0; i < count; i++) {
        var q = (phaseP * count * 1.8 + i / count) % 1;
        var x = direction === 'reverse' ? x2 - q * (x2 - x1) : x1 + q * (x2 - x1);
        g.fillStyle = '#3dd6c6';
        g.shadowBlur = 7 * d; g.shadowColor = '#3dd6c6';
        rounded(g, x - 2.5, y - 3, 5, 6, 1.5, '#3dd6c6', null);
      }
      g.shadowBlur = 0;
    }
    function drawConventional(p, n) {
      var c = $('dmConv'), f = dims(c), g = f.ctx, w = f.w, h = f.h, d = f.d;
      g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h);
      var pad = 12, memX = pad, memY = 36, memW = w * .27, memH = h - 61;
      var cpuW = w * .22, cpuX = w - cpuW - pad, cpuY = 36, cpuH = memH;
      var busX1 = memX + memW + 7, busX2 = cpuX - 7, busY = h * .57;
      var transferP = Math.min(1, p / .45);
      var computeP = p <= .45 ? 0 : Math.min(1, (p - .45) / .40);
      var outputP = p <= .85 ? 0 : Math.min(1, (p - .85) / .15);
      var transferActive = p > 0 && p <= .45;
      var outputActive = p > .85 && p < 1;
      g.fillStyle = '#8da6bb'; g.font = '9px "DM Mono",monospace'; g.fillText('WEIGHTS + INPUT', memX, 24);
      drawMemory(g, memX, memY, memW, memH, n, transferP, 'transfer', d);
      drawCpu(g, cpuX, cpuY, cpuW, cpuH, n, computeP > 0, computeP);
      drawBus(g, busX1, busX2, busY, transferP, transferActive, 'forward', d);
      if (outputActive) drawBus(g, busX1, busX2, busY, outputP, true, 'reverse', d);
      if (p >= .85) {
        g.fillStyle = '#3dd6c6'; g.font = '10px "DM Mono",monospace';
        g.fillText(outputP >= 1 ? 'OUTPUT VECTOR RETURNED' : 'SENDING N RESULTS…', memX, h - 10);
      } else if (p >= .45) {
        g.fillStyle = '#a78bfa'; g.font = '10px "DM Mono",monospace';
        g.fillText(computeP >= 1 ? 'COMPUTE COMPLETE' : 'COMPUTING IN CPU…', cpuX - 1, h - 10);
      } else if (p > 0) {
        g.fillStyle = '#3dd6c6'; g.font = '10px "DM Mono",monospace'; g.fillText('TRANSFERRING N² WEIGHTS + INPUTS…', memX, h - 10);
      } else {
        g.fillStyle = '#61788d'; g.font = '10px "DM Mono",monospace'; g.fillText('READY', memX, h - 10);
      }
    }
    function drawImc(p, n) {
      var c = $('dmImc'), f = dims(c), g = f.ctx, w = f.w, h = f.h, d = f.d;
      g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h);
      var memX = 12, memY = 31, memW = w * .66, memH = h - 53;
      var outputX = memX + memW + 9, outputW = Math.max(44, w - outputX - 12);
      var inputP = Math.min(1, p / .10);
      var computeP = p <= .10 ? 0 : Math.min(1, (p - .10) / .75);
      var outputP = p <= .85 ? 0 : Math.min(1, (p - .85) / .15);
      g.fillStyle = '#8da6bb'; g.font = '9px "DM Mono",monospace'; g.fillText('INPUT VECTOR → ARRAY', 12, 15);
      if (inputP < 1 && p > 0) {
        g.strokeStyle = '#30465a'; g.beginPath(); g.moveTo(13, 23); g.lineTo(w * .65, 23); g.stroke();
        var ix = 13 + (w * .65 - 13) * inputP;
        g.fillStyle = '#a78bfa'; rounded(g, ix - 3, 19, 6, 8, 2, '#a78bfa', null);
      }
      drawMemory(g, memX, memY, memW, memH, n, computeP, 'compute', d);
      rounded(g, outputX, memY, outputW, memH, 7, '#101928', '#2b465b');
      g.fillStyle = '#9fb3c7'; g.font = '9px "DM Mono",monospace'; g.fillText('OUTPUT', outputX + 6, memY + 15);
      var rows = Math.max(3, Math.min(7, Math.round(n / 16)));
      var gap = 4, cellH = (memH - 30 - (rows - 1) * gap) / rows;
      for (var i = 0; i < rows; i++) {
        var reached = outputP > (i / rows);
        g.fillStyle = reached ? '#3dd6c6' : 'rgba(120,151,175,.19)';
        rounded(g, outputX + 6, memY + 23 + i * (cellH + gap), outputW - 12, Math.max(3, cellH), 2, g.fillStyle, null);
      }
      g.fillStyle = outputP > 0 ? '#3dd6c6' : '#8da6bb'; g.font = '10px "DM Mono",monospace';
      g.fillText(p <= .10 ? (p > 0 ? 'LOADING INPUTS…' : 'WEIGHTS STAY IN PLACE') : p < .85 ? (computeP >= 1 ? 'IN-ARRAY MAC COMPLETE' : 'COMPUTING IN ARRAY…') : (outputP >= 1 ? 'OUTPUT VECTOR READY' : 'READING N RESULTS…'), 12, h - 10);
    }
    function render(p) {
      var n = N(), m = model(n);
      var transferP = Math.min(1, p / .45);
      var cpuP = p <= .45 ? 0 : Math.min(1, (p - .45) / .40);
      var outputP = p <= .85 ? 0 : Math.min(1, (p - .85) / .15);
      // Transfer weights + inputs, execute CPU arithmetic, then return the output vector.
      var convMoved = (n * n + n) * transferP + n * outputP;
      var convEnergy = (n * n + n) * E_MOVE * transferP + n * n * E_MAC * cpuP + n * E_MOVE * outputP;
      var imcInputP = Math.min(1, p / .10);
      var imcComputeP = p <= .10 ? 0 : Math.min(1, (p - .10) / .75);
      var imcOutputP = p <= .85 ? 0 : Math.min(1, (p - .85) / .15);
      var imcMoved = n * imcInputP + n * imcOutputP;
      var imcEnergy = n * E_MOVE * imcInputP + n * n * E_IMC_MAC * imcComputeP +
        (n * E_MOVE + n * E_IMC_OUT) * imcOutputP;

      drawConventional(p, n);
      drawImc(p, n);
      $('dmConvMoved').textContent = fmt(convMoved);
      $('dmConvMovedDetail').textContent = fmt(m.conv.moved) + ' total (weights + vectors)';
      $('dmConvE').textContent = fmt(convEnergy);
      $('dmConvEDetail').textContent = 'of ' + fmt(m.conv.e) + ' total units';
      $('dmImcMoved').textContent = fmt(imcMoved);
      $('dmImcMovedDetail').textContent = fmt(m.imc.moved) + ' total (input + output)';
      $('dmImcE').textContent = fmt(imcEnergy);
      $('dmImcEDetail').textContent = 'of ' + fmt(m.imc.e) + ' total units';
      var latencyRatio = m.conv.latency / m.imc.latency;
      // Keep even the shorter IMC bar clearly visible while preserving a strong visual contrast.
      var imcLatencyWidth = Math.max(8, 100 * m.imc.latency / m.conv.latency);
      $('dmConvLatency').textContent = fmt(m.conv.latency) + ' units';
      $('dmImcLatency').textContent = fmt(m.imc.latency) + ' units';
      $('dmConvLatencyBar').style.width = (100 * p) + '%';
      $('dmImcLatencyBar').style.width = (imcLatencyWidth * p) + '%';
      $('dmLatencySpeedup').textContent = p >= 1 ? 'MODELED LATENCY REDUCTION: ' + (100 * (1 - m.imc.latency / m.conv.latency)).toFixed(1) + '% · ' + latencyRatio.toFixed(1) + '× lower latency with IMC' : 'Modeled end-to-end latency: IMC is ' + latencyRatio.toFixed(1) + '× lower; bars animate during the run.';
      $('dmConvProgress').style.width = (p * 100) + '%';
      $('dmImcProgress').style.width = (p * 100) + '%';

      var convLane = $('dmConvLane'), imcLane = $('dmImcLane');
      var convPhase = p <= 0 ? 'Ready to transfer weights' : p < .45 ? 'Phase 1/3 · Memory → CPU transfer' : p < .85 ? 'Phase 2/3 · Matrix multiply in CPU' : p < 1 ? 'Phase 3/3 · CPU → memory output transfer' : 'Complete · transfer + CPU compute + output';
      var imcPhase = p <= 0 ? 'Ready for in-array compute' : p < .10 ? 'Moving input vector into array' : p < .85 ? 'Computing in place · weights stay put' : p < 1 ? 'Reading output vector from array' : 'Complete · compute in memory array';
      convLane.setAttribute('data-state', p <= 0 ? 'idle' : (p < .45 || (p >= .85 && p < 1)) ? 'transfer' : p < 1 ? 'compute' : 'done');
      imcLane.setAttribute('data-state', p <= 0 ? 'idle' : (p < .10 || (p >= .85 && p < 1)) ? 'transfer' : p < 1 ? 'compute' : 'done');
      $('dmConvPhase').textContent = convPhase;
      $('dmImcPhase').textContent = imcPhase;

      if (p >= 1) {
        var wordSave = 100 * (1 - m.imc.moved / m.conv.moved);
        var energySave = 100 * (1 - m.imc.e / m.conv.e);
        var latencySave = 100 * (1 - m.imc.latency / m.conv.latency);
        $('dmResult').innerHTML =
          '<b>' + n + ' × ' + n + ' matrix comparison</b>' +
          '<div class="dm-result-grid">' +
            '<div class="dm-result-metric"><span>FEWER WORDS MOVED</span><b>' + wordSave.toFixed(1) + '%</b></div>' +
            '<div class="dm-result-metric"><span>RELATIVE ENERGY REDUCTION</span><b>' + energySave.toFixed(1) + '%</b></div>' +
            '<div class="dm-result-metric"><span>MODELED LATENCY REDUCTION</span><b>' + latencySave.toFixed(1) + '%</b><span>' + (m.conv.latency / m.imc.latency).toFixed(1) + '× lower latency</span></div>' +
          '</div>';
      }
    }
    function stop() {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
      running = false;
    }
    function run() {
      stop();
      running = true;
      $('dmRun').textContent = 'Replay comparison ↻';
      if (reduce) {
        render(1);
        running = false;
        return;
      }
      startedAt = performance.now();
      function tick(now) {
        if (!running) return;
        var p = Math.min(1, (now - startedAt) / RUN_MS);
        render(p);
        if (p < 1) raf = requestAnimationFrame(tick);
        else { raf = null; running = false; }
      }
      raf = requestAnimationFrame(tick);
    }
    function reset() {
      stop();
      render(0);
      $('dmRun').textContent = 'Run comparison ▶';
      $('dmResult').innerHTML = 'Choose a matrix size, then press <b>Run comparison</b>. Watch the transfer phase finish before CPU computation starts.';
    }
    size.addEventListener('input', function () {
      var n = N();
      sizeOut.textContent = n + ' × ' + n;
      reset();
    });
    $('dmRun').addEventListener('click', run);
    $('dmReset').addEventListener('click', reset);
    window.addEventListener('resize', function () { render(0); });

    // First paint when close to viewport; animation begins only on user action.
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { render(0); io.disconnect(); }
      }, { rootMargin: '200px' });
      io.observe(sec);
    } else render(0);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();

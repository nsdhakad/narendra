/* Image input and inference-workbench controls.
 * Kept separate from the 3D renderer so image upload still works if WebGL fails.
 * Output scores are illustrative demo values, not trained-model predictions.
 */
(() => {
  'use strict';
  const explorer = document.querySelector('.system-explorer');
  if (!explorer) return;

  const id = name => document.getElementById(name);
  const all = selector => [...explorer.querySelectorAll(selector)];
  const requiredIds = [
    'systemStatus','systemStageCallout','systemImageInput','systemInputPreview',
    'imageDropzone','chooseImageButton','sampleImageButton','loadWeightsButton',
    'runPipelineButton','stepPipelineButton','resetPipelineButton','outputScores',
    'executionReadout','architectureMode','inferenceMode','explodeSystem','resetView'
  ];
  const missing = requiredIds.filter(name => !id(name));
  if (missing.length) {
    console.error('[System Explorer] Missing controls:', missing.join(', '));
    const readout = id('executionReadout');
    if (readout) readout.textContent = 'The system explorer is missing required controls. Refresh the page after the latest site deployment.';
    return;
  }

  const status = id('systemStatus');
  const callout = id('systemStageCallout');
  const input = id('systemImageInput');
  const preview = id('systemInputPreview');
  const dropzone = id('imageDropzone');
  const chooseButton = id('chooseImageButton');
  const sampleButton = id('sampleImageButton');
  const weightButton = id('loadWeightsButton');
  const runButton = id('runPipelineButton');
  const stepButton = id('stepPipelineButton');
  const resetButton = id('resetPipelineButton');
  const cells = all('.weight-cell');
  const stages = all('.pipeline-node');
  const components = all('.system-component');
  const scoresNode = id('outputScores');
  const readout = id('executionReadout');

  const flowOverlay = id('systemFlowOverlay');
  const flowImage = id('systemFlowImage');
  const flowImagePlaceholder = id('systemFlowImagePlaceholder');
  const flowMemoryCells = all('[data-flow-mem-cell]');
  const flowWeightCells = all('[data-flow-weight-cell]');
  const flowOutputBars = all('[data-flow-output-bar]');
  const flowStateText = id('systemFlowInputState');
  const flowWeightState = id('systemFlowWeightState');
  const flowTransferState = id('systemFlowTransferState');
  const flowOutputLabel = id('systemFlowOutputLabel');
  const flowOutputState = id('systemFlowOutputState');
  const stageOrder = ['input','weights','imc','riscv','output'];
  function setFlowStage(stage) {
    if (!flowOverlay) return;
    flowOverlay.dataset.flowState = stage || 'idle';
    const stageIndex = stageOrder.indexOf(stage);
    all('[data-flow-node]').forEach(node => {
      const nodeIndex = stageOrder.indexOf(node.dataset.flowNode);
      node.classList.toggle('is-flow-active', node.dataset.flowNode === stage);
      node.classList.toggle('is-flow-done', nodeIndex >= 0 && stageIndex > nodeIndex);
    });
    const activeEdges = {
      input: ['input-imc'], weights: ['weights-imc'],
      imc: ['input-imc','weights-imc','imc-riscv'],
      riscv: ['imc-riscv','riscv-output'], output: ['riscv-output']
    }[stage] || [];
    all('[data-flow-edge]').forEach(edge => edge.classList.toggle('is-flowing', activeEdges.includes(edge.dataset.flowEdge)));
  }
  function paintFlowWeights() {
    if (!weights) return;
    const flat = weights.flat();
    const sampleIndexes = [0,7,16,23,32,39,48,63];
    flowWeightCells.forEach((cell,index) => {
      const n = Math.max(0,Math.min(1,(flat[sampleIndexes[index]]+1)/2));
      cell.style.background = 'hsl(' + (245-n*70) + ' 58% ' + (18+n*38) + '%)';
      cell.style.borderColor = n > .68 ? '#a59bff' : n > .34 ? '#4db9af' : '#365568';
    });
    flowMemoryCells.forEach((cell,index) => {
      const value = flat[(Math.floor(index/4)*2)*8 + (index%4)*2];
      const n = Math.max(0,Math.min(1,(value+1)/2));
      cell.style.background = 'hsl(' + (245-n*70) + ' 58% ' + (18+n*38) + '%)';
      cell.style.boxShadow = '0 0 5px hsla(' + (245-n*70) + ',78%,65%,.18)';
    });
  }


  let imageElement = null;
  let objectUrl = null;
  let weights = null;
  let features = null;
  let scores = null;
  let pipelineStep = -1;
  let running = false;
  let runToken = 0;

  const setStatus = value => { status.textContent = value; };
  const panel = (which, value, done = false) => {
    const node = id(which);
    if (!node) return;
    node.textContent = value;
    node.classList.toggle('is-done', done);
  };
  const updateReady = () => {
    const ready = Boolean(imageElement && weights);
    runButton.disabled = !ready; // Keep enabled while running so it can pause.
    stepButton.disabled = !ready || running;
    panel('executionState', running ? 'RUNNING' : ready ? 'READY' : imageElement ? 'WAITING FOR WEIGHTS' : 'WAITING', ready);
  };
  const releaseObjectUrl = () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  };
  const resetOutput = () => {
    pipelineStep = -1;
    scores = null;
    stages.forEach((node, index) => {
      node.classList.toggle('is-current', index === 0);
      node.classList.remove('is-complete');
    });
    components.forEach(button => button.classList.remove('is-pulsing'));
    scoresNode.innerHTML = '<div class="output-empty">Run the pipeline to generate illustrative scores.</div>';
    if (window.systemArchitectureScene && window.systemArchitectureScene.setScores) {
      window.systemArchitectureScene.setScores(null);
    }
    flowOutputLabel.textContent = 'Display ready';
    flowOutputState.textContent = 'Awaiting result';
    flowOutputBars.forEach((bar,i)=>{bar.style.height = [25,48,34][i]+'%';bar.style.background='';});
    setFlowStage(imageElement ? (weights ? 'weights' : 'input') : 'idle');
    panel('executionState', imageElement && weights ? 'READY' : 'IDLE', Boolean(imageElement && weights));
    panel('outputState', 'NO RESULT');
    if (window.systemArchitectureScene && window.systemArchitectureScene.setStep) window.systemArchitectureScene.setStep(-1);
    updateReady();
  };

  function processImage(img, fileName) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const context = canvas.getContext('2d', { willReadFrequently: true }) || canvas.getContext('2d');
      if (!context) throw new Error('2D canvas is unavailable in this browser.');
      context.drawImage(img, 0, 0, 16, 16);
      const pixels = context.getImageData(0, 0, 16, 16).data;
      const grayscale = [];
      let red = 0, green = 0, blue = 0, contrast = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        red += pixels[i];
        green += pixels[i + 1];
        blue += pixels[i + 2];
        grayscale.push((pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114) / 255);
      }
      for (let i = 16; i < grayscale.length; i++) contrast += Math.abs(grayscale[i] - grayscale[i - 16]);

      imageElement = img;
      features = {
        red: red / (256 * 255),
        green: green / (256 * 255),
        blue: blue / (256 * 255),
        contrast: Math.min(1, contrast / 240),
        grayscale
      };
      // Mirror the very same decoded image onto the independent 3D input monitor.
      if (window.systemArchitectureScene && window.systemArchitectureScene.setInputImage) {
        window.systemArchitectureScene.setInputImage(img);
      }
      preview.src = img.src;
      preview.hidden = false;
      flowImage.src = img.src;
      flowImage.hidden = false;
      flowImagePlaceholder.hidden = true;
      id('systemFlowInputLabel').textContent = fileName || 'Image ready';
      flowStateText.textContent = '256 px features sampled';
      flowOutputLabel.textContent = 'Display ready';
      flowOutputState.textContent = 'Awaiting result';
      flowOutputBars.forEach((bar,i)=>{bar.style.height = [25,48,34][i]+'%'; bar.style.background='';});
      setFlowStage('input');
      id('imageDropTitle').textContent = fileName || 'Image ready';
      id('imageDropMeta').textContent = img.naturalWidth + ' × ' + img.naturalHeight + ' px · sampled locally';
      id('pixelSummary').textContent = '256 sampled pixels';
      panel('inputState', 'IMAGE READY', true);
      readout.textContent = 'Image loaded and sampled to a 16 × 16 grayscale vector. Load demo weights to continue.';
      setStatus('IMAGE READY · WAITING FOR WEIGHTS');
      resetOutput();
    } catch (error) {
      imageElement = null;
      features = null;
      panel('inputState', 'IMAGE ERROR');
      readout.textContent = 'This image could not be processed: ' + (error.message || 'unknown browser image error');
      setStatus('IMAGE PROCESSING ERROR');
      updateReady();
    }
  }

  function loadImageSource(source, fileName, sourceIsObjectUrl = false) {
    releaseObjectUrl();
    if (sourceIsObjectUrl) objectUrl = source;
    imageElement = null;
    features = null;
    preview.hidden = true;
    if (window.systemArchitectureScene && window.systemArchitectureScene.setInputImage) {
      window.systemArchitectureScene.setInputImage(null);
    }
    panel('inputState', 'LOADING');
    readout.textContent = 'Loading ' + (fileName || 'image') + '…';
    setStatus('LOADING IMAGE');
    updateReady();

    const image = new Image();
    image.decoding = 'async';
    image.onload = () => processImage(image, fileName);
    image.onerror = () => {
      imageElement = null;
      features = null;
      panel('inputState', 'IMAGE ERROR');
      readout.textContent = 'The browser could not decode this file. Try PNG, JPEG, or WebP.';
      id('systemFlowInputLabel').textContent = 'Image unavailable';
      flowStateText.textContent = 'Decode failed';
      setFlowStage('idle');
      setStatus('IMAGE DECODE ERROR');
      updateReady();
    };
    image.src = source;
  }

  function loadImageFile(file) {
    if (!file) return;
    const isImage = (file.type && file.type.startsWith('image/')) ||
      /\\.(png|jpe?g|webp|gif|bmp|avif|tiff?)$/i.test(file.name || '');
    if (!isImage) {
      readout.textContent = 'Choose an image file (PNG, JPEG, WebP, GIF, BMP, AVIF, or TIFF).';
      panel('inputState', 'INVALID FILE');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      readout.textContent = 'This image is larger than 25 MB. Please choose a smaller image.';
      panel('inputState', 'FILE TOO LARGE');
      return;
    }
    try {
      const source = URL.createObjectURL(file);
      loadImageSource(source, file.name || 'Uploaded image', true);
    } catch (error) {
      readout.textContent = 'Could not open this file: ' + (error.message || 'browser file API unavailable');
      panel('inputState', 'FILE ERROR');
    }
  }

  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    input.value = '';
    if (file) loadImageFile(file);
  });
  chooseButton.addEventListener('click', () => input.click());

  sampleButton.addEventListener('click', () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 224;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('2D canvas is unavailable in this browser.');
      const gradient = context.createLinearGradient(0, 0, 224, 224);
      gradient.addColorStop(0, '#13384b');
      gradient.addColorStop(0.5, '#48c9b6');
      gradient.addColorStop(1, '#a59bff');
      context.fillStyle = gradient;
      context.fillRect(0, 0, 224, 224);
      context.fillStyle = '#081522';
      for (let i = 0; i < 7; i++) context.fillRect(25 + i * 25, 36 + (i % 3) * 8, 12, 148 - (i % 3) * 10);
      context.strokeStyle = '#c7fff6';
      context.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        context.beginPath();
        context.moveTo(22, 25 + i * 42);
        context.lineTo(202, 25 + i * 42);
        context.stroke();
      }
      context.fillStyle = '#f0c98f';
      context.fillRect(92, 85, 42, 54);
      context.fillStyle = '#0b1c2a';
      context.font = 'bold 17px monospace';
      context.fillText('IMC', 94, 117);
      loadImageSource(canvas.toDataURL('image/png'), 'Sample IMC image', false);
    } catch (error) {
      panel('inputState', 'SAMPLE ERROR');
      readout.textContent = 'Could not create the sample image: ' + (error.message || 'unknown canvas error');
      setStatus('SAMPLE IMAGE ERROR');
    }
  });

  ['dragenter', 'dragover'].forEach(type => dropzone.addEventListener(type, event => {
    event.preventDefault();
    dropzone.classList.add('is-dragover');
  }));
  ['dragleave', 'drop'].forEach(type => dropzone.addEventListener(type, event => {
    event.preventDefault();
    dropzone.classList.remove('is-dragover');
  }));
  dropzone.addEventListener('drop', event => {
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) loadImageFile(file);
  });

  const paintCell = (cell, value, active = false) => {
    const normalized = Math.max(0, Math.min(1, (Number(value) + 1) / 2));
    const hue = 245 - normalized * 70;
    cell.style.background = 'hsl(' + hue + ' 58% ' + (18 + normalized * 38) + '%)';
    cell.classList.toggle('is-active', active);
    cell.style.boxShadow = active ? '0 0 10px hsla(' + hue + ',78%,65%,.55)' : '';
  };

  async function loadWeights() {
    weightButton.disabled = true;
    panel('weightState', 'FETCHING');
    flowWeightState.textContent = 'Fetching 8 × 8 matrix…';
    flowTransferState.textContent = 'Reading the weight file';
    setFlowStage('weights');
    all('[data-flow-edge="weights-imc"]').forEach(edge=>edge.classList.add('is-flowing'));
    readout.textContent = 'Fetching demo weights…';
    try {
      const response = await fetch(new URL('demo-weights.json', document.baseURI), { cache: 'no-store' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      if (!Array.isArray(data.weights) || data.weights.length !== 8 ||
          data.weights.some(row => !Array.isArray(row) || row.length !== 8)) {
        throw new Error('Weight file must contain an 8 × 8 matrix.');
      }
      weights = data.weights.map(row => row.map(value => {
        const number = Number(value);
        if (!Number.isFinite(number)) throw new Error('Invalid weight value.');
        return Math.max(-1, Math.min(1, number));
      }));
      const flat = weights.flat();
      const maxAbs = Math.max(...flat.map(Math.abs), 0.01);
      cells.forEach((cell, index) => paintCell(cell, flat[index] / maxAbs));
      panel('weightState', '64 CELLS LOADED', true);
      paintFlowWeights();
      flowWeightState.textContent = '64 values loaded · synthetic demo';
      flowTransferState.textContent = '64 values ready for memory transfer';
      setFlowStage('weights');
      readout.textContent = '64 synthetic demo weights are loaded. Run the pipeline or step through each stage.';
      setStatus('WEIGHTS LOADED · READY');
    } catch (error) {
      panel('weightState', 'FETCH ERROR');
      flowWeightState.textContent = 'Weight file not available';
      flowTransferState.textContent = 'Could not fetch weights';
      setFlowStage(imageElement ? 'input' : 'idle');
      readout.textContent = 'Could not load the demo weights (' + (error.message || 'fetch failed') + '). Refresh the page and try again.';
      setStatus('WEIGHT FETCH ERROR');
    } finally {
      weightButton.disabled = false;
      updateReady();
    }
  }
  weightButton.addEventListener('click', loadWeights);

  const componentInfo = {
    input: { title: 'Image input interface', detail: 'The input module represents the image source. The selected image is sampled locally into a compact 16 × 16 feature vector.', facts: ['IMAGE SOURCE', '16 × 16 sample', 'Browser-side only'] },
    imc: { title: 'IMC memory array', detail: 'The array holds 64 synthetic signed weights in an 8 × 8 grid. These values support an illustrative browser-side multiply-accumulate step.', facts: ['MEMORY + MAC', '8 × 8 demo matrix', 'Synthetic values'] },
    riscv: { title: 'RISC-V control core', detail: 'This block represents orchestration and control between the memory array and output. No RISC-V instruction set is executed in this visualization.', facts: ['CONTROL CORE', 'Data-path stages', 'ISA not executed'] },
    output: { title: 'Output display', detail: 'The output block presents three illustrative scores based on image colour features and synthetic weights; they are not trained-model predictions.', facts: ['OUTPUT DISPLAY', '3 demo categories', 'Not trained inference'] }
  };
  function selectComponent(name) {
    const info = componentInfo[name];
    if (!info) return;
    components.forEach(button => {
      const selected = button.dataset.component === name;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    id('architectureDetailTitle').textContent = info.title;
    id('architectureDetailCopy').textContent = info.detail;
    info.facts.forEach((fact,index) => { id('architectureFact'+(index+1)).textContent = fact; });
    callout.textContent = info.title + ' · ' + info.detail;
    setStatus('INSPECTING · ' + name.toUpperCase());
    if (window.systemArchitectureScene && window.systemArchitectureScene.highlight) window.systemArchitectureScene.highlight(name);
  }
  components.forEach(button => button.addEventListener('click', () => selectComponent(button.dataset.component)));

  function renderScores(items) {
    scoresNode.replaceChildren();
    // Send the same ordered scores to the 3D output monitor and the HTML chart.
    if (window.systemArchitectureScene && window.systemArchitectureScene.setScores) {
      window.systemArchitectureScene.setScores(items);
    }
    items.forEach((item,index)=>{ if(flowOutputBars[index]) { flowOutputBars[index].style.height = Math.max(12,Math.round(item.score*100))+'%'; flowOutputBars[index].style.background = ['#3d908e','#7d70dc','#c69b65'][index]; } });
    if(flowOutputLabel && items[0]) flowOutputLabel.textContent = items[0].label;
    if(flowOutputState) flowOutputState.textContent = 'Top score ' + (items[0] ? Math.round(items[0].score*100) + '%' : 'ready');
    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'score-row';
      const label = document.createElement('span');
      label.textContent = item.label;
      const track = document.createElement('span');
      track.className = 'score-track';
      const fill = document.createElement('span');
      fill.className = 'score-fill';
      fill.style.width = (item.score * 100).toFixed(1) + '%';
      track.append(fill);
      const percentage = document.createElement('span');
      percentage.textContent = (item.score * 100).toFixed(0) + '%';
      row.append(label, track, percentage);
      scoresNode.append(row);
    });
  }

  function calculateScores() {
    const flat = weights.flat();
    const f = features;
    const channels = [f.red, f.green, f.blue, f.contrast, ...f.grayscale.filter((_, index) => index % 21 === 0)];
    const labels = ['Teal pattern', 'Violet pattern', 'Warm pattern'];
    const logits = labels.map((_, classIndex) =>
      channels.reduce((sum, value, index) => sum + value * flat[(index + classIndex * 13) % flat.length], 0) +
      [f.green, f.blue, f.red][classIndex] * 0.9 + [f.contrast, f.red, f.green][classIndex] * 0.4
    );
    const exponentials = logits.map(value => Math.exp(Math.max(-4, Math.min(4, value))));
    const total = exponentials.reduce((a, b) => a + b, 0) || 1;
    return labels.map((label, index) => ({ label, score: exponentials[index] / total })).sort((a, b) => b.score - a.score);
  }

  const stepData = [
    ['IMAGE READY', 'Image loaded and sampled locally. A compact grayscale feature vector is ready.'],
    ['IMC ARRAY ACTIVE', 'The demo combines image-derived features with synthetic weights in a browser-side multiply-accumulate calculation.'],
    ['RISC-V ORCHESTRATION', 'The 3D model highlights the RISC-V control block. No RISC-V instruction set executes in this visualization.'],
    ['OUTPUT READY', 'Illustrative scores are displayed. They are not predictions from a trained neural network.']
  ];
  function updateStep(step) {
    stages.forEach((node, index) => {
      node.classList.toggle('is-current', index === step);
      node.classList.toggle('is-complete', index < step);
    });
    panel('executionState', stepData[step][0], true);
    panel('outputState', step === 3 ? 'DEMO SCORES READY' : 'WAITING', step === 3);
    readout.textContent = stepData[step][1];
    setStatus(stepData[step][0]);
    callout.textContent = stepData[step][0] + ' · ' + stepData[step][1];
    setFlowStage(['input','imc','riscv','output'][step]);
    flowStateText.textContent = step===0 ? 'Features prepared' : 'Image features sent';
    if(step===1) flowTransferState.textContent = 'Weights held in IMC cells';
    if(step===2) flowTransferState.textContent = 'IMC features → RISC-V';
    if(step===3) { flowOutputLabel.textContent = scores && scores[0] ? scores[0].label : 'Result ready'; flowOutputState.textContent = 'Demo scores displayed'; }
    components.forEach(button => button.classList.toggle('is-pulsing',
      (step === 1 && button.dataset.component === 'imc') ||
      (step === 2 && button.dataset.component === 'riscv') ||
      (step === 3 && button.dataset.component === 'output')
    ));
    if (weights) cells.forEach((cell, index) => paintCell(cell, weights.flat()[index], step === 1));
    if (step === 3) {
      scores = calculateScores();
      renderScores(scores);
    }
    if (window.systemArchitectureScene && window.systemArchitectureScene.setStep) window.systemArchitectureScene.setStep(step);
  }
  function executeStep() {
    if (!imageElement || !weights) {
      readout.textContent = 'Load an image and demo weights first.';
      return false;
    }
    if (pipelineStep >= 3) return false;
    pipelineStep += 1;
    updateStep(pipelineStep);
    return true;
  }
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function runPipeline() {
    if (running) {
      ++runToken;
      running = false;
      runButton.innerHTML = 'Resume pipeline <span aria-hidden="true">▶</span>';
      readout.textContent = 'Pipeline paused. Resume to continue, or use Step to advance manually.';
      setStatus('PIPELINE PAUSED');
      updateReady();
      return;
    }
    if (!imageElement || !weights) {
      readout.textContent = 'Load an image and demo weights before starting the pipeline.';
      return;
    }
    if (pipelineStep >= 3) resetOutput();
    running = true;
    const token = ++runToken;
    updateReady();
    runButton.innerHTML = 'Pause pipeline <span aria-hidden="true">Ⅱ</span>';
    setStatus('PIPELINE RUNNING');
    try {
      while (pipelineStep < 3 && token === runToken) {
        executeStep();
        if (pipelineStep < 3) await wait(900);
      }
    } finally {
      if (token === runToken) {
        running = false;
        runButton.innerHTML = pipelineStep >= 3
          ? 'Run again <span aria-hidden="true">↻</span>'
          : 'Resume pipeline <span aria-hidden="true">▶</span>';
        updateReady();
      }
    }
  }
  stepButton.addEventListener('click', () => { if (!running) executeStep(); });
  runButton.addEventListener('click', runPipeline);
  resetButton.addEventListener('click', () => {
    ++runToken;
    running = false;
    resetOutput();
    setStatus('READY · IMC + RISC-V');
    callout.textContent = 'Select a component or run the pipeline';
    runButton.innerHTML = 'Run pipeline <span aria-hidden="true">▶</span>';
  });

  function setMode(mode, initializing = false) {
    const normalizedMode = mode === 'inference' ? 'inference' : 'architecture';
    const architecture = normalizedMode === 'architecture';
    const previousMode = explorer.dataset.mode || 'architecture';

    if (!initializing && previousMode !== normalizedMode) {
      ++runToken;
      running = false;
      resetOutput(); // Keep image and weights; clear stale pipeline/result highlights.
      runButton.innerHTML = 'Run pipeline <span aria-hidden="true">▶</span>';
    }

    explorer.dataset.mode = normalizedMode;
    id('architectureMode').classList.toggle('is-active', architecture);
    id('architectureMode').setAttribute('aria-selected', String(architecture));
    id('inferenceMode').classList.toggle('is-active', !architecture);
    id('inferenceMode').setAttribute('aria-selected', String(!architecture));
    id('systemModeDescription').textContent = architecture
      ? 'Explore the hardware: select a component below or use Exploded view to inspect the package.'
      : 'Run the data path: load an image and demo weights, then run, pause, resume, or step through the pipeline.';
    if (window.systemArchitectureScene && window.systemArchitectureScene.setMode) window.systemArchitectureScene.setMode(normalizedMode);
    id('memoryPanelTitle').textContent = architecture ? 'IMC weight array' : 'Active inference array';
    id('executionPanelTitle').textContent = architecture ? 'Data path' : 'Execution trace';
    id('outputPanelTitle').textContent = architecture ? 'Output display' : 'Inference output';
    id('explodeSystem').setAttribute('aria-pressed', 'false');
    id('explodeSystem').innerHTML = 'Exploded view <span aria-hidden="true">↗</span>';
    explorer.dataset.exploded = 'false';
    if (window.systemArchitectureScene && window.systemArchitectureScene.explode) {
      window.systemArchitectureScene.explode(false);
    }

    if (architecture) {
      setStatus('ARCHITECTURE · EXPLORE HARDWARE');
      selectComponent('imc');
    } else {
      setStatus(imageElement && weights ? 'INFERENCE READY · IMC + RISC-V' : 'INFERENCE · LOAD INPUT + WEIGHTS');
      callout.textContent = 'Inference mode · watch image features and weights move through the system.';
      readout.textContent = imageElement && weights
        ? 'Image and demo weights are ready. Run the pipeline or use Step to advance one stage at a time.'
        : 'Upload an image and load demo weights to enable Run pipeline and Step.';
    }
  }
  id('architectureMode').addEventListener('click', () => setMode('architecture'));
  id('inferenceMode').addEventListener('click', () => setMode('inference'));
  setMode('architecture', true);
  selectComponent('imc');
  id('explodeSystem').addEventListener('click', event => {
    const button = event.currentTarget;
    const open = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(open));
    explorer.dataset.exploded = String(open);
    button.innerHTML = open ? 'Assembled view <span aria-hidden="true">↙</span>' : 'Exploded view <span aria-hidden="true">↗</span>';
    if (window.systemArchitectureScene && window.systemArchitectureScene.explode) window.systemArchitectureScene.explode(open);
  });
  id('resetView').addEventListener('click', () => {
    if (window.systemArchitectureScene && window.systemArchitectureScene.reset) window.systemArchitectureScene.reset();
    id('explodeSystem').setAttribute('aria-pressed', 'false');
    id('explodeSystem').innerHTML = 'Exploded view <span aria-hidden="true">↗</span>';
    explorer.dataset.exploded = 'false';
    setMode('architecture');
    components.forEach(button => {
      const selected = button.dataset.component === 'imc';
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  });

  window.addEventListener('pagehide', releaseObjectUrl);
})();

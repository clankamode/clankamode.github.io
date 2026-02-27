// Listen Mode — the page comes alive when you press play
(function () {
  const container = document.querySelector('.audio-player');
  if (!container || container.dataset.hydrated) return;
  container.dataset.hydrated = "1";

  const src = container.dataset.src;
  if (!src) return;

  const audio = new Audio(src);
  audio.crossOrigin = 'anonymous';
  audio.preload = 'metadata';
  let speed = 1;
  let audioCtx, analyser, dataArray, sourceNode;
  let listenMode = false;
  let animFrame;

  // --- SVG Icons ---
  const playSvg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><polygon points="3,1 13,8 3,15" fill="currentColor"/></svg>`;
  const pauseSvg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="4" height="14" rx="1" fill="currentColor"/><rect x="10" y="1" width="4" height="14" rx="1" fill="currentColor"/></svg>`;
  const skipBackSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/><text x="12" y="16" text-anchor="middle" font-size="8" font-family="monospace" fill="currentColor" stroke="none">15</text></svg>`;
  const skipFwdSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/><text x="12" y="16" text-anchor="middle" font-size="8" font-family="monospace" fill="currentColor" stroke="none">15</text></svg>`;

  // --- Build Player UI ---
  container.innerHTML = `
    <button class="ap-play" aria-label="Play audio narration">${playSvg}</button>
    <button class="ap-skip" data-skip="-15" aria-label="Back 15s">${skipBackSvg}</button>
    <div class="ap-progress-wrap">
      <div class="ap-progress"></div>
      <canvas class="ap-waveform"></canvas>
    </div>
    <button class="ap-skip" data-skip="15" aria-label="Forward 15s">${skipFwdSvg}</button>
    <button class="ap-speed" aria-label="Playback speed">1×</button>
    <span class="ap-time">0:00</span>
  `;

  const btn = container.querySelector('.ap-play');
  const progressWrap = container.querySelector('.ap-progress-wrap');
  const progress = container.querySelector('.ap-progress');
  const time = container.querySelector('.ap-time');
  const speedBtn = container.querySelector('.ap-speed');
  const skips = container.querySelectorAll('.ap-skip');
  const canvas = container.querySelector('.ap-waveform');
  const ctx = canvas.getContext('2d');

  // --- Waveform Canvas Setup ---
  function sizeCanvas() {
    const rect = progressWrap.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
  }

  // --- Content Elements & Timings ---
  const contentEls = [];
  const contentArea = document.querySelector('article') || document.querySelector('.page');
  if (contentArea) {
    contentArea.querySelectorAll('p, h2, h3, pre, .highlight').forEach(el => {
      if (el.closest('.audio-player') || el.closest('.footer') || el.closest('.post-nav') || el.closest('.meta') || el.classList.contains('post-number')) return;
      if (el.textContent.trim().length > 5) contentEls.push(el);
    });
  }

  // Load Whisper timings if embedded in page
  let timings = null;
  const timingsEl = document.getElementById('audio-timings');
  if (timingsEl) {
    try { timings = JSON.parse(timingsEl.textContent); } catch(e) {}
  }
  const hasTimings = timings && timings.length === contentEls.length;

  // --- Web Audio Analyzer ---
  function initAudio() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      sourceNode = audioCtx.createMediaElementSource(audio);
      sourceNode.connect(analyser);
      analyser.connect(audioCtx.destination);
    } catch(e) { audioCtx = null; }
  }

  // --- Listen Mode ---
  function enterListenMode() {
    if (listenMode) return;
    listenMode = true;
    sizeCanvas();
    document.body.classList.add('listen-mode');
    // listen-mode-sync added dynamically when audio reaches first timed paragraph
    animate();
  }

  function exitListenMode() {
    if (!listenMode) return;
    listenMode = false;
    document.body.classList.remove('listen-mode', 'listen-mode-sync');
    cancelAnimationFrame(animFrame);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    contentEls.forEach(el => el.classList.remove('lm-active', 'lm-past', 'lm-code-glow'));
    document.documentElement.style.removeProperty('--accent-pulse');
  }

  // --- Animation Loop ---
  let lastActiveIdx = -1;

  function animate() {
    if (!listenMode) return;
    animFrame = requestAnimationFrame(animate);

    // Waveform
    if (analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const barCount = analyser.frequencyBinCount;
      const barWidth = w / barCount;
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#c8f542';

      for (let i = 0; i < barCount; i++) {
        const v = dataArray[i] / 255;
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.3 + v * 0.5;
        ctx.fillRect(i * barWidth, h - (v * h), barWidth - 1, v * h);
      }
      ctx.globalAlpha = 1;

      // Accent breathing
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
      document.documentElement.style.setProperty('--accent-pulse', `hsl(73, 89%, ${62 + avg * 15}%)`);
    }

    // Paragraph sync (only if Whisper timings exist)
    if (hasTimings && audio.currentTime > 0) {
      const t = audio.currentTime;
      let activeIdx = -1;

      for (let i = 0; i < timings.length; i++) {
        if (t >= timings[i].start && t < timings[i].end) {
          activeIdx = i;
          break;
        }
        // Between elements — keep previous active
        if (i < timings.length - 1 && t >= timings[i].end && t < timings[i + 1].start) {
          activeIdx = i;
          break;
        }
      }
      // Past everything
      if (activeIdx === -1 && timings.length > 0 && t >= timings[timings.length - 1].start) {
        activeIdx = timings.length - 1;
      }

      // Add sync dimming only once audio reaches first timed content
      if (activeIdx > -1 && !document.body.classList.contains('listen-mode-sync')) {
        document.body.classList.add('listen-mode-sync');
      }

      if (activeIdx !== lastActiveIdx) {
        lastActiveIdx = activeIdx;
        contentEls.forEach((el, i) => {
          el.classList.toggle('lm-active', i === activeIdx);
          el.classList.toggle('lm-past', activeIdx > -1 && i < activeIdx);
          const isCode = el.tagName === 'PRE' || el.classList.contains('highlight');
          el.classList.toggle('lm-code-glow', isCode && i === activeIdx);
        });

        // Auto-scroll — always on paragraph change
        if (activeIdx > -1) {
          contentEls[activeIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }

  // --- Controls ---
  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  btn.addEventListener('click', () => {
    initAudio();
    if (audio.paused) {
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      audio.play();
      btn.innerHTML = pauseSvg;
      enterListenMode();
    } else {
      audio.pause();
      btn.innerHTML = playSvg;
    }
  });

  skips.forEach(s => s.addEventListener('click', () => {
    if (!audio.duration) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + parseInt(s.dataset.skip)));
  }));

  const speeds = [1, 1.25, 1.5, 1.75, 2];
  speedBtn.addEventListener('click', () => {
    const idx = (speeds.indexOf(speed) + 1) % speeds.length;
    speed = speeds[idx];
    audio.playbackRate = speed;
    speedBtn.textContent = speed === 1 ? '1×' : `${speed}×`;
  });

  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    progress.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    time.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener('loadedmetadata', () => {
    time.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('ended', () => {
    btn.innerHTML = playSvg;
    progress.style.width = '0%';
    exitListenMode();
  });

  progressWrap.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const rect = progressWrap.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
  });

  window.addEventListener('resize', () => { if (listenMode) sizeCanvas(); });
})();

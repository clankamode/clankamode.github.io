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

  // Cache the accent color so the animation loop never has to call
  // getComputedStyle() per frame. The loop writes --accent-pulse every frame,
  // so reading computed styles each frame would force a synchronous style
  // recalc 60×/sec. --accent only changes on theme toggle, so refresh it then.
  let accentColor = '#c8f542';
  let themeObserver;
  const readAccentColor = () =>
    getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#c8f542';

  // --- SVG Icons ---
  const playSvg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><polygon points="3,1 13,8 3,15" fill="currentColor"/></svg>`;
  const pauseSvg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="4" height="14" rx="1" fill="currentColor"/><rect x="10" y="1" width="4" height="14" rx="1" fill="currentColor"/></svg>`;
  const skipBackSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/><text x="12" y="16" text-anchor="middle" font-size="8" font-family="monospace" fill="currentColor" stroke="none">15</text></svg>`;
  const skipFwdSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/><text x="12" y="16" text-anchor="middle" font-size="8" font-family="monospace" fill="currentColor" stroke="none">15</text></svg>`;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

  // --- Build Player UI ---
  container.innerHTML = `
    <button class="ap-play" aria-label="Play audio narration">${playSvg}</button>
    <button class="ap-skip" data-skip="-15" aria-label="Back 15 seconds">${skipBackSvg}</button>
    <div class="ap-progress-wrap" role="slider" tabindex="0" aria-label="Playback position" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="0:00">
      <div class="ap-progress"></div>
      <canvas class="ap-waveform"></canvas>
    </div>
    <button class="ap-skip" data-skip="15" aria-label="Forward 15 seconds">${skipFwdSvg}</button>
    <button class="ap-speed" aria-label="Playback speed">1×</button>
    <span class="ap-time" aria-hidden="true">0:00</span>
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
    // Keep selector aligned with listen-mode dimming rules, including callout blocks.
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
  const hasTimings = timings && timings.length > 0;

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
    accentColor = readAccentColor();
    themeObserver = new MutationObserver(() => { accentColor = readAccentColor(); });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    sizeCanvas();
    document.body.classList.add('listen-mode');
    // listen-mode-sync added dynamically when audio reaches first timed paragraph
    animate();
  }

  function exitListenMode() {
    if (!listenMode) return;
    listenMode = false;
    themeObserver?.disconnect();
    themeObserver = undefined;
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
      const accent = accentColor;

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

      // Find the last spoken element whose start time we've passed
      // Spoken = duration > 0.5s
      const maxIdx = Math.min(timings.length, contentEls.length);
      for (let i = maxIdx - 1; i >= 0; i--) {
        const dur = timings[i].end - timings[i].start;
        if (dur > 0.5 && t >= timings[i].start) {
          activeIdx = i;
          break;
        }
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
          const isCode = el.tagName === 'PRE';
          el.classList.toggle('lm-code-glow', isCode && i === activeIdx);
        });

        // Auto-scroll — always on paragraph change
        if (activeIdx > -1) {
          contentEls[activeIdx].scrollIntoView({ behavior: scrollBehavior, block: 'center' });
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

  function setPlayState(playing) {
    btn.innerHTML = playing ? pauseSvg : playSvg;
    btn.setAttribute('aria-label', playing ? 'Pause audio narration' : 'Play audio narration');
  }

  btn.addEventListener('click', () => {
    initAudio();
    if (audio.paused) {
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      audio.play();
      setPlayState(true);
      enterListenMode();
    } else {
      audio.pause();
      setPlayState(false);
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

  function updateProgressAria() {
    if (!audio.duration) return;
    const pct = Math.round((audio.currentTime / audio.duration) * 100);
    progressWrap.setAttribute('aria-valuenow', String(pct));
    progressWrap.setAttribute('aria-valuetext', formatTime(audio.currentTime));
  }

  function seekToRatio(ratio) {
    if (!audio.duration) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, ratio * audio.duration));
    updateProgressAria();
  }

  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    progress.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    time.textContent = formatTime(audio.currentTime);
    updateProgressAria();
  });

  audio.addEventListener('loadedmetadata', () => {
    time.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('error', () => {
    setPlayState(false);
    exitListenMode();
    btn.disabled = true;
    skips.forEach((s) => { s.disabled = true; });
    speedBtn.disabled = true;
    progressWrap.setAttribute('aria-disabled', 'true');
    progressWrap.removeAttribute('tabindex');
    time.textContent = 'unavailable';
    container.setAttribute('data-audio-error', '1');
    if (!container.querySelector('.ap-error')) {
      const err = document.createElement('span');
      err.className = 'ap-error';
      err.setAttribute('role', 'status');
      err.textContent = 'audio unavailable';
      container.append(err);
    }
  });

  audio.addEventListener('ended', () => {
    setPlayState(false);
    progress.style.width = '0%';
    progressWrap.setAttribute('aria-valuenow', '0');
    progressWrap.setAttribute('aria-valuetext', '0:00');
    exitListenMode();
  });

  progressWrap.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const rect = progressWrap.getBoundingClientRect();
    seekToRatio((e.clientX - rect.left) / rect.width);
  });

  progressWrap.addEventListener('keydown', (e) => {
    if (!audio.duration) return;
    const step = e.shiftKey ? 0.1 : 0.05;
    let ratio = audio.currentTime / audio.duration;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      seekToRatio(ratio + step);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      seekToRatio(ratio - step);
    } else if (e.key === 'Home') {
      e.preventDefault();
      seekToRatio(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      seekToRatio(1);
    }
  });

  window.addEventListener('resize', () => { if (listenMode) sizeCanvas(); });
})();

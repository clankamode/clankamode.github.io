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

  // --- Paragraph Timing ---
  // Collect all content paragraphs, headings, pre blocks
  const contentEls = [];
  const contentArea = document.querySelector('article') || document.querySelector('.page');
  if (contentArea) {
    contentArea.querySelectorAll('p, h2, h3, pre, .highlight').forEach(el => {
      if (el.closest('.audio-player') || el.closest('.footer') || el.closest('.post-nav')) return;
      contentEls.push(el);
    });
  }

  // Word counts for timing estimation
  const wordCounts = contentEls.map(el => el.textContent.trim().split(/\s+/).length);
  const totalWords = wordCounts.reduce((a, b) => a + b, 0);
  let paragraphTimings = []; // [{start, end}] in seconds

  function buildTimings() {
    if (!audio.duration || totalWords === 0) return;
    const dur = audio.duration;
    let cumulative = 0;
    paragraphTimings = wordCounts.map(wc => {
      const start = (cumulative / totalWords) * dur;
      cumulative += wc;
      const end = (cumulative / totalWords) * dur;
      return { start, end };
    });
  }

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
    } catch(e) {
      // Web Audio not available — graceful fallback
      audioCtx = null;
    }
  }

  // --- Listen Mode ---
  function enterListenMode() {
    if (listenMode) return;
    listenMode = true;
    sizeCanvas();
    document.body.classList.add('listen-mode');
    buildTimings();
    animate();
  }

  function exitListenMode() {
    if (!listenMode) return;
    listenMode = false;
    document.body.classList.remove('listen-mode');
    cancelAnimationFrame(animFrame);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Remove active paragraph highlights
    contentEls.forEach(el => el.classList.remove('lm-active', 'lm-past'));
    // Reset accent
    document.documentElement.style.removeProperty('--accent-pulse');
  }

  // --- Animation Loop ---
  function animate() {
    if (!listenMode) return;
    animFrame = requestAnimationFrame(animate);

    // Waveform
    if (analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray);
      const w = canvas.width;
      const h = canvas.height;
      const dpr = window.devicePixelRatio;
      ctx.clearRect(0, 0, w, h);

      const barCount = analyser.frequencyBinCount;
      const barWidth = w / barCount;
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#c8f542';

      for (let i = 0; i < barCount; i++) {
        const v = dataArray[i] / 255;
        const barH = v * h;
        const x = i * barWidth;
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.3 + v * 0.5;
        ctx.fillRect(x, h - barH, barWidth - 1, barH);
      }
      ctx.globalAlpha = 1;

      // Accent breathing — avg amplitude drives subtle hue shift
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
      const pulseL = 62 + avg * 15; // base lightness 62%, up to 77%
      document.documentElement.style.setProperty('--accent-pulse', `hsl(73, 89%, ${pulseL}%)`);
    }

    // Paragraph spotlight
    if (paragraphTimings.length > 0 && audio.currentTime > 0) {
      const t = audio.currentTime;
      let activeIdx = -1;
      for (let i = 0; i < paragraphTimings.length; i++) {
        if (t >= paragraphTimings[i].start && t < paragraphTimings[i].end) {
          activeIdx = i;
          break;
        }
      }
      // If past all timings, highlight last
      if (activeIdx === -1 && t >= (paragraphTimings[paragraphTimings.length - 1]?.end || 0)) {
        activeIdx = paragraphTimings.length - 1;
      }

      contentEls.forEach((el, i) => {
        if (i === activeIdx) {
          el.classList.add('lm-active');
          el.classList.remove('lm-past');
        } else if (activeIdx > -1 && i < activeIdx) {
          el.classList.remove('lm-active');
          el.classList.add('lm-past');
        } else {
          el.classList.remove('lm-active', 'lm-past');
        }
      });

      // Auto-scroll active paragraph into view
      if (activeIdx > -1) {
        const activeEl = contentEls[activeIdx];
        const rect = activeEl.getBoundingClientRect();
        const viewH = window.innerHeight;
        if (rect.top < viewH * 0.2 || rect.bottom > viewH * 0.8) {
          activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      // Code block glow
      contentEls.forEach((el, i) => {
        if (el.tagName === 'PRE' || el.classList.contains('highlight')) {
          if (i === activeIdx) {
            el.classList.add('lm-code-glow');
          } else {
            el.classList.remove('lm-code-glow');
          }
        }
      });
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
      btn.setAttribute('aria-label', 'Pause');
      enterListenMode();
    } else {
      audio.pause();
      btn.innerHTML = playSvg;
      btn.setAttribute('aria-label', 'Play');
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
    buildTimings();
  });

  audio.addEventListener('ended', () => {
    btn.innerHTML = playSvg;
    btn.setAttribute('aria-label', 'Play');
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

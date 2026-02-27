// Minimal audio player for blog posts
// Looks for <div class="audio-player" data-src="..."> and hydrates it
(function () {
  const container = document.querySelector('.audio-player');
  if (!container || container.dataset.hydrated) return;
  container.dataset.hydrated = "1";

  const src = container.dataset.src;
  if (!src) return;

  const audio = new Audio(src);
  audio.preload = 'metadata';
  let speed = 1;

  const playSvg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><polygon points="3,1 13,8 3,15" fill="currentColor"/></svg>`;
  const pauseSvg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="4" height="14" rx="1" fill="currentColor"/><rect x="10" y="1" width="4" height="14" rx="1" fill="currentColor"/></svg>`;
  const skipBackSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/><text x="12" y="16" text-anchor="middle" font-size="8" font-family="monospace" fill="currentColor" stroke="none">15</text></svg>`;
  const skipFwdSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/><text x="12" y="16" text-anchor="middle" font-size="8" font-family="monospace" fill="currentColor" stroke="none">15</text></svg>`;

  container.innerHTML = `
    <button class="ap-play" aria-label="Play audio narration">${playSvg}</button>
    <button class="ap-skip" data-skip="-15" aria-label="Back 15s">${skipBackSvg}</button>
    <div class="ap-progress-wrap">
      <div class="ap-progress"></div>
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

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  btn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
      btn.innerHTML = pauseSvg;
      btn.setAttribute('aria-label', 'Pause');
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
    const pct = (audio.currentTime / audio.duration) * 100;
    progress.style.width = `${pct}%`;
    time.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener('loadedmetadata', () => {
    time.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('ended', () => {
    btn.innerHTML = playSvg;
    btn.setAttribute('aria-label', 'Play');
    progress.style.width = '0%';
  });

  progressWrap.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const rect = progressWrap.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
  });
})();

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

  container.innerHTML = `
    <button class="ap-play" aria-label="Play audio narration">▶</button>
    <div class="ap-progress-wrap">
      <div class="ap-progress"></div>
    </div>
    <span class="ap-time">0:00</span>
  `;

  const btn = container.querySelector('.ap-play');
  const progressWrap = container.querySelector('.ap-progress-wrap');
  const progress = container.querySelector('.ap-progress');
  const time = container.querySelector('.ap-time');

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  btn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
      btn.textContent = '⏸';
      btn.setAttribute('aria-label', 'Pause');
    } else {
      audio.pause();
      btn.textContent = '▶';
      btn.setAttribute('aria-label', 'Play');
    }
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
    btn.textContent = '▶';
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

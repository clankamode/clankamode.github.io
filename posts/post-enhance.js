/* Post page enhancements — injected via <script> at end of each post */
(() => {
  // 1. Reading progress bar
  const bar = document.createElement('div');
  Object.assign(bar.style, {
    position: 'fixed', top: '0', left: '0', height: '2px', width: '0%',
    background: 'linear-gradient(90deg, #c8f542, rgba(200, 245, 66, 0.4))',
    zIndex: '9990', transition: 'width 60ms linear',
    boxShadow: '0 0 8px rgba(200, 245, 66, 0.4)',
  });
  document.body.prepend(bar);
  const updateBar = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = h > 0 ? ((window.scrollY / h) * 100) + '%' : '0%';
  };
  window.addEventListener('scroll', updateBar, { passive: true });
  updateBar();

  // 2. Estimated reading time
  const article = document.querySelector('article') || document.querySelector('main');
  if (article) {
    const words = article.textContent?.split(/\s+/).length || 0;
    const mins = Math.max(1, Math.ceil(words / 220));
    const meta = document.querySelector('.post-meta');
    if (meta) {
      meta.innerHTML += ` &nbsp;·&nbsp; ${mins} min read`;
    }
  }

  // 3. Keyboard navigation: j/k for prev/next
  const navLinks = document.querySelectorAll('.nav a');
  const prev = navLinks[0]?.getAttribute('href');
  const next = navLinks.length > 1 ? navLinks[1]?.getAttribute('href') : null;
  document.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === 'j' && next) window.location.href = next;
    if (e.key === 'k' && prev) window.location.href = prev;
  });

  // 4. Back to top on 't'
  document.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === 't') window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

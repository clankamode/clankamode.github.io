export function initUI(): void {
  // Scroll progress bar
  (() => {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;
    const update = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = h > 0 ? ((window.scrollY / h) * 100) + '%' : '0%';
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  })();

  // Stagger work rows
  (() => {
    const workSection = document.querySelector('[aria-labelledby="work-label"]');
    if (!workSection) return;
    const workRows = workSection.querySelectorAll<HTMLElement>('.row');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('row-stagger');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    workRows.forEach((row, i) => {
      row.style.animationDelay = `${i * 0.06}s`;
      row.style.opacity = '0';
      observer.observe(row);
    });
  })();

  // Status bar date
  (() => {
    const el = document.getElementById('status-date');
    if (!el) return;
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    el.textContent = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  })();

  // Typewriter hero
  (() => {
    const twText = document.getElementById('tw-text');
    const twEm = document.getElementById('tw-em');
    const cursor = document.getElementById('tw-cursor');
    if (!twText || !twEm || !cursor) return;

    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      twText.textContent = 'I build systems';
      twEm.style.visibility = 'visible';
      cursor.classList.add('cursor--animate');
      return;
    }

    const LINE1 = 'I build systems';

    // Freeze cursor during typing
    cursor.style.animation = 'none';
    cursor.style.opacity = '1';

    let i = 0;
    function type() {
      if (i <= LINE1.length) {
        twText.textContent = LINE1.slice(0, i);
        i++;
        if (i <= LINE1.length) {
          setTimeout(type, 40);
        } else {
          // Reveal second line
          twEm.style.visibility = 'visible';
          twEm.style.opacity = '0';
          setTimeout(() => { twEm.style.opacity = '1'; }, 60);

          // Blink cursor twice, then go static
          setTimeout(() => {
            cursor.style.animation = 'cursorBlink 0.5s steps(2, start) 2';
            cursor.addEventListener('animationend', () => {
              cursor.style.animation = 'none';
              cursor.style.opacity = '1';
            }, { once: true });
          }, 400);
        }
      }
    }

    setTimeout(type, 180);
  })();

  // Scroll to top button
  (() => {
    const btn = document.getElementById('scroll-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 300);
    }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  })();

  // Section reveal on scroll
  (() => {
    const sections = document.querySelectorAll('.section-reveal');
    if (!sections.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    sections.forEach(s => observer.observe(s));
  })();
}

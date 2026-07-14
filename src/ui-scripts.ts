type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'clanka-theme';

function isTheme(value: string | null | undefined): value is Theme {
  return value === 'light' || value === 'dark';
}

function getSavedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

function setSavedTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage issues and keep in-memory state only.
  }
}

function activeTheme(): Theme {
  const attr = document.documentElement.dataset.theme;
  if (isTheme(attr)) return attr;

  const saved = getSavedTheme();
  if (saved) return saved;

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  setSavedTheme(theme);
}

export function initUI(): void {
  // Theme toggle
  (() => {
    const button = document.getElementById('theme-toggle') as HTMLButtonElement | null;
    if (!button) return;

    const setButtonState = (theme: Theme): void => {
      button.textContent = `theme: ${theme}`;
      // Pressed reflects dark mode being active (the primary "on" state of the toggle).
      button.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    };

    let theme = activeTheme();
    setTheme(theme);
    setButtonState(theme);

    button.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      setTheme(theme);
      setButtonState(theme);
    });
  })();

  // Scroll progress bar
  (() => {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;
    const update = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = h > 0 ? `${(window.scrollY / h) * 100}%` : '0%';
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  })();

  // Stagger work rows
  (() => {
    const workSection = document.querySelector('[aria-labelledby="work-label"]');
    if (!workSection) return;
    const workRows = workSection.querySelectorAll<HTMLElement>('.row');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('row-stagger');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    workRows.forEach((row, i) => {
      row.style.animationDelay = `${i * 0.06}s`;
      if (!prefersReducedMotion) {
        row.style.opacity = '0';
      }
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

    const textEl = twText;
    const emEl = twEm;
    const cursorEl = cursor;

    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      textEl.textContent = 'I build systems';
      emEl.style.visibility = 'visible';
      return;
    }

    const LINE1 = 'I build systems';

    // Freeze cursor during typing
    cursorEl.style.animation = 'none';
    cursorEl.style.opacity = '1';

    let i = 0;
    function type() {
      if (i <= LINE1.length) {
        textEl.textContent = LINE1.slice(0, i);
        i++;
        if (i <= LINE1.length) {
          setTimeout(type, 40);
        } else {
          // Reveal second line
          emEl.style.visibility = 'visible';
          emEl.style.opacity = '0';
          setTimeout(() => {
            emEl.style.opacity = '1';
          }, 60);

          // Blink cursor twice, then go static
          setTimeout(() => {
            cursorEl.style.animation = 'cursorBlink 0.5s steps(2, start) 2';
            cursorEl.addEventListener(
              'animationend',
              () => {
                cursorEl.style.animation = 'none';
                cursorEl.style.opacity = '1';
              },
              { once: true },
            );
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
    window.addEventListener(
      'scroll',
      () => {
        btn.classList.toggle('visible', window.scrollY > 300);
      },
      { passive: true },
    );
    btn.addEventListener('click', () => {
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? ('instant' as ScrollBehavior)
        : 'smooth';
      window.scrollTo({ top: 0, behavior });
    });
  })();

  // Section reveal on scroll
  (() => {
    const sections = document.querySelectorAll('.section-reveal');
    if (!sections.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sections.forEach((s) => s.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    sections.forEach((s) => observer.observe(s));
  })();
}

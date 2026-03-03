type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'clanka-theme';

function isTheme(value: string | null): value is Theme {
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
  if (isTheme(attr ?? null)) return attr;

  const saved = getSavedTheme();
  if (saved) return saved;

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  setSavedTheme(theme);
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return target.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function initUI(): void {
  // Theme toggle
  (() => {
    const button = document.getElementById('theme-toggle') as HTMLButtonElement | null;
    if (!button) return;

    const setButtonState = (theme: Theme): void => {
      button.textContent = `theme: ${theme}`;
      button.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
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
          setTimeout(() => {
            twEm.style.opacity = '1';
          }, 60);

          // Blink cursor twice, then go static
          setTimeout(() => {
            cursor.style.animation = 'cursorBlink 0.5s steps(2, start) 2';
            cursor.addEventListener(
              'animationend',
              () => {
                cursor.style.animation = 'none';
                cursor.style.opacity = '1';
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
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  })();

  // Search/filter logs + keyboard navigation
  (() => {
    type SearchItem = { row: HTMLElement; link: HTMLAnchorElement; text: string };

    const input = document.getElementById('posts-search-input') as HTMLInputElement | null;
    const countEl = document.getElementById('posts-search-count');
    const featured = document.querySelector('.logs-section .featured-log') as HTMLAnchorElement | null;
    const rows = Array.from(document.querySelectorAll<HTMLElement>('#logs-list .row'));

    if (!input || !countEl || rows.length === 0) return;

    const items: SearchItem[] = rows
      .map((row) => {
        const link = row.querySelector('.row-name a') as HTMLAnchorElement | null;
        if (!link) return null;

        const title = link.textContent ?? '';
        const excerpt = row.querySelector('.row-excerpt')?.textContent ?? '';
        const date = row.querySelector('.row-meta')?.textContent ?? '';

        return {
          row,
          link,
          text: `${title} ${excerpt} ${date}`.toLowerCase(),
        };
      })
      .filter((item): item is SearchItem => item !== null);

    const featuredText = (featured?.textContent ?? '').toLowerCase();
    let visibleItems = items;

    const updateCount = (count: number, query: string): void => {
      if (!query) {
        countEl.textContent = `${count} logs`;
        return;
      }

      if (count === 0) {
        countEl.textContent = 'no matches';
        return;
      }

      countEl.textContent = `${count} match${count === 1 ? '' : 'es'}`;
    };

    const applyFilter = (): void => {
      const query = input.value.trim().toLowerCase();
      const filtered: SearchItem[] = [];

      let featuredVisible = false;
      if (featured) {
        featuredVisible = query.length === 0 || featuredText.includes(query);
        featured.hidden = !featuredVisible;
      }

      items.forEach((item) => {
        const visible = query.length === 0 || item.text.includes(query);
        item.row.hidden = !visible;
        item.link.tabIndex = visible ? 0 : -1;
        if (visible) {
          filtered.push(item);
        }
      });

      visibleItems = filtered;
      updateCount(visibleItems.length + (featuredVisible ? 1 : 0), query);
    };

    const focusVisibleByOffset = (step: number): void => {
      if (!visibleItems.length) return;

      const links = visibleItems.map((item) => item.link);
      const active = document.activeElement;
      const currentIndex = active instanceof HTMLAnchorElement ? links.indexOf(active) : -1;
      const startIndex = step > 0 ? -1 : links.length;
      const nextIndex = Math.max(0, Math.min(links.length - 1, (currentIndex === -1 ? startIndex : currentIndex) + step));
      links[nextIndex]?.focus();
    };

    input.addEventListener('input', applyFilter);

    input.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        focusVisibleByOffset(1);
      } else if (event.key === 'Escape') {
        if (input.value) {
          input.value = '';
          applyFilter();
        } else {
          input.blur();
        }
      }
    });

    rows.forEach((row) => {
      const link = row.querySelector('.row-name a') as HTMLAnchorElement | null;
      if (!link) return;

      link.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          focusVisibleByOffset(1);
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          const links = visibleItems.map((item) => item.link);
          const index = links.indexOf(link);
          if (index <= 0) {
            input.focus();
            return;
          }
          links[index - 1]?.focus();
        }
      });
    });

    window.addEventListener('keydown', (event) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      input.focus();
      input.select();
    });

    applyFilter();
  })();

  // Section reveal on scroll
  (() => {
    const sections = document.querySelectorAll('.section-reveal');
    if (!sections.length) return;
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

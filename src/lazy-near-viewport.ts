/** Pixels below the viewport to treat as "near enough" to start deferred work. */
const DEFAULT_PREFETCH_PX = 900;

/**
 * Runs `fn` once when `target` is near the viewport (or immediately if it already is).
 */
export function runWhenNearViewport(
  target: string | Element | null | undefined,
  fn: () => void,
  prefetchPx = DEFAULT_PREFETCH_PX,
): void {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;

  const nearEnough = (): boolean => {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    return r.top < vh + prefetchPx && r.bottom > -prefetchPx;
  };

  if (nearEnough()) {
    fn();
    return;
  }

  if (typeof IntersectionObserver === 'undefined') {
    fn();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      fn();
    },
    { root: null, rootMargin: `0px 0px ${prefetchPx}px 0px`, threshold: 0 },
  );
  observer.observe(el);
}

/** Pixels below the viewport to treat as "near enough" to start deferred work. */
const DEFAULT_PREFETCH_PX = 900;

const scheduled = new WeakSet<Element>();

export type NearViewportDisconnect = () => void;

/**
 * Runs `fn` once when `target` is near the viewport (or immediately if it already is).
 * Returns a disconnect function to cancel pending observation.
 */
export function runWhenNearViewport(
  target: string | Element | null | undefined,
  fn: () => void,
  prefetchPx = DEFAULT_PREFETCH_PX,
): NearViewportDisconnect {
  const noop = (): void => {};

  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return noop;

  if (scheduled.has(el)) return noop;
  scheduled.add(el);

  const nearEnough = (): boolean => {
    const r = el.getBoundingClientRect();
    if (r.height <= 0 && r.width <= 0) return false;
    const vh = window.innerHeight;
    return r.top < vh + prefetchPx && r.bottom > -prefetchPx;
  };

  if (nearEnough()) {
    fn();
    return noop;
  }

  if (typeof IntersectionObserver === 'undefined') {
    fn();
    return noop;
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

  return () => observer.disconnect();
}
// Workaround for Node runtime where globalThis.localStorage may exist without Web Storage methods.
// This breaks code that checks `typeof localStorage !== 'undefined' && localStorage.getItem(...)`.
if (typeof globalThis.localStorage !== 'undefined') {
  const hasGetItem = typeof globalThis.localStorage?.getItem === 'function';
  const hasSetItem = typeof globalThis.localStorage?.setItem === 'function';
  if (!hasGetItem || !hasSetItem) {
    try {
      delete globalThis.localStorage;
    } catch {
      // no-op
    }
  }
}

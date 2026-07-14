/** Bounded retry with linear backoff for one-shot live widget loads. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = typeof globalThis.setTimeout === 'function' ? globalThis.setTimeout : setTimeout;
    timer(resolve, ms);
  });
}

export async function withRetries<T>(
  fn: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 200,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) {
        await delay(baseDelayMs * (attempt + 1));
      }
    }
  }

  throw lastError;
}

export async function withResultRetries<T extends { ok: boolean }>(
  fn: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 200,
): Promise<T> {
  let last: T | undefined;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    last = await fn();
    if (last.ok) return last;
    if (attempt < attempts - 1) {
      await delay(baseDelayMs * (attempt + 1));
    }
  }

  return last as T;
}

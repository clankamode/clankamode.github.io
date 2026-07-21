/** Bounded retry with linear backoff for one-shot live widget loads. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = typeof globalThis.setTimeout === 'function' ? globalThis.setTimeout : setTimeout;
    timer(resolve, ms);
  });
}

function normalizeAttempts(attempts: number): number {
  const n = Math.floor(Number(attempts));
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export async function withRetries<T>(
  fn: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 200,
): Promise<T> {
  const maxAttempts = normalizeAttempts(attempts);
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts - 1) {
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
  const maxAttempts = normalizeAttempts(attempts);
  let last: T | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      last = await fn();
      if (last.ok) return last;
    } catch (error) {
      // Treat throws like a failed attempt when possible.
      if (attempt >= maxAttempts - 1) throw error;
      last = undefined;
    }
    if (attempt < maxAttempts - 1) {
      await delay(baseDelayMs * (attempt + 1));
    }
  }

  if (last === undefined) {
    throw new Error('withResultRetries exhausted attempts without a result');
  }
  return last;
}

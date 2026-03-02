const NPM_DOWNLOAD_ENDPOINT =
  'https://api.npmjs.org/downloads/point/last-month/@clankamode%2Fci-failure-triager';
const DOWNLOAD_TIMEOUT_MS = 5000;

interface NpmDownloads {
  downloads?: number;
}

export async function loadNpmBadge(): Promise<void> {
  const badge = document.getElementById('npm-ci-triage');
  if (!badge) return;
  let timeoutId = 0;

  try {
    const controller = new AbortController();
    timeoutId = window.setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

    const response = await fetch(NPM_DOWNLOAD_ENDPOINT, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`NPM API ${response.status}`);

    const data = (await response.json()) as NpmDownloads;
    const downloads = typeof data.downloads === 'number' ? data.downloads : null;

    if (downloads === null) throw new Error('Malformed downloads payload');

    badge.textContent = `${downloads} dl/mo`;
  } catch {
    // Leave fallback text as-is — graceful degradation
  } finally {
    window.clearTimeout(timeoutId);
  }
}

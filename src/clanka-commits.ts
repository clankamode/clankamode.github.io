const GITHUB_EVENTS_ENDPOINT =
  'https://clanka-api.clankamode.workers.dev/github/events';
const COMMIT_TIMEOUT_MS = 5000;

const COMMIT_TYPES = ['feat', 'fix', 'chore', 'docs', 'test', 'refactor', 'ci', 'build', 'style'] as const;

interface ApiEvent {
  type: string;
  repo: string;
  message: string;
  timestamp: string;
}

interface GithubEventsResponse {
  events: ApiEvent[];
}

type GithubEventsPayload = GithubEventsResponse | ApiEvent[];

function relativeTime(isoString: string): string {
  const then = new Date(isoString).getTime();
  if (Number.isNaN(then)) return 'unknown';

  const diffMs = Date.now() - then;
  if (diffMs < 0) return 'just now';

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHr > 0) return `${diffHr}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return 'just now';
}

function truncateMessage(message: string, maxLen = 72): string {
  const trimmed = message.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}

function stripRepoPrefix(repoName: string): string {
  return repoName.replace(/^clankamode\//, '');
}

function detectCommitType(message: string): string {
  const trimmed = message.trim().toLowerCase();
  const match = trimmed.match(/^([a-z]+)/);
  const tag = match ? match[1] : '';

  return COMMIT_TYPES.includes(tag as (typeof COMMIT_TYPES)[number]) ? tag : 'push';
}

function parseEvents(payload: GithubEventsPayload): ApiEvent[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload.events) ? payload.events : [];
}

function setFeedText(message: string): void {
  const feed = document.getElementById('commit-feed');
  if (!feed) return;
  feed.textContent = '';
  const status = document.createElement('span');
  status.className = 'commit-feed-loading';
  status.textContent = message;
  feed.append(status);
}

let commitFeedLoadInFlight = false;

export async function loadCommitFeed(): Promise<void> {
  const commitFeed = document.getElementById('commit-feed');
  if (!commitFeed || commitFeedLoadInFlight) return;

  commitFeedLoadInFlight = true;

  try {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), COMMIT_TIMEOUT_MS);

    try {
      const response = await fetch(GITHUB_EVENTS_ENDPOINT, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`GitHub events API ${response.status}`);

      const data = (await response.json()) as GithubEventsPayload;
      const events = parseEvents(data);

      if (!Array.isArray(events) || events.length === 0) {
        setFeedText('// no recent activity');
        return;
      }

      commitFeed.textContent = '';
      events.slice(0, 8).forEach((event) => {
        const repo = stripRepoPrefix(event.repo || 'unknown');
        const message = event.message || '';
        const commitType = detectCommitType(message);
        const tagClass = COMMIT_TYPES.includes(commitType as (typeof COMMIT_TYPES)[number]) ? commitType : 'push';

        const item = document.createElement('div');
        item.className = 'commit-item';

        const repoEl = document.createElement('a');
        repoEl.className = 'commit-repo';
        repoEl.href = `https://github.com/${event.repo || 'unknown'}`;
        repoEl.rel = 'noopener';
        repoEl.textContent = repo;

        const tagEl = document.createElement('span');
        tagEl.className = `commit-tag commit-tag--${tagClass}`;
        tagEl.textContent = commitType;

        const messageEl = document.createElement('span');
        messageEl.className = 'commit-message';
        messageEl.textContent = message ? truncateMessage(message) : '—';

        const timeEl = document.createElement('span');
        timeEl.className = 'commit-time';
        timeEl.textContent = event.timestamp ? relativeTime(event.timestamp) : 'unknown';

        item.append(repoEl, tagEl, messageEl, timeEl);
        commitFeed.append(item);
      });
    } finally {
      window.clearTimeout(timeoutId);
    }
  } catch {
    setFeedText('// activity unavailable');
  } finally {
    commitFeedLoadInFlight = false;
  }
}

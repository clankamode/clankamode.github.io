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

function relativeTime(isoString: string): string {
  const then = new Date(isoString).getTime();
  const diffMs = Date.now() - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHr > 0) return `${diffHr}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return 'just now';
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


function setFeedText(message: string): void {
  const feed = document.getElementById('commit-feed');
  if (!feed) return;
  feed.textContent = '';
  const status = document.createElement('span');
  status.className = 'commit-feed-loading';
  status.textContent = message;
  feed.append(status);
}

export async function loadCommitFeed(): Promise<void> {
  const commitFeed = document.getElementById('commit-feed');
  if (!commitFeed) return;

  try {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), COMMIT_TIMEOUT_MS);

    const response = await fetch(GITHUB_EVENTS_ENDPOINT, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    window.clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`GitHub events API ${response.status}`);

    const data = (await response.json()) as GithubEventsResponse;
    const events = data.events;

    if (!Array.isArray(events) || events.length === 0) {
      setFeedText('// no activity data');
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

      const repoEl = document.createElement('span');
      repoEl.className = 'commit-repo';
      repoEl.textContent = repo;

      const tagEl = document.createElement('span');
      tagEl.className = `commit-tag commit-tag--${tagClass}`;
      tagEl.textContent = commitType;

      const timeEl = document.createElement('span');
      timeEl.className = 'commit-time';
      timeEl.textContent = event.timestamp ? relativeTime(event.timestamp) : 'just now';

      item.append(repoEl, tagEl, timeEl);
      commitFeed.append(item);
    });
  } catch {
    setFeedText('// no activity data');
  }
}

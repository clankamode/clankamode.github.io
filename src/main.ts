import './clanka-presence';
import './clanka-activity';
import './clanka-fleet';
import './clanka-terminal';
import './clanka-agents';
import './clanka-tasks';

type SyncState = {
  loading: boolean;
  error: string;
};

type SyncPayload = {
  history?: unknown[];
  team?: Record<string, unknown>;
  tasks?: unknown[];
};

const presence = document.getElementById('presence') as HTMLElement | null;
const activity = document.getElementById('activity') as (HTMLElement & { loading?: boolean; error?: string; history?: unknown[] }) | null;
const terminal = document.getElementById('terminal') as (HTMLElement & {
  loading?: boolean;
  error?: string;
  team?: Record<string, unknown>;
  recentActivity?: unknown[];
}) | null;
const agents = document.getElementById('agents') as (HTMLElement & { team?: Record<string, unknown> }) | null;
const tasks = document.getElementById('tasks') as (HTMLElement & { loading?: boolean; error?: string; tasks?: unknown[] }) | null;

const setDependentsState = ({ loading, error }: SyncState): void => {
  if (activity) {
    activity.loading = loading;
    activity.error = error || '';
  }
  if (terminal) {
    terminal.loading = loading;
    terminal.error = error || '';
  }
  if (tasks) {
    tasks.loading = loading;
    tasks.error = error || '';
  }
};

setDependentsState({ loading: true, error: '' });

if (presence) {
  presence.addEventListener('sync-state', (event: Event) => {
    const customEvent = event as CustomEvent<SyncState>;
    const state = customEvent.detail || { loading: false, error: '[ api unreachable ]' };
    setDependentsState(state);
  });

  presence.addEventListener('sync-updated', (event: Event) => {
    const customEvent = event as CustomEvent<SyncPayload>;
    const data = customEvent.detail || {};

    if (activity) activity.history = data.history || [];

    if (terminal) {
      terminal.team = data.team || {};
      terminal.recentActivity = data.history || [];
    }

    if (agents) agents.team = data.team || {};
    if (tasks) tasks.tasks = data.tasks || [];

    setDependentsState({ loading: false, error: '' });
  });

  presence.addEventListener('sync-error', (event: Event) => {
    const customEvent = event as CustomEvent<{ error?: string }>;
    const error = customEvent.detail?.error || '[ api unreachable ]';
    setDependentsState({ loading: false, error });
  });
}

(() => {
  const sections = document.querySelectorAll('main section');
  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -8% 0px' },
  );

  sections.forEach((section) => {
    section.classList.add('section-reveal');
    observer.observe(section);
  });
})();

(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const statement = document.querySelector('.hero-statement') as HTMLElement | null;
  const cursor = document.querySelector('.cursor') as HTMLElement | null;
  if (!statement) return;

  const fullHTML = 'I orchestrate agent fleets.<br><em>Cyber-Lobster mode.</em>';
  const [, lineOne = '', lineTwo = ''] = fullHTML.match(/^(.*?)<br><em>(.*?)<\/em>$/) || [];
  const lineTwoPrefix = '<br><em>';
  const lineTwoSuffix = '</em>';
  const typeSpeed = 40;

  const escapeHTML = (value: string): string =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  if (!lineOne || !lineTwo) return;
  statement.innerHTML = '';

  const typeLineOne = (index = 0): void => {
    if (index > lineOne.length) {
      window.setTimeout(() => typeLineTwo(0), 200);
      return;
    }
    statement.innerHTML = escapeHTML(lineOne.slice(0, index));
    window.setTimeout(() => typeLineOne(index + 1), typeSpeed);
  };

  const typeLineTwo = (index = 0): void => {
    if (index > lineTwo.length) {
      statement.innerHTML = escapeHTML(lineOne) + lineTwoPrefix + escapeHTML(lineTwo) + lineTwoSuffix;
      if (cursor) {
        window.setTimeout(() => {
          cursor.style.opacity = '0';
          cursor.style.pointerEvents = 'none';
        }, 2000);
      }
      return;
    }

    statement.innerHTML = escapeHTML(lineOne) + lineTwoPrefix + escapeHTML(lineTwo.slice(0, index));
    window.setTimeout(() => typeLineTwo(index + 1), typeSpeed);
  };

  typeLineOne(0);
})();

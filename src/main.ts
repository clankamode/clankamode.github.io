import './styles.css';
import { initUI } from './ui-scripts';
import { loadLiveStats } from './clanka-stats';
import { loadNpmBadge } from './clanka-npm';
import { loadCommitFeed } from './clanka-commits';
import './clanka-presence';
import './clanka-fleet';
import './clanka-terminal';
import './clanka-agents';
import './clanka-tasks';
import './clanka-cmdk';
import { renderHomepageContent, renderHomepageStats } from './homepage-content';
import { runWhenNearViewport } from './lazy-near-viewport';

type SyncPayload = {
  team?: Record<string, unknown>;
  tasks?: unknown[];
  agents_active?: number;
};

const presence = document.getElementById('presence') as HTMLElement | null;
const tasks = document.getElementById('tasks') as (HTMLElement & { loading?: boolean; error?: string; tasks?: unknown[] }) | null;
const agents = document.getElementById('agents') as (HTMLElement & {
  loading?: boolean;
  error?: string;
  team?: Record<string, unknown>;
}) | null;

const setText = (id: string, value: string): void => {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
};

const ACTIVE_TEAM_STATES = new Set(['active', 'online', 'busy', 'running', 'healthy', 'up']);

const countActiveFromTeam = (team?: Record<string, unknown>): number | null => {
  if (!team || typeof team !== 'object') return null;

  const members = Object.values(team).filter((value): value is Record<string, unknown> => value !== null && typeof value === 'object');
  if (!members.length) return null;

  let active = 0;
  let withState = 0;

  members.forEach((member) => {
    const state = String(member.status ?? member.state ?? member.presence ?? '').trim().toLowerCase();
    if (!state) return;
    withState += 1;
    if (ACTIVE_TEAM_STATES.has(state)) {
      active += 1;
    }
  });

  // Only count members with an explicit status — missing state must not inflate "active".
  if (withState === 0) return null;
  return active;
};

const resolveActiveAgents = (data: SyncPayload): number | null => {
  if (typeof data.agents_active === 'number' && Number.isFinite(data.agents_active) && data.agents_active >= 0) {
    return Math.floor(data.agents_active);
  }

  if ('team' in data) {
    return countActiveFromTeam(data.team);
  }

  return null;
};

if (presence) {
  presence.addEventListener('sync-updated', (event: Event) => {
    const customEvent = event as CustomEvent<SyncPayload>;
    const data = customEvent.detail || {};

    // Always clear latched errors on any successful presence sync.
    if (tasks) {
      tasks.loading = false;
      tasks.error = '';
      if ('tasks' in data) {
        tasks.tasks = Array.isArray(data.tasks) ? data.tasks : [];
      }
    }
    if (agents) {
      agents.loading = false;
      agents.error = '';
      if ('team' in data) {
        agents.team = data.team && typeof data.team === 'object' ? data.team : {};
      }
    }

    const activeAgents = resolveActiveAgents(data);
    if (activeAgents !== null) {
      setText('stat-active-agents', `agents: ${activeAgents} active`);
    } else {
      const el = document.getElementById('stat-active-agents');
      if (el?.textContent === 'agents: offline') {
        setText('stat-active-agents', 'agents: —');
      }
    }
  });

  presence.addEventListener('sync-error', (event: Event) => {
    const hadSync = Boolean((event as CustomEvent<{ hadSync?: boolean }>).detail?.hadSync);

    // After a successful sync, keep last-good boards visible through transient blips.
    if (hadSync) {
      if (agents) agents.loading = false;
      if (tasks) tasks.loading = false;
      return;
    }

    if (agents) {
      agents.loading = false;
      agents.error = '[ api unreachable ]';
    }
    if (tasks) {
      tasks.loading = false;
      tasks.error = '[ api unreachable ]';
    }
    setText('stat-active-agents', 'agents: offline');
  });
}

initUI();
void renderHomepageStats();
runWhenNearViewport('.logs-section', () => void renderHomepageContent());
void loadLiveStats();
void loadNpmBadge();
runWhenNearViewport('[aria-labelledby="activity-label"]', () => void loadCommitFeed());
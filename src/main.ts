import './styles.css';
import { initUI } from './ui-scripts';
import { loadLiveStats } from './clanka-stats';
import { loadNpmBadge } from './clanka-npm';
import { loadCommitFeed } from './clanka-commits';
import './clanka-presence';
import './clanka-activity';
import './clanka-fleet';
import './clanka-terminal';
import './clanka-agents';
import './clanka-tasks';
import './clanka-cmdk';
import { renderHomepageContent } from './homepage-content';

type SyncState = {
  loading: boolean;
  error: string;
};

type SyncPayload = {
  history?: unknown[];
  team?: Record<string, unknown>;
  tasks?: unknown[];
  agents_active?: number;
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

  if (withState > 0) return active;
  return members.length;
};

const resolveActiveAgents = (data: SyncPayload): number | null => {
  if (typeof data.agents_active === 'number' && Number.isFinite(data.agents_active) && data.agents_active >= 0) {
    return Math.floor(data.agents_active);
  }

  return countActiveFromTeam(data.team);
};

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

    const activeAgents = resolveActiveAgents(data);
    if (activeAgents !== null) {
      setText('stat-active-agents', `agents: ${activeAgents} active`);
    }

    setDependentsState({ loading: false, error: '' });
  });

  presence.addEventListener('sync-error', (event: Event) => {
    const customEvent = event as CustomEvent<{ error?: string }>;
    const error = customEvent.detail?.error || '[ api unreachable ]';
    setText('stat-active-agents', 'agents: offline');
    setDependentsState({ loading: false, error });
  });
}

initUI();
void renderHomepageContent();
void loadLiveStats();
void loadNpmBadge();
void loadCommitFeed();

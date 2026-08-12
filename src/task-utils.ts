export type TaskItem = {
  status?: string;
  title?: string;
  assignee?: string;
  priority?: string | number;
};

export type TaskDisplay = {
  statusClass: 'todo' | 'doing' | 'done' | 'blocked';
  statusLabel: string;
  title: string;
  assignee: string;
  priority: string;
};

export const TASK_SKELETON_CARD_COUNT = 3;

export function normalizeTaskStatus(value: unknown): TaskDisplay['statusClass'] {
  const raw = String(value ?? 'todo')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  switch (raw) {
    case 'doing':
    case 'in_progress':
    case 'wip':
    case 'active':
    case 'running':
      return 'doing';
    case 'done':
    case 'complete':
    case 'completed':
    case 'finished':
      return 'done';
    case 'blocked':
    case 'waiting':
    case 'on_hold':
      return 'blocked';
    case 'todo':
    case 'pending':
    case 'backlog':
    case '':
      return 'todo';
    default:
      return 'todo';
  }
}

const STATUS_LABELS: Record<TaskDisplay['statusClass'], string> = {
  todo: 'TODO',
  doing: 'DOING',
  done: 'DONE',
  blocked: 'BLOCKED',
};

/** Format priority without inventing a P-prefix on already-prefixed or non-numeric values. */
export function formatTaskPriority(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `P${Math.trunc(value)}`;
  }
  if (typeof value !== 'string') return '?';
  const s = value.trim();
  if (!s) return '?';
  const stripped = /^p\s*/i.test(s) ? s.replace(/^p\s*/i, '') : s;
  if (/^\d+$/.test(stripped)) return `P${stripped}`;
  // Non-numeric priorities (high/low) render as-is — never Phigh / PP1.
  return s;
}

function stringifyTaskValue(value: unknown, fallback: string): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string') {
    const s = value.trim();
    return s.length > 0 ? s : fallback;
  }
  // Objects/arrays/bools must not render as "[object Object]".
  return fallback;
}

const FALLBACK_TASK_DISPLAY: TaskDisplay = {
  statusClass: 'todo',
  statusLabel: 'TODO',
  title: 'untitled',
  assignee: 'unassigned',
  priority: '?',
};

export function isTaskItem(value: unknown): value is TaskItem {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Keep only plain task objects from a /now tasks array. */
export function normalizeTasks(value: unknown): TaskItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isTaskItem);
}

export function getTaskDisplay(task: TaskItem | null | undefined): TaskDisplay {
  if (task == null || !isTaskItem(task)) {
    // Fresh object so callers cannot mutate a shared singleton.
    return { ...FALLBACK_TASK_DISPLAY };
  }

  const statusClass = normalizeTaskStatus(task.status);
  return {
    statusClass,
    statusLabel: STATUS_LABELS[statusClass],
    title: stringifyTaskValue(task.title, 'untitled'),
    assignee: stringifyTaskValue(task.assignee, 'unassigned'),
    priority: formatTaskPriority(task.priority),
  };
}

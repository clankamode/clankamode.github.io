export type TaskItem = {
  status?: string;
  title?: string;
  assignee?: string;
  priority?: string | number;
};

export type TaskDisplay = {
  statusClass: 'todo' | 'doing' | 'done';
  statusLabel: string;
  title: string;
  assignee: string;
  priority: string;
};

export const TASK_SKELETON_CARD_COUNT = 3;

export function normalizeTaskStatus(value: unknown): TaskDisplay['statusClass'] {
  switch (String(value ?? 'todo').trim().toLowerCase()) {
    case 'doing':
      return 'doing';
    case 'done':
      return 'done';
    default:
      return 'todo';
  }
}

function stringifyTaskValue(value: string | number | undefined, fallback: string): string {
  if (value === undefined || value === null) return fallback;
  const s = String(value).trim();
  return s.length > 0 ? s : fallback;
}

const FALLBACK_TASK_DISPLAY: TaskDisplay = {
  statusClass: 'todo',
  statusLabel: 'TODO',
  title: 'untitled',
  assignee: 'unassigned',
  priority: '?',
};

export function getTaskDisplay(task: TaskItem | null | undefined): TaskDisplay {
  if (task == null) {
    // Fresh object so callers cannot mutate a shared singleton.
    return { ...FALLBACK_TASK_DISPLAY };
  }

  return {
    statusClass: normalizeTaskStatus(task.status),
    statusLabel: stringifyTaskValue(task.status, 'TODO'),
    title: stringifyTaskValue(task.title, 'untitled'),
    assignee: stringifyTaskValue(task.assignee, 'unassigned'),
    priority: stringifyTaskValue(task.priority, '?'),
  };
}

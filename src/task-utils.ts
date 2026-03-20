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

export function normalizeTaskStatus(value: string | undefined): TaskDisplay['statusClass'] {
  switch ((value ?? 'todo').trim().toLowerCase()) {
    case 'doing':
      return 'doing';
    case 'done':
      return 'done';
    default:
      return 'todo';
  }
}

function stringifyTaskValue(value: string | number | undefined, fallback: string): string {
  return String(value ?? fallback);
}

export function getTaskDisplay(task: TaskItem): TaskDisplay {
  return {
    statusClass: normalizeTaskStatus(task.status),
    statusLabel: stringifyTaskValue(task.status, 'TODO'),
    title: stringifyTaskValue(task.title, 'untitled'),
    assignee: stringifyTaskValue(task.assignee, 'unassigned'),
    priority: stringifyTaskValue(task.priority, '?'),
  };
}

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

type TaskItem = {
  status?: string;
  title?: string;
  assignee?: string;
  priority?: string | number;
};

@customElement('clanka-tasks')
export class ClankaTasks extends LitElement {
  @property({ type: Array }) tasks: TaskItem[] = [];
  @property({ type: Boolean }) loading = true;
  @property({ type: String }) error = '';

  static styles = css`
    :host {
      display: block;
      margin-bottom: 64px;
    }
    .sec-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .sec-label {
      font-size: 10px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--muted, #6b6b78);
    }
    .sec-line {
      flex: 1;
      height: 1px;
      background: var(--border, #1e1e22);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-top: 24px;
    }
    .task-card {
      background: var(--surface, #0e0e10);
      border: 1px solid var(--border, #1e1e22);
      padding: 16px;
      position: relative;
      min-height: 92px;
    }
    .task-status {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 8px;
    }
    .status-todo { color: var(--muted, #6b6b78); }
    .status-doing { color: var(--accent, #c8f542); }
    .status-done { color: #42f59e; opacity: 0.6; }
    .task-title {
      font-size: 13px;
      color: var(--bright, #f0f0f8);
      font-weight: bold;
      margin-bottom: 8px;
    }
    .task-meta {
      font-size: 10px;
      color: var(--dim, #3a3a42);
      display: flex;
      justify-content: space-between;
    }
    .fallback {
      font-size: 12px;
      color: var(--muted, #6b6b78);
      border: 1px solid var(--border, #1e1e22);
      background: var(--surface, #0e0e10);
      padding: 12px 16px;
    }
    .loading {
      color: var(--accent, #c8f542);
      animation: blink 1s steps(2, start) infinite;
    }
    .skeleton {
      height: 11px;
      border-radius: 2px;
      background: linear-gradient(
        90deg,
        color-mix(in srgb, var(--surface, #0e0e10) 88%, var(--border, #1e1e22) 12%) 0%,
        color-mix(in srgb, var(--surface, #0e0e10) 70%, var(--accent, #c8f542) 30%) 50%,
        color-mix(in srgb, var(--surface, #0e0e10) 88%, var(--border, #1e1e22) 12%) 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.8s linear infinite;
    }
    .skeleton.status { width: 88px; margin-bottom: 8px; }
    .skeleton.title { width: 75%; margin-bottom: 10px; }
    .skeleton.meta { width: 60%; }
    :host(:focus-visible) {
      outline: 1px solid var(--accent, #c8f542);
      outline-offset: 4px;
    }
    @keyframes shimmer {
      from { background-position: 200% 0; }
      to { background-position: -200% 0; }
    }
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0.4; }
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'region');
    this.setAttribute('aria-label', 'Task board');
    if (!this.hasAttribute('tabindex')) {
      this.tabIndex = 0;
    }
  }

  private normalizeStatus(value: string | undefined): string {
    const status = (value ?? 'todo').toLowerCase();
    return ['todo', 'doing', 'done'].includes(status) ? status : 'todo';
  }

  render() {
    return html`
      <div class="sec-header">
        <span class="sec-label">tasks_board</span>
        <div class="sec-line"></div>
      </div>

      ${this.loading
        ? html`
            <div class="fallback"><span class="loading">[ loading... ]</span></div>
            <div class="grid">
              ${Array.from({ length: 3 }).map(
                () => html`<div class="task-card" aria-hidden="true">
                  <div class="skeleton status"></div>
                  <div class="skeleton title"></div>
                  <div class="skeleton meta"></div>
                </div>`,
              )}
            </div>
          `
        : this.error
          ? html`<div class="fallback">${this.error}</div>`
          : this.tasks.length === 0
            ? html`<div class="fallback">[ no tasks ]</div>`
            : html`
                <div class="grid" role="list">
                  ${this.tasks.map(
                    (task) => html`
                      <article class="task-card" role="listitem">
                        <div class="task-status status-${this.normalizeStatus(task.status)}">${(task.status ?? 'TODO').toString()}</div>
                        <div class="task-title">${(task.title ?? 'untitled').toString()}</div>
                        <div class="task-meta">
                          <span>@${(task.assignee ?? 'unassigned').toString()}</span>
                          <span>P${(task.priority ?? '?').toString()}</span>
                        </div>
                      </article>
                    `,
                  )}
                </div>
              `}
    `;
  }
}

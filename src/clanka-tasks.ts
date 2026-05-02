import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { getTaskDisplay, TASK_SKELETON_CARD_COUNT, type TaskItem } from './task-utils';

@customElement('clanka-tasks')
export class ClankaTasks extends LitElement {
  @property({ type: Array }) tasks: TaskItem[] = [];
  @property({ type: Boolean }) loading = true;
  @property({ type: String }) error = '';

  static styles = css`
    :host {
      display: block;
      margin-bottom: 64px;
      border-radius: 2px;
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
      color: var(--muted, #717986);
    }
    .sec-line {
      flex: 1;
      height: 1px;
      background: var(--border, #26292e);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-top: 24px;
    }
    .task-card {
      background: var(--surface, #131417);
      border: 1px solid var(--border, #26292e);
      padding: 16px;
      position: relative;
      min-height: 92px;
      border-radius: 2px;
    }
    .task-status {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 8px;
    }
    .status-todo { color: var(--muted, #717986); }
    .status-doing { color: var(--accent, #c8f542); }
    .status-done { color: var(--bright, #f0f0f8); opacity: 0.85; }
    .task-title {
      font-size: 13px;
      color: var(--bright, #f0f0f8);
      font-weight: bold;
      margin-bottom: 8px;
    }
    .task-meta {
      font-size: 10px;
      color: var(--dim, #505661);
      display: flex;
      justify-content: space-between;
    }
    .fallback {
      font-size: 12px;
      color: var(--muted, #717986);
      border: 1px solid var(--border, #26292e);
      background: var(--surface, #131417);
      padding: 12px 16px;
      border-radius: 2px;
    }
    .loading {
      color: var(--muted, #717986);
    }
    .skeleton {
      height: 11px;
      border-radius: 2px;
      background: var(--attention-panel, var(--surface, #131417));
      border: 1px solid var(--border, #26292e);
    }
    .skeleton.status { width: 88px; margin-bottom: 8px; }
    .skeleton.title { width: 75%; margin-bottom: 10px; }
    .skeleton.meta { width: 60%; }
    :host(:focus-visible) {
      outline: 1px solid var(--accent, #c8f542);
      outline-offset: 4px;
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

  render() {
    return html`
      <div class="sec-header">
        <span class="sec-label">tasks_board</span>
        <div class="sec-line"></div>
      </div>

      ${this.loading
        ? html`
            <div class="fallback"><span class="loading">[ loading tasks ]</span></div>
            <div class="grid">
              ${Array.from({ length: TASK_SKELETON_CARD_COUNT }).map(
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
            ? html`<div class="fallback">[ no tasks scheduled ]</div>`
            : html`
                <div class="grid" role="list">
                  ${this.tasks.map(
                    (task) => {
                      const display = getTaskDisplay(task);
                      return html`
                      <article class="task-card" role="listitem">
                        <div class="task-status status-${display.statusClass}">${display.statusLabel}</div>
                        <div class="task-title">${display.title}</div>
                        <div class="task-meta">
                          <span>@${display.assignee}</span>
                          <span>P${display.priority}</span>
                        </div>
                      </article>
                    `;
                    },
                  )}
                </div>
              `}
    `;
  }
}

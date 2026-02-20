import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('clanka-tasks')
export class ClankaTasks extends LitElement {
  @property({ type: Array }) tasks: any[] = [];

  static styles = css`
    :host {
      display: block;
      margin-bottom: 64px;
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
  `;

  render() {
    if (!this.tasks || this.tasks.length === 0) return html``;

    return html`
      <div class="sec-header">
        <span class="sec-label">tasks_board</span>
        <div class="sec-line"></div>
      </div>
      <div class="grid">
        ${this.tasks.map(task => html`
          <div class="task-card">
            <div class="task-status status-${task.status.toLowerCase()}">${task.status}</div>
            <div class="task-title">${task.title}</div>
            <div class="task-meta">
              <span>@${task.assignee}</span>
              <span>P${task.priority}</span>
            </div>
          </div>
        `)}
      </div>
    `;
  }
}

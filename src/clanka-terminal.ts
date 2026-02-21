import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('clanka-terminal')
export class ClankaTerminal extends LitElement {
  @property({ type: Object }) team: Record<string, any> = {};

  static styles = css`
    :host {
      display: block;
      margin-bottom: 64px;
      font-family: 'Courier New', Courier, monospace;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 1px;
      background: var(--border, #1e1e22);
      border: 1px solid var(--border, #1e1e22);
    }
    .node {
      background: var(--bg, #070708);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .node-id {
      font-size: 10px;
      color: var(--dim, #3a3a42);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .node-role {
      font-size: 12px;
      color: var(--bright, #f0f0f8);
      font-weight: bold;
    }
    .node-status {
      font-size: 9px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .indicator {
      width: 4px;
      height: 4px;
      border-radius: 50%;
    }
    .status-idle { color: var(--muted, #6b6b78); }
    .status-idle .indicator { background: var(--muted, #6b6b78); }
    
    .status-active { color: var(--accent, #c8f542); }
    .status-active .indicator { 
      background: var(--accent, #c8f542);
      box-shadow: 0 0 8px var(--accent, #c8f542);
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .node-task {
      font-size: 10px;
      color: var(--muted, #6b6b78);
      line-height: 1.4;
      margin-top: 4px;
      min-height: 2.8em;
      word-break: break-all;
    }
    .trace-log {
      margin-top: 24px;
      padding: 12px;
      background: var(--surface, #0e0e10);
      border: 1px solid var(--border, #1e1e22);
      font-size: 10px;
      color: var(--dim, #3a3a42);
      max-height: 120px;
      overflow: hidden;
    }
    .trace-entry {
      margin-bottom: 4px;
      display: flex;
      gap: 12px;
    }
    .trace-hash { color: var(--accent, #c8f542); opacity: 0.6; }
    .trace-msg { color: var(--muted, #6b6b78); }
  `;

  private roles = {
    orchestrator: 'CLANKA',
    architect: 'ARCHITECT',
    engineer: 'ENGINEER',
    auditor: 'AUDITOR',
    chronicler: 'CHRONICLER'
  };

  private getTraceLogs() {
    return [
      { hash: '7f2a1c', msg: 'tx: spawning subagent [id: 00d7]' },
      { hash: '8b3d4e', msg: 'fs: diff verified [v8_context: clean]' },
      { hash: 'e1f0a2', msg: 'run: commit contiguous [txId: 913a]' }
    ];
  }

  render() {
    return html`
      <div class="sec-header">
        <span class="sec-label">terminal_view</span>
        <div class="sec-line"></div>
      </div>
      <div class="grid">
        ${Object.entries(this.roles).map(([key, label]) => {
          const data = this.team[key] || { status: 'idle', task: 'waiting_for_directive' };
          const isActive = data.status === 'active';
          return html`
            <div class="node">
              <div class="node-id">${key}</div>
              <div class="node-role">${label}</div>
              <div class="node-status ${isActive ? 'status-active' : 'status-idle'}">
                <span class="indicator"></span>
                ${data.status.toUpperCase()}
              </div>
              <div class="node-task">> ${data.task}</div>
            </div>
          `;
        })}
      </div>
      <div class="trace-log">
        ${this.getTraceLogs().map(log => html`
          <div class="trace-entry">
            <span class="trace-hash">[${log.hash}]</span>
            <span class="trace-msg">${log.msg}</span>
          </div>
        `)}
      </div>
    `;
  }
}

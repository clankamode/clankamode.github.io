import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

type AgentState = {
  status?: string;
  task?: string;
};

type ActivityItem = {
  timestamp?: string | number;
  desc?: string;
  type?: string;
};

@customElement('clanka-terminal')
export class ClankaTerminal extends LitElement {
  @property({ type: Object }) team: Record<string, AgentState> = {};
  @property({ type: Array }) recentActivity: ActivityItem[] = [];
  @property({ type: Boolean }) loading = true;
  @property({ type: String }) error = '';

  static styles = css`
    :host {
      display: block;
      margin-bottom: 64px;
      font-family: 'IBM Plex Mono', 'Courier New', Courier, monospace;
      --bg: #070708;
      --surface: #0e0e10;
      --border: #1e1e22;
      --dim: #3a3a42;
      --muted: #6b6b78;
      --text: #d4d4dc;
      --bright: #f0f0f8;
      --accent: #c8f542;
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
    .terminal {
      border: 1px solid var(--border, #1e1e22);
      background: radial-gradient(circle at top, #0f1110 0%, #070708 68%);
      padding: 14px;
      color: var(--accent, #c8f542);
      font-size: 11px;
      line-height: 1.55;
      overflow-x: auto;
    }
    .line {
      white-space: pre;
      color: color-mix(in srgb, var(--accent, #c8f542) 92%, #111 8%);
    }
    .line.dim {
      color: var(--muted, #6b6b78);
    }
    .line.error {
      color: #af8f8f;
    }
    .line.prompt {
      color: var(--bright, #f0f0f8);
    }
    .cursor {
      display: inline-block;
      width: 8px;
      height: 1em;
      background: var(--accent, #c8f542);
      transform: translateY(2px);
      margin-left: 3px;
      animation: blink 1s steps(2, start) infinite;
    }
    .skeleton {
      height: 10px;
      border-radius: 2px;
      width: 82%;
      margin: 8px 0;
      background: linear-gradient(
        90deg,
        color-mix(in srgb, #0f1110 90%, var(--border, #1e1e22) 10%) 0%,
        color-mix(in srgb, #0f1110 72%, var(--accent, #c8f542) 28%) 50%,
        color-mix(in srgb, #0f1110 90%, var(--border, #1e1e22) 10%) 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.7s linear infinite;
    }
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
      51%, 100% { opacity: 0.2; }
    }
  `;

  private roles: Record<string, string> = {
    orchestrator: 'CLANKA',
    architect: 'ARCHITECT',
    engineer: 'ENGINEER',
    auditor: 'AUDITOR',
    chronicler: 'CHRONICLER',
  };

  connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'region');
    this.setAttribute('aria-label', 'Terminal readout');
    if (!this.hasAttribute('tabindex')) {
      this.tabIndex = 0;
    }
  }

  private normalizeStatus(status: string | undefined): 'active' | 'idle' | 'offline' {
    const value = (status ?? 'idle').toLowerCase();
    if (value === 'active') return 'active';
    if (value === 'offline') return 'offline';
    return 'idle';
  }

  private traceLines(): string[] {
    if (!this.recentActivity.length) {
      return ['boot: no recent activity records'];
    }

    return this.recentActivity.slice(0, 3).map((item) => {
      const rawTimestamp = item?.timestamp ?? Date.now();
      const parsed = new Date(rawTimestamp);
      const stamp = Number.isNaN(parsed.getTime())
        ? '--:--:--'
        : parsed.toLocaleTimeString([], { hour12: false });
      const message = (item.desc ?? item.type ?? 'event').toString();
      return `${stamp} ${message}`;
    });
  }

  private renderTeamLines() {
    return Object.entries(this.roles).map(([id, label]) => {
      const state = this.team[id] ?? { status: 'idle', task: 'waiting_for_directive' };
      const normalized = this.normalizeStatus(state.status);
      const statusText = normalized === 'active' ? '[online]' : normalized === 'offline' ? '[offline]' : '[idle]';
      const taskText = (state.task ?? 'waiting_for_directive').toString();
      return html`<div class="line">${statusText} ${label.padEnd(11, ' ')} :: ${taskText}</div>`;
    });
  }

  render() {
    return html`
      <div class="sec-header">
        <span class="sec-label">terminal_view</span>
        <div class="sec-line"></div>
      </div>

      <div class="terminal" role="log" aria-live="polite" aria-atomic="false">
        ${this.loading
          ? html`
              <div class="line">clanka@fleet:~$ <span>[ loading... ]</span></div>
              ${Array.from({ length: 5 }).map(() => html`<div class="skeleton" aria-hidden="true"></div>`)}
              <div class="line prompt">clanka@fleet:~$<span class="cursor" aria-hidden="true"></span></div>
            `
          : this.error
            ? html`
                <div class="line prompt">clanka@fleet:~$ status</div>
                <div class="line error">${this.error}</div>
                <div class="line dim">fallback mode: cached UI only</div>
                <div class="line prompt">clanka@fleet:~$<span class="cursor" aria-hidden="true"></span></div>
              `
            : html`
                <div class="line prompt">clanka@fleet:~$ agents --status</div>
                ${this.renderTeamLines()}
                <div class="line dim">---</div>
                <div class="line prompt">clanka@fleet:~$ tail -n 3 /var/log/activity.log</div>
                ${this.traceLines().map((line) => html`<div class="line dim">${line}</div>`)}
                <div class="line prompt">clanka@fleet:~$<span class="cursor" aria-hidden="true"></span></div>
              `}
      </div>
    `;
  }
}

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { fetchEvents, relativeTime } from './time-utils';

type EventItem = { type: string; repo: string; message: string; timestamp: string };

@customElement('clanka-terminal')
export class ClankaTerminal extends LitElement {
  @state() private events: EventItem[] = [];
  @state() private loading = true;
  @state() private error = '';

  static styles = css`
    :host {
      display: block;
      margin-bottom: 28px;
      font-family: 'IBM Plex Mono', 'Courier New', Courier, monospace;
      border-radius: 2px;
    }
    .sec-header {
      display: flex; align-items: center; gap: 12px; margin-bottom: 24px;
    }
    .sec-label {
      font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--muted);
    }
    .sec-line { flex: 1; height: 1px; background: var(--border); }
    .terminal {
      border: 1px solid var(--border);
      background: var(--surface);
      padding: 14px;
      color: var(--muted);
      font-size: 11px;
      line-height: 1.55;
      overflow-x: auto;
      border-radius: 2px;
    }
    .line { white-space: pre; color: var(--muted); }
    .line.dim { color: var(--muted); }
    .line.prompt { color: var(--bright); }
    .tag { color: var(--accent); font-weight: 600; }
    .repo { color: var(--text); }
    .msg { color: var(--text); }
    .ts { color: var(--dim); }
    .cursor {
      display: inline-block; width: 6px; height: 1em;
      border-left: 1px solid var(--accent);
      transform: translateY(2px);
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.loadData();
  }

  private async loadData(): Promise<void> {
    const events = await fetchEvents();
    if (events.length === 0) {
      this.error = '[ activity unavailable ]';
    } else {
      this.events = events.slice(0, 8);
    }
    this.loading = false;
  }

  render() {
    return html`
      <div class="sec-header">
        <span class="sec-label">terminal</span>
        <div class="sec-line"></div>
      </div>
      <div class="terminal" role="log" aria-label="Terminal output">
        <div class="line prompt">clanka@fleet:~$ git log --oneline --all-repos</div>
        ${this.loading
          ? html`<div class="line dim">[ fetching activity... ]<span class="cursor"></span></div>`
          : this.error
            ? html`<div class="line dim">${this.error}</div>`
            : this.events.map(e => html`
              <div class="line"><span class="tag">[${e.type}]</span> <span class="repo">${e.repo}:</span> <span class="msg">"${e.message}"</span>  <span class="ts">· ${relativeTime(e.timestamp)}</span></div>
            `)}
        ${!this.loading ? html`<div class="line prompt">clanka@fleet:~$ <span class="cursor"></span></div>` : ''}
      </div>
    `;
  }
}

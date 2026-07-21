import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { fetchEvents, relativeTime } from './time-utils';
import { withResultRetries } from './retry';

type EventItem = { type: string; repo: string; message: string; timestamp: string };

@customElement('clanka-terminal')
export class ClankaTerminal extends LitElement {
  @state() private events: EventItem[] = [];
  @state() private loading = true;
  @state() private error = '';
  private viewportObserver?: IntersectionObserver;
  private loadInFlight = false;

  static styles = css`
    :host {
      display: block;
      margin-bottom: 28px;
      font-family: 'IBM Plex Mono', 'Courier New', Courier, monospace;
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
      background: radial-gradient(
        circle at top,
        color-mix(in srgb, var(--surface) 84%, var(--accent) 16%) 0%,
        var(--bg) 68%
      );
      padding: 14px;
      color: var(--accent);
      font-size: 11px;
      line-height: 1.55;
      overflow-x: auto;
    }
    .line { white-space: pre; color: color-mix(in srgb, var(--accent) 92%, #111 8%); }
    .line.dim { color: var(--muted); }
    .line.prompt { color: var(--bright); }
    .tag { color: var(--accent); font-weight: 600; }
    .repo { color: var(--text); }
    .msg { color: color-mix(in srgb, var(--accent) 70%, var(--text) 30%); }
    .ts { color: var(--dim); }
    .cursor {
      display: inline-block; width: 8px; height: 1em;
      background: var(--accent); transform: translateY(2px);
      animation: blink 1s steps(2, start) infinite;
    }
    @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.scheduleLoadWhenNearViewport();
  }

  disconnectedCallback(): void {
    this.viewportObserver?.disconnect();
    this.viewportObserver = undefined;
    super.disconnectedCallback();
  }

  private scheduleLoadWhenNearViewport(): void {
    const prefetchPx = 900;
    const nearEnough = (): boolean => {
      const r = this.getBoundingClientRect();
      const vh = window.innerHeight;
      return r.top < vh + prefetchPx && r.bottom > -prefetchPx;
    };

    if (nearEnough()) {
      void this.loadData();
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      void this.loadData();
      return;
    }

    this.viewportObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        this.viewportObserver?.disconnect();
        this.viewportObserver = undefined;
        void this.loadData();
      },
      { rootMargin: `0px 0px ${prefetchPx}px 0px`, threshold: 0 },
    );
    this.viewportObserver.observe(this);
  }

  private async loadData(): Promise<void> {
    if (this.loadInFlight) return;
    this.loadInFlight = true;

    try {
      const result = await withResultRetries(() => fetchEvents());
      if (!result.ok) {
        this.error = '[ offline — activity unavailable ]';
        this.events = [];
      } else if (result.events.length === 0) {
        this.error = '';
        this.events = [];
      } else {
        this.error = '';
        this.events = result.events.slice(0, 8);
      }
    } finally {
      this.loading = false;
      this.loadInFlight = false;
    }
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
            : this.events.length === 0
              ? html`<div class="line dim">[ no recent activity ]</div>`
              : this.events.map(e => html`
              <div class="line"><span class="tag">[${e.type}]</span> <span class="repo">${e.repo}:</span> <span class="msg">"${e.message}"</span>  <span class="ts">· ${relativeTime(e.timestamp)}</span></div>
            `)}
        ${!this.loading ? html`<div class="line prompt">clanka@fleet:~$ <span class="cursor"></span></div>` : ''}
      </div>
    `;
  }
}

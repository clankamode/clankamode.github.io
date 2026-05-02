import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { fetchEvents, relativeTime } from './time-utils';

type EventItem = { type: string; repo: string; message: string; timestamp: string };

@customElement('clanka-activity')
export class ClankaActivity extends LitElement {
  @state() private events: EventItem[] = [];
  @state() private loading = true;
  @state() private error = '';
  private viewportObserver?: IntersectionObserver;

  static styles = css`
    :host { display: block; margin-bottom: 64px; border-radius: 2px; }
    .sec-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .sec-label { font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--muted, #717986); }
    .sec-line { flex: 1; height: 1px; background: var(--border, #26292e); }
    .row {
      display: grid; grid-template-columns: 1fr auto; align-items: baseline; gap: 16px;
      padding: 12px 0; border-bottom: 1px solid var(--border, #26292e);
      border-left: 2px solid transparent;
    }
    .row-name { color: var(--text, #cfd4db); font-size: 13px; }
    .row-meta { color: var(--dim, #505661); font-size: 11px; text-align: right; }
    .tag { color: var(--accent, #c8f542); }
    .status-fallback {
      font-size: 12px;
      color: var(--muted, #717986);
      padding: 12px 14px;
      border: 1px solid var(--border, #26292e);
      background: var(--surface, #131417);
      border-radius: 2px;
    }
    .loading-text { color: var(--muted, #717986); }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'region');
    this.setAttribute('aria-label', 'Recent activity');
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
    const events = await fetchEvents();
    if (events.length === 0) {
      this.error = '[ activity unavailable ]';
    } else {
      this.events = events;
    }
    this.loading = false;
  }

  render() {
    return html`
      <div class="sec-header">
        <span class="sec-label">activity</span>
        <div class="sec-line"></div>
      </div>
      ${this.loading
        ? html`<div class="status-fallback"><span class="loading-text">[ loading activity ]</span></div>`
        : this.error
          ? html`<div class="status-fallback">${this.error}</div>`
          : this.events.map(e => html`
            <div class="row" role="listitem">
              <span class="row-name"><span class="tag">[${e.type}]</span> ${e.repo}: ${e.message}</span>
              <span class="row-meta">${relativeTime(e.timestamp)}</span>
            </div>
          `)}
    `;
  }
}

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

type ActivityItem = {
  type?: string;
  desc?: string;
  timestamp?: string | number;
};

@customElement('clanka-activity')
export class ClankaActivity extends LitElement {
  @property({ type: Array }) history: ActivityItem[] = [];
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
    .row {
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: baseline;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid var(--border, #1e1e22);
    }
    .row-name {
      color: var(--text, #d4d4dc);
      font-size: 13px;
    }
    .row-meta {
      color: var(--dim, #3a3a42);
      font-size: 11px;
      text-align: right;
    }
    .loading-text {
      color: var(--accent, #c8f542);
      animation: blink 1s steps(2, start) infinite;
    }
    .status-fallback {
      font-size: 12px;
      color: var(--muted, #6b6b78);
      padding: 12px 0;
      border-bottom: 1px solid var(--border, #1e1e22);
    }
    .skeleton-row {
      display: grid;
      grid-template-columns: 1fr 72px;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid var(--border, #1e1e22);
    }
    .skeleton-line {
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
    .skeleton-line.short {
      width: 72px;
      justify-self: end;
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
      51%, 100% { opacity: 0.4; }
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'region');
    this.setAttribute('aria-label', 'Recent activity');
    if (!this.hasAttribute('tabindex')) {
      this.tabIndex = 0;
    }
  }

  private formatDate(value: string | number | undefined): string {
    if (value === undefined) return '--';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '--' : parsed.toLocaleDateString();
  }

  render() {
    return html`
      <div class="sec-header">
        <span class="sec-label">activity</span>
        <div class="sec-line"></div>
      </div>

      ${this.loading
        ? html`
            <div class="status-fallback"><span class="loading-text">[ loading... ]</span></div>
            ${Array.from({ length: 3 }).map(
              () => html`<div class="skeleton-row" aria-hidden="true">
                <span class="skeleton-line"></span>
                <span class="skeleton-line short"></span>
              </div>`,
            )}
          `
        : this.error
          ? html`<div class="status-fallback">${this.error}</div>`
          : this.history.length === 0
            ? html`<div class="status-fallback">[ no activity ]</div>`
            : this.history.map(
                (item) => html`
                  <div class="row" role="listitem">
                    <span class="row-name">[${(item.type ?? 'event').toString()}] ${(item.desc ?? 'update').toString()}</span>
                    <span class="row-meta">${this.formatDate(item.timestamp)}</span>
                  </div>
                `,
              )}
    `;
  }
}

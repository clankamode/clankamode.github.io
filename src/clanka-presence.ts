import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { fetchNow } from './clanka-api';

@customElement('clanka-presence')
export class ClankaPresence extends LitElement {
  @state() private current: string = '[ loading... ]';
  @state() private status: string = 'OPERATIONAL';
  @state() private loading = true;
  @state() private error = '';
  private pollId?: number;
  private hasSyncedOnce = false;
  private updateInFlight = false;

  static styles = css`
    :host {
      display: block;
    }
    .hd {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      border-bottom: 1px solid var(--border, #1e1e22);
      padding-bottom: 24px;
      margin-bottom: 64px;
    }
    .hd-name {
      font-size: 11px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--accent);
      font-weight: bold;
    }
    .hd-status {
      font-size: 11px;
      color: var(--muted);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent);
      display: inline-block;
      animation: pulse 2s ease-in-out infinite;
    }
    .dot.thinking {
      background: #f5d442;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.2; }
    }
    .presence-block {
      margin-top: 32px;
      font-size: 11px;
      color: var(--muted);
    }
    .presence-label {
      color: var(--dim);
    }
    .loading,
    .error {
      color: var(--accent);
      animation: pulse 1.4s ease-in-out infinite;
    }
    .error {
      color: var(--muted);
      animation: none;
    }
    .skeleton {
      height: 12px;
      margin-top: 6px;
      width: min(380px, 80%);
      border-radius: 2px;
      background: linear-gradient(
        90deg,
        color-mix(in srgb, var(--surface) 90%, var(--border) 10%) 0%,
        color-mix(in srgb, var(--surface) 60%, var(--accent) 40%) 50%,
        color-mix(in srgb, var(--surface) 90%, var(--border) 10%) 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.6s linear infinite;
    }
    :host(:focus-visible) {
      outline: 1px solid var(--accent);
      outline-offset: 4px;
    }
    @keyframes shimmer {
      from { background-position: 200% 0; }
      to { background-position: -200% 0; }
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'region');
    this.setAttribute('aria-label', 'Clanka live presence');
    if (!this.hasAttribute('tabindex')) {
      this.tabIndex = 0;
    }
  }

  disconnectedCallback(): void {
    if (this.pollId) {
      window.clearInterval(this.pollId);
      this.pollId = undefined;
    }
    super.disconnectedCallback();
  }

  async firstUpdated() {
    await this.updatePresence();
    if (!this.isConnected) return;
    this.pollId = window.setInterval(() => void this.updatePresence(), 30000);
  }

  async updatePresence() {
    if (this.updateInFlight) return;
    this.updateInFlight = true;

    const isInitialLoad = !this.hasSyncedOnce;
    if (isInitialLoad) {
      this.loading = true;
      this.error = '';
    }

    try {
      const data = await fetchNow();
      if (!this.isConnected) return;

      if (typeof data.current === 'string') {
        this.current = data.current;
      } else if (!this.hasSyncedOnce) {
        this.current = 'active';
      }
      if (typeof data.status === 'string') {
        this.status = data.status;
      } else if (!this.hasSyncedOnce) {
        this.status = 'operational';
      }
      this.error = '';
      this.hasSyncedOnce = true;
      this.dispatchEvent(new CustomEvent('sync-updated', { detail: data }));
    } catch {
      if (!this.isConnected) return;

      this.error = '[ api unreachable ]';
      this.current = '[ offline ]';
      this.status = 'offline';
      this.dispatchEvent(new CustomEvent('sync-error', { detail: { error: this.error } }));
    } finally {
      this.updateInFlight = false;
      if (this.isConnected) {
        this.loading = false;
      }
    }
  }

  render() {
    const normalizedStatus = this.status.toLowerCase();
    const showThinking = normalizedStatus === 'thinking';
    const showOffline = normalizedStatus === 'offline';

    return html`
      <div class="hd">
        <span class="hd-name">CLANKA ⚡</span>
        <span class="hd-status">
          <span class="dot ${showThinking ? 'thinking' : ''}" style=${showOffline ? 'opacity:.4' : ''}></span>
          ${this.loading ? 'SYNCING' : this.status.toUpperCase()}
        </span>
      </div>
      <div class="presence-block">
        <span class="presence-label">// currently:</span>
        ${this.loading
          ? html`<span class="loading"> [ loading... ]</span><div class="skeleton" aria-hidden="true"></div>`
          : this.error
            ? html`<span class="error"> ${this.error}</span>`
            : html` ${this.current}`}
      </div>
    `;
  }
}

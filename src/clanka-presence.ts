import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { fetchNow } from './clanka-api';

type PresencePayload = {
  current?: string;
  status?: string;
  history?: unknown[];
  team?: Record<string, unknown>;
  tasks?: unknown[];
};

@customElement('clanka-presence')
export class ClankaPresence extends LitElement {
  @state() private current: string = '[ loading... ]';
  @state() private status: string = 'OPERATIONAL';
  @state() private history: unknown[] = [];
  @state() private loading = true;
  @state() private error = '';
  private pollId?: number;

  static styles = css`
    :host {
      display: block;
      --bg: #070708;
      --surface: #0e0e10;
      --border: #1e1e22;
      --dim: #3a3a42;
      --accent: #c8f542;
      --muted: #6b6b78;
      --text: #d4d4dc;
      --bright: #f0f0f8;
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
    }
    super.disconnectedCallback();
  }

  async firstUpdated() {
    await this.updatePresence();
    this.pollId = window.setInterval(() => this.updatePresence(), 30000);
  }

  async updatePresence() {
    this.loading = true;
    this.error = '';
    this.dispatchEvent(new CustomEvent('sync-state', { detail: { loading: true, error: '' } }));

    try {
      const data = (await fetchNow()) as PresencePayload;
      this.current = typeof data.current === 'string' ? data.current : 'active';
      this.status = typeof data.status === 'string' ? data.status : 'operational';
      this.history = Array.isArray(data.history) ? data.history : [];
      this.dispatchEvent(new CustomEvent('sync-updated', { detail: data }));
    } catch (e) {
      this.error = '[ api unreachable ]';
      this.current = '[ offline ]';
      this.status = 'offline';
      this.dispatchEvent(new CustomEvent('sync-error', { detail: { error: this.error } }));
    } finally {
      this.loading = false;
      this.dispatchEvent(new CustomEvent('sync-state', { detail: { loading: false, error: this.error } }));
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

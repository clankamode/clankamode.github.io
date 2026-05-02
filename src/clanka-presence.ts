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
      border-radius: 2px;
    }
    .hd {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      border-bottom: 1px solid var(--border, #26292e);
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .hd-name {
      font-size: 11px;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: var(--text, #d4d4d4);
      font-weight: 500;
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
      border-radius: 2px;
      background: var(--border-strong, #3a3a3a);
      display: inline-block;
    }
    .presence-block {
      margin-top: 0;
      font-size: 12px;
      color: var(--muted);
    }
    .presence-label {
      color: var(--muted);
    }
    .loading,
    .error {
      color: var(--muted);
    }
    .error {
      color: var(--muted);
    }
    .skeleton {
      display: none;
    }
    :host(:focus-visible) {
      outline: 1px solid var(--accent);
      outline-offset: 4px;
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
    const showOffline = normalizedStatus === 'offline';

    return html`
      <div class="hd">
        <span class="hd-name">CLANKA ⚡</span>
        <span class="hd-status">
          <span class="dot" style=${showOffline ? 'opacity:.45' : ''}></span>
          ${this.loading ? 'SYNCING' : this.status.toUpperCase()}
        </span>
      </div>
      <div class="presence-block">
        <span class="presence-label">// currently:</span>
        ${this.loading
          ? html`<span class="loading"> [ awaiting update ]</span><div class="skeleton" aria-hidden="true"></div>`
          : this.error
            ? html`<span class="error"> ${this.error}</span>`
            : html` ${this.current}`}
      </div>
    `;
  }
}

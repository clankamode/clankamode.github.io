import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('clanka-presence')
export class ClankaPresence extends LitElement {
  @state() private current: string = '...';
  @state() private status: string = 'OPERATIONAL';
  @state() private history: any[] = [];

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
  `;

  async firstUpdated() {
    await this.updatePresence();
    setInterval(() => this.updatePresence(), 30000);
  }

  async updatePresence() {
    try {
      const res = await fetch('https://clanka-api.clankamode.workers.dev/now');
      const data = await res.json();
      this.current = data.current;
      this.status = data.status;
      this.history = data.history || [];
      this.dispatchEvent(new CustomEvent('sync-updated', { detail: data }));
    } catch (e) {
      console.error('Presence fetch failed');
    }
  }

  render() {
    return html`
      <div class="hd">
        <span class="hd-name">CLANKA ⚡</span>
        <span class="hd-status">
          <span class="dot ${this.status === 'thinking' ? 'thinking' : ''}"></span>
          ${this.status.toUpperCase()}
        </span>
      </div>
      <div class="presence-block">
        <span class="presence-label">// currently:</span> ${this.current}
      </div>
    `;
  }
}

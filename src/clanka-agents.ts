import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('clanka-agents')
export class ClankaAgents extends LitElement {
  @property({ attribute: false }) team: Record<string, unknown> = {};
  @property({ type: Boolean }) loading = true;
  @property({ type: String }) error = '';

  static styles = css`
    :host { display: block; margin-bottom: 28px; }
    .sec-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .sec-label { font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--muted, #6b6b78); }
    .sec-line { flex: 1; height: 1px; background: var(--border, #1e1e22); }
    .note {
      text-align: center; padding: 32px 16px;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px; line-height: 1.8;
      color: var(--dim, #3a3a42);
    }
    .loading {
      color: var(--accent, #c8f542);
      animation: blink 1s steps(2, start) infinite;
    }
    .error { color: var(--muted, #6b6b78); }
    a { color: var(--muted, #6b6b78); text-decoration: none; }
    a:hover { color: var(--accent, #c8f542); }
    :host(:focus-visible) {
      outline: 1px solid var(--accent, #c8f542);
      outline-offset: 4px;
    }
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0.4; }
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'region');
    this.setAttribute('aria-label', 'Agent orchestration');
    if (!this.hasAttribute('tabindex')) {
      this.tabIndex = 0;
    }
  }

  private get teamCount(): number {
    if (!this.team || typeof this.team !== 'object') return 0;
    return Object.values(this.team).filter(
      (value) => value !== null && typeof value === 'object',
    ).length;
  }

  render() {
    const teamCount = this.teamCount;

    return html`
      <div class="sec-header">
        <span class="sec-label">agents</span>
        <div class="sec-line"></div>
      </div>
      <div class="note">
        ${this.loading
          ? html`<span class="loading">[ loading... ]</span>`
          : this.error
            ? html`<span class="error">${this.error}</span>`
            : teamCount > 0
              ? html`// team: ${teamCount} member${teamCount === 1 ? '' : 's'}<br>
                  // check <a href="https://github.com/clankamode" target="_blank" rel="noopener noreferrer">github.com/clankamode</a> for shipped work`
              : html`// agent orchestration is internal<br>
                  // check <a href="https://github.com/clankamode" target="_blank" rel="noopener noreferrer">github.com/clankamode</a> for shipped work`}
      </div>
    `;
  }
}
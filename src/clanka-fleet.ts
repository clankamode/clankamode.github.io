import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { fetchFleetSummary } from './clanka-api';

type Tier = 'ops' | 'infra' | 'core' | 'quality' | 'policy' | 'template';
type Criticality = 'critical' | 'high' | 'medium';

interface FleetRepo {
  repo: string;
  tier: Tier;
  criticality: Criticality;
  online: boolean;
}

const TIERS: Tier[] = ['ops', 'infra', 'core', 'quality', 'policy', 'template'];

@customElement('clanka-fleet')
export class ClankaFleet extends LitElement {
  @state() private repos: FleetRepo[] = [];
  @state() private live = false;
  @state() private loading = true;
  @state() private error = '';

  static styles = css`
    :host {
      display: block;
      margin-bottom: 64px;
      --bg: #070708;
      --surface: #0e0e10;
      --border: #1e1e22;
      --dim: #3a3a42;
      --muted: #6b6b78;
      --text: #d4d4dc;
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
    .sync {
      font-size: 9px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--muted, #6b6b78);
    }
    .sync.live {
      color: var(--accent, #c8f542);
    }
    .tier-group {
      margin-bottom: 18px;
    }
    .tier-title {
      font-size: 9px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--dim, #3a3a42);
      margin-bottom: 6px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 1px;
      background: var(--border, #1e1e22);
      border: 1px solid var(--border, #1e1e22);
    }
    .card {
      background: var(--bg, #070708);
      padding: 12px 16px;
      transition: background 0.12s ease;
      min-height: 64px;
    }
    .card:hover {
      background: var(--surface, #0e0e10);
    }
    .card-head {
      margin-bottom: 8px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .repo {
      font-size: 12px;
      color: var(--text, #d4d4dc);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tier-badge {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: var(--dim, #3a3a42);
    }
    .criticality {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--muted, #6b6b78);
    }
    .status-pill {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .status-pill.online {
      color: var(--accent, #c8f542);
    }
    .status-pill.offline {
      color: var(--muted, #6b6b78);
      opacity: 0.65;
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 6px;
    }
    .critical { background: var(--accent, #c8f542); }
    .high { background: #f5a623; }
    .medium { background: var(--muted, #6b6b78); }
    .fallback {
      padding: 12px 16px;
      border: 1px solid var(--border, #1e1e22);
      background: var(--surface, #0e0e10);
      color: var(--muted, #6b6b78);
      font-size: 12px;
    }
    .loading {
      color: var(--accent, #c8f542);
      animation: blink 1s steps(2, start) infinite;
    }
    .skeleton-card {
      background: var(--bg, #070708);
      padding: 12px 16px;
      min-height: 64px;
    }
    .skeleton-line {
      height: 10px;
      border-radius: 2px;
      margin-bottom: 9px;
      width: 80%;
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
      width: 52%;
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
    this.setAttribute('aria-label', 'Fleet status');
    if (!this.hasAttribute('tabindex')) {
      this.tabIndex = 0;
    }
    this.loadFleet();
  }

  private async loadFleet(): Promise<void> {
    this.loading = true;
    this.error = '';

    try {
      const data = await fetchFleetSummary();
      const repos = this.extractRepos(data);
      if (!repos.length) {
        throw new Error('No fleet repos in payload');
      }
      this.repos = repos;
      this.live = true;
    } catch {
      this.repos = [];
      this.live = false;
      this.error = '[ api unreachable ]';
    } finally {
      this.loading = false;
    }
  }

  private extractRepos(data: unknown): FleetRepo[] {
    const source = this.pickRepoArray(data);
    if (!source.length) return [];

    return source
      .map((item) => this.normalizeRepo(item))
      .filter((item): item is FleetRepo => item !== null)
      .sort((a, b) => {
        const tierOrder = TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier);
        return tierOrder !== 0 ? tierOrder : a.repo.localeCompare(b.repo);
      });
  }

  private pickRepoArray(data: unknown): unknown[] {
    if (!data || typeof data !== 'object') return [];

    const root = data as Record<string, unknown>;
    if (Array.isArray(root.repos)) return root.repos;
    if (Array.isArray(root.fleet)) return root.fleet;

    if (root.summary && typeof root.summary === 'object') {
      const summary = root.summary as Record<string, unknown>;
      if (Array.isArray(summary.repos)) return summary.repos;
      if (Array.isArray(summary.fleet)) return summary.fleet;
    }

    return [];
  }

  private readOnlineState(raw: Record<string, unknown>): boolean {
    if (typeof raw.online === 'boolean') return raw.online;

    const status = String(raw.status ?? raw.state ?? '').trim().toLowerCase();
    if (!status) return true;

    if (['offline', 'down', 'error', 'failed', 'degraded'].includes(status)) return false;
    if (['online', 'up', 'ok', 'healthy', 'active'].includes(status)) return true;
    return true;
  }

  private normalizeRepo(item: unknown): FleetRepo | null {
    if (!item || typeof item !== 'object') return null;

    const raw = item as Record<string, unknown>;
    const repo = String(raw.repo ?? raw.name ?? raw.full_name ?? '').trim();
    const tier = String(raw.tier ?? '').trim().toLowerCase() as Tier;
    const criticality = String(raw.criticality ?? raw.priority ?? '').trim().toLowerCase() as Criticality;
    const online = this.readOnlineState(raw);

    if (!repo || !TIERS.includes(tier)) return null;

    if (!['critical', 'high', 'medium'].includes(criticality)) {
      return { repo, tier, criticality: 'medium', online };
    }

    return { repo, tier, criticality, online };
  }

  private shortName(repo: string): string {
    return repo.replace(/^clankamode\//, '');
  }

  render() {
    const grouped = TIERS.map((tier) => ({
      tier,
      repos: this.repos.filter((repo) => repo.tier === tier),
    })).filter((group) => group.repos.length > 0);

    return html`
      <div class="sec-header">
        <span class="sec-label">fleet</span>
        <div class="sec-line"></div>
        <span class="sync ${this.live ? 'live' : ''}">
          ${this.loading ? 'SYNCING' : this.live ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      ${this.loading
        ? html`
            <div class="fallback"><span class="loading">[ loading... ]</span></div>
            <div class="grid" aria-hidden="true">
              ${Array.from({ length: 6 }).map(
                () => html`<div class="skeleton-card">
                  <div class="skeleton-line"></div>
                  <div class="skeleton-line short"></div>
                </div>`,
              )}
            </div>
          `
        : this.error
          ? html`<div class="fallback">${this.error}</div>`
          : grouped.map(
              (group) => html`
                <div class="tier-group">
                  <div class="tier-title">${group.tier}</div>
                  <div class="grid" role="list">
                    ${group.repos.map(
                      (repo) => html`
                        <article class="card" role="listitem">
                          <div class="card-head">
                            <span class="repo">${this.shortName(repo.repo)}</span>
                            <span class="status-pill ${repo.online ? 'online' : 'offline'}">
                              ${repo.online ? '● online' : '○ offline'}
                            </span>
                          </div>
                          <div class="tier-badge">${repo.tier}</div>
                          <div class="criticality"><span class="dot ${repo.criticality}" aria-hidden="true"></span>${repo.criticality}</div>
                        </article>
                      `,
                    )}
                  </div>
                </div>
              `,
            )}
    `;
  }
}

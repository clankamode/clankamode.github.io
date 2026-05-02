import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { fetchFleetSummary } from './clanka-api';

type Tier = 'ops' | 'infra' | 'core' | 'quality' | 'policy' | 'template';
type Criticality = 'critical' | 'high' | 'medium';

interface FleetRepo {
  repo: string;
  tier: Tier;
  criticality: Criticality;
  online: boolean | null;
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
      border-radius: 2px;
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
      color: var(--muted, #717986);
    }
    .sec-line {
      flex: 1;
      height: 1px;
      background: var(--border, #26292e);
    }
    .sync {
      font-size: 9px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--muted, #717986);
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
      color: var(--dim, #505661);
      margin-bottom: 6px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 1px;
      background: var(--border, #26292e);
      border: 1px solid var(--border, #26292e);
    }
    .card {
      background: var(--bg, #0b0c0d);
      padding: 12px 16px;
      min-height: 64px;
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
      color: var(--text, #cfd4db);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tier-badge {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: var(--dim, #505661);
    }
    .criticality {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--muted, #717986);
    }
    .status-pill {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 2px 6px;
      border: 1px solid var(--border, #26292e);
      border-radius: 2px;
    }
    .status-pill.online {
      color: var(--accent, #c8f542);
      border-color: var(--accent, #c8f542);
    }
    .status-pill.offline {
      color: var(--muted, #717986);
      opacity: 0.85;
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 2px;
      display: inline-block;
      margin-right: 6px;
    }
    .critical { background: var(--accent, #c8f542); }
    .high { background: var(--muted, #717986); }
    .medium { background: var(--dim, #505661); }
    .fallback {
      padding: 12px 16px;
      border: 1px solid var(--border, #26292e);
      background: var(--surface, #131417);
      color: var(--muted, #717986);
      font-size: 12px;
      border-radius: 2px;
    }
    .loading {
      color: var(--muted, #717986);
    }
    .skeleton-card {
      background: var(--bg, #0b0c0d);
      padding: 12px 16px;
      min-height: 64px;
    }
    .skeleton-line {
      height: 10px;
      border-radius: 2px;
      margin-bottom: 9px;
      width: 80%;
      background: var(--attention-panel, var(--surface, #131417));
      border: 1px solid var(--border, #26292e);
    }
    .skeleton-line.short {
      width: 52%;
    }
    :host(:focus-visible) {
      outline: 1px solid var(--accent, #c8f542);
      outline-offset: 4px;
    }
    @media (max-width: 680px) {
      .grid {
        grid-template-columns: 1fr;
      }
      .card {
        min-height: 0;
        padding: 10px 12px;
      }
      .card-head {
        align-items: flex-start;
        flex-direction: column;
        gap: 6px;
      }
    }
  `;

  private viewportObserver?: IntersectionObserver;

  connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'region');
    this.setAttribute('aria-label', 'Fleet status');
    if (!this.hasAttribute('tabindex')) {
      this.tabIndex = 0;
    }
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
      void this.loadFleet();
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      void this.loadFleet();
      return;
    }

    this.viewportObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        this.viewportObserver?.disconnect();
        this.viewportObserver = undefined;
        void this.loadFleet();
      },
      { rootMargin: `0px 0px ${prefetchPx}px 0px`, threshold: 0 },
    );
    this.viewportObserver.observe(this);
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

  private readOnlineState(raw: Record<string, unknown>): boolean | null {
    if (typeof raw.online === 'boolean') return raw.online;

    const status = String(raw.status ?? raw.state ?? '').trim().toLowerCase();
    if (!status) return null;

    if (['offline', 'down', 'error', 'failed', 'degraded'].includes(status)) return false;
    if (['online', 'up', 'ok', 'healthy', 'active'].includes(status)) return true;
    return null;
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
            <div class="fallback"><span class="loading">[ loading fleet summary ]</span></div>
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
                            ${repo.online === null
                              ? null
                              : html`
                                  <span class="status-pill ${repo.online ? 'online' : 'offline'}">
                                    ${repo.online ? '● online' : '● offline'}
                                  </span>
                                `}
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

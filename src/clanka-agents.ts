import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

type AgentStatus = 'IDLE' | 'ACTIVE' | 'DONE';

interface AgentNode {
  id: string;
  role: string;
  status: AgentStatus;
  task: string;
  sinceMs?: number;
}

const PLACEHOLDER_NODES: AgentNode[] = [
  { id: 'ag-01', role: 'CODEx', status: 'ACTIVE', task: 'analyzing PR diff in clanka-tools', sinceMs: Date.now() - 42_000 },
  { id: 'ag-02', role: 'CLAUDE', status: 'IDLE', task: 'waiting on deploy verification' },
  { id: 'ag-03', role: 'OPS', status: 'DONE', task: 'patching fleet config for edge failover', sinceMs: Date.now() - 128_000 },
  { id: 'ag-04', role: 'SCRIBE', status: 'ACTIVE', task: 'writing post 006: incident loops', sinceMs: Date.now() - 17_000 },
];

@customElement('clanka-agents')
export class ClankaAgents extends LitElement {
  @property({ type: Object }) team: Record<string, unknown> = {};

  @state() private nodes: AgentNode[] = [];
  @state() private loading = true;
  @state() private error = false;
  @state() private hasLiveData = false;
  @state() private lastSyncMs: number | null = null;
  @state() private nowMs = Date.now();

  private tickId?: number;

  static styles = css`
    :host {
      display: block;
      margin-bottom: 64px;
      --bg: #070708;
      --surface: #0e0e10;
      --border: #1e1e22;
      --muted: #6b6b78;
      --text: #d4d4dc;
      --bright: #f0f0f8;
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
      min-width: 62px;
      text-align: right;
    }
    .sync.live {
      color: var(--accent, #c8f542);
    }
    .status-line {
      margin-bottom: 14px;
      font-size: 12px;
      color: var(--accent, #c8f542);
      letter-spacing: 0.08em;
      text-transform: lowercase;
    }
    .status-line.error {
      color: var(--muted, #6b6b78);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1px;
      background: var(--border, #1e1e22);
      border: 1px solid var(--border, #1e1e22);
    }
    .node {
      min-height: 80px;
      padding: 12px;
      background: var(--bg, #070708);
      display: flex;
      flex-direction: column;
      gap: 6px;
      border: 1px solid transparent;
      transition: background 0.12s ease;
    }
    .node:hover {
      background: var(--surface, #0e0e10);
    }
    .node.active {
      border-color: color-mix(in srgb, var(--accent, #c8f542) 22%, transparent);
      box-shadow: 0 0 12px rgba(200, 245, 66, 0.15);
    }
    .node-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
    }
    .agent-id {
      color: var(--bright, #f0f0f8);
      font-size: 13px;
      font-weight: bold;
      letter-spacing: 0.02em;
    }
    .agent-role {
      color: var(--muted, #6b6b78);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }
    .node-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .node-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--muted, #6b6b78);
    }
    .node-status.active {
      color: var(--accent, #c8f542);
    }
    .node-status.done {
      color: var(--text, #d4d4dc);
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
      opacity: 0.9;
    }
    .dot.pulse {
      animation: pulse 1.15s ease-in-out infinite;
      box-shadow: 0 0 8px currentColor;
    }
    .elapsed {
      color: var(--muted, #6b6b78);
      font-size: 9px;
    }
    .task {
      color: var(--muted, #6b6b78);
      font-size: 11px;
      line-height: 1.35;
      word-break: break-word;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.tickId = window.setInterval(() => {
      this.nowMs = Date.now();
    }, 1000);
  }

  disconnectedCallback(): void {
    if (this.tickId) {
      window.clearInterval(this.tickId);
    }
    super.disconnectedCallback();
  }

  async firstUpdated(): Promise<void> {
    await this.fetchTeam();
  }

  protected updated(changedProps: Map<PropertyKey, unknown>): void {
    if (changedProps.has('team')) {
      this.applyTeam(this.team, true);
    }
  }

  private async fetchTeam(): Promise<void> {
    this.loading = true;
    this.error = false;
    try {
      const response = await fetch('https://clanka-api.clankamode.workers.dev/now', {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Agent fetch failed: ${response.status}`);
      }
      const payload = (await response.json()) as Record<string, unknown>;
      this.applyTeam(this.extractTeam(payload), true);
    } catch (err) {
      console.error('agent mesh fetch failed', err);
      this.error = true;
      this.loading = false;
      this.hasLiveData = false;
      this.nodes = PLACEHOLDER_NODES;
    }
  }

  private extractTeam(payload: Record<string, unknown>): Record<string, unknown> {
    const team = payload.team;
    if (team && typeof team === 'object' && !Array.isArray(team)) {
      return team as Record<string, unknown>;
    }
    return {};
  }

  private applyTeam(team: Record<string, unknown>, didSync: boolean): void {
    const parsed = this.normalizeTeam(team);
    if (parsed.length > 0) {
      this.nodes = parsed;
      this.hasLiveData = true;
      this.error = false;
      this.loading = false;
      if (didSync) {
        this.lastSyncMs = Date.now();
      }
      return;
    }

    this.hasLiveData = false;
    this.loading = false;
    this.nodes = PLACEHOLDER_NODES;
  }

  private normalizeTeam(team: Record<string, unknown>): AgentNode[] {
    return Object.entries(team)
      .map(([key, raw]) => this.normalizeAgent(key, raw))
      .filter((node): node is AgentNode => node !== null)
      .sort((a, b) => {
        const rank = this.statusRank(a.status) - this.statusRank(b.status);
        return rank !== 0 ? rank : a.id.localeCompare(b.id);
      });
  }

  private normalizeAgent(key: string, raw: unknown): AgentNode | null {
    if (!raw || typeof raw !== 'object') return null;
    const data = raw as Record<string, unknown>;

    const id = String(data.id ?? key).trim();
    if (!id) return null;

    const role = String(data.role ?? key).trim().toUpperCase();
    const task = String(
      data.task ?? data.currentTask ?? data.current_task ?? data.activity ?? 'awaiting_task',
    ).trim();
    const status = this.normalizeStatus(data.status);
    const sinceMs = this.parseTime(data.startedAt ?? data.started_at ?? data.since ?? data.updatedAt ?? data.updated_at);

    return {
      id,
      role,
      status,
      task: task || 'awaiting_task',
      sinceMs: sinceMs ?? undefined,
    };
  }

  private normalizeStatus(value: unknown): AgentStatus {
    const raw = String(value ?? '').trim().toLowerCase();
    if (['active', 'running', 'busy', 'working'].includes(raw)) return 'ACTIVE';
    if (['done', 'completed', 'complete', 'success'].includes(raw)) return 'DONE';
    return 'IDLE';
  }

  private parseTime(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value > 1e12 ? value : value * 1000;
    }
    if (typeof value === 'string') {
      const asNum = Number(value);
      if (Number.isFinite(asNum) && value.trim() !== '') {
        return asNum > 1e12 ? asNum : asNum * 1000;
      }
      const asDate = Date.parse(value);
      if (!Number.isNaN(asDate)) return asDate;
    }
    return null;
  }

  private statusRank(status: AgentStatus): number {
    if (status === 'ACTIVE') return 0;
    if (status === 'IDLE') return 1;
    return 2;
  }

  private elapsedLabel(node: AgentNode): string {
    if (!node.sinceMs) return '--:--';
    const elapsed = Math.max(0, Math.floor((this.nowMs - node.sinceMs) / 1000));
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  private syncLabel(): string {
    if (this.error) return 'OFFLINE';
    if (!this.lastSyncMs) return this.hasLiveData ? 'LIVE' : 'CACHED';
    const seconds = Math.max(0, Math.floor((this.nowMs - this.lastSyncMs) / 1000));
    if (seconds < 8) return 'LIVE';
    return `${seconds}s ago`;
  }

  render() {
    return html`
      <div class="sec-header">
        <span class="sec-label">agent_mesh</span>
        <div class="sec-line"></div>
        <span class="sync ${this.hasLiveData && !this.error ? 'live' : ''}">LAST SYNC ${this.syncLabel()}</span>
      </div>

      ${this.loading
        ? html`<div class="status-line">[ initializing agent mesh... ]</div>`
        : this.error
          ? html`<div class="status-line error">[ agent mesh offline ]</div>`
          : html``}

      <div class="grid">
        ${this.nodes.map((node) => {
          const statusClass = node.status === 'ACTIVE' ? 'active' : node.status === 'DONE' ? 'done' : '';
          return html`
            <article class="node ${node.status === 'ACTIVE' ? 'active' : ''}">
              <div class="node-head">
                <span class="agent-id">${node.id}</span>
                <span class="agent-role">${node.role}</span>
              </div>
              <div class="node-meta">
                <span class="node-status ${statusClass}">
                  <span class="dot ${node.status === 'ACTIVE' ? 'pulse' : ''}" aria-hidden="true"></span>
                  ${node.status}
                </span>
                <span class="elapsed">${this.elapsedLabel(node)}</span>
              </div>
              <div class="task">> ${node.task}</div>
            </article>
          `;
        })}
      </div>
    `;
  }
}

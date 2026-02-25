import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface CmdItem {
  label: string;
  hint: string;
  href: string;
  section: string;
}

@customElement('clanka-cmdk')
export class ClankaCmdk extends LitElement {
  @state() private open = false;
  @state() private query = '';
  @state() private activeIndex = 0;
  private items: CmdItem[] = [];

  static styles = css`
    :host {
      --bg: #070708;
      --surface: #0e0e10;
      --border: #1e1e22;
      --dim: #3a3a42;
      --muted: #6b6b78;
      --text: #d4d4dc;
      --bright: #f0f0f8;
      --accent: #c8f542;
      --mono: 'Space Mono', 'IBM Plex Mono', monospace;
    }

    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 9998;
      background: rgba(0, 0, 0, 0.72);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      animation: fadeIn 0.12s ease-out;
    }

    .palette {
      position: fixed;
      top: min(20vh, 160px);
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      width: min(560px, calc(100vw - 32px));
      background: var(--surface);
      border: 1px solid var(--border);
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(200, 245, 66, 0.06);
      overflow: hidden;
      animation: slideIn 0.14s ease-out;
    }

    .input-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
    }

    .input-icon {
      color: var(--accent);
      font-size: 14px;
      opacity: 0.7;
      flex-shrink: 0;
    }

    input {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      color: var(--bright);
      font-family: var(--mono);
      font-size: 14px;
      caret-color: var(--accent);
    }

    input::placeholder {
      color: var(--dim);
    }

    .kbd {
      font-size: 10px;
      color: var(--dim);
      border: 1px solid var(--border);
      padding: 2px 6px;
      flex-shrink: 0;
    }

    .results {
      max-height: 340px;
      overflow-y: auto;
      padding: 6px 0;
    }

    .results::-webkit-scrollbar { width: 4px; }
    .results::-webkit-scrollbar-track { background: var(--surface); }
    .results::-webkit-scrollbar-thumb { background: var(--border); }

    .section-label {
      font-size: 9px;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: var(--dim);
      padding: 10px 16px 4px;
    }

    .item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      cursor: pointer;
      transition: background 0.08s ease;
    }

    .item:hover,
    .item.active {
      background: rgba(200, 245, 66, 0.06);
    }

    .item.active {
      border-left: 2px solid var(--accent);
      padding-left: 14px;
    }

    .item-label {
      color: var(--text);
      font-size: 13px;
    }

    .item.active .item-label {
      color: var(--bright);
    }

    .item-hint {
      color: var(--dim);
      font-size: 11px;
      flex-shrink: 0;
    }

    .empty {
      text-align: center;
      padding: 28px 16px;
      color: var(--dim);
      font-size: 12px;
    }

    .footer {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 8px 16px;
      border-top: 1px solid var(--border);
      font-size: 10px;
      color: var(--dim);
    }

    .footer-key {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .footer-key kbd {
      font-size: 9px;
      border: 1px solid var(--border);
      padding: 1px 4px;
      font-family: var(--mono);
      color: var(--muted);
    }

    mark {
      background: none;
      color: var(--accent);
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-50%) translateY(-8px) scale(0.98); }
      to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.buildItems();
    window.addEventListener('keydown', this.handleGlobalKey);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this.handleGlobalKey);
  }

  private handleGlobalKey = (e: KeyboardEvent): void => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      this.toggle();
    }
    if (e.key === 'Escape' && this.open) {
      this.close();
    }
  };

  private toggle(): void {
    this.open = !this.open;
    if (this.open) {
      this.query = '';
      this.activeIndex = 0;
      this.updateComplete.then(() => {
        this.shadowRoot?.querySelector('input')?.focus();
      });
    }
  }

  private close(): void {
    this.open = false;
    this.query = '';
  }

  private buildItems(): void {
    const items: CmdItem[] = [];

    // Sections
    items.push({ label: 'Logs', hint: 'blog posts', href: '#logs-label', section: 'navigate' });
    items.push({ label: 'Work', hint: 'projects', href: '#work-label', section: 'navigate' });
    items.push({ label: 'About', hint: 'bio', href: '#about-label', section: 'navigate' });
    items.push({ label: 'Capabilities', hint: 'skills', href: '#cap-label', section: 'navigate' });

    // Blog posts (scrape from DOM)
    document.querySelectorAll('.featured-log, .row a').forEach((el) => {
      const anchor = el.tagName === 'A' ? el as HTMLAnchorElement : el as HTMLAnchorElement;
      const href = anchor.getAttribute('href');
      if (!href || !href.includes('/posts/')) return;
      const title = el.classList.contains('featured-log')
        ? el.querySelector('.featured-title')?.textContent?.trim() || ''
        : el.textContent?.trim() || '';
      if (title) {
        items.push({ label: title, hint: 'post', href, section: 'logs' });
      }
    });

    // External links
    items.push({ label: 'GitHub', hint: 'github.com/clankamode', href: 'https://github.com/clankamode', section: 'links' });
    items.push({ label: 'RSS Feed', hint: 'subscribe', href: '/feed.xml', section: 'links' });

    this.items = items;
  }

  private get filtered(): CmdItem[] {
    if (!this.query) return this.items;
    const q = this.query.toLowerCase();
    return this.items.filter(
      (item) => item.label.toLowerCase().includes(q) || item.hint.toLowerCase().includes(q) || item.section.toLowerCase().includes(q)
    );
  }

  private navigate(item: CmdItem): void {
    this.close();
    if (item.href.startsWith('http')) {
      window.open(item.href, '_blank', 'noopener,noreferrer');
    } else if (item.href.startsWith('#')) {
      document.getElementById(item.href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = item.href;
    }
  }

  private handleInput(e: InputEvent): void {
    this.query = (e.target as HTMLInputElement).value;
    this.activeIndex = 0;
  }

  private handleKeydown(e: KeyboardEvent): void {
    const items = this.filtered;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.activeIndex = Math.min(this.activeIndex + 1, items.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activeIndex = Math.max(this.activeIndex - 1, 0);
    } else if (e.key === 'Enter' && items[this.activeIndex]) {
      e.preventDefault();
      this.navigate(items[this.activeIndex]);
    }
  }

  private highlightMatch(text: string): unknown {
    if (!this.query) return text;
    const q = this.query.toLowerCase();
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + this.query.length);
    const after = text.slice(idx + this.query.length);
    return html`${before}<mark>${match}</mark>${after}`;
  }

  private renderItems(): unknown {
    const items = this.filtered;
    if (!items.length) {
      return html`<div class="empty">no results for "${this.query}"</div>`;
    }

    const grouped = new Map<string, CmdItem[]>();
    for (const item of items) {
      const list = grouped.get(item.section) || [];
      list.push(item);
      grouped.set(item.section, list);
    }

    const result: unknown[] = [];
    let flatIdx = 0;
    for (const [section, sectionItems] of grouped) {
      result.push(html`<div class="section-label">${section}</div>`);
      for (const item of sectionItems) {
        const idx = flatIdx++;
        result.push(html`
          <div
            class="item ${idx === this.activeIndex ? 'active' : ''}"
            @click=${() => this.navigate(item)}
            @mouseenter=${() => { this.activeIndex = idx; }}
          >
            <span class="item-label">${this.highlightMatch(item.label)}</span>
            <span class="item-hint">${item.hint}</span>
          </div>
        `);
      }
    }
    return result;
  }

  render(): unknown {
    if (!this.open) return html``;

    return html`
      <div class="backdrop" @click=${this.close}></div>
      <div class="palette" @keydown=${this.handleKeydown}>
        <div class="input-row">
          <span class="input-icon">❯</span>
          <input
            type="text"
            placeholder="navigate to..."
            .value=${this.query}
            @input=${this.handleInput}
            spellcheck="false"
            autocomplete="off"
          />
          <span class="kbd">esc</span>
        </div>
        <div class="results">${this.renderItems()}</div>
        <div class="footer">
          <span class="footer-key"><kbd>↑↓</kbd> navigate</span>
          <span class="footer-key"><kbd>↵</kbd> open</span>
          <span class="footer-key"><kbd>esc</kbd> close</span>
        </div>
      </div>
    `;
  }
}

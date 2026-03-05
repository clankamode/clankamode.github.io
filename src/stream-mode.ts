/* ──────────────────────────────────────────────────────────
 *  Stream Mode — redacts sensitive data for live streams
 *  Toggle: toolbar button  ·  ⌘⇧S / Ctrl+Shift+S
 * ────────────────────────────────────────────────────────── */

const STREAM_MODE_KEY = "STREAM_MODE";
const TOOLBAR_ID = "stream-toolbar";
const BANNER_ID = "stream-banner";
const STYLE_ID = "stream-mode-styles";

// ── Sensitive-data patterns ─────────────────────────────────

const SENSITIVE_OBJECT_KEYS = new Set([
  "email",
  "name",
  "image",
  "token",
  "accessToken",
  "refreshToken",
  "password",
  "secret",
  "apiKey",
  "api_key",
  "authorization",
  "sub",
  "proxyEmail",
  "originalEmail",
  "google_id",
  "googleId",
  "session_token",
  "cookie",
]);

const JWT_PATTERN = /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g;
const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9._-]{20,}/gi;
const LONG_NUMERIC_ID_PATTERN = /\b\d{18,}\b/g;

// ── Internal state ──────────────────────────────────────────

const originals = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
};
let consolePatched = false;
let keyHandler: ((e: KeyboardEvent) => void) | null = null;
let storageHandler: ((e: StorageEvent) => void) | null = null;
let initialized = false;

const isBrowser = (): boolean =>
  typeof window !== "undefined" && typeof document !== "undefined";

// ── Public API ──────────────────────────────────────────────

export function isStreamMode(): boolean {
  if (!isBrowser()) return false;
  try {
    return window.localStorage.getItem(STREAM_MODE_KEY) === "true";
  } catch {
    return false;
  }
}

export function enableStreamMode(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STREAM_MODE_KEY, "true");
  } catch {
    return;
  }
  applyRedaction();
  syncUI();
}

export function disableStreamMode(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STREAM_MODE_KEY, "false");
  } catch {
    return;
  }
  applyRedaction();
  syncUI();
}

export function toggleStreamMode(): void {
  if (isStreamMode()) disableStreamMode();
  else enableStreamMode();
}

// ── Masking helpers ─────────────────────────────────────────

function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return "•••";
  const local = parts[0];
  return `${local.slice(0, 1)}•••${local.slice(-1)}@${parts[1]}`;
}

function maskKey(value: string): string {
  if (!value || value.length <= 8) return "•••";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function redactString(value: string): string {
  if (!value || typeof value !== "string") return "•••";
  if (value.includes("@")) return maskEmail(value);
  JWT_PATTERN.lastIndex = 0;
  BEARER_PATTERN.lastIndex = 0;
  LONG_NUMERIC_ID_PATTERN.lastIndex = 0;
  if (JWT_PATTERN.test(value) || BEARER_PATTERN.test(value)) return "•••";
  if (LONG_NUMERIC_ID_PATTERN.test(value)) return "•••";
  if (value.length >= 32 && /^[A-Za-z0-9_-]+$/.test(value))
    return maskKey(value);
  return value;
}

// ── DOM modifications ───────────────────────────────────────

export function applyRedaction(): void {
  if (!isBrowser()) return;

  const on = isStreamMode();
  if (on) {
    document.body.classList.add("stream-mode-active");
  } else {
    document.body.classList.remove("stream-mode-active");
  }
}

// ── Console patching ────────────────────────────────────────

function deepRedactForConsole(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === "string") return redactString(value);
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(deepRedactForConsole);
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const keyLower = k.toLowerCase();
    if (
      SENSITIVE_OBJECT_KEYS.has(k) ||
      keyLower.includes("token") ||
      keyLower.includes("secret") ||
      keyLower.includes("password") ||
      keyLower.includes("email")
    ) {
      out[k] = typeof v === "string" ? "•••" : "[REDACTED]";
    } else {
      out[k] = deepRedactForConsole(v);
    }
  }
  return out;
}

function redactArgs(args: unknown[]): unknown[] {
  return args.map((arg) => {
    if (typeof arg === "string") return redactString(arg);
    if (typeof arg === "object" && arg !== null)
      return deepRedactForConsole(arg);
    return arg;
  });
}

function patchConsoleMethods(): void {
  if (consolePatched) return;
  consolePatched = true;

  for (const method of ["log", "warn", "error", "debug"] as const) {
    const original = originals[method];
    console[method] = (...args: unknown[]) => {
      if (isStreamMode()) args = redactArgs(args);
      original(...args);
    };
  }
}

function unpatchConsoleMethods(): void {
  if (!consolePatched) return;
  consolePatched = false;
  console.log = originals.log;
  console.warn = originals.warn;
  console.error = originals.error;
  console.debug = originals.debug;
}

// ── Keyboard shortcut ───────────────────────────────────────

function attachKeyboardShortcut(): void {
  if (keyHandler) return;
  keyHandler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "s") {
      e.preventDefault();
      toggleStreamMode();
    }
  };
  document.addEventListener("keydown", keyHandler);
}

function detachKeyboardShortcut(): void {
  if (keyHandler) {
    document.removeEventListener("keydown", keyHandler);
    keyHandler = null;
  }
}

function attachStorageSync(): void {
  if (storageHandler) return;
  storageHandler = (e: StorageEvent) => {
    if (e.key !== STREAM_MODE_KEY) return;
    applyRedaction();
    syncUI();
  };
  window.addEventListener("storage", storageHandler);
}

function detachStorageSync(): void {
  if (!storageHandler) return;
  window.removeEventListener("storage", storageHandler);
  storageHandler = null;
}

// ── Injected styles ─────────────────────────────────────────

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    /* ── Stream Mode Toolbar ─────────────────────── */
    #${TOOLBAR_ID} {
      position: fixed;
      left: max(1rem, env(safe-area-inset-left));
      bottom: max(1rem, env(safe-area-inset-bottom));
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--surface-interactive, #1a1a1a);
      border: 1px solid var(--border-subtle, #2a2a2a);
      padding: 8px 14px;
      border-radius: var(--radius-lg, 12px);
      font-family: var(--font-mono, monospace);
      font-size: 12px;
      color: var(--text-secondary, #a1a1a1);
      z-index: 9999;
      opacity: 0;
      transform: translateY(8px);
      animation: stream-toolbar-in 300ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) forwards;
      user-select: none;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    }

    body.feedback-launcher-visible #${TOOLBAR_ID} {
      bottom: calc(max(1rem, env(safe-area-inset-bottom)) + 4.5rem);
    }

    @media (max-width: 480px) {
      body.feedback-launcher-visible #${TOOLBAR_ID} {
        bottom: max(1rem, env(safe-area-inset-bottom));
      }
    }
    @keyframes stream-toolbar-in {
      to { opacity: 1; transform: translateY(0); }
    }

    #${TOOLBAR_ID} .stream-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--text-muted, #6b6b6b);
      transition: background 200ms ease-out, box-shadow 200ms ease-out;
      flex-shrink: 0;
    }
    #${TOOLBAR_ID} .stream-dot[data-active="true"] {
      background: var(--accent-primary, #2cbb5d);
      box-shadow: 0 0 8px rgba(44, 187, 93, 0.5);
    }

    #${TOOLBAR_ID} .stream-label {
      letter-spacing: 0.05em;
      text-transform: uppercase;
      font-size: 11px;
      white-space: nowrap;
    }

    #${TOOLBAR_ID} .stream-shortcut {
      font-size: 10px;
      color: var(--text-muted, #6b6b6b);
      letter-spacing: 0.03em;
    }

    #${TOOLBAR_ID} .stream-btn {
      background: transparent;
      padding: 4px 10px;
      border: 1px solid var(--border-interactive, #3a3a3a);
      color: var(--text-secondary, #a1a1a1);
      border-radius: var(--radius-sm, 6px);
      cursor: pointer;
      font-family: inherit;
      font-size: 11px;
      letter-spacing: 0.04em;
      transition: border-color 150ms ease-out,
        color 150ms ease-out,
        background 150ms ease-out;
    }
    #${TOOLBAR_ID} .stream-btn:hover {
      border-color: var(--accent-primary, #2cbb5d);
      color: var(--accent-primary, #2cbb5d);
      background: rgba(44, 187, 93, 0.06);
    }
    #${TOOLBAR_ID} .stream-btn:active {
      transform: translateY(1px);
    }

    /* ── Active-state top banner ──────────────────── */
    #${BANNER_ID} {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--accent-primary, #2cbb5d);
      z-index: 9998;
      opacity: 0;
      transition: opacity 200ms ease-out;
      pointer-events: none;
    }
    #${BANNER_ID}[data-active="true"] {
      opacity: 1;
    }

    /* ── Redacted element styling ─────────────────── */
    body.stream-mode-active .stream-hidden {
      display: none !important;
    }
    body.stream-mode-active .sensitive {
      filter: blur(5px);
      user-select: none;
      transition: filter 0.2s ease-out;
    }
    body.stream-mode-active .sensitive:hover {
      filter: blur(0px);
    }
  `;
  document.head.appendChild(style);
}

function removeStyles(): void {
  document.getElementById(STYLE_ID)?.remove();
}

// ── Toolbar DOM ─────────────────────────────────────────────

function syncUI(): void {
  const on = isStreamMode();

  // Dot indicator
  const dot = document.querySelector(
    `#${TOOLBAR_ID} .stream-dot`,
  ) as HTMLElement | null;
  if (dot) dot.setAttribute("data-active", String(on));

  // Button label
  const btn = document.querySelector(
    `#${TOOLBAR_ID} .stream-btn`,
  ) as HTMLButtonElement | null;
  if (btn) btn.textContent = on ? "ON" : "OFF";

  // Banner
  const banner = document.getElementById(BANNER_ID);
  if (banner) banner.setAttribute("data-active", String(on));
}

export function injectToolbar(): void {
  if (!isBrowser()) return;
  if (document.getElementById(TOOLBAR_ID)) return;

  injectStyles();

  // Banner (3px accent bar at top when active)
  const banner = document.createElement("div");
  banner.id = BANNER_ID;
  banner.setAttribute("data-active", String(isStreamMode()));
  document.body.appendChild(banner);

  // Toolbar
  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().includes("MAC");
  const shortcutLabel = isMac ? "⌘⇧S" : "Ctrl+Shift+S";

  const bar = document.createElement("div");
  bar.id = TOOLBAR_ID;
  bar.setAttribute("role", "status");
  bar.setAttribute("aria-label", "Stream mode controls");

  // Dot
  const dot = document.createElement("span");
  dot.className = "stream-dot";
  dot.setAttribute("data-active", String(isStreamMode()));
  bar.appendChild(dot);

  // Label
  const label = document.createElement("span");
  label.className = "stream-label";
  label.textContent = "STREAM";
  bar.appendChild(label);

  // Shortcut hint
  const hint = document.createElement("span");
  hint.className = "stream-shortcut";
  hint.textContent = shortcutLabel;
  bar.appendChild(hint);

  // Toggle button
  const btn = document.createElement("button");
  btn.className = "stream-btn";
  btn.textContent = isStreamMode() ? "ON" : "OFF";
  btn.addEventListener("click", () => toggleStreamMode());
  bar.appendChild(btn);

  document.body.appendChild(bar);
}

function removeToolbar(): void {
  document.getElementById(TOOLBAR_ID)?.remove();
  document.getElementById(BANNER_ID)?.remove();
}

// ── Init / Destroy ──────────────────────────────────────────

export function initStreamMode(): void {
  if (!isBrowser()) return;
  if (initialized) return;
  initialized = true;
  patchConsoleMethods();
  injectToolbar();
  attachKeyboardShortcut();
  attachStorageSync();
  applyRedaction();
}

export function destroyStreamMode(): void {
  if (!isBrowser()) return;
  if (!initialized) return;
  initialized = false;
  detachKeyboardShortcut();
  detachStorageSync();
  unpatchConsoleMethods();
  document.body.classList.remove("stream-mode-active");
  removeToolbar();
  removeStyles();
}

export const __streamModeTestUtils = {
  redactString,
  deepRedactForConsole,
};

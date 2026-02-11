# Session Appliance Invariants

This document defines the non-negotiable "Appliance" contract for the session system.
These invariants must be enforced by E2E tests (`tests/session-invariants.spec.ts`) and static analysis (`tests/truth-budget.spec.ts`).

## 1. Gate Mode (Invariant: Single Assertion)
*   **Mission Statement**: The Gate must assert ONE primary mission (SessionIntent).
*   **Bounded Scope**: Must display time estimate and item count.
*   **No Distractions**: Global navigation (Navbar links) must be reduced to Identity only.
*   **No Peer Options**: Alternative tracks must be hidden behind a deliberate "Change track" action. Infinite scroll/grids are forbidden here.

## 2. Execute Mode (Invariant: Zero Escape)
*   **Zero Global Nav**: The standard Navbar and Footer must be REMOVED from the DOM.
*   **HUD Only**: The only chrome allowed is the SessionHUD (progress, status).
*   **Reader Focus**: The main content area must be the Session Reader.
*   **No Sidebar**: The library/pillar sidebar must be hidden or replaced by the Session Checklist.

## 3. Exit Mode (Invariant: Earned Release)
*   **Ritual Required**: The "Internalize & Close" action must be DISABLED until the user performs the "Pick 1 of 2" ritual.
*   **No Negotiation**: The "Extend Session" button is FORBIDDEN.
*   **Truthful Next**: Micro-session proposals must be concrete (<= 5 min) and optional. No generic "keep going" loops.
*   **Cognitive Fingerprint**: The exit view must show the *Delta* (State Change), not just "Items Completed" (Activity).

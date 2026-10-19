# Keep user state on refresh via URL query state

## Goal
When the user refreshes the page (or opens the app from a shared link), restore where they were: the selected root, the open `.cursor` group, and the open skill. Persist that state in the URL query string — the simplest durable mechanism (no storage APIs, shareable, works on refresh).

## Non-goals
- No server changes: `serveStatic` already serves `/` regardless of query string.
- No `popstate`/back-button handling (state is written with `history.replaceState`, so no extra history entries are created).
- No persistence of scroll position, collapsed/expanded sidebar, or the full multi-open-accordion set — the URL tracks the focused path only (root → group → skill).
- No localStorage/sessionStorage.

## Context
- Repos / packages involved: `agent-gui` (single repo, frontend only: `public/app.js`).
- Contracts / current behavior (post PR #1 merge, `7bcc138`):
  - Boot: `loadRoots()` renders the sidebar; content area shows an empty state until `selectRoot(rootName)` runs.
  - `selectRoot` fetches groups (`.cursor`) or skills (flat roots) and renders accordions; sets `currentRoot`, `currentGroups`, `currentSkillsCache`.
  - `toggleGroup(i)` lazy-fetches group skills on first open; `toggleSkill(cacheKey, i)` lazy-fetches skill content on first open; open state is the CSS class `.open`.
  - Skill `path` is root-relative for flat roots and group-relative for `.cursor` groups (contract from PR #1).
- Proposed URL shape (query params, all optional):
  - Flat: `/?root=.claude&skill=parent/child`
  - Group: `/?root=.cursor&group=skills&skill=foo` (`group` = group `searchPath`, `skill` = path within group)
  - Missing/invalid params → current default behavior (empty state); never hard-fail restore on stale params.

## Open questions (blocked)
- None

## Dependencies & order
- None

## Implementation units

### U1 — URL state read/write for root, group, and skill
- **Scope in:** `public/app.js` only:
  - **Write side:** derive the query string from current state (`currentRoot`, tracked open group path, tracked open skill path) and call `history.replaceState` on every state mutation — `selectRoot` (root only, clears group/skill), `toggleGroup` open/close (group; opening a group clears skill), `toggleSkill` open/close (skill). Closing the tracked accordion must clear (or re-derive) its param so the URL never lies about what is open.
  - **Read side:** a boot restore step that runs after `await loadRoots()` and parses `location.search`: validate `root` against the rendered roots, call `selectRoot`; if `.cursor` + `group` matches a group `searchPath`, open that accordion (existing `toggleGroup` path, so its lazy fetch runs); once the skills render, if `skill` matches a listed path, open it (existing `toggleSkill` path, so content loads). Stale/invalid `group`/`skill` params are ignored silently.
  - Boot entrypoint becomes an async init that awaits `loadRoots()` before restore (sidebar `.active` highlight depends on roots being rendered).
- **Scope out:** server, CSS, index.html (unless a trivial init hook is needed), popstate, storage APIs.
- **Likely touchpoints (tentative):** `public/app.js`.
- **Verification (narrowest):**
  1. `node --check public/app.js`
  2. `npm test` (server regression suite stays green — 40/40)
  3. Browser smoke (if agent-browser available): start server against a **tmp `HOME` fixture** (`HOME=<tmp> node server.js`), load `/?root=.cursor&group=skills&skill=<fixture>`, confirm root selected + group open + skill content shown; plain `/` still shows the empty state.
- **Rollback seam:** single commit reverting `public/app.js`; no server/data state.
- **Review handoff hints:** restore must reuse the existing `selectRoot`/`toggleGroup`/`toggleSkill` code paths (no duplicate fetch/render logic); URL writes must use `replaceState` (never `pushState`) to avoid history spam; every param must be cleared when its feature closes; restore must be resilient (one bad param must not block the rest of the page boot).

## After planning
Attach **bmo-step-deliver** for execution. Single unit → one deliver pass with block review + commit, then Phase 4.

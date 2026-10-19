# Make enable/disable work properly for skills

## Goal
Verify the skill enable/disable (toggle) feature end-to-end and fix the bugs that break it for nested skills and for skills inside `.cursor` groups, add regression tests so it stays fixed, and keep the UI checkbox in sync when a toggle fails.

## Non-goals
- No new features (bulk toggle, search, permissions model).
- No refactor of routing, listing, or the accordion UI beyond what the fixes require.
- No changes to skill discovery (`walkDirs`/`shouldSkip`) — discovery already handles nesting.

## Context
- Repos / packages involved: `agent-gui` (single repo: Node server + vanilla JS frontend).
- Contracts:
  - `POST /api/skill/toggle/:root/:skillPath?group=` → `toggleSkill(rootName, skillPath, groupPath)` moves a skill folder between `<root>/<rel>` and `<root>/temp_disabled_skills/<rel>`.
  - Frontend toggle call sends `skillPath` **prefixed with the group path** plus `?group=` (e.g. `skills/nested/foo?group=skills`), while the content endpoint `GET /api/skill/...` sends the path **relative to the group** plus `?group=` — the service must honor both shapes.
  - Skills can be nested arbitrarily (`parent/child/SKILL.md`); `collectSkills` already reports nested relative paths.
- Confirmed failures (repro'd against current `main`):
  1. Nested flat skill (`.claude/parent/child-skill`) — disable fails `ENOENT`: destination parent dir `temp_disabled_skills/parent/` is never created.
  2. Nested group skill (`.cursor/skills/nested/group-nested`) — toggle fails "Skill folder not found" and content lookup returns null: `toggleSkill`/`getSkillContent` collapse the path to the basename when `groupPath` is set.
  3. UI: a failed toggle leaves the checkbox visually flipped (browser flips it before `onchange`; code only corrects it on success), and `toggleSkillEnabled` relies on the global `event`.

## Open questions (blocked)
- None

## Dependencies & order
- U1 (server correctness + tests) before U2 (frontend relies on accurate server responses); otherwise independent.

## Implementation units

### U1 — Server: fix toggle/content path resolution + regression tests
- **Scope in:**
  - `server/services/skillsService.js`:
    - `toggleSkill`: when `groupPath` is set, normalize `skillPath` (strip the leading `groupPath/` if present) and build `fullEnabledPath` / `fullDisabledPath` from `groupPath + relative` so nested group skills resolve; create the destination parent with `fs.mkdirSync(path.dirname(newPath), { recursive: true })` before `renameSync` (fixes nested flat ENOENT and covers enable-side parents too).
    - `getSkillContent`: resolve as `path.join(groupPath, skillPath)` (full relative path), not `path.join(groupPath, skillName)`; validate `skillPath` (not just basename) against `..`.
    - Tighten `..` checks in both functions to inspect the full `skillPath`.
  - `server/config.js`: harden `isSafePath` to require a path-separator boundary (or exact equality), so sibling prefixes like `/home/.claude-evil` cannot pass a `/home/.claude` base check.
  - New `server/services/skillsService.test.js` (node:test + tmp `HOME` set **before** requiring the service, same style as existing helper tests):
    - flat skill disable → moves to `temp_disabled_skills/<name>` → enable restores, content preserved.
    - nested flat skill (`parent/child`) disable/enable roundtrip at the full nested path.
    - group skill (`?group=skills`, path prefixed `skills/<name>`) disable/enable.
    - nested group skill (`skills/nested/<name>?group=skills`) disable/enable.
    - `getSkillContent` returns content for disabled skills (flat, nested, group-nested).
    - listing flags disabled skills (`findSkillsInGroup` / `findSkillsRecursively` show `enabled: false`).
    - `isSafePath` rejects sibling-prefix escapes.
- **Scope out:** frontend, HTTP status-code mapping in `toggleController`, listing/sort cleanups.
- **Likely touchpoints (tentative):** `server/services/skillsService.js`, `server/config.js`, `server/services/skillsService.test.js`.
- **Verification (narrowest):** `npm test` (runs `node --test "server/**/*.test.js"`) — all existing + new tests green.
- **Rollback seam:** single commit reverting the service/config/test changes; no data migration (moves are runtime filesystem state, not repo state).
- **Review handoff hints:** contract split between toggle (group-prefixed path) and content (group-relative path) must stay honored; `renameSync` needs its destination parent to exist; `isSafePath` change affects static file serving too — check `serveStatic` still serves `public/` files.

### U2 — Frontend: keep the toggle checkbox honest on failure
- **Scope in:**
  - `public/app.js`:
    - Pass the DOM `event` explicitly into `toggleSkillEnabled` (drop the unused `currentEnabled` param and the global `event` reference).
    - On failed response (`result.success` falsy or thrown fetch error), revert the checkbox to `skill.enabled` and keep the console error.
- **Scope out:** styling, counts layout, any new UI.
- **Likely touchpoints (tentative):** `public/app.js` only.
- **Verification (narrowest):** `node --check public/app.js` and full `npm test` still green (server untouched by this unit; regression net stays up).
- **Rollback seam:** single commit reverting `public/app.js`.
- **Review handoff hints:** `onchange` fires after the browser has already flipped `checked` — revert must set `checkbox.checked = skill.enabled` (the last known server truth), not toggle again.

## After planning
Attach **bmo-step-deliver** for execution. One **U*** per unit with block review + commit between units (autopilot continue under bmo-builder).

# Analisador de Funil

Browser-only web app for marketers to build a sales funnel (stages, conversion rates, costs) and see results from a budget or the budget needed for a goal.
- How it works today: `SPEC.md`. Ideas and the feature in progress: `BACKLOG.md`. What changed in each version: `CHANGELOG.md`.

## Commands
- Install: `npm install`, then `npx playwright install chromium` once for the browser tests
- Develop: `npm run dev` (Vite, http://localhost:5173)
- Build: `npm run build` (type-checks with `tsc -b` first; output in `dist/`)
- Tests: `npm test` (Vitest + Testing Library, jsdom); `npm run test:e2e` (Playwright, Chromium; starts the dev server itself)
- Lint: `npm run lint` (oxlint)
- Cloud sessions (Claude Code on the web): `.claude/hooks/session-start.sh` runs `npm install` and installs Chromium; the plugin and the environment are set up as in `CLOUD.md`.

## Conventions
- All user-facing text comes from a single texts module, never written inline in components (PT-BR only for now; kept in one place so it can be translated later).
- Funnel calculations are pure functions, separate from React components, so they're tested without rendering and reused by comparison and export.
- Money and volumes keep full precision; rounding happens only on display. The one exception is the budget computed in goal mode, which is rounded up.
- TypeScript is in strict mode; `npm run build` must pass type-checking.

## Tests
- Unit and component tests live next to the code as `src/**/*.test.ts(x)`; browser tests live in `e2e/*.spec.ts`.
- `src/test/setup.ts` loads the jest-dom matchers; Vitest globals (`test`, `expect`) are on.
- Calculation rules are tested as pure functions; behavior that changes state (editing stages, switching modes, saving, importing) is tested with Testing Library, as in `src/funnels/funnels.test.tsx`, or with Playwright when it depends on the real browser (local storage across reloads, file download and upload), as in `e2e/funnels.spec.ts`. Only what needs a real person looking at a real browser (visual style, funnel proportions and scale breaks, animations, drag to reorder, how the exported PNG/PDF looks) goes into "To check by hand".

## Development cycle
Uses the `grilling`, `document` and `build` skills and the `tester` agent from the `minidev` plugin. When a step needs one that isn't available, tell the user and stop; don't imitate it from memory.

1. **Idea:** if the idea is clear, record it with `document`. If it leaves behavior open (decisions that would change what gets built), start a `grilling` interview; before its final summary, load `document` and write the summary as the backlog entry, so my OK approves the text that will be recorded. "Just note it" ("só anota", "apenas registra") always skips the interview.
2. **Build:** `build`.
3. **Bugs:** no backlog entry or tester. Work on a `fix/<short-name>` branch created from the up-to-date main branch. If the bug can be reproduced in a test (see Tests), write the test and show it fails, then fix it. If it needs a real person looking at a real browser, put the steps to reproduce it in the commit message's `To check by hand:` block. Record it with `document` (CHANGELOG under Fixed; SPEC.md if a rule changed) and commit on the branch. Once it's confirmed fixed, merge it into the main branch, delete the branch and push. If the fix needs a decision about behavior, it's a feature: go to step 1.
4. **Release:** not published yet; cut the version with `document`.

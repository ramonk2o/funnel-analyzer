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
- `src/test/formShape.ts` turns a funnel form into what the person sees (no internal stage ids, goal target as a position), for comparing forms in tests.
- Calculation rules are tested as pure functions; behavior that changes state (editing stages, switching modes, saving, importing) is tested with Testing Library, as in `src/funnels/funnels.test.tsx`, or with Playwright when it depends on the real browser (local storage across reloads, file download and upload), as in `e2e/funnels.spec.ts`. Only what needs a real person looking at a real browser (visual style, funnel proportions and scale breaks, animations, drag to reorder, how the exported PNG/PDF looks) goes into "To check by hand".

## Development cycle
This project uses the `minidev` cycle. When a step needs one of its skills and it isn't available, tell the user and stop; don't imitate it from memory.
- Ideas: `document`. Features: `build`. Bugs: `fix`.
- Releases: cut the version with `document`.

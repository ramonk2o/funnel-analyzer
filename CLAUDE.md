# Analisador de Funil

Browser-only web app for marketers to build a sales funnel (stages, conversion rates, costs) and see results from a budget or the budget needed for a goal.
- How it works today: `SPEC.md`. What changed in each version: `CHANGELOG.md`. Ideas, bugs and work in progress: GitHub issues (see Agent skills below).

## Commands
- Install: `npm install`, then `npx playwright install chromium` once for the browser tests
- Develop: `npm run dev` (Vite, http://localhost:5173)
- Type-check: `npm run typecheck` (`tsc -b`, about 2 s; run it often while coding)
- Build: `npm run build` (type-checks first; output in `dist/`)
- Tests: `npm test` (Vitest + Testing Library, jsdom); `npm run test:e2e` (Playwright, Chromium; starts the dev server itself)
- One test file: `npx vitest run src/funnel/calc.test.ts`; one browser test file: `npx playwright test e2e/funnels.spec.ts`
- Lint: `npm run lint` (oxlint)
- Cloud sessions (Claude Code on the web): `.claude/hooks/session-start.sh` runs `npm install` and installs Chromium; the environment is set up as in `CLOUD.md`.

## Conventions
- Language: documents, issues, pull requests, commit messages and the changelog are written in Brazilian Portuguese. This file and `docs/agents/` stay in English.
- All user-facing text comes from a single texts module (`src/texts.ts`), never written inline in components (PT-BR only for now; kept in one place so it can be translated later).
- Funnel calculations are pure functions, separate from React components, so they're tested without rendering and reused by comparison and export.
- Money and volumes keep full precision; rounding happens only on display. The one exception is the budget computed in goal mode, which is rounded up.
- TypeScript is in strict mode; `npm run typecheck` and `npm run build` must pass.
- Stack: React 19, TypeScript, Vite; data lives in the browser's `localStorage` (no server, no account).

## Tests
- Unit and component tests live next to the code as `src/**/*.test.ts(x)`; browser tests live in `e2e/*.spec.ts`.
- `src/test/setup.ts` loads the jest-dom matchers; Vitest globals (`test`, `expect`) are on.
- `src/test/formShape.ts` turns a funnel form into what the person sees (no internal stage ids, goal target as a position), for comparing forms in tests.
- Where tests go in: calculation and data rules are tested as pure functions in the plain `.ts` modules (`src/funnel/calc.ts`, `form.ts`, `numbers.ts`; `src/compare/*.ts`; `src/funnels/parse.ts`, `file.ts`, `storage.ts`; `src/settings/accent.ts`, `separator.ts`; `src/theme/contrast.ts`). Behavior that changes state (editing stages, switching modes, saving, importing) is tested with Testing Library, as in `src/funnels/funnels.test.tsx`, or with Playwright when it depends on the real browser (local storage across reloads, file download and upload), as in `e2e/funnels.spec.ts`.
- Only what needs a person looking at a real browser (visual style, funnel proportions, animations, drag to reorder, how an exported PNG/PDF looks) is left without automated tests.

## Working rules
- Every change goes on its own branch and into `main` through a pull request, merged with squash; delete the branch after merging.
- Changelog: every pull request with a change that people using the app would notice adds a line under `## [Unreleased]` in `CHANGELOG.md` (Keep a Changelog categories, in Portuguese: Adicionado, Alterado, Removido, Corrigido). Refactoring, tests, tooling and project docs don't get a line.
- Releases (only when asked):
  1. Pick the number with Semantic Versioning from the `[Unreleased]` entries (major: breaking; minor: new features; patch: fixes only) and show the version, date and entries for an OK.
  2. On a `release/<version>` branch, move the entries under `## [<version>] - <YYYY-MM-DD>`, leaving `## [Unreleased]` empty above it; set `version` in `package.json`; update the compare links at the end of `CHANGELOG.md` (`[Unreleased]: https://github.com/ramonk2o/funnel-analyzer/compare/<version>...HEAD`, `[<version>]: .../compare/<previous>...<version>`; the first version links to `.../tree/<version>`).
  3. Open the pull request "Release <version>"; after it is squash-merged, tag the merge commit on `main` with an annotated tag `<version>` and push only the tag.

## Agent skills

### Issue tracker

Issues live in GitHub Issues for ramonk2o/funnel-analyzer (via the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

The five default triage labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

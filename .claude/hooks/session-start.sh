#!/bin/bash
# Prepares a cloud session (Claude Code on the web): dependencies and the Playwright browser.
# Does nothing on a local machine. See CLOUD.md.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

npm install --no-audit --no-fund
# Downloads Chromium only when it's missing; needs the Playwright hosts allowed (CLOUD.md).
npx playwright install chromium || echo "Chromium not installed: check the environment's network access (CLOUD.md)." >&2

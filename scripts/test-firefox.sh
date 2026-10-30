#!/usr/bin/env bash
# Run the browser scenarios in Playwright's Firefox build one spec file at a
# time with a single worker. Multi-worker Firefox runs have died silently on
# this shared machine; the per-file loop is slower but reports every file.
# Usage: scripts/test-firefox.sh [spec files...]   (default: every spec)
set -u
cd "$(dirname "$0")/.."
files=("$@")
if [ ${#files[@]} -eq 0 ]; then
  mapfile -t files < <(ls tests/browser/*.spec.ts | grep -v pages.spec.ts)
fi
status=0
for file in "${files[@]}"; do
  echo "== $file"
  if ! PW_BROWSER=firefox PW_WORKERS=1 npx playwright test "$file" 2>&1 | grep -E '^\s+[0-9]+ (passed|failed|skipped|flaky)'; then
    status=1
  fi
done
exit $status

#!/usr/bin/env bash
# Publish the locally verified production build to the gh-pages branch.
#
# GitHub Pages serves that branch when the repository's Pages source is the
# branch (legacy build type). This path spends no Actions minutes: run the
# checks locally first (format, roadmap, rules, gameplay, PAGES_SMOKE), then
#
#   VITE_BASE_PATH=/theandril-hearth-and-card/ npm run build
#   scripts/deploy-pages.sh
#
# The script refuses a dirty tree or a build made for the wrong base path, and
# records the source commit in the published branch's commit message.
set -euo pipefail
cd "$(dirname "$0")/.."

base="/theandril-hearth-and-card/"
# The build regenerates the change-ledger snapshot from this branch's history;
# that generated file stays uncommitted on feature branches and is tolerated here.
if [ -n "$(git status --porcelain -- . ':!src/development/changes.json')" ]; then
  echo "Commit or stash local changes before publishing." >&2
  exit 1
fi
if [ ! -f dist/index.html ]; then
  echo "No dist/index.html. Build first with VITE_BASE_PATH=$base npm run build" >&2
  exit 1
fi
if ! grep -q "\"${base}assets/" dist/index.html && ! grep -q "'${base}assets/" dist/index.html && ! grep -q "${base}assets/" dist/index.html; then
  echo "dist was not built for $base; rebuild with VITE_BASE_PATH=$base" >&2
  exit 1
fi

source_commit=$(git rev-parse HEAD)
source_short=$(git rev-parse --short HEAD)
source_branch=$(git rev-parse --abbrev-ref HEAD)
worktree=$(mktemp -d)
trap 'git worktree remove --force "$worktree" >/dev/null 2>&1 || true; rm -rf "$worktree"' EXIT

git fetch origin gh-pages >/dev/null 2>&1 || true
if git show-ref --verify --quiet refs/remotes/origin/gh-pages; then
  git worktree add --force "$worktree" origin/gh-pages >/dev/null
  git -C "$worktree" checkout -B gh-pages >/dev/null
  git -C "$worktree" rm -rq . >/dev/null 2>&1 || true
else
  git worktree add --detach "$worktree" >/dev/null
  git -C "$worktree" checkout --orphan gh-pages >/dev/null
  git -C "$worktree" rm -rfq . >/dev/null 2>&1 || true
fi

cp -R dist/. "$worktree"/
touch "$worktree/.nojekyll"
git -C "$worktree" add -A
if git -C "$worktree" diff --cached --quiet; then
  echo "gh-pages already matches dist ($source_short); nothing to publish."
  exit 0
fi
git -C "$worktree" -c user.name="$(git config user.name)" -c user.email="$(git config user.email)" \
  commit -q -m "Publish $source_short from $source_branch

Source: $source_commit
Built locally with VITE_BASE_PATH=$base after the local checks."
git -C "$worktree" push -q origin gh-pages
echo "Published $source_short to gh-pages."

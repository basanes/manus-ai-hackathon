#!/usr/bin/env bash
# One-command check for src/features/inspiration.ts (Participant 2).
#   bash docs/handoffs/inspiration-import/verification/run.sh
#
# Works from anywhere inside the repo: it walks up to the folder that owns
# src/lib/contracts.ts, syncs Participant 1's real shared files, then checks
# this module against them.
#
# 1. syncs src/lib/{contracts,planner}.ts and src/features/inspiration.ts
#    (falls back to the committed snapshot if the repo root cannot be found)
# 2. static guard: no React, no fetch, no external imports
# 3. type-check (strict)
# 4. acceptance + planner-integration test
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"

find_repo() {
  local dir="$HERE"
  while [ "$dir" != "/" ]; do
    if [ -f "$dir/src/lib/contracts.ts" ] && [ -f "$dir/src/features/inspiration.ts" ]; then
      echo "$dir"
      return
    fi
    dir="$(dirname "$dir")"
  done
  echo ""
}

REPO="${REPO:-$(find_repo)}"

echo "== 1/4  syncing shared files =="
if [ -n "$REPO" ]; then
  cp "$REPO/src/lib/contracts.ts" lib/contracts.ts
  cp "$REPO/src/lib/planner.ts" lib/planner.ts
  cp "$REPO/src/features/inspiration.ts" features/inspiration.ts
  echo "     synced from $REPO"
else
  echo "     repo root not found — using the committed snapshots in lib/ and features/"
fi

echo
echo "== 2/4  static guard: forbidden patterns =="
if grep -nE "react|useState|fetch\(|XMLHttpRequest|axios|import .* from '[^.]|require\(" features/inspiration.ts; then
  echo "     FAIL: forbidden pattern found above"
  exit 1
else
  echo "     OK: no React, no fetch, no external import, no new dependency"
fi

echo
echo "== 3/4  type-check (strict) =="
npx --yes tsc --noEmit --strict --target es2022 --module esnext \
  --moduleResolution bundler --lib es2022,dom --skipLibCheck test.ts
echo "     OK: no type errors"

echo
echo "== 4/4  acceptance + integration test =="
npx --yes tsx test.ts

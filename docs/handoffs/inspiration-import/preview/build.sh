#!/usr/bin/env bash
# Bundle the module + preview UI into one self-contained preview/index.html.
#   bash preview/build.sh
set -euo pipefail
cd "$(dirname "$0")"

npx --yes esbuild app.ts --bundle --format=iife --target=es2019 --log-level=warning --outfile=bundle.js

python3 - <<'PY'
from pathlib import Path
shell = Path('shell.html').read_text()
bundle = Path('bundle.js').read_text()
Path('index.html').write_text(shell.replace('/*__BUNDLE__*/', bundle))
PY

rm -f bundle.js
echo "built preview/index.html ($(wc -c < index.html) bytes)"

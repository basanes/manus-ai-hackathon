#!/usr/bin/env bash
# Verify the Participant 3 module without installing anything into the shared app.
set -e
cd "$(dirname "$0")"
npx --yes tsx@4.19.1 test.ts

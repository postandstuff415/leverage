#!/usr/bin/env bash
# Rebuild the site and (re)start the production server on port 3000.
# Build runs in the foreground so errors surface; the server is launched in a new
# session (setsid) so it keeps running after this script — and your shell — exits.
# serve.ts supersedes any previously running instance, so this is safe to re-run.
set -euo pipefail
cd "$(dirname "$0")"

bun run build
rm -f site.log
setsid nohup bun run start > site.log 2>&1 < /dev/null &
echo "site published; serving on port 3000"

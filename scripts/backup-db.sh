#!/usr/bin/env bash
# Dumps the local Docker database to backups/gfuel-<timestamp>.sql
set -euo pipefail
# Moving to the project root makes the volumes and the dump path predictable.
cd "$(dirname "$0")/.."
mkdir -p backups
out="backups/gfuel-$(date +%Y%m%d-%H%M%S).sql"
# -T disables the pseudo-terminal, and pg_dump writes the SQL to the dated file.
docker compose exec -T db pg_dump -U gfuel -d gfuel --clean --if-exists > "$out"
echo "Backup written to $out"

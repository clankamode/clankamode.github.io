#!/usr/bin/env bash
#
# Backs up the Supabase Postgres database to a gzipped dump and uploads it to S3.
# Requires: pg_dump (PostgreSQL client), aws CLI, and env vars below.
#
# Usage:
#   ./scripts/bin/backup-db-to-s3.sh
#
# Env (set in .env.local or export before running):
#   DATABASE_URL     - Supabase Postgres connection string (Session pooler, port 5432)
#   S3_BACKUP_BUCKET - S3 bucket name
#   S3_BACKUP_PREFIX - Optional; object key prefix (default: none, files at bucket root)
#   AWS_REGION       - Optional; e.g. us-east-1 (default: from AWS CLI config)
#   AWS_PROFILE      - Optional; if using a named profile
#   PG_DUMP          - Optional; path to pg_dump (must match server major version, e.g. 17 for Supabase)
#

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Load .env.local first so PG_DUMP (and other vars) can be set there
if [ -f "$PROJECT_ROOT/.env.local" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$PROJECT_ROOT/.env.local"
  set +a
fi

# Prefer PG_DUMP env, then Homebrew postgresql@17 (Supabase uses Postgres 17), else PATH
if [ -n "${PG_DUMP}" ] && [ -x "${PG_DUMP}" ]; then
  PG_DUMP_CMD="${PG_DUMP}"
else
  BREW_PG17=""
  if command -v brew >/dev/null 2>&1; then
    BREW_PG17="$(brew --prefix postgresql@17 2>/dev/null)"
  fi
  if [ -n "$BREW_PG17" ] && [ -x "$BREW_PG17/bin/pg_dump" ]; then
    PG_DUMP_CMD="$BREW_PG17/bin/pg_dump"
  else
    PG_DUMP_CMD="pg_dump"
  fi
fi

if [ -z "${DATABASE_URL}" ]; then
  echo "Error: DATABASE_URL is not set." >&2
  echo "Get it from Supabase Dashboard → Project Settings → Database → Connection string (Session pooler, port 5432)." >&2
  echo "Add to .env.local or export before running." >&2
  exit 1
fi

if [ -z "${S3_BACKUP_BUCKET}" ]; then
  echo "Error: S3_BACKUP_BUCKET is not set." >&2
  echo "Add to .env.local or export before running." >&2
  exit 1
fi

# Optional prefix (e.g. "db-backups/"); default is empty = bucket root
PREFIX="${S3_BACKUP_PREFIX:-}"
PREFIX="${PREFIX%/}"
[ -n "$PREFIX" ] && PREFIX="$PREFIX/"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DUMP_NAME="supabase-dump-${TIMESTAMP}.dump.gz"
TMP_DIR="${TMPDIR:-/tmp}"
DUMP_PATH="${TMP_DIR}/${DUMP_NAME}"
S3_KEY="${PREFIX}${DUMP_NAME}"

# Supabase uses Postgres 17; pg_dump must be same major version or newer
PG_DUMP_VERSION=$("$PG_DUMP_CMD" --version 2>/dev/null | sed -n 's/.* \([0-9]*\)\.*.*/\1/p')
if [ -n "$PG_DUMP_VERSION" ] && [ "$PG_DUMP_VERSION" -lt 17 ]; then
  echo "Error: Supabase uses Postgres 17; your pg_dump is $PG_DUMP_VERSION." >&2
  echo "Install Postgres 17 client: brew install postgresql@17" >&2
  echo "Then re-run this script (it will use postgresql@17 automatically)." >&2
  exit 1
fi

echo "Creating logical backup (using $PG_DUMP_CMD)..."
DUMP_RAW="${TMP_DIR}/supabase-dump-${TIMESTAMP}.dump"
"$PG_DUMP_CMD" "$DATABASE_URL" \
  --no-owner \
  --no-privileges \
  --format=custom \
  --file="$DUMP_RAW"
gzip -c "$DUMP_RAW" > "$DUMP_PATH"
rm -f "$DUMP_RAW"

echo "Uploading to s3://${S3_BACKUP_BUCKET}/${S3_KEY}"
aws s3 cp "$DUMP_PATH" "s3://${S3_BACKUP_BUCKET}/${S3_KEY}" ${AWS_REGION:+--region "$AWS_REGION"}

rm -f "$DUMP_PATH"
echo "Done. Backup: s3://${S3_BACKUP_BUCKET}/${S3_KEY}"

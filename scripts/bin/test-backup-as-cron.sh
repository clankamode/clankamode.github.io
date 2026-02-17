#!/usr/bin/env bash
#
# Runs the database backup script in a cron-like environment (minimal PATH).
# Use this to verify the backup works when scheduled via crontab, without waiting for cron.
#
# Usage:
#   ./scripts/bin/test-backup-as-cron.sh
#
# Exits with the same code as the backup script (0 = success).
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup-db-to-s3.sh"

# Same PATH we recommend in crontab so brew + aws are found
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

echo "Testing backup with cron-like PATH: $PATH"
echo "---"
exec "$BACKUP_SCRIPT"

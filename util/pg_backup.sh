#!/bin/bash
# A simple script to back up a PostgreSQL database.

# --- Configuration ---
# !! Set these variables !!

DB_NAME="zumbamail"
DB_USER="postgres"
BACKUP_DIR="/var/backups/postgres"
PGPASS_FILE="~/.pgpass" # Path to your credential file

# --- End Configuration ---

# Exit immediately if a command exits with a non-zero status.
set -e
# Treat unset variables as an error
set -u
# Ensures that a pipeline's return status is the status of the last
# command to exit with a non-zero status, or zero if all exit successfully.
set -o pipefail

# Set PGPASSFILE environment variable
export PGPASSFILE=$PGPASS_FILE

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Create timestamp
TIMESTAMP=$(date +'%Y-%m-%d_%H-%M-%S')
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.bz2"

echo "Backing up '$DB_NAME' to $BACKUP_FILE..."

# Perform the backup using pg_dump, pipe to bzip2 for compression
# We specify -h localhost to ensure it uses the .pgpass file
#pg_dump -U "$DB_USER" -h localhost "$DB_NAME" | bzip2 > "$BACKUP_FILE"
pg_dump -U "$DB_USER" "$DB_NAME" | bzip2 > "$BACKUP_FILE"

echo "Backup complete."

# --- Optional Cleanup ---
# Check for the cleanup flag (e.g., ./pg_backup.sh -c 7)
if [ "${1:-}" == "-c" ] && [ -n "${2:-}" ]; then
    DAYS_TO_KEEP="$2"
    echo "Cleaning up backups older than $DAYS_TO_KEEP days..."
    
    # Find and delete files
    # -mtime +N means files modified more than N*24 hours ago.
    find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.bz2" -mtime +"$DAYS_TO_KEEP" -type f -delete
    
    echo "Cleanup complete."
fi
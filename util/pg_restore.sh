#!/bin/bash
# A simple script to restore a PostgreSQL database from a .sql.bz2 file.
# WARNING: This script DROPS and RE-CREATES the database.

# --- Configuration ---
# !! Set these variables !!

DB_NAME="zumbamail"
DB_USER="postgres" # This user MUST have CREATE DATABASE privileges
PGPASS_FILE="~/.pgpass" # Path to your credential file

# --- End Configuration ---

set -e
set -u
set -o pipefail

# Get backup file path from the first argument
BACKUP_FILE_PATH="$1"

# --- Validations ---
if [ -z "$BACKUP_FILE_PATH" ]; then
    echo "Error: You must provide the path to the backup file."
    echo "Usage: ./pg_restore.sh /path/to/backup.sql.bz2"
    exit 1
fi

if [ ! -f "$BACKUP_FILE_PATH" ]; then
    echo "Error: File not found: $BACKUP_FILE_PATH"
    exit 1
fi

# Set PGPASSFILE environment variable
export PGPASSFILE=$PGPASS_FILE

echo "--- WARNING ---"
echo "This script will DROP and RE-CREATE the database '$DB_NAME'."
read -p "Are you sure you want to continue? (y/n): " -n 1 -r
echo # Move to a new line
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

# --- Restore Process ---

echo "1. Dropping existing database '$DB_NAME'..."
# Connect to the 'postgres' maintenance database to drop our target DB
# psql -U "$DB_USER" -h localhost -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
 psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"

echo "2. Creating new database '$DB_NAME'..."
# Re-create the database, owned by our user
# psql -U "$DB_USER" -h localhost -d postgres -c "CREATE DATABASE \"$DB_NAME\" WITH OWNER \"$DB_USER\";"
psql -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\" WITH OWNER \"$DB_USER\";"

echo "3. Restoring data from $BACKUP_FILE_PATH..."
# Decompress the file and pipe the SQL to psql
#bunzip2 -c "$BACKUP_FILE_PATH" | psql -U "$DB_USER" -h localhost -d "$DB_NAME"
bunzip2 -c "$BACKUP_FILE_PATH" | psql -U "$DB_USER" -d "$DB_NAME"

echo "Restore complete."
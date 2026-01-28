#!/bin/bash

# Import Lichess puzzles on production server
# Usage: ./import-puzzles-remote.sh [limit]
# Example: ./import-puzzles-remote.sh 1000  (import first 1000 puzzles)
#          ./import-puzzles-remote.sh       (import all puzzles)

set -e

echo "🧩 Lichess Puzzles Import Script (Remote)"
echo "=========================================="
echo ""

# Server details
SERVER_USER="jan191"
SERVER_HOST="srv37.mikr.us"
SERVER_PATH="/var/www/chess-trainer"

# Optional limit parameter
LIMIT=${1:-0}

if [ $LIMIT -gt 0 ]; then
  echo "📊 Import limit: $LIMIT puzzles"
else
  echo "📊 Import limit: ALL puzzles"
fi

echo "🎯 Server: $SERVER_USER@$SERVER_HOST"
echo ""
echo "⚠️  You will be prompted for your SSH password"
echo ""
echo "This will:"
echo "  1. Decompress the .zst file"
echo "  2. Import puzzles into the production database"
echo "  3. Show progress and statistics"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Cancelled"
  exit 1
fi

echo ""
echo "🚀 Starting import..."
echo ""

# Run the import on the remote server
ssh "$SERVER_USER@$SERVER_HOST" << EOF
  set -e

  cd $SERVER_PATH/backend

  echo "📂 Current directory: \$(pwd)"
  echo ""

  # Check if the CSV file exists
  if [ ! -f "../lichess_db_puzzle.csv.zst" ]; then
    echo "❌ Error: lichess_db_puzzle.csv.zst not found in $SERVER_PATH"
    echo "   Please run ./upload-puzzles.sh first"
    exit 1
  fi

  # Decompress if needed
  if [ ! -f "../lichess_db_puzzle.csv" ]; then
    echo "📦 Decompressing lichess_db_puzzle.csv.zst..."
    zstd -d ../lichess_db_puzzle.csv.zst -o ../lichess_db_puzzle.csv
    echo "✅ Decompression complete"
    echo ""
  else
    echo "✅ CSV file already decompressed"
    echo ""
  fi

  # Run the import script with appropriate arguments
  echo "🔄 Running import script..."
  echo ""

  if [ $LIMIT -gt 0 ]; then
    echo "🔧 Importing first $LIMIT puzzles..."
    npm run import:puzzles -- ../lichess_db_puzzle.csv $LIMIT
  else
    echo "🔧 Importing ALL puzzles..."
    npm run import:puzzles -- ../lichess_db_puzzle.csv
  fi

  echo ""
  echo "✅ Import Complete!"
  echo ""
  echo "📊 To verify, check the puzzles count:"
  echo "   psql -h psql01.mikr.us -U jan191 -d db_jan191 -c 'SELECT COUNT(*) FROM puzzles;'"
EOF

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Import process finished successfully!"
  echo ""
  echo "🎯 Your puzzles are now available at: http://srv37.mikr.us:40105"
else
  echo ""
  echo "❌ Import failed! Check the output above for errors."
  exit 1
fi

#!/bin/bash

# Download Lichess puzzles directly on server and import them
# Usage: ./download-and-import-puzzles.sh [limit]
# Example: ./download-and-import-puzzles.sh 1000  (import first 1000 puzzles)
#          ./download-and-import-puzzles.sh       (import all puzzles)

set -e

echo "🧩 Lichess Puzzles Download & Import Script"
echo "============================================"
echo ""

# Server details
SERVER_USER="jan191"
SERVER_HOST="srv37.mikr.us"
SERVER_PATH="/var/www/chess-trainer"
LICHESS_URL="https://database.lichess.org/lichess_db_puzzle.csv.zst"

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
echo "  1. Download puzzles from Lichess (if not already present)"
echo "  2. Decompress the .zst file"
echo "  3. Import puzzles into the production database"
echo "  4. Show progress and statistics"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Cancelled"
  exit 1
fi

echo ""
echo "🚀 Starting download and import..."
echo ""

# Run everything on the remote server
ssh "$SERVER_USER@$SERVER_HOST" << EOF
  set -e

  cd $SERVER_PATH

  echo "📂 Current directory: \$(pwd)"
  echo ""

  # Download if not exists
  if [ ! -f "lichess_db_puzzle.csv.zst" ]; then
    echo "📥 Downloading Lichess puzzle database..."
    echo "   This may take a while (file is ~500MB compressed)..."
    echo ""
    wget --progress=bar:force "$LICHESS_URL" 2>&1 | grep --line-buffered "%" | sed -u 's/^/   /'
    echo ""
    echo "✅ Download complete"
    echo ""
  else
    echo "✅ Puzzle database already downloaded"
    echo ""
  fi

  # Decompress if needed
  if [ ! -f "lichess_db_puzzle.csv" ]; then
    echo "📦 Decompressing lichess_db_puzzle.csv.zst..."
    zstd -d lichess_db_puzzle.csv.zst -o lichess_db_puzzle.csv
    echo "✅ Decompression complete"
    echo ""
  else
    echo "✅ CSV file already decompressed"
    echo ""
  fi

  # Move to backend directory for import
  cd backend

  # Run the import script with appropriate arguments
  echo "🔄 Running import script..."
  echo ""

  if [ $LIMIT -gt 0 ]; then
    echo "🔧 Importing first $LIMIT puzzles..."
    npm run import:puzzles -- ../lichess_db_puzzle.csv $LIMIT
  else
    echo "🔧 Importing ALL puzzles..."
    echo "⚠️  WARNING: This can take hours for millions of puzzles!"
    echo ""
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
  echo "✅ Download and import process finished successfully!"
  echo ""
  echo "🎯 Your puzzles are now available at: http://srv37.mikr.us:40105"
else
  echo ""
  echo "❌ Process failed! Check the output above for errors."
  exit 1
fi

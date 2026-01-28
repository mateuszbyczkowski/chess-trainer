#!/bin/bash

# Import Lichess puzzles - Run this DIRECTLY ON THE SERVER
# Usage (on server):
#   cd /var/www/chess-trainer
#   ./server-import-puzzles.sh [limit]
#
# Examples:
#   ./server-import-puzzles.sh 100000  # Import first 100,000 puzzles
#   ./server-import-puzzles.sh         # Import all puzzles

set -e

echo "🧩 Lichess Puzzles Server Import Script"
echo "========================================"
echo ""

LICHESS_URL="https://database.lichess.org/lichess_db_puzzle.csv.zst"
LIMIT=${1:-0}

if [ $LIMIT -gt 0 ]; then
  echo "📊 Import limit: $LIMIT puzzles"
else
  echo "📊 Import limit: ALL puzzles"
  echo "⚠️  WARNING: This can take hours and may exceed database limits!"
fi

echo ""
echo "📂 Current directory: $(pwd)"
echo ""

read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Cancelled"
  exit 1
fi

echo ""

# Download if not exists
if [ ! -f "lichess_db_puzzle.csv.zst" ]; then
  echo "📥 Downloading Lichess puzzle database..."
  echo "   URL: $LICHESS_URL"
  echo "   This may take a while (file is ~500MB compressed)..."
  echo ""
  wget --progress=bar:force "$LICHESS_URL"
  echo ""
  echo "✅ Download complete"
  echo ""
else
  echo "✅ Puzzle database already downloaded"
  echo ""
fi

# Check for decompression tools
if [ ! -f "lichess_db_puzzle.csv" ]; then
  echo "📦 Decompressing lichess_db_puzzle.csv.zst..."

  # Try zstd first
  if command -v zstd &> /dev/null; then
    zstd -d lichess_db_puzzle.csv.zst -o lichess_db_puzzle.csv
    echo "✅ Decompression complete"
    echo ""
  # Try unzstd as fallback
  elif command -v unzstd &> /dev/null; then
    unzstd lichess_db_puzzle.csv.zst -o lichess_db_puzzle.csv
    echo "✅ Decompression complete"
    echo ""
  else
    echo "❌ ERROR: zstd decompression tool not found!"
    echo ""
    echo "Please install zstd:"
    echo "  sudo apt-get update && sudo apt-get install -y zstd"
    echo ""
    echo "Or if you don't have sudo access, contact your hosting provider."
    echo ""
    exit 1
  fi
else
  echo "✅ CSV file already decompressed"
  echo ""
fi

# Move to backend directory for import
cd backend

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
echo ""
echo "🎯 Your puzzles are now available at: http://srv37.mikr.us:40105"

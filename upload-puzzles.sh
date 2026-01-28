#!/bin/bash

# Upload Lichess puzzles database to production server
# Usage: ./upload-puzzles.sh

set -e

echo "📤 Lichess Puzzles Upload Script"
echo "================================="
echo ""

# Check if the puzzles file exists locally
PUZZLES_FILE="lichess_db_puzzle.csv.zst"
if [ ! -f "$PUZZLES_FILE" ]; then
  echo "❌ Error: $PUZZLES_FILE not found in current directory"
  exit 1
fi

# Get file size
FILE_SIZE=$(ls -lh "$PUZZLES_FILE" | awk '{print $5}')
echo "📁 Found: $PUZZLES_FILE ($FILE_SIZE)"
echo ""

# Server details
SERVER_USER="jan191"
SERVER_HOST="srv37.mikr.us"
SERVER_PATH="/var/www/chess-trainer"

echo "🎯 Uploading to: $SERVER_USER@$SERVER_HOST:$SERVER_PATH"
echo ""
echo "⚠️  You will be prompted for your SSH password"
echo ""

# Upload using scp (will prompt for password)
scp "$PUZZLES_FILE" "$SERVER_USER@$SERVER_HOST:$SERVER_PATH/"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Upload Complete!"
  echo ""
  echo "📍 File location on server: $SERVER_PATH/$PUZZLES_FILE"
  echo ""
  echo "Next steps:"
  echo "  1. Run: ./import-puzzles-remote.sh"
  echo "  2. Or manually: ssh $SERVER_USER@$SERVER_HOST"
  echo "                  cd $SERVER_PATH/backend"
  echo "                  npm run import:puzzles"
else
  echo ""
  echo "❌ Upload failed!"
  exit 1
fi

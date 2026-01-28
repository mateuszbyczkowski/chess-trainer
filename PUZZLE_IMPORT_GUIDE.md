# Lichess Puzzle Import Guide

This guide explains how to import chess puzzles from the Lichess database into your production server.

## Prerequisites

- SSH access to `jan191@srv37.mikr.us`
- Password for SSH authentication
- `zstd` decompression tool on server (install if needed: `sudo apt-get install -y zstd`)

## How to Import Puzzles

**Run commands directly on the server** - Best approach for reliability:

### Step 1: SSH into the server
```bash
ssh jan191@srv37.mikr.us
cd /var/www/chess-trainer
```

### Step 2: Copy the import script to the server (one-time setup)
```bash
wget https://raw.githubusercontent.com/mateuszbyczkowski/chess-trainer/main/server-import-puzzles.sh
chmod +x server-import-puzzles.sh
```

### Step 3: Run the import
```bash
# Import limited number (recommended)
./server-import-puzzles.sh 100000  # First 100,000 puzzles

# Or import all puzzles
./server-import-puzzles.sh
```

The script will:
1. Download the Lichess puzzle database from https://database.lichess.org
2. Decompress the `.zst` file
3. Import puzzles into the production database
4. Show progress and statistics

**Expected output:**
```
🧩 Lichess Puzzles Server Import Script
========================================

📊 Import limit: 100000 puzzles

📂 Current directory: /var/www/chess-trainer

Continue? (y/N) y

📥 Downloading Lichess puzzle database...
   URL: https://database.lichess.org/lichess_db_puzzle.csv.zst
   This may take a while (file is ~500MB compressed)...

✅ Download complete

📦 Decompressing lichess_db_puzzle.csv.zst...
✅ Decompression complete

🔄 Running import script...

🔧 Importing first 100000 puzzles...
🧩 Importing Lichess Puzzles...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% | 100000/100000 | ETA: 0s

📊 Import Statistics:
  Total Puzzles: 100000
  Successfully Imported: 99800
  Duplicates Skipped: 200
  Errors: 0

✅ Import Complete!
```

## Verification

After import, verify the puzzles were imported successfully:

```bash
# SSH into the server
ssh jan191@srv37.mikr.us

# Check puzzle count
psql -h psql01.mikr.us -U jan191 -d db_jan191 -c "SELECT COUNT(*) FROM puzzles;"

# Check theme distribution
psql -h psql01.mikr.us -U jan191 -d db_jan191 -c "
  SELECT theme, COUNT(*)
  FROM (SELECT UNNEST(themes) as theme FROM puzzles) t
  GROUP BY theme
  ORDER BY count DESC
  LIMIT 10;
"
```

## Troubleshooting

### "zstd: command not found"
- Install zstd on the server: `sudo apt-get update && sudo apt-get install -y zstd`
- If you don't have sudo access, contact your hosting provider

### "Connection refused" or "Permission denied"
- Check your SSH credentials
- Ensure you have access to `jan191@srv37.mikr.us`

### "Database connection error"
- Verify the backend `.env` file has correct DATABASE_URL
- Check PostgreSQL is running on `psql01.mikr.us:5432`

### Import is very slow
- The full Lichess database contains millions of puzzles
- Use a limit for faster testing: `./server-import-puzzles.sh 100000`
- Full import can take hours depending on server resources

### "Duplicate key error"
- Puzzles with existing `lichessPuzzleId` are automatically skipped
- This is normal if re-running the import

## Database Storage Considerations

**mikr.us Database Limits:**
- Database size limit: 200-300 MB
- Each puzzle takes approximately 500-800 bytes

**Estimated capacity:**
- 200MB = ~250,000 - 400,000 puzzles
- 300MB = ~375,000 - 600,000 puzzles

**Recommendations:**
1. Start with a limited import (50,000-100,000 puzzles for testing)
2. Monitor database size: `\l+` in psql or check mikr.us dashboard
3. Can import up to 400,000+ puzzles within the limit
4. Import more as needed based on usage

## Files

- `server-import-puzzles.sh` - Import script to run directly on server (recommended)
- `backend/src/scripts/import-puzzles-from-csv.ts` - Core import script (called by shell script)

## Production URLs

- **Backend API**: http://srv37.mikr.us:30191/api
- **Frontend**: http://srv37.mikr.us:40105
- **Database**: psql01.mikr.us:5432 (db_jan191)

---

**Last Updated:** 2026-01-27

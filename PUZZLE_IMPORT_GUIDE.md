# Lichess Puzzle Import Guide

This guide explains how to import chess puzzles from the Lichess database into your production server.

## Prerequisites

- SSH access to `jan191@srv37.mikr.us`
- Password for SSH authentication
- `zstd` decompression tool (already installed on server)

## Method 1: Manual SSH (Simplest) ⭐

**Best for network connectivity issues** - Run commands directly on the server:

### Step 1: SSH into the server
```bash
ssh jan191@srv37.mikr.us
cd /var/www/chess-trainer
```

### Step 2: Copy the import script to the server
```bash
# Copy the script content to server (one-time setup)
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

**Skip to "Verification" section below** if using this method.

---

## Method 2: Automated via SSH (From Local Machine)

**Requires network access to srv37.mikr.us from your machine:**

```bash
# Import limited number (recommended for testing)
./download-and-import-puzzles.sh 100000  # Import first 100,000 puzzles

# Or import all puzzles (may hit database limit)
./download-and-import-puzzles.sh
```

This script will SSH into the server and run the import automatically.

---

## Method 3: Upload from Local Machine

If you already have the file locally and have network access to the server:

### Prerequisites

1. **Download Lichess Puzzle Database**
   - Go to: https://database.lichess.org/#puzzles
   - Download the latest `lichess_db_puzzle.csv.zst` file
   - Place it in the project root directory

## Step 1: Upload Puzzles to Server

Upload the compressed puzzle database to the production server:

```bash
./upload-puzzles.sh
```

This script will:
- Check if `lichess_db_puzzle.csv.zst` exists locally
- Prompt for your SSH password
- Upload the file to `/var/www/chess-trainer/` on the server
- Show upload progress and file size

**Output:**
```
📤 Lichess Puzzles Upload Script
=================================

📁 Found: lichess_db_puzzle.csv.zst (123M)

🎯 Uploading to: jan191@srv37.mikr.us:/var/www/chess-trainer

⚠️  You will be prompted for your SSH password

[Password prompt]
lichess_db_puzzle.csv.zst   100%  123MB   5.2MB/s   00:23

✅ Upload Complete!
```

## Step 2: Import Puzzles into Database

Import the puzzles into your production PostgreSQL database:

```bash
# Import ALL puzzles (can take a while with millions of puzzles)
./import-puzzles-remote.sh

# OR import a limited number (recommended for testing)
./import-puzzles-remote.sh 1000    # Import first 1000 puzzles
./import-puzzles-remote.sh 10000   # Import first 10,000 puzzles
```

This script will:
1. Prompt for your SSH password
2. SSH into the server
3. Decompress the `.zst` file (if not already done)
4. Run the import script
5. Show progress (batch processing in groups of 100)
6. Display statistics when complete

**Output:**
```
🧩 Lichess Puzzles Import Script (Remote)
==========================================

📊 Import limit: 1000 puzzles
🎯 Server: jan191@srv37.mikr.us

⚠️  You will be prompted for your SSH password

This will:
  1. Decompress the .zst file
  2. Import puzzles into the production database
  3. Show progress and statistics

Continue? (y/N) y

🚀 Starting import...

📂 Current directory: /var/www/chess-trainer/backend

📦 Decompressing lichess_db_puzzle.csv.zst...
✅ Decompression complete

🔄 Running import script...

🔧 Importing first 1000 puzzles...
🧩 Importing Lichess Puzzles...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% | 1000/1000 | ETA: 0s

📊 Import Statistics:
  Total Puzzles: 1000
  Successfully Imported: 995
  Duplicates Skipped: 5
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

### "lichess_db_puzzle.csv.zst not found"
- Make sure the file is in the project root directory before running `upload-puzzles.sh`
- Download from: https://database.lichess.org/#puzzles

### "Connection refused" or "Permission denied"
- Check your SSH credentials
- Ensure you have access to `jan191@srv37.mikr.us`

### "Database connection error"
- Verify the backend `.env` file has correct DATABASE_URL
- Check PostgreSQL is running on `psql01.mikr.us:5432`

### Import is very slow
- The full Lichess database contains millions of puzzles
- Use a limit for faster testing: `./import-puzzles-remote.sh 1000`
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

- `server-import-puzzles.sh` - ⭐ Run directly on server (simplest, recommended)
- `download-and-import-puzzles.sh` - SSH in and import (requires network access from local)
- `upload-puzzles.sh` - Uploads CSV file to server via SCP (requires network access)
- `import-puzzles-remote.sh` - Runs import on server (if file already uploaded)
- `backend/src/scripts/import-puzzles-from-csv.ts` - Core import script (used by all methods)

## Production URLs

- **Backend API**: http://srv37.mikr.us:30191/api
- **Frontend**: http://srv37.mikr.us:40105
- **Database**: psql01.mikr.us:5432 (db_jan191)

---

**Last Updated:** 2026-01-27

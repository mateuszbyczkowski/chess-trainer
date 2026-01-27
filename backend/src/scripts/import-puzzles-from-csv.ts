import { DataSource } from "typeorm";
import { join } from "path";
import * as fs from "fs";
import * as readline from "readline";
import { config } from "dotenv";

// Load environment variables
config({ path: join(__dirname, "../../.env") });

/**
 * Import chess puzzles from Lichess CSV format
 *
 * CSV Format:
 * PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
 *
 * Usage:
 * 1. Download puzzles: https://database.lichess.org/#puzzles
 * 2. Extract: unzstd lichess_db_puzzle.csv.zst
 * 3. Place CSV file in project root
 * 4. Run: npm run import:puzzles -- <csv-file-path> [limit]
 *
 * Examples:
 * npm run import:puzzles -- lichess_db_puzzle.csv 1000
 * npm run import:puzzles -- lichess_db_puzzle.csv
 */

interface PuzzleData {
  lichessPuzzleId: string;
  fen: string;
  moves: string;
  rating: number;
  ratingDeviation?: number;
  popularity: number;
  nbPlays: number;
  themes: string[];
  gameUrl?: string;
  openingTags?: string[];
}

async function importPuzzlesFromCSV() {
  // Get CSV file path from command line args
  const csvFilePath = process.argv[2];
  const limit = process.argv[3] ? parseInt(process.argv[3]) : undefined;

  if (!csvFilePath) {
    console.error("❌ Please provide CSV file path");
    console.log("Usage: npm run import:puzzles -- <csv-file-path> [limit]");
    console.log("Example: npm run import:puzzles -- lichess_db_puzzle.csv 1000");
    process.exit(1);
  }

  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ File not found: ${csvFilePath}`);
    process.exit(1);
  }

  const dataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [join(__dirname, "../entities/**/*.entity{.ts,.js}")],
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log("✅ Database connection established");

    const puzzleRepository = dataSource.getRepository("Puzzle");

    // Check existing puzzles
    const existingCount = await puzzleRepository.count();
    console.log(`📊 Current puzzle count: ${existingCount}`);

    const fileStream = fs.createReadStream(csvFilePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let lineNumber = 0;
    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const batchSize = 100;
    let batch: PuzzleData[] = [];

    console.log(`📥 Starting import from ${csvFilePath}...`);
    if (limit) {
      console.log(`   Limiting to ${limit} puzzles`);
    }

    for await (const line of rl) {
      lineNumber++;

      // Skip header
      if (lineNumber === 1) {
        console.log(`📋 CSV Header: ${line}`);
        continue;
      }

      // Check limit
      if (limit && importedCount >= limit) {
        console.log(`✅ Reached import limit of ${limit} puzzles`);
        break;
      }

      try {
        // Parse CSV line (handle quoted fields)
        const columns = parseCSVLine(line);

        if (columns.length < 8) {
          console.warn(`⚠️  Line ${lineNumber}: Invalid format, skipping`);
          skippedCount++;
          continue;
        }

        const [
          puzzleId,
          fen,
          moves,
          rating,
          ratingDeviation,
          popularity,
          nbPlays,
          themes,
          gameUrl,
          openingTags,
        ] = columns;

        // Check if puzzle already exists
        const exists = await puzzleRepository.findOne({
          where: { lichessPuzzleId: puzzleId },
        });

        if (exists) {
          skippedCount++;
          continue;
        }

        const puzzleData: PuzzleData = {
          lichessPuzzleId: puzzleId,
          fen,
          moves,
          rating: parseInt(rating),
          ratingDeviation: ratingDeviation ? parseInt(ratingDeviation) : undefined,
          popularity: parseInt(popularity),
          nbPlays: parseInt(nbPlays),
          themes: themes ? themes.split(" ") : [],
          gameUrl: gameUrl || undefined,
          openingTags: openingTags ? openingTags.split(" ") : [],
        };

        batch.push(puzzleData);

        // Save batch
        if (batch.length >= batchSize) {
          await puzzleRepository.save(batch);
          importedCount += batch.length;
          console.log(`   Progress: ${importedCount} puzzles imported...`);
          batch = [];
        }
      } catch (error) {
        console.error(`❌ Error on line ${lineNumber}:`, error);
        errorCount++;
        if (errorCount > 100) {
          console.error("❌ Too many errors, aborting import");
          break;
        }
      }
    }

    // Save remaining batch
    if (batch.length > 0) {
      await puzzleRepository.save(batch);
      importedCount += batch.length;
    }

    const finalCount = await puzzleRepository.count();

    console.log("\n✅ Import complete!");
    console.log(`   Total lines processed: ${lineNumber - 1}`);
    console.log(`   Puzzles imported: ${importedCount}`);
    console.log(`   Puzzles skipped: ${skippedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Final puzzle count: ${finalCount}`);

    // Show stats
    console.log("\n📊 Database statistics:");

    const ratingDistribution = await puzzleRepository
      .createQueryBuilder("puzzle")
      .select("FLOOR(rating / 200) * 200", "rating_range")
      .addSelect("COUNT(*)", "count")
      .groupBy("rating_range")
      .orderBy("rating_range", "ASC")
      .getRawMany();

    console.log("\n   Rating distribution:");
    ratingDistribution.forEach((r: any) => {
      const range = `${r.rating_range}-${parseInt(r.rating_range) + 199}`;
      console.log(`   ${range}: ${r.count} puzzles`);
    });

    const topThemes = await puzzleRepository
      .createQueryBuilder("puzzle")
      .select("UNNEST(puzzle.themes)", "theme")
      .addSelect("COUNT(*)", "count")
      .groupBy("theme")
      .orderBy("count", "DESC")
      .limit(10)
      .getRawMany();

    console.log("\n   Top 10 themes:");
    topThemes.forEach((t: any) => {
      console.log(`   ${t.theme}: ${t.count}`);
    });

    await dataSource.destroy();
  } catch (error) {
    console.error("❌ Import failed:", error);
    await dataSource.destroy();
    process.exit(1);
  }
}

/**
 * Parse CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

importPuzzlesFromCSV();

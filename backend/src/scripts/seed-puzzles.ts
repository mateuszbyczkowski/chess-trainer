import { DataSource } from "typeorm";
import { join } from "path";
import { config } from "dotenv";
import { v4 as uuidv4 } from "uuid";

interface ThemeCount {
  theme: string;
  count: string;
}

// Load environment variables
config({ path: join(__dirname, "../../.env") });

// Sample puzzles from Lichess database with various themes and ratings
const samplePuzzles = [
  {
    lichessPuzzleId: "00008",
    fen: "r6k/pp2r2p/4Rp1Q/3p4/8/1N1P2R1/PqP2bPP/7K b - - 0 24",
    moves: "f2g3 e6e7 b2b1 b3c1 b1c1 h6c1",
    rating: 1700,
    popularity: 95,
    nbPlays: 5832,
    themes: ["mate", "mateIn2", "sacrifice"],
    openingTags: ["Italian_Game"],
    gameUrl: "https://lichess.org/yyznGmXs#48",
  },
  {
    lichessPuzzleId: "0000D",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    moves: "h5f7 e8f7 c4d5 f7e8 d5c6 d7c6",
    rating: 1200,
    popularity: 98,
    nbPlays: 12450,
    themes: ["fork", "opening", "short"],
    openingTags: ["Italian_Game", "Fried_Liver_Attack"],
    gameUrl: "https://lichess.org/example1",
  },
  {
    lichessPuzzleId: "0000H",
    fen: "5rk1/1p1q2bp/p2pN1p1/2pP2Bn/2P3P1/1P6/P4QKP/5R2 w - - 2 26",
    moves: "f2f8 g8h7 f8f7 d7f7 e6f8 h7g8 f8g6",
    rating: 1850,
    popularity: 92,
    nbPlays: 3421,
    themes: ["middlegame", "sacrifice", "advantage"],
    openingTags: ["Queens_Gambit"],
    gameUrl: "https://lichess.org/example2",
  },
  {
    lichessPuzzleId: "0000K",
    fen: "2r3k1/5pp1/p2p3p/1p1Pp2P/4P3/1P3P2/P1R3PK/8 w - - 0 28",
    moves: "c2c8 g8h7 c8c7 h7g8",
    rating: 1450,
    popularity: 89,
    nbPlays: 4567,
    themes: ["endgame", "rookEndgame", "advantage"],
    openingTags: ["Queens_Pawn_Game"],
    gameUrl: "https://lichess.org/example3",
  },
  {
    lichessPuzzleId: "0000M",
    fen: "r1bqk2r/ppp2ppp/2np1n2/2b1p3/2B1P3/2PP1N2/PP3PPP/RNBQK2R w KQkq - 0 6",
    moves: "c4f7 e8f7 f3g5 f7e8 d1f3 d8e7 f3f7",
    rating: 1300,
    popularity: 94,
    nbPlays: 8934,
    themes: ["opening", "sacrifice", "attackingF7"],
    openingTags: ["Italian_Game"],
    gameUrl: "https://lichess.org/example4",
  },
  {
    lichessPuzzleId: "0000P",
    fen: "3r2k1/p4ppp/1p6/nP1p4/P2P4/4PP2/5PKP/2R5 b - - 0 26",
    moves: "d8c8 c1c8 a5c6",
    rating: 1600,
    popularity: 87,
    nbPlays: 2345,
    themes: ["endgame", "rookEndgame", "simplification"],
    openingTags: ["English_Opening"],
    gameUrl: "https://lichess.org/example5",
  },
  {
    lichessPuzzleId: "0000R",
    fen: "r1b2rk1/5ppp/p7/1p1pP3/3n4/P4N1P/1P3PP1/R3R1K1 w - - 0 18",
    moves: "e1e4 d4f3 g2f3 d5e4 f3e4",
    rating: 1500,
    popularity: 90,
    nbPlays: 5678,
    themes: ["middlegame", "advantage", "exchange"],
    openingTags: ["Scandinavian_Defense"],
    gameUrl: "https://lichess.org/example6",
  },
  {
    lichessPuzzleId: "0000T",
    fen: "r2qkb1r/pp3ppp/2n1pn2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 7",
    moves: "d4d5 e6d5 c4d5 c6e7 f3g5",
    rating: 1400,
    popularity: 91,
    nbPlays: 7890,
    themes: ["opening", "advantage", "advancedPawn"],
    openingTags: ["Queens_Gambit_Declined"],
    gameUrl: "https://lichess.org/example7",
  },
  {
    lichessPuzzleId: "0000V",
    fen: "2rq1rk1/pb1n1pp1/1p2pn1p/3p4/N2P1B2/1P2PN2/P1PQ1PPP/2R2RK1 w - - 0 14",
    moves: "f4d6 d7f6 d6f8 f6d5",
    rating: 1750,
    popularity: 88,
    nbPlays: 3456,
    themes: ["middlegame", "pin", "advantage"],
    openingTags: ["Queens_Indian_Defense"],
    gameUrl: "https://lichess.org/example8",
  },
  {
    lichessPuzzleId: "0000X",
    fen: "r4rk1/1bqnbppp/p2ppn2/1p6/3NPP2/1BN1B3/PPPQ2PP/2KR3R w - - 0 14",
    moves: "d4f5 e6f5 e3h6 g7h6 d2h6 f8e8",
    rating: 1900,
    popularity: 93,
    nbPlays: 4123,
    themes: ["middlegame", "sacrifice", "attack"],
    openingTags: ["Sicilian_Defense"],
    gameUrl: "https://lichess.org/example9",
  },
  {
    lichessPuzzleId: "0000Z",
    fen: "6k1/5p2/p5p1/1p2B2p/1P2P2P/P4PP1/7K/8 w - - 0 37",
    moves: "e5f6 g8f8 f6h8",
    rating: 1550,
    popularity: 86,
    nbPlays: 2789,
    themes: ["endgame", "bishopEndgame", "advantage"],
    openingTags: ["Kings_Pawn_Opening"],
    gameUrl: "https://lichess.org/example10",
  },
  {
    lichessPuzzleId: "00012",
    fen: "r1bq1rk1/ppp2ppp/2n2n2/3p4/1bPP4/2N1PN2/PP3PPP/R1BQKB1R w KQ - 0 7",
    moves: "a2a3 b4c3 b2c3",
    rating: 1100,
    popularity: 96,
    nbPlays: 9876,
    themes: ["opening", "advantage", "capturingDefender"],
    openingTags: ["Queens_Gambit_Declined"],
    gameUrl: "https://lichess.org/example11",
  },
  {
    lichessPuzzleId: "00015",
    fen: "r2qk2r/ppp1bppp/2n5/3pPb2/3Pn3/3B1N2/PPP2PPP/RNBQR1K1 w kq - 0 9",
    moves: "d3e4 d5e4 d1d8 e8d8 b1c3 e4c3 b2c3",
    rating: 1650,
    popularity: 89,
    nbPlays: 4321,
    themes: ["middlegame", "advantage", "trade"],
    openingTags: ["French_Defense"],
    gameUrl: "https://lichess.org/example12",
  },
  {
    lichessPuzzleId: "00018",
    fen: "2kr3r/ppp2p1p/2n3p1/4q3/4n3/1P1B1P2/PBP1Q1PP/R4RK1 w - - 0 16",
    moves: "e2e4 c6e5 e4e5 e5e5 a1d1",
    rating: 1800,
    popularity: 91,
    nbPlays: 3987,
    themes: ["middlegame", "advantage", "trade"],
    openingTags: ["Caro_Kann_Defense"],
    gameUrl: "https://lichess.org/example13",
  },
  {
    lichessPuzzleId: "0001B",
    fen: "r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5",
    moves: "b1c3 e4c3 d2c3",
    rating: 1250,
    popularity: 97,
    nbPlays: 11234,
    themes: ["opening", "advantage", "developingAttack"],
    openingTags: ["Italian_Game"],
    gameUrl: "https://lichess.org/example14",
  },
  {
    lichessPuzzleId: "0001D",
    fen: "8/8/4k3/3p1p2/3P1P2/4K3/8/8 w - - 0 50",
    moves: "e3d3 e6d6 d3c3 d6c6 c3d3",
    rating: 1350,
    popularity: 85,
    nbPlays: 1987,
    themes: ["endgame", "pawnEndgame", "zugzwang"],
    openingTags: [],
    gameUrl: "https://lichess.org/example15",
  },
  {
    lichessPuzzleId: "0001F",
    fen: "5rk1/pp1b1ppp/8/2pP4/2Pn4/6P1/PP3P1P/R1B2RK1 w - - 0 18",
    moves: "c1d2 d4f3 g1h1 f3d2 a1d1",
    rating: 1700,
    popularity: 88,
    nbPlays: 3456,
    themes: ["middlegame", "advantage", "trade"],
    openingTags: ["Slav_Defense"],
    gameUrl: "https://lichess.org/example16",
  },
  {
    lichessPuzzleId: "0001H",
    fen: "r4rk1/1ppq1ppp/p1n5/3pPb2/1P1P4/2PB1N2/P4PPP/R1BQR1K1 w - - 0 15",
    moves: "c3c4 d5c4 d3c4 c6e5 c1e3",
    rating: 1950,
    popularity: 90,
    nbPlays: 2987,
    themes: ["middlegame", "advantage", "discoveredAttack"],
    openingTags: ["French_Defense"],
    gameUrl: "https://lichess.org/example17",
  },
  {
    lichessPuzzleId: "0001K",
    fen: "r1bqk2r/pp3ppp/2n1pn2/2pp4/1bPP4/1P2PN2/PB1N1PPP/R2QKB1R w KQkq - 0 8",
    moves: "a2a3 b4d2 d1d2 c5d4 f3d4",
    rating: 1500,
    popularity: 92,
    nbPlays: 6543,
    themes: ["opening", "advantage", "capturingDefender"],
    openingTags: ["Queens_Gambit_Declined"],
    gameUrl: "https://lichess.org/example18",
  },
  {
    lichessPuzzleId: "0001M",
    fen: "3r2k1/5ppp/1p6/p1qPp3/P1P1P3/1P3P2/5PKP/2RQ4 w - - 0 28",
    moves: "d1a1 c5c4 b3c4 d8d5 a1a5",
    rating: 2000,
    popularity: 87,
    nbPlays: 2345,
    themes: ["endgame", "advantage", "simplification"],
    openingTags: ["English_Opening"],
    gameUrl: "https://lichess.org/example19",
  },
];

async function seedPuzzles() {
  const dataSource = new DataSource({
    type: "postgres",
    url:
      process.env.DATABASE_URL ||
      "postgresql://chess_trainer:chess_trainer_password@localhost:5432/chess_trainer_dev",
    entities: [join(__dirname, "../entities/**/*.entity{.ts,.js}")],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log("✅ Database connection established");

    const puzzleRepository = dataSource.getRepository("Puzzle");

    // Check if puzzles already exist
    const existingCount = await puzzleRepository.count();
    console.log(`📊 Current puzzle count: ${existingCount}`);

    if (existingCount > 0) {
      console.log("⚠️  Puzzles already exist. Skipping seed.");
      console.log("   To re-seed, run: npm run db:reset");
      await dataSource.destroy();
      return;
    }

    // Insert sample puzzles
    console.log(`📥 Inserting ${samplePuzzles.length} sample puzzles...`);

    for (const puzzleData of samplePuzzles) {
      await puzzleRepository.save({
        id: uuidv4(), // Generate UUID in application
        ...puzzleData,
      });
    }

    const newCount = await puzzleRepository.count();
    console.log(`✅ Successfully seeded ${newCount} puzzles!`);

    // Show some stats
    const themes = await puzzleRepository
      .createQueryBuilder("puzzle")
      .select("UNNEST(puzzle.themes)", "theme")
      .addSelect("COUNT(*)", "count")
      .groupBy("theme")
      .orderBy("count", "DESC")
      .limit(10)
      .getRawMany();

    console.log("\n📊 Top themes in database:");
    themes.forEach((t: ThemeCount) => {
      console.log(`   ${t.theme}: ${t.count}`);
    });

    await dataSource.destroy();
    console.log("\n✅ Seed complete!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedPuzzles();

import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { DataSource } from "typeorm";
import { v4 as uuidv4 } from "uuid";

interface AttemptResponse {
  id: string;
  userId: string;
  puzzleId: string;
  solved: boolean;
  moves: string[];
  timeSpentSeconds: number;
  hintsUsed: number;
  attemptNumber: number;
  attemptedAt?: string;
  puzzle?: unknown;
}

// Sample puzzles for testing
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
];

describe("Puzzle Solving E2E Test", () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same global configuration as in main.ts
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    // Seed sample puzzles for testing
    const dataSource = app.get(DataSource);
    const puzzleRepository = dataSource.getRepository("Puzzle");

    // Check if puzzles already exist
    const existingCount = await puzzleRepository.count();

    if (existingCount === 0) {
      // Insert sample puzzles
      for (const puzzleData of samplePuzzles) {
        await puzzleRepository.save({
          id: uuidv4(),
          ...puzzleData,
        });
      }
      console.log(`✅ Seeded ${samplePuzzles.length} test puzzles`);
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it("should complete full puzzle solving flow: create guest user, fetch puzzle, solve, and verify saved attempt", async () => {
    // Step 1: Create a guest user and authenticate
    const guestResponse = await request(app.getHttpServer())
      .post("/api/auth/guest")
      .expect(201);

    expect(guestResponse.body).toHaveProperty("accessToken");
    expect(guestResponse.body).toHaveProperty("user");
    expect(guestResponse.body.user).toHaveProperty("id");
    expect(guestResponse.body.user.isGuest).toBe(true);

    authToken = guestResponse.body.accessToken;
    userId = guestResponse.body.user.id;

    // Step 2: Fetch a random puzzle
    const puzzleResponse = await request(app.getHttpServer())
      .get("/api/puzzles/random")
      .expect(200);

    expect(puzzleResponse.body).toHaveProperty("id");
    expect(puzzleResponse.body).toHaveProperty("fen");
    expect(puzzleResponse.body).toHaveProperty("moves");

    const puzzleId = puzzleResponse.body.id;
    const puzzleMoves = puzzleResponse.body.moves;

    // Ensure moves is a string (puzzle stores as string, attempt expects string)
    const movesString =
      typeof puzzleMoves === "string" ? puzzleMoves : puzzleMoves.join(" ");

    // Step 3: Submit a solved attempt for the puzzle
    const attemptData = {
      puzzleId: puzzleId,
      solved: true,
      movesMade: movesString, // Using the correct solution moves as string
      timeSpent: 45,
    };

    const attemptResponse = await request(app.getHttpServer())
      .post("/api/attempts")
      .set("Authorization", `Bearer ${authToken}`)
      .send(attemptData)
      .expect(201);

    expect(attemptResponse.body).toHaveProperty("id");
    expect(attemptResponse.body.userId).toBe(userId);
    expect(attemptResponse.body.puzzleId).toBe(puzzleId);
    expect(attemptResponse.body.solved).toBe(true);
    expect(attemptResponse.body.moves).toEqual(movesString.split(" ").filter((m: string) => m.length > 0));

    const attemptId = attemptResponse.body.id;

    // Step 4: Verify the attempt was saved by fetching user's attempt history
    const historyResponse = await request(app.getHttpServer())
      .get("/api/attempts/history?limit=50&offset=0")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(historyResponse.body)).toBe(true);
    expect(historyResponse.body.length).toBeGreaterThan(0);

    // Find the attempt we just created
    const savedAttempt = historyResponse.body.find(
      (attempt: AttemptResponse) => attempt.id === attemptId,
    );

    expect(savedAttempt).toBeDefined();
    expect(savedAttempt.userId).toBe(userId);
    expect(savedAttempt.puzzleId).toBe(puzzleId);
    expect(savedAttempt.solved).toBe(true);
    expect(savedAttempt.moves).toEqual(movesString.split(" ").filter((m: string) => m.length > 0));
    expect(savedAttempt.timeSpentSeconds).toBe(45);
    expect(savedAttempt.hintsUsed).toBe(0);
    expect(savedAttempt).toHaveProperty("puzzle");
  });
});

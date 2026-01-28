import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";

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

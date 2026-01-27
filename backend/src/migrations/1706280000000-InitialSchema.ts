import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1706280000000 implements MigrationInterface {
  name = "InitialSchema1706280000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL,
        "lichess_id" character varying(50),
        "lichess_username" character varying(50),
        "google_id" character varying(255),
        "email" character varying(255),
        "display_name" character varying(100) NOT NULL,
        "avatar_url" text,
        "lichess_rating" integer,
        "lichess_rating_synced_at" TIMESTAMP,
        "is_guest" boolean NOT NULL DEFAULT false,
        "ai_enabled" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_lichess_id" UNIQUE ("lichess_id"),
        CONSTRAINT "UQ_users_google_id" UNIQUE ("google_id"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_users_lichess_id" ON "users" ("lichess_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_users_google_id" ON "users" ("google_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_users_email" ON "users" ("email")
    `);

    // Create puzzles table
    await queryRunner.query(`
      CREATE TABLE "puzzles" (
        "id" uuid NOT NULL,
        "lichess_puzzle_id" character varying(20) NOT NULL,
        "fen" text NOT NULL,
        "moves" text NOT NULL,
        "rating" integer NOT NULL,
        "rating_deviation" integer,
        "popularity" integer NOT NULL DEFAULT 0,
        "nb_plays" integer NOT NULL DEFAULT 0,
        "themes" text[] NOT NULL DEFAULT '{}',
        "game_url" text,
        "opening_tags" text[] DEFAULT '{}',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_puzzles_lichess_puzzle_id" UNIQUE ("lichess_puzzle_id"),
        CONSTRAINT "PK_puzzles_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_puzzles_lichess_id" ON "puzzles" ("lichess_puzzle_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_puzzles_rating" ON "puzzles" ("rating")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_puzzles_themes" ON "puzzles" USING GIN ("themes")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_puzzles_opening_tags" ON "puzzles" USING GIN ("opening_tags")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_puzzles_popularity" ON "puzzles" ("popularity" DESC)
    `);

    // Create training_sessions table
    await queryRunner.query(`
      CREATE TABLE "training_sessions" (
        "id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "name" character varying(255),
        "themes" text[] NOT NULL DEFAULT '{}',
        "target_count" integer NOT NULL DEFAULT 100,
        "completed_count" integer NOT NULL DEFAULT 0,
        "accuracy" decimal(5,2) NOT NULL DEFAULT 0,
        "started_at" TIMESTAMP NOT NULL DEFAULT now(),
        "completed_at" TIMESTAMP,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_training_sessions_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_sessions_user_id" ON "training_sessions" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_sessions_is_active" ON "training_sessions" ("is_active")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_sessions_started_at" ON "training_sessions" ("started_at" DESC)
    `);

    // Create puzzle_attempts table
    await queryRunner.query(`
      CREATE TABLE "puzzle_attempts" (
        "id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "puzzle_id" uuid NOT NULL,
        "session_id" uuid,
        "solved" boolean NOT NULL,
        "moves" text[] NOT NULL DEFAULT '{}',
        "time_spent_seconds" integer NOT NULL DEFAULT 0,
        "hints_used" integer NOT NULL DEFAULT 0,
        "attempt_number" integer NOT NULL DEFAULT 1,
        "attempted_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_puzzle_attempts_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_attempts_user_id" ON "puzzle_attempts" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_attempts_puzzle_id" ON "puzzle_attempts" ("puzzle_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_attempts_session_id" ON "puzzle_attempts" ("session_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_attempts_attempted_at" ON "puzzle_attempts" ("attempted_at" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_attempts_user_solved" ON "puzzle_attempts" ("user_id", "solved")
    `);

    // Create session_puzzles table
    await queryRunner.query(`
      CREATE TABLE "session_puzzles" (
        "id" uuid NOT NULL,
        "session_id" uuid NOT NULL,
        "puzzle_id" uuid NOT NULL,
        "order_index" integer NOT NULL,
        "completed" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_session_puzzles_session_puzzle" UNIQUE ("session_id", "puzzle_id"),
        CONSTRAINT "PK_session_puzzles_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_session_puzzles_session_id" ON "session_puzzles" ("session_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_session_puzzles_order" ON "session_puzzles" ("session_id", "order_index")
    `);

    // Create daily_puzzles table
    await queryRunner.query(`
      CREATE TABLE "daily_puzzles" (
        "id" uuid NOT NULL,
        "puzzle_id" uuid NOT NULL,
        "date" date NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_daily_puzzles_date" UNIQUE ("date"),
        CONSTRAINT "PK_daily_puzzles_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_daily_puzzles_date" ON "daily_puzzles" ("date" DESC)
    `);

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "training_sessions"
      ADD CONSTRAINT "FK_training_sessions_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "puzzle_attempts"
      ADD CONSTRAINT "FK_puzzle_attempts_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "puzzle_attempts"
      ADD CONSTRAINT "FK_puzzle_attempts_puzzle_id"
      FOREIGN KEY ("puzzle_id") REFERENCES "puzzles"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "puzzle_attempts"
      ADD CONSTRAINT "FK_puzzle_attempts_session_id"
      FOREIGN KEY ("session_id") REFERENCES "training_sessions"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "session_puzzles"
      ADD CONSTRAINT "FK_session_puzzles_session_id"
      FOREIGN KEY ("session_id") REFERENCES "training_sessions"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "session_puzzles"
      ADD CONSTRAINT "FK_session_puzzles_puzzle_id"
      FOREIGN KEY ("puzzle_id") REFERENCES "puzzles"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "daily_puzzles"
      ADD CONSTRAINT "FK_daily_puzzles_puzzle_id"
      FOREIGN KEY ("puzzle_id") REFERENCES "puzzles"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(
      `ALTER TABLE "daily_puzzles" DROP CONSTRAINT "FK_daily_puzzles_puzzle_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "session_puzzles" DROP CONSTRAINT "FK_session_puzzles_puzzle_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "session_puzzles" DROP CONSTRAINT "FK_session_puzzles_session_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "puzzle_attempts" DROP CONSTRAINT "FK_puzzle_attempts_session_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "puzzle_attempts" DROP CONSTRAINT "FK_puzzle_attempts_puzzle_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "puzzle_attempts" DROP CONSTRAINT "FK_puzzle_attempts_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_sessions" DROP CONSTRAINT "FK_training_sessions_user_id"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE "daily_puzzles"`);
    await queryRunner.query(`DROP TABLE "session_puzzles"`);
    await queryRunner.query(`DROP TABLE "puzzle_attempts"`);
    await queryRunner.query(`DROP TABLE "training_sessions"`);
    await queryRunner.query(`DROP TABLE "puzzles"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}

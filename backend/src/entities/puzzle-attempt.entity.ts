import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./user.entity";
import { Puzzle } from "./puzzle.entity";
import { TrainingSession } from "./training-session.entity";

@Entity("puzzle_attempts")
@Index("idx_attempts_user_id", ["userId"])
@Index("idx_attempts_puzzle_id", ["puzzleId"])
@Index("idx_attempts_session_id", ["sessionId"])
@Index("idx_attempts_attempted_at", ["attemptedAt"])
@Index("idx_attempts_user_solved", ["userId", "solved"])
export class PuzzleAttempt {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ name: "puzzle_id", type: "uuid" })
  puzzleId: string;

  @Column({ name: "session_id", type: "uuid", nullable: true })
  sessionId: string | null;

  @Column({ type: "boolean" })
  solved: boolean;

  @Column({ type: "text", array: true, default: "{}" })
  moves: string[];

  @Column({ name: "time_spent_seconds", type: "integer", default: 0 })
  timeSpentSeconds: number;

  @Column({ name: "hints_used", type: "integer", default: 0 })
  hintsUsed: number;

  @Column({ name: "attempt_number", type: "integer", default: 1 })
  attemptNumber: number;

  @CreateDateColumn({ name: "attempted_at" })
  attemptedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.attempts, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Puzzle, (puzzle) => puzzle.attempts, { onDelete: "CASCADE" })
  @JoinColumn({ name: "puzzle_id" })
  puzzle: Puzzle;

  @ManyToOne(() => TrainingSession, (session) => session.attempts, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "session_id" })
  session: TrainingSession | null;
}

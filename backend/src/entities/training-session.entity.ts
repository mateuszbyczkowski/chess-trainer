import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./user.entity";
import { PuzzleAttempt } from "./puzzle-attempt.entity";
import { SessionPuzzle } from "./session-puzzle.entity";

@Entity("training_sessions")
@Index("idx_sessions_user_id", ["userId"])
@Index("idx_sessions_is_active", ["isActive"])
@Index("idx_sessions_started_at", ["startedAt"])
export class TrainingSession {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  name: string | null;

  @Column({ type: "text", array: true, default: "{}" })
  themes: string[];

  @Column({ name: "target_count", type: "integer", default: 100 })
  targetCount: number;

  @Column({ name: "completed_count", type: "integer", default: 0 })
  completedCount: number;

  @Column({ type: "decimal", precision: 5, scale: 2, default: 0 })
  accuracy: number;

  @CreateDateColumn({ name: "started_at" })
  startedAt: Date;

  @Column({ name: "completed_at", type: "timestamp", nullable: true })
  completedAt: Date | null;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean;

  // Relations
  @ManyToOne(() => User, (user) => user.trainingSessions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  @OneToMany(() => PuzzleAttempt, (attempt) => attempt.session)
  attempts: PuzzleAttempt[];

  @OneToMany(() => SessionPuzzle, (sessionPuzzle) => sessionPuzzle.session)
  sessionPuzzles: SessionPuzzle[];
}

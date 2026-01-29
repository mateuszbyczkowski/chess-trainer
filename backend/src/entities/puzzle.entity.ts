import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { PuzzleAttempt } from "./puzzle-attempt.entity";
import { DailyPuzzle } from "./daily-puzzle.entity";
import { SessionPuzzle } from "./session-puzzle.entity";

@Entity("puzzles")
@Index("idx_puzzles_rating", ["rating"])
@Index("idx_puzzles_themes", ["themes"])
@Index("idx_puzzles_opening_tags", ["openingTags"])
@Index("idx_puzzles_popularity", ["popularity"])
export class Puzzle {
  @PrimaryColumn("uuid")
  id: string;

  @Column({
    name: "lichess_puzzle_id",
    type: "varchar",
    length: 20,
    unique: true,
  })
  lichessPuzzleId: string;

  @Column({ type: "text" })
  fen: string;

  @Column({ type: "text" })
  moves: string;

  @Column({ type: "integer" })
  rating: number;

  @Column({ name: "rating_deviation", type: "integer", nullable: true })
  ratingDeviation: number | null;

  @Column({ type: "integer", default: 0 })
  popularity: number;

  @Column({ name: "nb_plays", type: "integer", default: 0 })
  nbPlays: number;

  @Column({ type: "text", array: true, default: "{}" })
  themes: string[];

  @Column({ name: "game_url", type: "text", nullable: true })
  gameUrl: string | null;

  @Column({
    name: "opening_tags",
    type: "text",
    array: true,
    default: "{}",
    nullable: true,
  })
  openingTags: string[] | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  // Relations
  @OneToMany(() => PuzzleAttempt, (attempt) => attempt.puzzle)
  attempts: PuzzleAttempt[];

  @OneToMany(() => DailyPuzzle, (daily) => daily.puzzle)
  dailyPuzzles: DailyPuzzle[];

  @OneToMany(() => SessionPuzzle, (sessionPuzzle) => sessionPuzzle.puzzle)
  sessionPuzzles: SessionPuzzle[];
}

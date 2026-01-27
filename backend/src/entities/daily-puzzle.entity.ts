import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Puzzle } from './puzzle.entity';

@Entity('daily_puzzles')
@Index('idx_daily_puzzles_date', ['date'])
export class DailyPuzzle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'puzzle_id', type: 'uuid' })
  puzzleId: string;

  @Column({ type: 'date', unique: true })
  date: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Puzzle, (puzzle) => puzzle.dailyPuzzles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'puzzle_id' })
  puzzle: Puzzle;
}

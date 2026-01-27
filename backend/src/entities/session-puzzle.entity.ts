import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { TrainingSession } from './training-session.entity';
import { Puzzle } from './puzzle.entity';

@Entity('session_puzzles')
@Unique(['sessionId', 'puzzleId'])
@Index('idx_session_puzzles_session_id', ['sessionId'])
@Index('idx_session_puzzles_order', ['sessionId', 'orderIndex'])
export class SessionPuzzle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @Column({ name: 'puzzle_id', type: 'uuid' })
  puzzleId: string;

  @Column({ name: 'order_index', type: 'integer' })
  orderIndex: number;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => TrainingSession, (session) => session.sessionPuzzles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: TrainingSession;

  @ManyToOne(() => Puzzle, (puzzle) => puzzle.sessionPuzzles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'puzzle_id' })
  puzzle: Puzzle;
}

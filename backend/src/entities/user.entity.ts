import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PuzzleAttempt } from './puzzle-attempt.entity';
import { TrainingSession } from './training-session.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'lichess_id', type: 'varchar', length: 50, nullable: true, unique: true })
  lichessId: string | null;

  @Column({ name: 'lichess_username', type: 'varchar', length: 50, nullable: true })
  lichessUsername: string | null;

  @Column({ name: 'google_id', type: 'varchar', length: 255, nullable: true, unique: true })
  googleId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ name: 'display_name', type: 'varchar', length: 100 })
  displayName: string;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'lichess_rating', type: 'integer', nullable: true })
  lichessRating: number | null;

  @Column({ name: 'lichess_rating_synced_at', type: 'timestamp', nullable: true })
  lichessRatingSyncedAt: Date | null;

  @Column({ name: 'is_guest', type: 'boolean', default: false })
  isGuest: boolean;

  @Column({ name: 'ai_enabled', type: 'boolean', default: false })
  aiEnabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => PuzzleAttempt, (attempt) => attempt.user)
  attempts: PuzzleAttempt[];

  @OneToMany(() => TrainingSession, (session) => session.user)
  trainingSessions: TrainingSession[];
}

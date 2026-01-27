import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PuzzleAttempt } from '@entities/index';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(PuzzleAttempt)
    private readonly attemptRepository: Repository<PuzzleAttempt>,
  ) {}

  async getOverview(userId: string) {
    const totalAttempts = await this.attemptRepository.count({ where: { userId } });
    const totalSolved = await this.attemptRepository.count({ where: { userId, solved: true } });
    const accuracy = totalAttempts > 0 ? (totalSolved / totalAttempts) * 100 : 0;

    const avgTime = await this.attemptRepository
      .createQueryBuilder('attempt')
      .select('AVG(attempt.timeSpentSeconds)', 'avg')
      .where('attempt.userId = :userId', { userId })
      .getRawOne();

    return {
      totalSolved,
      totalAttempts,
      accuracy: parseFloat(accuracy.toFixed(2)),
      averageTimeSeconds: parseInt(avgTime?.avg || 0),
      currentStreak: 0, // TODO: Calculate streak
      longestStreak: 0, // TODO: Calculate streak
      solvedToday: 0, // TODO: Calculate
      solvedThisWeek: 0, // TODO: Calculate
      solvedThisMonth: 0, // TODO: Calculate
    };
  }

  async getByTheme(userId: string) {
    // TODO: Implement theme-based statistics
    return [];
  }
}

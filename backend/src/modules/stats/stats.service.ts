import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PuzzleAttempt } from "@entities/index";

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(PuzzleAttempt)
    private readonly attemptRepository: Repository<PuzzleAttempt>,
  ) {}

  async getOverview(userId: string) {
    const totalAttempts = await this.attemptRepository.count({
      where: { userId },
    });
    const totalSolved = await this.attemptRepository.count({
      where: { userId, solved: true },
    });
    const accuracy =
      totalAttempts > 0 ? (totalSolved / totalAttempts) * 100 : 0;

    const avgTime = await this.attemptRepository
      .createQueryBuilder("attempt")
      .select("AVG(attempt.timeSpentSeconds)", "avg")
      .where("attempt.userId = :userId", { userId })
      .getRawOne();

    // Get all attempts sorted by date for streak and date-based calculations
    const allAttempts = await this.attemptRepository.find({
      where: { userId },
      order: { attemptedAt: "DESC" },
    });

    // Calculate current streak (consecutive solved from most recent)
    let currentStreak = 0;
    for (const attempt of allAttempts) {
      if (attempt.solved) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedByDate = [...allAttempts].sort(
      (a, b) => a.attemptedAt.getTime() - b.attemptedAt.getTime(),
    );

    for (const attempt of sortedByDate) {
      if (attempt.solved) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Calculate date-based stats
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    let solvedToday = 0;
    let solvedThisWeek = 0;
    let solvedThisMonth = 0;

    for (const attempt of allAttempts) {
      if (attempt.solved) {
        const attemptDate = new Date(attempt.attemptedAt);
        if (attemptDate >= today) {
          solvedToday++;
        }
        if (attemptDate >= weekAgo) {
          solvedThisWeek++;
        }
        if (attemptDate >= monthAgo) {
          solvedThisMonth++;
        }
      }
    }

    return {
      totalSolved,
      totalAttempts,
      accuracy: parseFloat(accuracy.toFixed(2)),
      averageTimeSeconds: parseInt(avgTime?.avg || 0),
      currentStreak,
      longestStreak,
      solvedToday,
      solvedThisWeek,
      solvedThisMonth,
    };
  }

  async getByTheme(_userId: string) {
    // TODO: Implement theme-based statistics
    return [];
  }
}

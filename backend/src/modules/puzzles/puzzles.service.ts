import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Puzzle, DailyPuzzle } from '@entities/index';

@Injectable()
export class PuzzlesService {
  constructor(
    @InjectRepository(Puzzle)
    private readonly puzzleRepository: Repository<Puzzle>,
    @InjectRepository(DailyPuzzle)
    private readonly dailyPuzzleRepository: Repository<DailyPuzzle>,
  ) {}

  async findOne(id: string): Promise<Puzzle | null> {
    return this.puzzleRepository.findOne({ where: { id } });
  }

  async getRandomPuzzle(options?: {
    minRating?: number;
    maxRating?: number;
    themes?: string[];
  }): Promise<Puzzle | null> {
    const query = this.puzzleRepository.createQueryBuilder('puzzle');

    if (options?.minRating) {
      query.andWhere('puzzle.rating >= :minRating', { minRating: options.minRating });
    }
    if (options?.maxRating) {
      query.andWhere('puzzle.rating <= :maxRating', { maxRating: options.maxRating });
    }
    if (options?.themes && options.themes.length > 0) {
      query.andWhere('puzzle.themes && :themes', { themes: options.themes });
    }

    query.orderBy('RANDOM()').limit(1);

    return query.getOne();
  }

  async getDailyPuzzle(): Promise<Puzzle | null> {
    const today = new Date().toISOString().split('T')[0];
    const dailyPuzzle = await this.dailyPuzzleRepository.findOne({
      where: { date: new Date(today) },
      relations: ['puzzle'],
    });

    // If no daily puzzle is set, return a random puzzle
    if (!dailyPuzzle) {
      return this.getRandomPuzzle();
    }

    return dailyPuzzle.puzzle;
  }

  async getThemes(): Promise<{ name: string; count: number }[]> {
    // TODO: Implement theme aggregation
    return [];
  }

  async getOpenings(): Promise<{ name: string; count: number }[]> {
    // TODO: Implement opening aggregation
    return [];
  }
}

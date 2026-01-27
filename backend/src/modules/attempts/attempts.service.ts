import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PuzzleAttempt } from "@entities/index";

@Injectable()
export class AttemptsService {
  constructor(
    @InjectRepository(PuzzleAttempt)
    private readonly attemptRepository: Repository<PuzzleAttempt>,
  ) {}

  async create(data: Partial<PuzzleAttempt>): Promise<PuzzleAttempt> {
    const attempt = this.attemptRepository.create(data);
    return this.attemptRepository.save(attempt);
  }

  async findByUser(
    userId: string,
    limit = 50,
    offset = 0,
  ): Promise<PuzzleAttempt[]> {
    return this.attemptRepository.find({
      where: { userId },
      relations: ["puzzle"],
      order: { attemptedAt: "DESC" },
      take: limit,
      skip: offset,
    });
  }

  async findByPuzzle(
    puzzleId: string,
    userId?: string,
  ): Promise<PuzzleAttempt[]> {
    const where: any = { puzzleId };
    if (userId) {
      where.userId = userId;
    }

    return this.attemptRepository.find({
      where,
      order: { attemptedAt: "DESC" },
    });
  }
}

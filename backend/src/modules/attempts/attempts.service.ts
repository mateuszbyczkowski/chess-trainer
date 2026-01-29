import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PuzzleAttempt } from "@entities/index";
import { CreateAttemptDto } from "./dto/create-attempt.dto";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class AttemptsService {
  constructor(
    @InjectRepository(PuzzleAttempt)
    private readonly attemptRepository: Repository<PuzzleAttempt>,
  ) {}

  async create(userId: string, dto: CreateAttemptDto): Promise<PuzzleAttempt> {
    // Map DTO fields to entity fields
    const attempt = this.attemptRepository.create({
      id: uuidv4(),
      userId,
      puzzleId: dto.puzzleId,
      solved: dto.solved,
      timeSpentSeconds: dto.timeSpent,
      moves: dto.movesMade.split(" ").filter((m) => m.length > 0),
    });
    return this.attemptRepository.save(attempt);
  }

  async findByUser(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{
    data: PuzzleAttempt[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    const [data, total] = await this.attemptRepository.findAndCount({
      where: { userId },
      relations: ["puzzle"],
      order: { attemptedAt: "DESC" },
      take: limit,
      skip: offset,
    });

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByPuzzle(
    puzzleId: string,
    userId?: string,
  ): Promise<PuzzleAttempt[]> {
    const where: { puzzleId: string; userId?: string } = { puzzleId };
    if (userId) {
      where.userId = userId;
    }

    return this.attemptRepository.find({
      where,
      order: { attemptedAt: "DESC" },
    });
  }
}

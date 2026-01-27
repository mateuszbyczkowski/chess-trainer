import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TrainingSession, SessionPuzzle } from "@entities/index";

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(TrainingSession)
    private readonly sessionRepository: Repository<TrainingSession>,
    @InjectRepository(SessionPuzzle)
    private readonly sessionPuzzleRepository: Repository<SessionPuzzle>,
  ) {}

  async create(
    userId: string,
    data: Partial<TrainingSession>,
  ): Promise<TrainingSession> {
    const session = this.sessionRepository.create({
      userId,
      ...data,
    });
    return this.sessionRepository.save(session);
  }

  async findByUser(userId: string): Promise<TrainingSession[]> {
    return this.sessionRepository.find({
      where: { userId },
      order: { startedAt: "DESC" },
    });
  }

  async findOne(id: string): Promise<TrainingSession | null> {
    return this.sessionRepository.findOne({ where: { id } });
  }

  async update(
    id: string,
    data: Partial<TrainingSession>,
  ): Promise<TrainingSession> {
    await this.sessionRepository.update(id, data);
    return this.findOne(id);
  }
}

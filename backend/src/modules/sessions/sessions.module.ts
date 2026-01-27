import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TrainingSession, SessionPuzzle } from "@entities/index";
import { SessionsService } from "./sessions.service";
import { SessionsController } from "./sessions.controller";

@Module({
  imports: [TypeOrmModule.forFeature([TrainingSession, SessionPuzzle])],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}

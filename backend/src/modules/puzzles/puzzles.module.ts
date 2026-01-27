import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Puzzle, DailyPuzzle } from '@entities/index';
import { PuzzlesService } from './puzzles.service';
import { PuzzlesController } from './puzzles.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Puzzle, DailyPuzzle])],
  controllers: [PuzzlesController],
  providers: [PuzzlesService],
  exports: [PuzzlesService],
})
export class PuzzlesModule {}

import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PuzzlesService } from './puzzles.service';

@ApiTags('Puzzles')
@Controller('puzzles')
export class PuzzlesController {
  constructor(private readonly puzzlesService: PuzzlesService) {}

  @Get('daily')
  @ApiOperation({ summary: 'Get puzzle of the day' })
  async getDailyPuzzle() {
    const puzzle = await this.puzzlesService.getDailyPuzzle();
    if (!puzzle) {
      throw new NotFoundException('No daily puzzle available');
    }
    return puzzle;
  }

  @Get('random')
  @ApiOperation({ summary: 'Get random puzzle' })
  async getRandomPuzzle(
    @Query('minRating') minRating?: number,
    @Query('maxRating') maxRating?: number,
    @Query('themes') themes?: string,
  ) {
    const themeArray = themes ? themes.split(',') : undefined;
    const puzzle = await this.puzzlesService.getRandomPuzzle({
      minRating,
      maxRating,
      themes: themeArray,
    });
    if (!puzzle) {
      throw new NotFoundException('No puzzle found matching the criteria');
    }
    return puzzle;
  }

  @Get('categories/themes')
  @ApiOperation({ summary: 'Get all puzzle themes' })
  async getThemes() {
    return this.puzzlesService.getThemes();
  }

  @Get('categories/openings')
  @ApiOperation({ summary: 'Get all puzzle openings' })
  async getOpenings() {
    return this.puzzlesService.getOpenings();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get puzzle by ID' })
  async getPuzzle(@Param('id') id: string) {
    const puzzle = await this.puzzlesService.findOne(id);
    if (!puzzle) {
      throw new NotFoundException(`Puzzle with ID ${id} not found`);
    }
    return puzzle;
  }
}

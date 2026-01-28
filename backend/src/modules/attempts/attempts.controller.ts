import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AttemptsService } from "./attempts.service";
import { Request } from "express";
import { PuzzleAttempt, User } from "@entities/index";

@ApiTags("Attempts")
@Controller("attempts")
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post()
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  async createAttempt(@Req() req: Request, @Body() data: Partial<PuzzleAttempt>) {
    const user = req.user as User;
    return this.attemptsService.create({
      userId: user.id,
      ...data,
    });
  }

  @Get("history")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  async getHistory(
    @Req() req: Request,
    @Query("limit", new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query("offset", new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    const user = req.user as User;
    return this.attemptsService.findByUser(user.id, limit, offset);
  }
}

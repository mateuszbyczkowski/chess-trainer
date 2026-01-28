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
import { CreateAttemptDto } from "./dto/create-attempt.dto";
import { Request } from "express";
import { User } from "@entities/index";

@ApiTags("Attempts")
@Controller("attempts")
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post()
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  async createAttempt(@Req() req: Request, @Body() dto: CreateAttemptDto) {
    const user = req.user as User;
    return this.attemptsService.create(user.id, dto);
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

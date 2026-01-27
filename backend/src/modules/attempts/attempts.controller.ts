import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AttemptsService } from "./attempts.service";
import { Request } from "express";

@ApiTags("Attempts")
@Controller("attempts")
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post()
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  async createAttempt(@Req() req: Request, @Body() data: any) {
    const user = req.user as any;
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
    @Query("limit") limit?: number,
    @Query("offset") offset?: number,
  ) {
    const user = req.user as any;
    return this.attemptsService.findByUser(user.id, limit, offset);
  }
}

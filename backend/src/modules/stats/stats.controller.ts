import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { StatsService } from "./stats.service";
import { Request } from "express";

@ApiTags("Statistics")
@Controller("stats")
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get("overview")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  async getOverview(@Req() req: Request) {
    const user = req.user as any;
    return this.statsService.getOverview(user.id);
  }

  @Get("by-theme")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  async getByTheme(@Req() req: Request) {
    const user = req.user as any;
    return this.statsService.getByTheme(user.id);
  }
}

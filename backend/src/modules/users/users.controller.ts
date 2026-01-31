import { Controller, Get, Patch, Post, Body, UseGuards, Req } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { Request } from "express";
import { User } from "@entities/index";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("profile")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  async getProfile(@Req() req: Request) {
    return req.user;
  }

  @Patch("profile")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  async updateProfile(@Req() req: Request, @Body() data: Partial<User>) {
    const user = req.user as User;
    return this.usersService.update(user.id, data);
  }

  @Post("sync-lichess-rating")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  async syncLichessRating(@Req() req: Request) {
    const user = req.user as User;
    return this.usersService.syncLichessRating(user.id);
  }

  @Patch("manual-rating")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  async updateManualRating(
    @Req() req: Request,
    @Body() body: { rating: number }
  ) {
    const user = req.user as User;
    return this.usersService.updateManualRating(user.id, body.rating);
  }
}

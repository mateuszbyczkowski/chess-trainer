import { Controller, Get, Post, UseGuards, Req, Res } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { Request, Response } from "express";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("lichess")
  @UseGuards(AuthGuard("lichess"))
  @ApiOperation({ summary: "Initiate Lichess OAuth flow" })
  async lichessAuth() {
    // Guard redirects to Lichess
  }

  @Get("lichess/callback")
  @UseGuards(AuthGuard("lichess"))
  @ApiOperation({ summary: "Lichess OAuth callback" })
  async lichessCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const tokens = await this.authService.generateTokens(user);

    // Redirect to frontend with tokens
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/auth/callback?token=${tokens.accessToken}`);
  }

  @Get("google")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "Initiate Google OAuth flow" })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "Google OAuth callback" })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const tokens = await this.authService.generateTokens(user);

    // Redirect to frontend with tokens
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/auth/callback?token=${tokens.accessToken}`);
  }

  @Post("guest")
  @ApiOperation({ summary: "Create guest session" })
  async createGuest() {
    const user = await this.authService.createGuestUser();
    const tokens = await this.authService.generateTokens(user);

    return {
      user: {
        id: user.id,
        displayName: user.displayName,
        isGuest: user.isGuest,
      },
      ...tokens,
    };
  }

  @Get("me")
  @UseGuards(AuthGuard("jwt"))
  @ApiOperation({ summary: "Get current user" })
  async getCurrentUser(@Req() req: Request) {
    return req.user;
  }
}

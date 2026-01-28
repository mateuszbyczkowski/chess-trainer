import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Res,
  Query,
  Session,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { Request, Response } from "express";
import { User } from "@entities/index";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

interface SessionData {
  lichess_code_verifier?: string;
  lichess_state?: string;
}

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get("lichess")
  @ApiOperation({ summary: "Initiate Lichess OAuth flow" })
  async lichessAuth(@Res() res: Response, @Session() session: SessionData) {
    // Generate PKCE code verifier and challenge
    const codeVerifier = crypto.randomBytes(32).toString("base64url");
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    // Store code_verifier in session for later use
    session.lichess_code_verifier = codeVerifier;

    // Build authorization URL
    const clientId =
      this.configService.get("LICHESS_CLIENT_ID") || "chess-trainer";
    const redirectUri = this.configService.get("LICHESS_REDIRECT_URI");
    const state = crypto.randomBytes(16).toString("base64url");

    // Store state in session for CSRF protection
    session.lichess_state = state;

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "email:read",
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
      state: state,
    });

    const authorizationUrl = `https://lichess.org/oauth?${params.toString()}`;
    res.redirect(authorizationUrl);
  }

  @Get("lichess/callback")
  @ApiOperation({ summary: "Lichess OAuth callback" })
  async lichessCallback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Req() req: Request,
    @Res() res: Response,
    @Session() session: SessionData,
  ) {
    // Verify state for CSRF protection
    if (!state || state !== session.lichess_state) {
      const frontendUrl =
        this.configService.get("FRONTEND_URL") || "http://localhost:5173";
      return res.redirect(`${frontendUrl}/login?error=invalid_state`);
    }

    // Retrieve code_verifier from session
    const codeVerifier = session.lichess_code_verifier;
    if (!codeVerifier) {
      const frontendUrl =
        this.configService.get("FRONTEND_URL") || "http://localhost:5173";
      return res.redirect(`${frontendUrl}/login?error=no_verifier`);
    }

    try {
      // Exchange authorization code for access token
      const clientId =
        this.configService.get("LICHESS_CLIENT_ID") || "chess-trainer";
      const redirectUri = this.configService.get("LICHESS_REDIRECT_URI");

      const tokenResponse = await fetch("https://lichess.org/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          code_verifier: codeVerifier,
          redirect_uri: redirectUri,
          client_id: clientId,
        }).toString(),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(
          `Token exchange failed: ${tokenResponse.status} ${tokenResponse.statusText} - ${errorText}`,
        );
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Fetch user data from Lichess
      const userResponse = await fetch("https://lichess.org/api/account", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error(
          `Failed to fetch Lichess user: ${userResponse.statusText}`,
        );
      }

      const lichessUser = await userResponse.json();

      // Transform to our user format
      const lichessProfile = {
        id: lichessUser.id,
        username: lichessUser.username,
        email: lichessUser.email,
        displayName: lichessUser.username,
        blitzRating: lichessUser.perfs?.blitz?.rating,
        rapidRating: lichessUser.perfs?.rapid?.rating,
      };

      // Find or create user
      const user =
        await this.authService.findOrCreateLichessUser(lichessProfile);

      // Generate JWT tokens
      const tokens = await this.authService.generateTokens(user);

      // Clean up session
      delete session.lichess_code_verifier;
      delete session.lichess_state;

      // Redirect to frontend with tokens
      const frontendUrl =
        this.configService.get("FRONTEND_URL") || "http://localhost:5173";
      res.redirect(`${frontendUrl}/auth/callback?token=${tokens.accessToken}`);
    } catch (error) {
      console.error("Lichess OAuth error:", error);
      const frontendUrl =
        this.configService.get("FRONTEND_URL") || "http://localhost:5173";
      res.redirect(
        `${frontendUrl}/login?error=oauth_failed&message=${encodeURIComponent(error.message)}`,
      );
    }
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
    const user = req.user as User;
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

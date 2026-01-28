import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-oauth2";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../auth.service";

@Injectable()
export class LichessStrategy extends PassportStrategy(Strategy, "lichess") {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      authorizationURL: "https://lichess.org/oauth",
      tokenURL: "https://lichess.org/api/token",
      clientID: configService.get("LICHESS_CLIENT_ID") || "chess-trainer",
      // Lichess uses PKCE without client secret (public client)
      clientSecret: "",
      callbackURL: configService.get("LICHESS_REDIRECT_URI"),
      scope: ["email:read"],
      // REQUIRED: Lichess requires PKCE with S256
      pkce: "S256",
      state: true,
    });
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
    _profile: unknown,
  ) {
    // Fetch actual user data from Lichess API
    const response = await fetch("https://lichess.org/api/account", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Lichess user: ${response.statusText}`);
    }

    const lichessUser = await response.json();

    // Transform Lichess data to our user format
    const lichessProfile = {
      id: lichessUser.id,
      username: lichessUser.username,
      email: lichessUser.email,
      displayName: lichessUser.username,
      // Optional: save rating for future features
      blitzRating: lichessUser.perfs?.blitz?.rating,
      rapidRating: lichessUser.perfs?.rapid?.rating,
    };

    return this.authService.findOrCreateLichessUser(lichessProfile);
  }
}

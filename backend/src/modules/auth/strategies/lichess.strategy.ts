import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class LichessStrategy extends PassportStrategy(Strategy, 'lichess') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      authorizationURL: 'https://lichess.org/oauth',
      tokenURL: 'https://lichess.org/api/token',
      clientID: configService.get('LICHESS_CLIENT_ID'),
      clientSecret: configService.get('LICHESS_CLIENT_SECRET'),
      callbackURL: configService.get('LICHESS_REDIRECT_URI'),
      scope: ['email:read'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    // TODO: Fetch Lichess profile using accessToken
    // For now, returning a placeholder
    const lichessProfile = {
      id: 'temp_lichess_id',
      username: 'temp_user',
      rating: 1500,
    };

    return this.authService.findOrCreateLichessUser(lichessProfile);
  }
}

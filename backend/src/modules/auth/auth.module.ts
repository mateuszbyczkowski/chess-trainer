import { Module, DynamicModule } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "@entities/user.entity";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { LichessStrategy } from "./strategies/lichess.strategy";
import { GoogleStrategy } from "./strategies/google.strategy";

@Module({})
export class AuthModule {
  static register(): DynamicModule {
    const providers = [AuthService, JwtStrategy];

    // Only register OAuth strategies if their credentials are configured
    if (process.env.LICHESS_CLIENT_ID || process.env.LICHESS_REDIRECT_URI) {
      providers.push(LichessStrategy);
    }

    if (process.env.GOOGLE_CLIENT_ID) {
      providers.push(GoogleStrategy);
    }

    return {
      module: AuthModule,
      imports: [
        TypeOrmModule.forFeature([User]),
        PassportModule.register({ defaultStrategy: "jwt" }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get("JWT_SECRET"),
            signOptions: {
              expiresIn: configService.get("JWT_EXPIRES_IN") || "7d",
            },
          }),
        }),
      ],
      controllers: [AuthController],
      providers,
      exports: [AuthService, JwtStrategy, PassportModule],
    };
  }
}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './config/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PuzzlesModule } from './modules/puzzles/puzzles.module';
import { AttemptsModule } from './modules/attempts/attempts.module';
import { StatsModule } from './modules/stats/stats.module';
import { SessionsModule } from './modules/sessions/sessions.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    DatabaseModule,

    // Feature modules
    AuthModule,
    UsersModule,
    PuzzlesModule,
    AttemptsModule,
    StatsModule,
    SessionsModule,
  ],
})
export class AppModule {}

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { join } from "path";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        url: configService.get("DATABASE_URL"),
        entities: [join(__dirname, "../entities/**/*.entity{.ts,.js}")],
        synchronize: false, // Use migrations instead
        logging: configService.get("NODE_ENV") === "development",
        autoLoadEntities: true,
      }),
    }),
  ],
})
export class DatabaseModule {}

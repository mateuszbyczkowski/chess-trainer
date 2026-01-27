import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get("health")
  getHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
    };
  }

  @Get()
  getRoot() {
    return {
      name: "Chess Trainer API",
      version: "1.0.0",
      documentation: "/api/docs",
      endpoints: {
        auth: "/api/auth",
        puzzles: "/api/puzzles",
        attempts: "/api/attempts",
        stats: "/api/stats",
        sessions: "/api/sessions",
        users: "/api/users",
      },
    };
  }
}

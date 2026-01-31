import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRatingSourceColumn1738327525000 implements MigrationInterface {
  name = "AddRatingSourceColumn1738327525000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add rating_source column to users table
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "rating_source" VARCHAR(20) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove rating_source column from users table
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "rating_source"
    `);
  }
}

import { IsBoolean, IsNumber, IsString, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateAttemptDto {
  @ApiProperty({
    description: "Puzzle ID",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsUUID()
  puzzleId: string;

  @ApiProperty({
    description: "Whether the puzzle was solved",
    example: true,
  })
  @IsBoolean()
  solved: boolean;

  @ApiProperty({
    description: "Time spent in seconds",
    example: 120,
  })
  @IsNumber()
  timeSpent: number;

  @ApiProperty({
    description: "Moves made in algebraic notation",
    example: "e4 e5 Nf3",
  })
  @IsString()
  movesMade: string;
}

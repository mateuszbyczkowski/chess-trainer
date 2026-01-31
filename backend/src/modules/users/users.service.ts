import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "@entities/user.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOne(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.userRepository.update(id, data);
    return this.findOne(id);
  }

  async syncLichessRating(userId: string): Promise<User> {
    const user = await this.findOne(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.lichessUsername) {
      throw new BadRequestException('User does not have a Lichess account linked');
    }

    // Rate limiting: max once per hour
    const ONE_HOUR = 60 * 60 * 1000;
    if (user.lichessRatingSyncedAt) {
      const timeSinceLastSync = Date.now() - user.lichessRatingSyncedAt.getTime();
      if (timeSinceLastSync < ONE_HOUR) {
        throw new BadRequestException('Rating can only be synced once per hour');
      }
    }

    try {
      const response = await fetch(`https://lichess.org/api/user/${user.lichessUsername}`);

      if (!response.ok) {
        throw new BadRequestException('Failed to fetch Lichess profile');
      }

      const lichessData = await response.json();

      // Extract rating with fallback
      const ratings = {
        rapid: lichessData.perfs?.rapid?.rating,
        blitz: lichessData.perfs?.blitz?.rating,
        bullet: lichessData.perfs?.bullet?.rating,
        classical: lichessData.perfs?.classical?.rating,
      };

      const selectedRating = ratings.rapid || ratings.blitz || ratings.bullet || ratings.classical || null;

      // Update user
      user.lichessRating = selectedRating;
      user.lichessRatingSyncedAt = new Date();
      user.ratingSource = 'lichess';

      return this.userRepository.save(user);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to sync Lichess rating');
    }
  }

  async updateManualRating(userId: string, rating: number): Promise<User> {
    const user = await this.findOne(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate rating range (typical chess ratings: 600-3000)
    if (rating < 600 || rating > 3000) {
      throw new BadRequestException('Rating must be between 600 and 3000');
    }

    // Don't allow manual rating for Lichess users (they should use sync)
    if (user.lichessId) {
      throw new BadRequestException('Lichess users should use the sync button instead');
    }

    // Update user
    user.lichessRating = rating;
    user.ratingSource = 'manual';
    user.lichessRatingSyncedAt = new Date(); // Track when manually set

    return this.userRepository.save(user);
  }
}

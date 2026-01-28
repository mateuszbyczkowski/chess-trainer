import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "@entities/user.entity";
import { v4 as uuidv4 } from "uuid";

interface LichessProfile {
  id: string;
  username: string;
  email?: string;
  displayName?: string;
  blitzRating?: number;
  rapidRating?: number;
  avatar?: string;
  rating?: number;
}

interface GoogleProfile {
  id: string;
  email: string;
  displayName?: string;
  picture?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      lichessId: user.lichessId,
      isGuest: user.isGuest,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: "30d" }),
    };
  }

  async findOrCreateLichessUser(profile: LichessProfile): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { lichessId: profile.id },
    });

    if (!user) {
      user = this.userRepository.create({
        id: uuidv4(), // Generate UUID in application
        lichessId: profile.id,
        lichessUsername: profile.username,
        displayName: profile.username,
        avatarUrl: profile.avatar || null,
        lichessRating: profile.rating || null,
        isGuest: false,
      });
      await this.userRepository.save(user);
    }

    return user;
  }

  async findOrCreateGoogleUser(profile: GoogleProfile): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { googleId: profile.id },
    });

    if (!user) {
      user = this.userRepository.create({
        id: uuidv4(), // Generate UUID in application
        googleId: profile.id,
        email: profile.email,
        displayName: profile.displayName || profile.email,
        avatarUrl: profile.picture || null,
        isGuest: false,
      });
      await this.userRepository.save(user);
    }

    return user;
  }

  async createGuestUser(): Promise<User> {
    const guestNumber = Math.floor(Math.random() * 100000);
    const user = this.userRepository.create({
      id: uuidv4(), // Generate UUID in application
      displayName: `Guest_${guestNumber}`,
      isGuest: true,
    });

    return this.userRepository.save(user);
  }
}

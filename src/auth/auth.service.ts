import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import type { Env } from '../config/env';
import { User } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import type { JwtPayload } from './auth.types';
import {
  AuthResponseDto,
  LoginDto,
  RegisterDto,
  UserResponseDto,
} from './dto/auth.dto';
import { hashPassword, verifyPassword } from './password';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  // Verified against when the email is unknown, so a login attempt takes the
  // same time whether or not the account exists.
  private dummyPasswordHash?: Promise<string>;

  constructor(
    private readonly users: UserService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const user = await this.users.create({
      email: dto.email,
      name: dto.name,
      passwordHash: await hashPassword(dto.password),
    });
    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.users.findByEmail(dto.email);
    this.dummyPasswordHash ??= hashPassword(randomBytes(16).toString('hex'));
    const passwordValid = await verifyPassword(
      dto.password,
      user?.passwordHash ?? (await this.dummyPasswordHash),
    );
    if (!user || !passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokens(user);
  }

  /**
   * Exchanges a refresh token for a new token pair. Each refresh token works
   * once; presenting one that was already used or revoked signals possible
   * theft, so every session for that user is revoked.
   */
  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(refreshToken) },
      include: { user: true },
    });
    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const now = new Date();
    // Conditional update so two concurrent requests cannot both spend it.
    const claimed = await this.prisma.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: now },
    });
    if (claimed.count === 0) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: now },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (stored.expiresAt <= now) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issueTokens(stored.user);
  }

  /** Revokes the refresh token. Succeeds silently if it is unknown. */
  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string): Promise<UserResponseDto> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    return UserResponseDto.from(user);
  }

  private async issueTokens(user: User): Promise<AuthResponseDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    const refreshToken = randomBytes(32).toString('base64url');
    const ttlDays = this.config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true });
    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(refreshToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + ttlDays * MS_PER_DAY),
      },
    });

    return { accessToken, refreshToken, user: UserResponseDto.from(user) };
  }

  // Refresh tokens are high-entropy random values, so a fast hash is enough
  // to keep a leaked database from yielding usable tokens.
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

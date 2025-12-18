import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma, Role } from '@generated/prisma/client';
import { PrismaService } from '@src/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import {
  JwtPayload,
  SafeClient,
  SafeProject,
  SafeUser,
  toSafeUser,
} from './auth.types';
import { ClientSignupDto } from './dto/client-signup.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{
    accessToken: string;
    user: SafeUser;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(
      dto.password,
      user.hashedPassword,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      clientId: user.clientId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: toSafeUser(user),
    };
  }

  async clientSignup(dto: ClientSignupDto): Promise<{
    user: SafeUser;
    client: SafeClient;
    project: SafeProject;
    accessToken: string;
  }> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const trimmedCompany = dto.companyName.trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const existingClient = await this.prisma.client.findUnique({
      where: { name: trimmedCompany },
    });
    if (existingClient) {
      throw new ConflictException('Company name already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    try {
      const { user, client, project } = await this.prisma.$transaction(
        async (tx) => {
          const createdClient = await tx.client.create({
            data: {
              name: trimmedCompany,
            },
          });

          const createdUser = await tx.user.create({
            data: {
              email: normalizedEmail,
              name: dto.contactName.trim(),
              hashedPassword,
              role: Role.USER,
              staffRole: null,
              clientId: createdClient.id,
              isEmailVerified: false,
            },
          });

          const createdProject = await tx.project.create({
            data: {
              name: dto.projectName.trim(),
              clientId: createdClient.id,
            },
          });

          return {
            user: toSafeUser(createdUser),
            client: createdClient,
            project: createdProject,
          };
        },
      );

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        clientId: user.clientId,
      };

      const accessToken = await this.jwtService.signAsync(payload);

      this.logger.log(
        `client_signup_success userId=${user.id} clientId=${client.id}`,
      );

      return { user, client, project, accessToken };
    } catch (error) {
      const conflict = this.mapUniqueConstraint(error);
      if (conflict) {
        this.logger.warn(
          `client_signup_conflict target=${conflict} email=${normalizedEmail} company=${trimmedCompany}`,
        );
        throw new ConflictException(
          conflict === 'email'
            ? 'Email already in use'
            : 'Company name already in use',
        );
      }

      this.logger.error(
        'client_signup_failed',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  private mapUniqueConstraint(error: unknown): 'email' | 'company' | null {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = error.meta?.target;
      const targets = Array.isArray(target)
        ? (target as string[])
        : typeof target === 'string'
          ? [target]
          : [];

      if (targets.some((t) => t.includes('email'))) {
        return 'email';
      }
      if (targets.some((t) => t.includes('name'))) {
        return 'company';
      }
    }
    return null;
  }
}

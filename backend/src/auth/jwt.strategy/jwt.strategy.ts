
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import {
  ConfigService,
} from '@nestjs/config';

import {
  PassportStrategy,
} from '@nestjs/passport';

import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';

import { UsersService } from '../../users/users.service';

import {
  GuideStatus,
  Role,
} from '../../users/schemas/user.schema';

interface JwtPayload {
  sub: string;
  publicId?: string;
  email?: string;
  role?: Role;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const jwtSecret =
      configService.get<string>(
        'JWT_SECRET',
      );

    if (
      !jwtSecret ||
      jwtSecret.length < 32
    ) {
      throw new Error(
        'JWT_SECRET must be configured with at least 32 characters',
      );
    }

    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: jwtSecret,
    });
  }

  // ==========================================
  // VALIDATE EVERY AUTHENTICATED REQUEST
  // ==========================================

  async validate(payload: JwtPayload) {
    if (
      !payload ||
      typeof payload.sub !== 'string' ||
      !payload.sub
    ) {
      throw new UnauthorizedException(
        'Invalid authentication token',
      );
    }

    // Always load the current user from MongoDB.
    // Do not trust the role stored in an old JWT.

    let user;

    try {
      user = await this.usersService.findOne(
        payload.sub,
      );
    } catch {
      throw new UnauthorizedException(
        'Account not found or no longer active',
      );
    }

    // ========================================
    // GUIDE APPROVAL CHECK
    // ========================================

    if (user.role === Role.GUIDE) {
      if (
        user.guideStatus ===
        GuideStatus.PENDING
      ) {
        throw new ForbiddenException(
          'Your guide account is awaiting admin approval',
        );
      }

      if (
        user.guideStatus ===
        GuideStatus.REJECTED
      ) {
        throw new ForbiddenException(
          'Your guide application has been rejected',
        );
      }

      if (
        user.guideStatus ===
        GuideStatus.SUSPENDED
      ) {
        throw new ForbiddenException(
          'Your guide account has been suspended',
        );
      }

      if (
        user.guideStatus !==
        GuideStatus.APPROVED
      ) {
        throw new ForbiddenException(
          'Guide account is not approved',
        );
      }
    }

    // ========================================
    // AUTHENTICATED USER DETAILS
    // ========================================

    return {
      id: String(user._id),

      publicId: user.publicId,

      email: user.email,

      role: user.role,

      name: user.name,

      guideStatus: user.guideStatus,

      profileImage: user.profileImage || '',
    };
  }
}

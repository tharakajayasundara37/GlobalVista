
import {
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

import {
  UsersService,
} from '../users/users.service';

import {
  GuideStatus,
  Role,
} from '../users/schemas/user.schema';

type JwtPayload = {
  sub: string;
  publicId?: string;
  email?: string;
  role?: Role;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
  'jwt',
) {
  constructor(
    private readonly usersService:
      UsersService,

    configService:
      ConfigService,
  ) {
    const secret =
      configService.get<string>(
        'JWT_SECRET',
      );

    if (
      !secret ||
      secret.length < 32
    ) {
      throw new Error(
        'JWT_SECRET is missing or too short in backend/.env',
      );
    }

    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: secret,
    });
  }

  async validate(
    payload: JwtPayload,
  ) {
    if (
      !payload ||
      typeof payload.sub !== 'string' ||
      !/^[0-9a-f]{24}$/i.test(
        payload.sub,
      )
    ) {
      throw new UnauthorizedException(
        'Invalid login session',
      );
    }

    let user;

    try {
      user =
        await this.usersService.findOne(
          payload.sub,
        );
    } catch {
      throw new UnauthorizedException(
        'Account not found or unavailable',
      );
    }

    if (!user) {
      throw new UnauthorizedException(
        'Account not found',
      );
    }

    // Always use the current database role,
    // not a role stored in the browser.

    if (
      user.role !== Role.ADMIN &&
      user.role !== Role.USER &&
      user.role !== Role.GUIDE
    ) {
      throw new UnauthorizedException(
        'Invalid account role',
      );
    }

    // Guides must remain approved.
    // Old JWTs cannot bypass approval.

    if (
      user.role === Role.GUIDE &&
      user.guideStatus !==
        GuideStatus.APPROVED
    ) {
      throw new UnauthorizedException(
        'Tour guide account is not approved',
      );
    }

    return {
      id: String(user._id),

      publicId:
        user.publicId,

      email:
        user.email,

      role:
        user.role,
    };
  }
}

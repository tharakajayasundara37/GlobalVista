
import {
  Module,
  forwardRef,
} from '@nestjs/common';

import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';

import {
  JwtModule,
} from '@nestjs/jwt';

import {
  PassportModule,
} from '@nestjs/passport';

import {
  AuthController,
} from './auth.controller';

import {
  AuthService,
} from './auth.service';

import {
  JwtStrategy,
} from './jwt.strategy';

import {
  UsersModule,
} from '../users/users.module';

@Module({
  imports: [
    ConfigModule,

    forwardRef(() => UsersModule),

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    JwtModule.registerAsync({
      global: true,

      imports: [
        ConfigModule,
      ],

      inject: [
        ConfigService,
      ],

      useFactory: (
        configService: ConfigService,
      ) => {
        const secret =
          configService.get<string>(
            'JWT_SECRET',
          );

        if (
          !secret ||
          secret.length < 32
        ) {
          throw new Error(
            'JWT_SECRET must be configured in backend/.env and contain at least 32 characters.',
          );
        }

        return {
          secret,

          signOptions: {
            expiresIn: '7d',
          },
        };
      },
    }),
  ],

  controllers: [
    AuthController,
  ],

  providers: [
    AuthService,
    JwtStrategy,
  ],

  exports: [
    JwtModule,
    PassportModule,
    JwtStrategy,
  ],
})
export class AuthModule {}

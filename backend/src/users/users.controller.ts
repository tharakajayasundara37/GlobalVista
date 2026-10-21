
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import {
  FileInterceptor,
} from '@nestjs/platform-express';

import {
  diskStorage,
} from 'multer';

import {
  mkdirSync,
} from 'fs';

import {
  extname,
  join,
} from 'path';

import {
  randomUUID,
} from 'crypto';

import {
  UsersService,
} from './users.service';

import {
  JwtGuard,
} from '../auth/jwt.guard';

import {
  AdminGuard,
} from '../auth/admin.guard';


// =========================
// PROFILE IMAGE SETTINGS
// =========================

const PROFILE_IMAGE_FOLDER =
  join(
    process.cwd(),
    'uploads',
    'users',
  );

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

const ALLOWED_IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
];


@Controller('users')
export class UsersController {

  constructor(
    private readonly usersService:
      UsersService,
  ) {}


  /* =========================
     CURRENT LOGGED-IN USER
  ========================= */

  @Get('me')
  @UseGuards(JwtGuard)
  findMe(
    @Req() req: any,
  ) {
    return this.usersService.findOne(
      req.user.id,
    );
  }


  /* =========================
     NEW - UPDATE ADMIN PROFILE
  ========================= */

  @Patch('me/profile')
  @UseGuards(
    JwtGuard,
  )
  updateMyProfile(
    @Req() req: any,

    @Body()
    body: {
      name?: string;
      mobile?: string;
      country?: string;
      city?: string;
      profileImage?: string;
      about?: string;
      languages?: string[];
      experienceYears?: number;
    },
  ) {

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      throw new BadRequestException(
        'Invalid profile details',
      );
    }

    const updates: {
      name?: string;
      mobile?: string;
      country?: string;
      city?: string;
      profileImage?: string;
      about?: string;
      languages?: string[];
      experienceYears?: number;
    } = {};

    if (
      body.name !== undefined
    ) {
      if (
        typeof body.name !== 'string' ||
        body.name.trim().length > 100
      ) {
        throw new BadRequestException(
          'Invalid name',
        );
      }

      updates.name = body.name;
    }

    if (
      body.mobile !== undefined
    ) {
      if (
        typeof body.mobile !== 'string' ||
        body.mobile.trim().length > 30
      ) {
        throw new BadRequestException(
          'Invalid mobile number',
        );
      }

      updates.mobile = body.mobile;
    }

    if (
      body.country !== undefined
    ) {
      if (
        typeof body.country !== 'string' ||
        body.country.trim().length > 100
      ) {
        throw new BadRequestException(
          'Invalid country',
        );
      }

      updates.country = body.country;
    }

    if (body.city !== undefined && typeof body.city === 'string') {
      updates.city = body.city;
    }

    if (body.profileImage !== undefined && typeof body.profileImage === 'string') {
      updates.profileImage = body.profileImage;
    }

    if (body.about !== undefined && typeof body.about === 'string') {
      updates.about = body.about;
    }

    if (body.languages !== undefined && Array.isArray(body.languages)) {
      updates.languages = body.languages;
    }

    if (body.experienceYears !== undefined && typeof body.experienceYears === 'number') {
      updates.experienceYears = body.experienceYears;
    }

    if (
      Object.keys(updates).length === 0
    ) {
      throw new BadRequestException(
        'No profile fields provided',
      );
    }

    return this.usersService
      .updateMyProfile(
        req.user.id,
        updates,
      );
  }


  /* =========================
     NEW - UPLOAD PROFILE IMAGE
  ========================= */

  @Post('me/profile-image')
  @UseGuards(
    JwtGuard,
  )
  @UseInterceptors(
    FileInterceptor(
      'image',
      {
        storage: diskStorage({

          destination: (
            _req,
            _file,
            callback,
          ) => {

            try {
              mkdirSync(
                PROFILE_IMAGE_FOLDER,
                {
                  recursive: true,
                },
              );

              callback(
                null,
                PROFILE_IMAGE_FOLDER,
              );

            } catch (error) {

              callback(
                error instanceof Error
                  ? error
                  : new Error(
                      'Unable to create image folder',
                    ),
                PROFILE_IMAGE_FOLDER,
              );
            }
          },

          filename: (
            _req,
            file,
            callback,
          ) => {

            const extension =
              extname(
                file.originalname,
              ).toLowerCase();

            const filename =
              `${randomUUID()}${extension}`;

            callback(
              null,
              filename,
            );
          },
        }),

        limits: {
          fileSize:
            5 * 1024 * 1024,
          files: 1,
        },

        fileFilter: (
          _req,
          file,
          callback,
        ) => {

          const extension =
            extname(
              file.originalname,
            ).toLowerCase();

          const validMimeType =
            ALLOWED_IMAGE_TYPES.includes(
              file.mimetype,
            );

          const validExtension =
            ALLOWED_IMAGE_EXTENSIONS.includes(
              extension,
            );

          if (
            !validMimeType ||
            !validExtension
          ) {

            return callback(
              new BadRequestException(
                'Only JPG, JPEG, PNG and WEBP images are allowed',
              ),
              false,
            );
          }

          callback(
            null,
            true,
          );
        },
      },
    ),
  )
  async uploadProfileImage(
    @Req() req: any,

    @UploadedFile()
    file?: Express.Multer.File,
  ) {

    if (!file) {
      throw new BadRequestException(
        'Please select a profile image',
      );
    }

    const imagePath =
      `/uploads/users/${file.filename}`;

    return this.usersService
      .updateProfileImage(
        req.user.id,
        imagePath,
      );
  }


  /* =========================
     NEW - CHANGE ADMIN PASSWORD
  ========================= */

  @Patch('me/password')
  @UseGuards(
    JwtGuard,
  )
  changeMyPassword(
    @Req() req: any,

    @Body()
    body: {
      currentPassword?: string;
      newPassword?: string;
    },
  ) {

    if (
      !body ||
      typeof body.currentPassword !==
        'string' ||
      typeof body.newPassword !==
        'string'
    ) {
      throw new BadRequestException(
        'Current password and new password are required',
      );
    }

    if (
      body.currentPassword.length > 200 ||
      body.newPassword.length > 200
    ) {
      throw new BadRequestException(
        'Password is too long',
      );
    }

    return this.usersService
      .changeMyPassword(
        req.user.id,
        body.currentPassword,
        body.newPassword,
      );
  }


  /* =========================
     ADMIN - ALL USERS
  ========================= */

  @Get()
  @UseGuards(
    JwtGuard,
    AdminGuard,
  )
  findAll() {
    return this.usersService.findAll();
  }


  /* =========================
     ADMIN - SINGLE USER
  ========================= */

  @Get(':id')
  @UseGuards(
    JwtGuard,
    AdminGuard,
  )
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.usersService.findOne(
      id,
    );
  }


  /* =========================
     ADMIN - DELETE USER
  ========================= */

  @Delete(':id')
  @UseGuards(
    JwtGuard,
    AdminGuard,
  )
  remove(
    @Param('id')
    id: string,
  ) {
    return this.usersService.remove(
      id,
    );
  }

}

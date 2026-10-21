
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import {
  FilesInterceptor,
} from '@nestjs/platform-express';

import { diskStorage } from 'multer';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

import {
  DestinationsService,
} from './destinations.service';

import {
  CreateDestinationDto,
} from './dto/create-destination.dto';

import {
  UpdateDestinationDto,
} from './dto/update-destination.dto';

import {
  JwtGuard,
} from '../auth/jwt.guard';

import {
  AdminGuard,
} from '../auth/admin.guard';

interface CurrentRequest {
  user: {
    id: string;
    role: string;
  };
}

const UPLOAD_DIRECTORY = join(
  process.cwd(),
  'uploads',
  'destinations',
);

const ALLOWED_IMAGE_TYPES:
  Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
  };

@Controller('destinations')
export class DestinationsController {
  constructor(
    private readonly destinationsService:
      DestinationsService,
  ) {}

  // ==================================
  // GUIDE ROLE CHECK
  // ==================================

  private requireGuide(
    req: CurrentRequest,
  ) {
    if (
      req.user?.role !== 'GUIDE'
    ) {
      throw new ForbiddenException(
        'Tour Guide access required.',
      );
    }

    return req.user.id;
  }

  // ==================================
  // ADMIN / GUIDE IMAGE UPLOAD
  // ==================================

  @Post('upload-images')
  @UseGuards(JwtGuard)
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      storage: diskStorage({
        destination: (
          _req,
          _file,
          callback,
        ) => {
          try {
            mkdirSync(
              UPLOAD_DIRECTORY,
              {
                recursive: true,
              },
            );

            callback(
              null,
              UPLOAD_DIRECTORY,
            );
          } catch (error) {
            callback(
              error as Error,
              UPLOAD_DIRECTORY,
            );
          }
        },

        filename: (
          _req,
          file,
          callback,
        ) => {
          const ext =
            ALLOWED_IMAGE_TYPES[
              file.mimetype
            ];

          if (!ext) {
            return callback(
              new BadRequestException(
                'Unsupported image format.',
              ),
              '',
            );
          }

          callback(
            null,
            `destination-${randomUUID()}${ext}`,
          );
        },
      }),

      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5,
      },

      fileFilter: (
        req,
        file,
        callback,
      ) => {
        const actor =
          req as unknown as
            CurrentRequest;

        if (
          ![
            'ADMIN',
            'GUIDE',
          ].includes(
            actor.user?.role,
          )
        ) {
          return callback(
            new ForbiddenException(
              'Admin or Guide access required.',
            ),
            false,
          );
        }

        if (
          !ALLOWED_IMAGE_TYPES[
            file.mimetype
          ]
        ) {
          return callback(
            new BadRequestException(
              'Only JPG, PNG and WEBP images are allowed.',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  uploadImages(
    @Req()
    req: CurrentRequest,

    @UploadedFiles()
    files: Express.Multer.File[],
  ) {
    if (
      ![
        'ADMIN',
        'GUIDE',
      ].includes(
        req.user?.role,
      )
    ) {
      throw new ForbiddenException(
        'Admin or Guide access required.',
      );
    }

    if (
      !files ||
      files.length === 0
    ) {
      throw new BadRequestException(
        'Please select images.',
      );
    }

    return {
      message:
        'Destination images uploaded successfully.',

      images: files.map(
        (file) =>
          `/uploads/destinations/${file.filename}`,
      ),
    };
  }

  // ==================================
  // PUBLIC DESTINATIONS
  // ==================================

  @Get()
  findPublicDestinations() {
    return this.destinationsService.findActive();
  }

  // ==================================
  // PUBLIC MAP
  // ==================================

  @Get('map')
  findMapDestinations() {
    return this.destinationsService
      .findMapDestinations();
  }

  // ==================================
  // PUBLIC ACTIVE
  // ==================================

  @Get('active')
  findActiveDestinations() {
    return this.destinationsService.findActive();
  }

  // ==================================
  // GUIDE - MY DESTINATIONS
  // ==================================

  @Get('guide/mine')
  @UseGuards(JwtGuard)
  findMine(
    @Req() req: CurrentRequest,
  ) {
    return this.destinationsService
      .findGuideDestinations(
        this.requireGuide(req),
      );
  }

  // ==================================
  // GUIDE - ADD DESTINATION
  // ==================================

  @Post('guide')
  @UseGuards(JwtGuard)
  createGuideDestination(
    @Req() req: CurrentRequest,
    @Body() body: CreateDestinationDto,
  ) {
    return this.destinationsService
      .createByGuide(
        body,
        this.requireGuide(req),
      );
  }

  // ==================================
  // GUIDE - EDIT / RESUBMIT
  // ==================================

  @Patch('guide/:id')
  @UseGuards(JwtGuard)
  updateGuideDestination(
    @Req() req: CurrentRequest,
    @Param('id') id: string,
    @Body() body: UpdateDestinationDto,
  ) {
    return this.destinationsService
      .updateByGuide(
        id,
        this.requireGuide(req),
        body,
      );
  }

  // ==================================
  // GUIDE - DELETE OWN DESTINATION
  // ==================================

  @Delete('guide/:id')
  @UseGuards(JwtGuard)
  deleteGuideDestination(
    @Req() req: CurrentRequest,
    @Param('id') id: string,
  ) {
    return this.destinationsService
      .removeByGuide(
        id,
        this.requireGuide(req),
      );
  }

  // ==================================
  // ADMIN - ALL DESTINATIONS
  // ==================================

  @Get('admin/all')
  @UseGuards(
    JwtGuard,
    AdminGuard,
  )
  findAll() {
    return this.destinationsService.findAll();
  }

  // ==================================
  // ADMIN - PENDING DESTINATIONS
  // ==================================

  @Get('admin/pending')
  @UseGuards(
    JwtGuard,
    AdminGuard,
  )
  findPending() {
    return this.destinationsService.findPending();
  }

  // ==================================
  // ADMIN - SINGLE DESTINATION
  // ==================================

  @Get('admin/:id')
  @UseGuards(
    JwtGuard,
    AdminGuard,
  )
  findOneForAdmin(
    @Param('id') id: string,
  ) {
    return this.destinationsService
      .findOneForAdmin(id);
  }

  // ==================================
  // ADMIN - APPROVE
  // ==================================

  @Patch('admin/:id/approve')
  @UseGuards(
    JwtGuard,
    AdminGuard,
  )
  approve(
    @Param('id') id: string,
    @Req() req: CurrentRequest,
  ) {
    return this.destinationsService
      .approve(
        id,
        req.user.id,
      );
  }

  // ==================================
  // ADMIN - REJECT
  // ==================================

  @Patch('admin/:id/reject')
  @UseGuards(
    JwtGuard,
    AdminGuard,
  )
  reject(
    @Param('id') id: string,
    @Body('reason') reason: unknown,
  ) {
    return this.destinationsService
      .reject(
        id,
        reason,
      );
  }

  // ==================================
  // PUBLIC - SINGLE DESTINATION
  // ==================================

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.destinationsService
      .findOne(id);
  }

  // ==================================
  // ADMIN - CREATE (EXISTING ROUTE)
  // ==================================

  @Post()
  @UseGuards(
    JwtGuard,
    AdminGuard,
  )
  create(
    @Body() body: CreateDestinationDto,
  ) {
    return this.destinationsService.create(body);
  }

  // ==================================
  // ADMIN - UPDATE (EXISTING ROUTE)
  // ==================================

  @Patch(':id')
  @UseGuards(
    JwtGuard,
    AdminGuard,
  )
  update(
    @Param('id') id: string,
    @Body() body: UpdateDestinationDto,
  ) {
    return this.destinationsService
      .update(
        id,
        body,
      );
  }

  // ==================================
  // ADMIN - DELETE (EXISTING ROUTE)
  // ==================================

  @Delete(':id')
  @UseGuards(
    JwtGuard,
    AdminGuard,
  )
  remove(
    @Param('id') id: string,
  ) {
    return this.destinationsService
      .remove(id);
  }
}

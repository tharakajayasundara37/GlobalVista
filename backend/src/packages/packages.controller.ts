import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import {
  FilesInterceptor,
} from '@nestjs/platform-express';

import {
  diskStorage,
} from 'multer';

import type {
  Request,
} from 'express';

import {
  extname,
} from 'path';

import {
  PackagesService,
} from './packages.service';

import {
  CreatePackageDto,
  UpdatePackageDto,
} from './dto/create-package.dto';

import {
  JwtGuard,
} from '../auth/jwt.guard';

import {
  AdminGuard,
} from '../auth/admin.guard';


@Controller('packages')
export class PackagesController {

  constructor(
    private readonly packagesService:
      PackagesService,
  ) {}


  /* =========================
     UPLOAD PACKAGE IMAGES
  ========================= */

  @Post(
    'upload-images',
  )
  @UseGuards(
    JwtGuard,
    AdminGuard,
  )
  @UseInterceptors(
    FilesInterceptor(
      'images',

      5,

      {
        storage:
          diskStorage({

            destination:
              './uploads/packages',


            filename: (
              _req: Request,

              file:
                Express.Multer.File,

              callback: (
                error:
                  Error | null,

                filename:
                  string,
              ) => void,
            ) => {

              const uniqueName =
                `${Date.now()}-${Math.round(
                  Math.random() *
                    1e9,
                )}`;


              const extension =
                extname(
                  file.originalname,
                ).toLowerCase();


              callback(
                null,

                `${uniqueName}${extension}`,
              );

            },

          }),


        limits: {
          fileSize:
            5 *
            1024 *
            1024,
        },


        fileFilter: (
          _req: Request,

          file:
            Express.Multer.File,

          callback: (
            error:
              Error | null,

            acceptFile:
              boolean,
          ) => void,
        ) => {

          const allowedTypes =
            [
              'image/jpeg',
              'image/jpg',
              'image/png',
              'image/webp',
            ];


          if (
            !allowedTypes.includes(
              file.mimetype,
            )
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
  uploadImages(
    @UploadedFiles()
    files:
      Express.Multer.File[],
  ) {

    if (
      !files ||
      files.length ===
        0
    ) {

      throw new BadRequestException(
        'Please select at least one image',
      );

    }


    const urls =
      files.map(
        (
          file,
        ) =>
          `/uploads/packages/${file.filename}`,
      );


    return {

      message:
        'Images uploaded successfully',

      images:
        urls,

    };

  }


  /* =========================
     CREATE PACKAGE
  ========================= */

  @Post()
  @UseGuards(
    JwtGuard,
    AdminGuard,
  )
  create(
    @Body()
    body:
      CreatePackageDto,
  ) {

    return this.packagesService.create(
      body,
    );

  }


  /* =========================
     GET PACKAGES
  ========================= */

  /*
   * Examples:
   *
   * GET /packages
   *
   * GET /packages?country=Maldives
   *
   * GET /packages?maxPrice=1000
   *
   * GET /packages?specialOffer=true
   */

  @Get()
  findAll(
    @Query()
    query: any,
  ) {

    return this.packagesService.findAll(
      query,
    );

  }


  /* =========================
     GET ONE PACKAGE
  ========================= */

  @Get(
    ':id',
  )
  findOne(
    @Param(
      'id',
    )
    id:
      string,
  ) {

    return this.packagesService.findOne(
      id,
    );

  }


  /* =========================
     UPDATE PACKAGE
  ========================= */

  @Patch(
    ':id',
  )
  @UseGuards(
    JwtGuard,
    AdminGuard,
  )
  update(
    @Param(
      'id',
    )
    id:
      string,

    @Body()
    body:
      UpdatePackageDto,
  ) {

    return this.packagesService.update(
      id,
      body,
    );

  }


  /* =========================
     DELETE PACKAGE
  ========================= */

  @Delete(
    ':id',
  )
  @UseGuards(
    JwtGuard,
    AdminGuard,
  )
  remove(
    @Param(
      'id',
    )
    id:
      string,
  ) {

    return this.packagesService.remove(
      id,
    );

  }

}
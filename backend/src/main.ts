
import {
  ValidationPipe,
} from '@nestjs/common';

import {
  NestFactory,
} from '@nestjs/core';

import {
  NestExpressApplication,
} from '@nestjs/platform-express';

import {
  SwaggerModule,
  DocumentBuilder,
} from '@nestjs/swagger';

import {
  join,
} from 'path';

import {
  mkdirSync,
} from 'fs';
import { json, urlencoded } from 'express';

import {
  AppModule,
} from './app.module';

async function bootstrap() {
  const app =
    await NestFactory.create<NestExpressApplication>(
      AppModule,
    );

  // ==========================================
  // ENABLE CORS
  // ==========================================

  app.enableCors();

  app.use(json({ limit: '15mb' }));
  app.use(urlencoded({ extended: true, limit: '15mb' }));

  // ==========================================
  // GLOBAL VALIDATION
  // ==========================================

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,

      forbidNonWhitelisted:
        true,

      transform: true,
    }),
  );

  // ==========================================
  // ENSURE PACKAGE UPLOAD DIRECTORY EXISTS
  // ==========================================

  mkdirSync(
    join(
      process.cwd(),
      'uploads',
      'packages',
    ),
    {
      recursive: true,
    },
  );

  // ==========================================
  // NEW - ADMIN PROFILE IMAGE DIRECTORY
  // ==========================================

  mkdirSync(
    join(
      process.cwd(),
      'uploads',
      'users',
    ),
    {
      recursive: true,
    },
  );

  // ==========================================
  // SERVE ALL UPLOADED IMAGES
  // ==========================================
  //
  // Existing package images:
  // http://localhost:3001/uploads/packages/image.jpg
  //
  // New admin profile images:
  // http://localhost:3001/uploads/users/profile.jpg
  //
  // ==========================================

  app.useStaticAssets(
    join(
      process.cwd(),
      'uploads',
    ),
    {
      prefix:
        '/uploads/',
    },
  );

  app.useStaticAssets(
    join(
      process.cwd(),
      'uploads',
    ),
    {
      prefix:
        '/images/',
    },
  );

  app.useStaticAssets(
    join(
      process.cwd(),
      '..',
      'frontend',
      'public',
      'videos',
    ),
    {
      prefix:
        '/videos/',
    },
  );

  // ==========================================
  // SWAGGER CONFIGURATION
  // ==========================================

  const config =
    new DocumentBuilder()
      .setTitle(
        'GlobalVista Travel API',
      )
      .setDescription(
        'Travel Booking Management System API Documentation',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();

  const document =
    SwaggerModule.createDocument(
      app,
      config,
    );

  SwaggerModule.setup(
    'api',
    app,
    document,
  );

  // ==========================================
  // SERVER PORT
  // ==========================================

  const port =
    Number(
      process.env.PORT,
    ) || 3001;

  await app.listen(port, '0.0.0.0');

  console.log(
    `GlobalVista API running on http://localhost:${port}`,
  );

  console.log(
    `Profile images available at http://localhost:${port}/uploads/users/`,
  );
}

bootstrap();

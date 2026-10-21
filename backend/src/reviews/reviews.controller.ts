import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ReviewsService,
} from './reviews.service';

import {
  CreateReviewDto,
} from './dto/create-review.dto';

import {
  JwtGuard,
} from '../auth/jwt.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService:
      ReviewsService,
  ) {}

  private ensureAdmin(
    user: any,
  ) {
    const role =
      String(
        user?.role || '',
      )
        .trim()
        .toUpperCase();

    if (
      role !== 'ADMIN'
    ) {
      throw new ForbiddenException(
        'Admin access required',
      );
    }
  }

  /*
   * TRAVELLER
   * Submit a review.
   */
  @Post()
  @UseGuards(
    JwtGuard,
  )
  async create(
    @Req()
    req: any,

    @Body()
    body: CreateReviewDto,
  ) {
    return this.reviewsService.create(
      req.user,
      body,
    );
  }

  /*
   * PUBLIC
   *
   * Latest 3 approved real reviews
   * for homepage.
   *
   * GET /reviews/recent
   */
  @Get('recent')
  async findPublicRecent() {
    return this.reviewsService
      .findPublicRecent();
  }

  /*
   * PUBLIC
   *
   * Package average rating.
   *
   * GET /reviews/package/:packageId/rating
   */
  @Get(
    'package/:packageId/rating',
  )
  async getPackageRating(
    @Param(
      'packageId',
    )
    packageId: string,
  ) {
    return this.reviewsService
      .getPackageRating(
        packageId,
      );
  }

  /*
   * PUBLIC
   *
   * All approved reviews
   * for one package.
   *
   * GET /reviews/package/:packageId
   */
  @Get(
    'package/:packageId',
  )
  async findByPackage(
    @Param(
      'packageId',
    )
    packageId: string,
  ) {
    return this.reviewsService
      .findByPackage(
        packageId,
      );
  }

  /*
   * ADMIN
   *
   * Get all reviews.
   *
   * GET /reviews
   */
  @Get()
  @UseGuards(
    JwtGuard,
  )
  async findAll(
    @Req()
    req: any,
  ) {
    this.ensureAdmin(
      req.user,
    );

    return this.reviewsService
      .findAll();
  }

  /*
   * ADMIN
   *
   * Delete review.
   *
   * DELETE /reviews/:id
   */
  @Delete(
    ':id',
  )
  @UseGuards(
    JwtGuard,
  )
  async remove(
    @Req()
    req: any,

    @Param(
      'id',
    )
    id: string,
  ) {
    this.ensureAdmin(
      req.user,
    );

    return this.reviewsService
      .remove(
        id,
      );
  }
}
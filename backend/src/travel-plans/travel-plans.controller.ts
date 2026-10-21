import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  TravelPlansService,
} from './travel-plans.service';

import {
  CreateTravelPlanDto,
  UpdateTravelPlanDto,
} from './dto/create-travel-plan.dto';

import {
  JwtGuard,
} from '../auth/jwt.guard';

@Controller('travel-plans')
export class TravelPlansController {
  constructor(
    private readonly travelPlansService:
      TravelPlansService,
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
   * PUBLIC
   * Active plans for homepage.
   *
   * GET /travel-plans/active
   */
  @Get('active')
  async findActive() {
    return this.travelPlansService
      .findActive();
  }

  /*
   * ADMIN
   * Get all plans.
   *
   * GET /travel-plans
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

    return this.travelPlansService
      .findAll();
  }

  /*
   * ADMIN
   * Get one plan.
   *
   * GET /travel-plans/:id
   */
  @Get(':id')
  @UseGuards(
    JwtGuard,
  )
  async findOne(
    @Req()
    req: any,

    @Param('id')
    id: string,
  ) {
    this.ensureAdmin(
      req.user,
    );

    return this.travelPlansService
      .findOne(
        id,
      );
  }

  /*
   * ADMIN
   * Create plan.
   *
   * POST /travel-plans
   */
  @Post()
  @UseGuards(
    JwtGuard,
  )
  async create(
    @Req()
    req: any,

    @Body()
    body:
      CreateTravelPlanDto,
  ) {
    this.ensureAdmin(
      req.user,
    );

    return this.travelPlansService
      .create(
        body,
      );
  }

  /*
   * ADMIN
   * Update plan.
   *
   * PATCH /travel-plans/:id
   */
  @Patch(':id')
  @UseGuards(
    JwtGuard,
  )
  async update(
    @Req()
    req: any,

    @Param('id')
    id: string,

    @Body()
    body:
      UpdateTravelPlanDto,
  ) {
    this.ensureAdmin(
      req.user,
    );

    return this.travelPlansService
      .update(
        id,
        body,
      );
  }

  /*
   * ADMIN
   * Delete plan.
   *
   * DELETE /travel-plans/:id
   */
  @Delete(':id')
  @UseGuards(
    JwtGuard,
  )
  async remove(
    @Req()
    req: any,

    @Param('id')
    id: string,
  ) {
    this.ensureAdmin(
      req.user,
    );

    return this.travelPlansService
      .remove(
        id,
      );
  }
}
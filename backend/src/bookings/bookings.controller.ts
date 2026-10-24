import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  BookingsService,
} from './bookings.service';

import {
  CreateBookingDto,
} from './dto/create-booking.dto';

import {
  BookingStatus,
} from './enums/booking-status.enum';

import {
  JwtGuard,
} from '../auth/jwt.guard';

import {
  AdminGuard,
} from '../auth/admin.guard';

@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService:
      BookingsService,
  ) {}

  /* =========================
     CREATE BOOKING
     Traveller only
  ========================= */

  @Post()
  @UseGuards(
    JwtGuard,
  )
  create(
    @Req()
    req: any,

    @Body()
    dto: CreateBookingDto,
  ) {
    return this.bookingsService.create(
      req.user,
      dto,
    );
  }

  /* =========================
     ALL BOOKINGS
     Admin only
  ========================= */

  @Get()
  @UseGuards(
    JwtGuard,
    AdminGuard,
  )
  findAll() {
    return this.bookingsService.findAll();
  }

  /* =========================
     CURRENT USER BOOKINGS
     Traveller
  ========================= */

  @Get('my')
  @UseGuards(
    JwtGuard,
  )
  findMyBookings(
    @Req()
    req: any,
  ) {
    return this.bookingsService.findUserBookings(
      req.user,
      req.user.id,
    );
  }

  /* =========================
     TRAVELLER BOOKINGS
     Admin or owner
  ========================= */

  @Get('user/:userId')
  @UseGuards(
    JwtGuard,
  )
  findUserBookings(
    @Param(
      'userId',
    )
    userId: string,

    @Req()
    req: any,
  ) {
    return this.bookingsService.findUserBookings(
      req.user,
      userId,
    );
  }

  /* =========================
     PUBLIC BUSY GUIDES SCHEDULE
     Must be before :id to prevent route masking
  ========================= */

  @Get('busy-guides')
  findBusyGuides(
    @Query('travelDate') travelDate: string,
    @Query('durationDays') durationDays?: string,
    @Query('packageId') packageId?: string,
  ) {
    return this.bookingsService.findBusyGuides(
      travelDate,
      durationDays,
      packageId,
    );
  }

  /* =========================
     PUBLIC VEHICLE PRICING
     Must be before :id to prevent route masking
  ========================= */

  @Get('vehicle-pricing')
  findVehiclePricing() {
    return this.bookingsService.getVehiclePricingSetting();
  }

  /* =========================
     GUIDE ASSIGNED TOURS
     Must be before :id to prevent route masking
  ========================= */

  @Get('my-guide-tours')
  @UseGuards(JwtGuard)
  findMyGuideTours(@Req() req: any) {
    return this.bookingsService.findGuideBookings(req.user);
  }

  /* =========================
     SINGLE BOOKING

     Traveller:
     only own booking

     Admin:
     any booking
  ========================= */

  @Get(':id')
  @UseGuards(
    JwtGuard,
  )
  findOne(
    @Req()
    req: any,

    @Param(
      'id',
    )
    id: string,
  ) {
    return this.bookingsService.findOne(
      req.user,
      id,
    );
  }

  /* =========================
     UPDATE BOOKING STATUS
     Admin only
  ========================= */

  @Patch(':id')
  @UseGuards(
    JwtGuard,
    AdminGuard,
  )
  updateStatus(
    @Param(
      'id',
    )
    id: string,

    @Body(
      'status',
    )
    status: BookingStatus,
  ) {
    return this.bookingsService.updateStatus(
      id,
      status,
    );
  }

  /* =========================
     DELETE BOOKING
     Admin only
  ========================= */

  @Delete(':id')
  @UseGuards(
    JwtGuard,
    AdminGuard,
  )
  remove(
    @Param(
      'id',
    )
    id: string,
  ) {
    return this.bookingsService.remove(
      id,
    );
  }
}

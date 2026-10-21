import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
    body: CreateBookingDto,
  ) {
    return this.bookingsService.create(
      req.user,
      body,
    );
  }

  /* =========================
     GET ALL BOOKINGS
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
     USER BOOKING HISTORY

     Traveller:
     only own bookings

     Admin:
     can view any user
  ========================= */

  /* =========================
     CURRENT USER BOOKINGS
  ========================= */

  @Get('my')
  @UseGuards(JwtGuard)
  findMyBookings(@Req() req: any) {
    return this.bookingsService.findUserBookings(req.user, req.user.id);
  }

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
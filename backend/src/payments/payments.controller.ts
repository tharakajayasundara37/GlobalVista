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
  PaymentsService,
} from './payments.service';

import {
  CreatePaymentDto,
} from './dto/create-payment.dto';

import {
  JwtGuard,
} from '../auth/jwt.guard';

import {
  AdminGuard,
} from '../auth/admin.guard';


@Controller('payments')
export class PaymentsController {

  constructor(
    private readonly paymentsService:
      PaymentsService,
  ) {}


  /* =========================
     CREATE PAYMENT
  ========================= */

  @Post()
  @UseGuards(JwtGuard)
  create(
    @Req() req: any,
    @Body() body: CreatePaymentDto,
  ) {
    return this.paymentsService.create(
      req.user,
      body,
    );
  }


  /* =========================
     ADMIN - ALL PAYMENTS
  ========================= */

  @Get()
  @UseGuards(
    JwtGuard,
    AdminGuard,
  )
  findAll() {
    return this.paymentsService.findAll();
  }


  /* =========================
     PAYMENTS BY BOOKING
  ========================= */

  @Get('booking/:bookingId')
  @UseGuards(JwtGuard)
  findByBooking(
    @Req() req: any,
    @Param('bookingId')
    bookingId: string,
  ) {
    return this.paymentsService.findByBooking(
      req.user,
      bookingId,
    );
  }


  /* =========================
     SINGLE PAYMENT
  ========================= */

  @Get(':id')
  @UseGuards(JwtGuard)
  findOne(
    @Req() req: any,
    @Param('id')
    id: string,
  ) {
    return this.paymentsService.findOne(
      req.user,
      id,
    );
  }


  /* =========================
     ADMIN UPDATE STATUS
  ========================= */

  @Patch(':id')
  @UseGuards(
    JwtGuard,
    AdminGuard,
  )
  updateStatus(
    @Param('id')
    id: string,

    @Body('status')
    status: string,
  ) {
    return this.paymentsService.updateStatus(
      id,
      status,
    );
  }


  /* =========================
     ADMIN DELETE PAYMENT
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
    return this.paymentsService.remove(
      id,
    );
  }

}
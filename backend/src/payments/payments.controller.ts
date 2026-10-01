import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req
} from '@nestjs/common';


import { PaymentsService } from './payments.service';

import { CreatePaymentDto } from './dto/create-payment.dto';

import { JwtGuard } from '../auth/jwt.guard';

import { AdminGuard } from '../auth/admin.guard';



@Controller('payments')
export class PaymentsController {


  constructor(
    private paymentsService: PaymentsService
  ) {}



  @Post()
  @UseGuards(JwtGuard)
  create(
    @Req() req:any,
    @Body() body:CreatePaymentDto
  ) {

    return this.paymentsService.create(
      req.user,
      body
    );

  }



  @Get()
  @UseGuards(JwtGuard, AdminGuard)
  findAll() {

    return this.paymentsService.findAll();

  }



  @Get(':id')
  @UseGuards(JwtGuard)
  findOne(
    @Param('id') id:string
  ) {

    return this.paymentsService.findOne(id);

  }



  @Get('booking/:bookingId')
  @UseGuards(JwtGuard)
  findByBooking(
    @Param('bookingId') bookingId:string
  ) {

    return this.paymentsService.findByBooking(
      bookingId
    );

  }



  @Patch(':id')
  @UseGuards(JwtGuard, AdminGuard)
  updateStatus(
    @Param('id') id:string,
    @Body('status') status:string
  ) {

    return this.paymentsService.updateStatus(
      id,
      status
    );

  }



  @Delete(':id')
  @UseGuards(JwtGuard, AdminGuard)
  remove(
    @Param('id') id:string
  ) {

    return this.paymentsService.remove(id);

  }


}
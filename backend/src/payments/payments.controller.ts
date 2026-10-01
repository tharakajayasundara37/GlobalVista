import {

  Controller,

  Get,

  Post,

  Body,

  Param,

  Patch,

  Delete,

  UseGuards

} from '@nestjs/common';


import {
  PaymentsService
} from './payments.service';


import {
  CreatePaymentDto
} from './dto/create-payment.dto';


import {
  JwtGuard
} from '../auth/jwt.guard';


import {
  AdminGuard
} from '../auth/admin.guard';



@Controller('payments')
export class PaymentsController {


  constructor(

    private paymentsService: PaymentsService

  ) {}





  // USER Create Payment

  @Post()

  @UseGuards(JwtGuard)

  create(

    @Body() body: CreatePaymentDto

  ) {


    return this.paymentsService.create(

      body

    );


  }







  // ADMIN View All Payments

  @Get()

  @UseGuards(

    JwtGuard,

    AdminGuard

  )

  findAll() {


    return this.paymentsService.findAll();


  }







  // Single Payment

  @Get(':id')

  @UseGuards(JwtGuard)

  findOne(

    @Param('id') id: string

  ) {


    return this.paymentsService.findOne(

      id

    );


  }







  // Payments By Booking

  @Get('booking/:bookingId')

  @UseGuards(JwtGuard)

  findByBooking(

    @Param('bookingId') bookingId: string

  ) {


    return this.paymentsService.findByBooking(

      bookingId

    );


  }







  // ADMIN Update Payment Status

  @Patch(':id')

  @UseGuards(

    JwtGuard,

    AdminGuard

  )

  updateStatus(

    @Param('id') id: string,

    @Body('status') status: string

  ) {


    return this.paymentsService.updateStatus(

      id,

      status

    );


  }







  // ADMIN Delete Payment

  @Delete(':id')

  @UseGuards(

    JwtGuard,

    AdminGuard

  )

  remove(

    @Param('id') id: string

  ) {


    return this.paymentsService.remove(

      id

    );


  }


}
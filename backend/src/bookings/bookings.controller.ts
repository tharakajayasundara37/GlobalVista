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


import { BookingsService } from './bookings.service';

import { CreateBookingDto } from './dto/create-booking.dto';

import { BookingStatus } from './enums/booking-status.enum';


import { JwtGuard } from '../auth/jwt.guard';

import { AdminGuard } from '../auth/admin.guard';



@Controller('bookings')
export class BookingsController {


constructor(
  private bookingsService: BookingsService
){}



// ==========================
// Create Booking
// USER + ADMIN
// ==========================

@Post()
@UseGuards(JwtGuard)
create(
  @Body() body:CreateBookingDto
){

return this.bookingsService.create(body);

}




// ==========================
// All Bookings
// ADMIN ONLY
// ==========================

@Get()
@UseGuards(JwtGuard, AdminGuard)
findAll(){

return this.bookingsService.findAll();

}




// ==========================
// Single Booking
// USER + ADMIN
// ==========================

@Get(':id')
@UseGuards(JwtGuard)
findOne(
  @Param('id') id:string
){

return this.bookingsService.findOne(id);

}





// ==========================
// User Booking History
// USER + ADMIN
// ==========================

@Get('user/:userId')
@UseGuards(JwtGuard)
findUserBookings(
  @Param('userId') userId:string
){

return this.bookingsService.findUserBookings(userId);

}





// ==========================
// Update Booking Status
// ADMIN ONLY
// ==========================

@Patch(':id')
@UseGuards(JwtGuard, AdminGuard)
updateStatus(
  @Param('id') id:string,
  @Body('status') status:BookingStatus
){

return this.bookingsService.updateStatus(
  id,
  status
);

}





// ==========================
// Delete Booking
// ADMIN ONLY
// ==========================

@Delete(':id')
@UseGuards(JwtGuard, AdminGuard)
remove(
  @Param('id') id:string
){

return this.bookingsService.remove(id);

}



}
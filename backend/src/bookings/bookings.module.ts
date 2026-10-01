import { Module } from '@nestjs/common';


import { MongooseModule } from '@nestjs/mongoose';


import { BookingsController } from './bookings.controller';


import { BookingsService } from './bookings.service';



import {

  Booking,

  BookingSchema

} from './schemas/booking.schema';



import { AuthModule } from '../auth/auth.module';




@Module({

imports:[



  AuthModule,



  MongooseModule.forFeature([


    {

      name: Booking.name,

      schema: BookingSchema

    }


  ])



],





controllers:[

  BookingsController

],





providers:[

  BookingsService

],





exports:[

  BookingsService

]



})


export class BookingsModule {}
import { Module } from '@nestjs/common';


import { MongooseModule } from '@nestjs/mongoose';


import { AdminDashboardController } from './admin-dashboard.controller';


import { AdminDashboardService } from './admin-dashboard.service';



import { AuthModule } from '../auth/auth.module';



import {
  User,
  UserSchema
} from '../users/schemas/user.schema';



import {
  Package,
  PackageSchema
} from '../packages/schemas/package.schema';



import {
  Booking,
  BookingSchema
} from '../bookings/schemas/booking.schema';



import {
  Payment,
  PaymentSchema
} from '../payments/schemas/payment.schema';




@Module({

imports:[


AuthModule,


MongooseModule.forFeature([


{
 name:User.name,
 schema:UserSchema
},


{
 name:Package.name,
 schema:PackageSchema
},


{
 name:Booking.name,
 schema:BookingSchema
},


{
 name:Payment.name,
 schema:PaymentSchema
}


])


],



controllers:[

AdminDashboardController

],



providers:[

AdminDashboardService

]


})


export class AdminDashboardModule {}
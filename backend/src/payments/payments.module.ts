import {
 Module
} from '@nestjs/common';


import {
 MongooseModule
} from '@nestjs/mongoose';



import {
 PaymentsController
} from './payments.controller';



import {
 PaymentsService
} from './payments.service';



import {

Payment,

PaymentSchema

} from './schemas/payment.schema';



import {

Booking,

BookingSchema

} from '../bookings/schemas/booking.schema';



import {
 AuthModule
} from '../auth/auth.module';





@Module({

imports:[


AuthModule,



MongooseModule.forFeature([


{

name:Payment.name,

schema:PaymentSchema

},



{

name:Booking.name,

schema:BookingSchema

}



])

],



controllers:[

PaymentsController

],



providers:[

PaymentsService

]



})


export class PaymentsModule {}
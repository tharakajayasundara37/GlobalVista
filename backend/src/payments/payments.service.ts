import {
  Injectable,
  NotFoundException
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Payment,
  PaymentDocument
} from './schemas/payment.schema';

import {
  Booking,
  BookingDocument
} from '../bookings/schemas/booking.schema';

import { CreatePaymentDto } from './dto/create-payment.dto';


@Injectable()
export class PaymentsService {


constructor(

@InjectModel(Payment.name)
private paymentModel: Model<PaymentDocument>,

@InjectModel(Booking.name)
private bookingModel: Model<BookingDocument>

){}


// Create Payment
async create(data:CreatePaymentDto){

const booking = await this.bookingModel.findById(
  data.bookingId
);


if(!booking){

throw new NotFoundException(
  "Booking not found"
);

}


const payment = new this.paymentModel({

...data,

status:"SUCCESS"

});


const savedPayment = await payment.save();


await this.bookingModel.findByIdAndUpdate(

data.bookingId,

{
paymentStatus:"PAID"
}

);


return savedPayment;

}



// All Payments
async findAll(){

return this.paymentModel

.find()

.populate(
  'bookingId'
)

.populate(
  'userId'
);

}



// Single Payment
async findOne(id:string){

const payment = await this.paymentModel

.findById(id)

.populate(
  'bookingId'
)

.populate(
  'userId'
);



if(!payment){

throw new NotFoundException(
  "Payment not found"
);

}


return payment;

}



// Booking Payments
async findByBooking(bookingId:string){

return this.paymentModel.find({

bookingId

});

}



// Update Status
async updateStatus(
id:string,
status:string
){

const payment = await this.paymentModel.findByIdAndUpdate(

id,

{
status
},

{
new:true
}

);



if(!payment){

throw new NotFoundException(
  "Payment not found"
);

}



if(status==="SUCCESS"){


await this.bookingModel.findByIdAndUpdate(

payment.bookingId,

{
paymentStatus:"PAID"
}

);


}



return payment;

}



// Delete
async remove(id:string){

const payment = await this.paymentModel.findByIdAndDelete(
id
);



if(!payment){

throw new NotFoundException(
  "Payment not found"
);

}



return {

message:"Payment deleted successfully"

};


}


}
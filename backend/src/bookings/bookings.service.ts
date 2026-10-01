import {
  Injectable,
  NotFoundException
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Booking,
  BookingDocument
} from './schemas/booking.schema';

import { BookingStatus } from './enums/booking-status.enum';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {

constructor(
  @InjectModel(Booking.name)
  private bookingModel: Model<BookingDocument>
){}


// Create Booking
async create(data:CreateBookingDto){

const booking = new this.bookingModel({
  ...data,
  status:'PENDING',
  paymentStatus:'UNPAID'
});

return booking.save();

}


// Get All Bookings
async findAll(){

return this.bookingModel
.find()
.populate(
  'userId',
  'name email country'
)
.populate(
  'packageId',
  'title country price duration category'
);

}


// Get Single Booking
async findOne(id:string){

const booking = await this.bookingModel
.findById(id)
.populate(
  'userId',
  'name email country'
)
.populate(
  'packageId',
  'title country price duration category'
);


if(!booking){
  throw new NotFoundException(
    "Booking not found"
  );
}

return booking;

}


// Get User Bookings
async findUserBookings(userId:string){

return this.bookingModel
.find({
  userId:userId
})
.populate(
  'userId',
  'name email country'
)
.populate(
  'packageId',
  'title country price duration category'
);

}


// Update Booking Status
async updateStatus(
id:string,
status:BookingStatus
){

const booking = await this.bookingModel.findByIdAndUpdate(
  id,
  {
    status:status
  },
  {
    new:true
  }
);


if(!booking){
  throw new NotFoundException(
    "Booking not found"
  );
}

return booking;

}


// Delete Booking
async remove(id:string){

const booking = await this.bookingModel.findByIdAndDelete(id);


if(!booking){
  throw new NotFoundException(
    "Booking not found"
  );
}

return {
  message:"Booking deleted successfully"
};

}

}

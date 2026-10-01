import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BookingStatus } from '../enums/booking-status.enum';

export type BookingDocument = Booking & Document;


@Schema({
  timestamps:true
})
export class Booking {


  @Prop({
    type: Types.ObjectId,
    ref:'User',
    required:true
  })
  userId: Types.ObjectId;



  @Prop({
    type: Types.ObjectId,
    ref:'Package',
    required:true
  })
  packageId: Types.ObjectId;



  @Prop()
  travelDate:string;



  @Prop()
  numberOfPeople:number;



  @Prop()
  totalPrice:number;



@Prop({
  enum: BookingStatus,
  default: BookingStatus.PENDING
})
status: BookingStatus;



  @Prop({
    default:'UNPAID'
  })
  paymentStatus:string;


}


export const BookingSchema =
SchemaFactory.createForClass(Booking);
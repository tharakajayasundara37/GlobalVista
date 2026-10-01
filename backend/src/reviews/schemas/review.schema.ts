import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';


export type ReviewDocument = Review & Document;


@Schema({
  timestamps:true
})
export class Review {


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



  @Prop({
    required:true
  })
  rating:number;



  @Prop()
  comment:string;



  @Prop({
    default:true
  })
  isApproved:boolean;


}


export const ReviewSchema =
SchemaFactory.createForClass(Review);
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';


export type WishlistDocument = Wishlist & Document;


@Schema({
  timestamps:true
})
export class Wishlist {


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


}


export const WishlistSchema =
SchemaFactory.createForClass(Wishlist);
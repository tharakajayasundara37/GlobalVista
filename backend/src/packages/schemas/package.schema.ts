import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';


export type PackageDocument = Package & Document;


@Schema({
  timestamps:true
})
export class Package {


  @Prop({
    required:true
  })
  title:string;


  @Prop({
    required:true
  })
  destination:string;


  @Prop({
    required:true
  })
  country:string;


  @Prop()
  duration:string;


  @Prop()
  price:number;


  @Prop()
  category:string;


  @Prop()
  description:string;


  @Prop()
  included:string[];


  @Prop()
  images:string[];


  @Prop()
  availability:boolean;


  @Prop()
  rating:number;


}


export const PackageSchema =
SchemaFactory.createForClass(Package);
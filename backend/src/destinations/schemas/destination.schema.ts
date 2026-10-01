import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';


export type DestinationDocument = Destination & Document;


@Schema({
    timestamps:true
})
export class Destination {


    @Prop({
        required:true
    })
    name:string;



    @Prop({
        required:true
    })
    country:string;



    @Prop()
    description:string;



    @Prop()
    images:string[];



    @Prop()
    rating:number;



    @Prop()
    bestTimeToVisit:string;



    @Prop()
    activities:string[];



    @Prop()
    budget:string;



}


export const DestinationSchema =
SchemaFactory.createForClass(Destination);
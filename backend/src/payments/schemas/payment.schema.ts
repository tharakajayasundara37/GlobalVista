import {
 Prop,
 Schema,
 SchemaFactory
} from '@nestjs/mongoose';


import {
 Document,
 Types
} from 'mongoose';




export type PaymentDocument =
Payment & Document;





@Schema({

timestamps:true

})

export class Payment {



@Prop({

type:Types.ObjectId,

ref:'Booking',

required:true

})

bookingId:Types.ObjectId;






@Prop({

type:Types.ObjectId,

ref:'User',

required:true

})

userId:Types.ObjectId;







@Prop({

required:true

})

amount:number;







@Prop()

paymentMethod:string;







@Prop()

transactionId:string;







@Prop({

default:"PENDING"

})

status:string;



}




export const PaymentSchema =
SchemaFactory.createForClass(Payment);
import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  Document,
  Types,
} from 'mongoose';

export type PaymentDocument =
  Payment & Document;

@Schema({
  timestamps: true,
})
export class Payment {
  @Prop({
    type:
      Types.ObjectId,

    ref:
      'Booking',

    required:
      true,

    index:
      true,
  })
  bookingId:
    Types.ObjectId;

  @Prop({
    type:
      Types.ObjectId,

    ref:
      'User',

    required:
      true,

    index:
      true,
  })
  userId:
    Types.ObjectId;

  @Prop({
    type:
      Number,

    required:
      true,

    min:
      0,
  })
  amount:
    number;

  @Prop({
    type:
      String,

    required:
      true,

    trim:
      true,
  })
  paymentMethod:
    string;

  @Prop({
    type:
      String,

    required:
      true,

    trim:
      true,

    unique:
      true,

    index:
      true,
  })
  transactionId:
    string;

  @Prop({
    type:
      String,

    enum: [
      'PENDING',
      'SUCCESS',
      'FAILED',
    ],

    default:
      'PENDING',

    index:
      true,
  })
  status:
    string;
}

export const PaymentSchema =
  SchemaFactory.createForClass(
    Payment,
  );

PaymentSchema.index({
  bookingId: 1,
  status: 1,
});
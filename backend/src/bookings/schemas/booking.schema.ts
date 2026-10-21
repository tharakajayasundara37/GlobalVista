import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  Document,
  Types,
} from 'mongoose';

import {
  BookingStatus,
} from '../enums/booking-status.enum';

import {
  AddOnPricingType,
} from '../../packages/schemas/package.schema';

export type BookingDocument =
  Booking & Document;

/* =========================
   SELECTED BOOKING ADD-ON
========================= */

@Schema({
  _id: false,
})
export class BookingAddOn {
  @Prop({
    required: true,
  })
  addOnId: string;

  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    min: 0,
  })
  price: number;

  @Prop({
    required: true,
    enum:
      AddOnPricingType,
  })
  pricingType:
    AddOnPricingType;

  @Prop({
    required: true,
    min: 1,
  })
  quantity: number;

  @Prop({
    required: true,
    min: 0,
  })
  calculatedAmount:
    number;
}

export const BookingAddOnSchema =
  SchemaFactory.createForClass(
    BookingAddOn,
  );

/* =========================
   TRAVEL PLAN SNAPSHOT
========================= */

@Schema({
  _id: false,
})
export class BookingTravelPlan {
  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    min: 0,
  })
  price: number;

  @Prop({
    default:
      '/ person',
    trim: true,
  })
  priceSuffix: string;

  @Prop({
    type: [
      String,
    ],
    default: [],
  })
  features: string[];

  @Prop({
    required: true,
    min: 1,
  })
  quantity: number;

  @Prop({
    required: true,
    min: 0,
  })
  calculatedAmount:
    number;
}

export const BookingTravelPlanSchema =
  SchemaFactory.createForClass(
    BookingTravelPlan,
  );

/* =========================
   BOOKING
========================= */

@Schema({
  timestamps: true,
})
export class Booking {
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
      Types.ObjectId,
    ref:
      'Package',
    required:
      true,
    index:
      true,
  })
  packageId:
    Types.ObjectId;

  @Prop({
    type:
      Types.ObjectId,
    ref:
      'TravelPlan',
    required:
      true,
    index:
      true,
  })
  travelPlanId:
    Types.ObjectId;

  @Prop({
    type:
      BookingTravelPlanSchema,
    required:
      true,
  })
  selectedTravelPlan:
    BookingTravelPlan;

  @Prop({
    required:
      true,
  })
  travelDate:
    string;

  @Prop({
    required:
      true,
    min:
      1,
  })
  numberOfPeople:
    number;

  @Prop({
    required:
      true,
    min:
      0,
  })
  basePrice:
    number;

  @Prop({
    required:
      true,
    min:
      0,
  })
  baseTotal:
    number;

  @Prop({
    type: [
      BookingAddOnSchema,
    ],
    default: [],
  })
  selectedAddOns:
    BookingAddOn[];

  @Prop({
    default:
      0,
    min:
      0,
  })
  addOnsTotal:
    number;

  @Prop({
    required:
      true,
    min:
      0,
  })
  totalPrice:
    number;

  @Prop({
    enum:
      BookingStatus,
    default:
      BookingStatus.PENDING,
    index:
      true,
  })
  status:
    BookingStatus;

  @Prop({
    default:
      'UNPAID',
    index:
      true,
  })
  paymentStatus:
    string;
}

export const BookingSchema =
  SchemaFactory.createForClass(
    Booking,
  );
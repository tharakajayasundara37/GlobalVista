
import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  Document,
  Schema as MongooseSchema,
  Types,
} from 'mongoose';

export type PackageDocument =
  Package & Document;

/* =========================
   ADD-ON PRICING TYPE
========================= */

export enum AddOnPricingType {
  PER_PERSON = 'PER_PERSON',
  PER_BOOKING = 'PER_BOOKING',
}

/* =========================
   PACKAGE ADD-ON
========================= */

@Schema()
export class PackageAddOn {
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
    enum: AddOnPricingType,
    default: AddOnPricingType.PER_PERSON,
  })
  pricingType: AddOnPricingType;
}

export const PackageAddOnSchema =
  SchemaFactory.createForClass(PackageAddOn);

/* =========================
   PACKAGE
========================= */

@Schema({
  timestamps: true,
})
export class Package {
  @Prop({
    required: true,
    trim: true,
  })
  title: string;

  /* =========================
     DESTINATION LINK

     Optional to preserve
     existing packages.
  ========================= */

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Destination',
    default: null,
    index: true,
  })
  destinationId?: Types.ObjectId | null;

  @Prop({
    required: true,
    trim: true,
  })
  destination: string;

  @Prop({
    required: true,
    trim: true,
  })
  country: string;

  @Prop({
    default: '',
  })
  duration: string;

  @Prop({
    type: Number,
    default: 150,
    min: 0,
  })
  distanceKm?: number;

  @Prop({
    required: true,
    min: 0,
  })
  price: number;

  @Prop({
    default: '',
  })
  category: string;

  @Prop({
    default: '',
  })
  description: string;

  /* =========================
     FREE INCLUDED ITEMS
     Maximum 6
  ========================= */

  @Prop({
    type: [String],
    default: [],
    validate: {
      validator: (items: string[]) =>
        !items || items.length <= 6,
      message:
        'A package can include a maximum of 6 free items',
    },
  })
  included: string[];

  /* =========================
     PAID OPTIONAL ADD-ONS
  ========================= */

  @Prop({
    type: [PackageAddOnSchema],
    default: [],
  })
  addOns: PackageAddOn[];

  /* =========================
     PACKAGE IMAGES
  ========================= */

  @Prop({
    type: [String],
    default: [],
  })
  images: string[];

  /* =========================
     AVAILABILITY
  ========================= */

  @Prop({
    default: true,
  })
  availability: boolean;

  /* =========================
     RATING
  ========================= */

  @Prop({
    default: 0,
    min: 0,
    max: 5,
  })
  rating: number;

  /* =========================
     SPECIAL OFFER
  ========================= */

  @Prop({
    type: Boolean,
    default: false,
  })
  isSpecialOffer: boolean;

  /* =========================
     ORIGINAL PRICE
  ========================= */

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  originalPrice: number;

  /* =========================
     DISCOUNT PERCENTAGE
     Calculated by service
  ========================= */

  @Prop({
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  })
  discountPercentage: number;
}

export const PackageSchema =
  SchemaFactory.createForClass(Package);

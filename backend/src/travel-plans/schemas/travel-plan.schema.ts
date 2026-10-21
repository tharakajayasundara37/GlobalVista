import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
} from 'mongoose';

export type TravelPlanDocument =
  HydratedDocument<TravelPlan>;

@Schema({
  timestamps: true,
})
export class TravelPlan {
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
    default: '/ person',
    trim: true,
  })
  priceSuffix: string;

  @Prop({
    type: [String],
    required: true,
    default: [],
  })
  features: string[];

  @Prop({
    default: false,
  })
  isPopular: boolean;

  @Prop({
    default: true,
  })
  isActive: boolean;

  @Prop({
    default: 0,
    min: 0,
  })
  sortOrder: number;
}

export const TravelPlanSchema =
  SchemaFactory.createForClass(
    TravelPlan,
  );
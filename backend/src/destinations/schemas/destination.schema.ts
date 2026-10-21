
import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Schema as MongooseSchema,
  Types,
} from 'mongoose';

export type DestinationDocument =
  HydratedDocument<Destination>;

export type ApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

@Schema({ timestamps: true })
export class Destination {
  @Prop({
    required: true,
    trim: true,
    index: true,
  })
  name: string;

  @Prop({
    required: true,
    trim: true,
    index: true,
  })
  country: string;

  @Prop({ default: '', trim: true })
  description: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({
    default: 0,
    min: 0,
    max: 5,
  })
  rating: number;

  @Prop({ default: '', trim: true })
  bestTimeToVisit: string;

  @Prop({ type: [String], default: [] })
  activities: string[];

  @Prop({ default: '', trim: true })
  budget: string;

  @Prop({
    type: Number,
    min: -90,
    max: 90,
    default: null,
  })
  latitude: number | null;

  @Prop({
    type: Number,
    min: -180,
    max: 180,
    default: null,
  })
  longitude: number | null;

  // Admin can hide an approved destination.
  @Prop({
    default: true,
    index: true,
  })
  isActive: boolean;

  // Owner of a Guide-created destination.
  // Older admin destinations have no owner.
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  })
  createdBy: Types.ObjectId | null;

  // Existing admin destinations remain approved.
  @Prop({
    type: String,
    enum: [
      'PENDING',
      'APPROVED',
      'REJECTED',
    ],
    default: 'APPROVED',
    index: true,
  })
  approvalStatus: ApprovalStatus;

  @Prop({
    default: '',
    trim: true,
  })
  rejectionReason: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    default: null,
  })
  approvedBy: Types.ObjectId | null;

  @Prop({
    type: Date,
    default: null,
  })
  approvedAt: Date | null;
}

export const DestinationSchema =
  SchemaFactory.createForClass(Destination);

DestinationSchema.index({
  country: 1,
  name: 1,
});

DestinationSchema.index({
  approvalStatus: 1,
  isActive: 1,
});

DestinationSchema.index({
  createdBy: 1,
  createdAt: -1,
});

import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import {
  Document,
  Types,
} from 'mongoose';

export type ReviewDocument =
  Review & Document;

@Schema({
  timestamps: true,
})
export class Review {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Package',
    required: true,
    index: true,
  })
  packageId: Types.ObjectId;

  @Prop({
    required: true,
    min: 1,
    max: 5,
  })
  rating: number;

  @Prop({
    required: true,
    trim: true,
    maxlength: 1000,
  })
  comment: string;

  @Prop({
    default: true,
    index: true,
  })
  isApproved: boolean;
}

export const ReviewSchema =
  SchemaFactory.createForClass(
    Review,
  );

ReviewSchema.index(
  {
    userId: 1,
    packageId: 1,
  },
  {
    unique: true,
  },
);
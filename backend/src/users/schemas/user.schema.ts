
import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum Role {
  USER = 'USER',
  GUIDE = 'GUIDE',
  ADMIN = 'ADMIN',
}

export enum GuideStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum VehicleType {
  CAR = 'CAR',
  VAN = 'VAN',
  BUS = 'BUS',
}

export enum GovernmentIdType {
  NIC = 'NIC',
  PASSPORT = 'PASSPORT',
  DRIVING_LICENSE = 'DRIVING_LICENSE',
}

@Schema({ timestamps: true })
export class User {
  @Prop({
    type: String,
    required: true,
    unique: true,
    sparse: true,
    index: true,
  })
  publicId: string;

  @Prop({
    type: String,
    required: true,
  })
  name: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({
    type: String,
    required: true,
  })
  password: string;

  @Prop({
    type: String,
    required: true,
  })
  country: string;

  @Prop({
    type: String,
    required: true,
  })
  mobile: string;

  @Prop({
    type: String,
    enum: Object.values(Role),
    default: Role.USER,
  })
  role: Role;

  @Prop({
    type: String,
    enum: Object.values(GuideStatus),
    default: null,
  })
  guideStatus: GuideStatus | null;

  // =========================
  // GUIDE PERSONAL DETAILS
  // =========================

  @Prop({
    type: String,
  })
  city?: string;

  @Prop({
    type: [String],
    default: [],
  })
  languages?: string[];

  @Prop({
    type: Number,
    default: 0,
  })
  experienceYears?: number;

  @Prop({
    type: String,
  })
  about?: string;

  @Prop({
    type: String,
    enum: Object.values(VehicleType),
    default: null,
  })
  vehicleType?: VehicleType | null;

  @Prop({
    type: String,
    default: '',
    trim: true,
  })
  vehicleNumber?: string;

  // =========================
  // GOVERNMENT IDENTITY
  // =========================

  @Prop({
    type: String,
    enum: Object.values(
      GovernmentIdType,
    ),
  })
  governmentIdType?: GovernmentIdType;

  @Prop({
    type: String,
    select: false,
  })
  governmentIdNumber?: string;

  // =========================
  // PROFILE IMAGE
  // =========================

  @Prop({
    type: String,
    default: '',
  })
  profileImage?: string;

  // =========================
  // GUIDE ID DOCUMENTS
  // PRIVATE STORAGE ONLY
  // =========================

  @Prop({
    type: String,
    select: false,
  })
  guideIdFrontPath?: string;

  @Prop({
    type: String,
    select: false,
  })
  guideIdBackPath?: string;

  @Prop({
    type: String,
    select: false,
  })
  guideLicensePath?: string;

  // =========================
  // GUIDE TERMS & CONSENT
  // =========================

  @Prop({
    type: Date,
    default: null,
  })
  guideTermsAcceptedAt?: Date | null;

  // =========================
  // EMAIL VERIFICATION
  // =========================

  @Prop({
    type: Boolean,
    default: false,
  })
  emailVerified?: boolean;

  // =========================
  // ADMIN REVIEW DETAILS
  // =========================

  @Prop({
    type: String,
    default: '',
  })
  guideReviewReason?: string;

  @Prop({
    type: Date,
    default: null,
  })
  guideReviewedAt?: Date | null;

  @Prop({
    type: String,
    default: '',
  })
  guideReviewedBy?: string;
}

export const UserSchema =
  SchemaFactory.createForClass(User);

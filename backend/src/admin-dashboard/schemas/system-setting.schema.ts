import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import { Document } from 'mongoose';

export type SystemSettingDocument = SystemSetting & Document;

@Schema({ timestamps: true })
export class SystemSetting {
  @Prop({ default: 'DEFAULT_SETTINGS', unique: true })
  key: string;

  @Prop({ default: 100 })
  pricePerKm: number;

  @Prop({ default: 100 })
  carRatePerKm: number;

  @Prop({ default: 150 })
  vanRatePerKm: number;

  @Prop({ default: 250 })
  busRatePerKm: number;
}

export const SystemSettingSchema =
  SchemaFactory.createForClass(SystemSetting);

import { User, UserSchema } from '../users/schemas/user.schema';
import { SystemSetting, SystemSettingSchema } from '../admin-dashboard/schemas/system-setting.schema';
import {
  Module,
} from '@nestjs/common';

import {
  MongooseModule,
} from '@nestjs/mongoose';

import {
  BookingsController,
} from './bookings.controller';

import {
  BookingsService,
} from './bookings.service';

import {
  Booking,
  BookingSchema,
} from './schemas/booking.schema';

import {
  Package,
  PackageSchema,
} from '../packages/schemas/package.schema';

import {
  TravelPlan,
  TravelPlanSchema,
} from '../travel-plans/schemas/travel-plan.schema';

import {
  AuthModule,
} from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,

    MongooseModule.forFeature([
      {
        name:
          Booking.name,

        schema:
          BookingSchema,
      },

      {
        name:
          Package.name,

        schema:
          PackageSchema,
      },

      {
        name:
          TravelPlan.name,

        schema:
          TravelPlanSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: SystemSetting.name,
        schema: SystemSettingSchema,
      },
    ]),
  ],

  controllers: [
    BookingsController,
  ],

  providers: [
    BookingsService,
  ],

  exports: [
    BookingsService,
  ],
})
export class BookingsModule {}
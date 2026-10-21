import {
  Module,
} from '@nestjs/common';

import {
  MongooseModule,
} from '@nestjs/mongoose';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  TravelPlan,
  TravelPlanSchema,
} from './schemas/travel-plan.schema';

import {
  TravelPlansService,
} from './travel-plans.service';

import {
  TravelPlansController,
} from './travel-plans.controller';

@Module({
  imports: [
    AuthModule,

    MongooseModule.forFeature([
      {
        name:
          TravelPlan.name,

        schema:
          TravelPlanSchema,
      },
    ]),
  ],

  controllers: [
    TravelPlansController,
  ],

  providers: [
    TravelPlansService,
  ],

  exports: [
    TravelPlansService,
  ],
})
export class TravelPlansModule {}
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from '../auth/auth.module';

import {
  Destination,
  DestinationSchema,
} from './schemas/destination.schema';

import { DestinationsController } from './destinations.controller';
import { DestinationsService } from './destinations.service';

@Module({
  imports: [
    AuthModule,

    MongooseModule.forFeature([
      {
        name: Destination.name,
        schema: DestinationSchema,
      },
    ]),
  ],

  controllers: [
    DestinationsController,
  ],

  providers: [
    DestinationsService,
  ],

  exports: [
    DestinationsService,
  ],
})
export class DestinationsModule {}
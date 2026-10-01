import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';


import { DestinationsController } from './destinations.controller';

import { DestinationsService } from './destinations.service';


import {
  Destination,
  DestinationSchema
} from './schemas/destination.schema';


import { AuthModule } from '../auth/auth.module';



@Module({

imports:[


AuthModule,


MongooseModule.forFeature([

{
name:Destination.name,
schema:DestinationSchema
}

])


],



controllers:[

DestinationsController

],



providers:[

DestinationsService

]


})


export class DestinationsModule {}
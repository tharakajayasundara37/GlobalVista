import { Module } from '@nestjs/common';


import { MongooseModule } from '@nestjs/mongoose';


import { PackagesController } from './packages.controller';


import { PackagesService } from './packages.service';



import {
 Package,
 PackageSchema
} from './schemas/package.schema';



import {
 Review,
 ReviewSchema
} from '../reviews/schemas/review.schema';



import { AuthModule } from '../auth/auth.module';



@Module({

imports:[


 AuthModule,


 MongooseModule.forFeature([


  {
    name:Package.name,
    schema:PackageSchema
  },


  {
    name:Review.name,
    schema:ReviewSchema
  }


 ])


],



controllers:[

 PackagesController

],



providers:[

 PackagesService

],



exports:[

 PackagesService

]


})


export class PackagesModule {}
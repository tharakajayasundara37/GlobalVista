import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';


import { WishlistController } from './wishlist.controller';

import { WishlistService } from './wishlist.service';



import {
  Wishlist,
  WishlistSchema
} from './schemas/wishlist.schema';



import { AuthModule } from '../auth/auth.module';



@Module({

imports:[


AuthModule,


MongooseModule.forFeature([

{
name:Wishlist.name,
schema:WishlistSchema
}

])


],



controllers:[

WishlistController

],



providers:[

WishlistService

]


})


export class WishlistModule {}
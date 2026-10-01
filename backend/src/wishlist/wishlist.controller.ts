import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req
} from '@nestjs/common';


import { WishlistService } from './wishlist.service';

import { CreateWishlistDto } from './dto/create-wishlist.dto';

import { JwtGuard } from '../auth/jwt.guard';



@Controller('wishlist')
export class WishlistController {


  constructor(
    private wishlistService: WishlistService
  ) {}



  // Add Wishlist

  @Post()
  @UseGuards(JwtGuard)
  create(
    @Req() req: any,
    @Body() body: CreateWishlistDto
  ) {

    return this.wishlistService.create(
      req.user,
      body
    );

  }



  // User Wishlist

  @Get('user/:userId')
  @UseGuards(JwtGuard)
  findByUser(
    @Req() req: any,
    @Param('userId') userId: string
  ) {

    return this.wishlistService.findByUser(
      req.user,
      userId
    );

  }



  // Delete Wishlist

  @Delete(':id')
  @UseGuards(JwtGuard)
  remove(
    @Req() req: any,
    @Param('id') id: string
  ) {

    return this.wishlistService.remove(
      req.user,
      id
    );

  }


}
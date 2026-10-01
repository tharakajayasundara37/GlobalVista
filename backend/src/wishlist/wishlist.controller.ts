import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards
} from '@nestjs/common';


import { WishlistService } from './wishlist.service';

import { CreateWishlistDto } from './dto/create-wishlist.dto';

import { JwtGuard } from '../auth/jwt.guard';



@Controller('wishlist')
export class WishlistController {


constructor(
private wishlistService:WishlistService
){}


// Add Wishlist (USER)

@Post()
@UseGuards(JwtGuard)
create(
@Body() body:CreateWishlistDto
){

return this.wishlistService.create(body);

}


// User Wishlist (USER)

@Get('user/:userId')
@UseGuards(JwtGuard)
findByUser(
@Param('userId') userId:string
){

return this.wishlistService.findByUser(userId);

}


// Delete Wishlist (USER)

@Delete(':id')
@UseGuards(JwtGuard)
remove(
@Param('id') id:string
){

return this.wishlistService.remove(id);

}


}
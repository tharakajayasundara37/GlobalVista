import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards
} from '@nestjs/common';


import { ReviewsService } from './reviews.service';

import { CreateReviewDto } from './dto/create-review.dto';

import { JwtGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../auth/admin.guard';



@Controller('reviews')
export class ReviewsController {


constructor(
private reviewsService:ReviewsService
){}


// Create Review (USER)

@Post()
@UseGuards(JwtGuard)
create(
@Body() body:CreateReviewDto
){

return this.reviewsService.create(body);

}


// All Reviews (PUBLIC)

@Get()
findAll(){

return this.reviewsService.findAll();

}


// Package Reviews (PUBLIC)

@Get('package/:packageId')
findByPackage(
@Param('packageId') packageId:string
){

return this.reviewsService.findByPackage(packageId);

}


// Delete Review (ADMIN)

@Delete(':id')
@UseGuards(JwtGuard, AdminGuard)
remove(
@Param('id') id:string
){

return this.reviewsService.remove(id);

}


// Package Rating (PUBLIC)

@Get('package/:packageId/rating')
getPackageRating(
@Param('packageId') packageId:string
){

return this.reviewsService.getPackageRating(
packageId
);

}


}
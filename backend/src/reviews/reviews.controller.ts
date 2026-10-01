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


import { ReviewsService } from './reviews.service';

import { CreateReviewDto } from './dto/create-review.dto';

import { JwtGuard } from '../auth/jwt.guard';

import { AdminGuard } from '../auth/admin.guard';



@Controller('reviews')
export class ReviewsController {


  constructor(
    private reviewsService: ReviewsService
  ) {}



  @Post()
  @UseGuards(JwtGuard)
  create(
    @Req() req:any,
    @Body() body:CreateReviewDto
  ) {

    return this.reviewsService.create(
      req.user,
      body
    );

  }



  @Get()
  findAll(){

    return this.reviewsService.findAll();

  }



  @Get('package/:packageId')
  findByPackage(
    @Param('packageId') packageId:string
  ){

    return this.reviewsService.findByPackage(
      packageId
    );

  }



  @Get('package/:packageId/rating')
  getPackageRating(
    @Param('packageId') packageId:string
  ){

    return this.reviewsService.getPackageRating(
      packageId
    );

  }



  @Delete(':id')
  @UseGuards(JwtGuard, AdminGuard)
  remove(
    @Param('id') id:string
  ){

    return this.reviewsService.remove(id);

  }


}
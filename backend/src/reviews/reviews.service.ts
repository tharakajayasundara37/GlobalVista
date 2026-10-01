import {
  Injectable,
  NotFoundException
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Review,
  ReviewDocument
} from './schemas/review.schema';

import { CreateReviewDto } from './dto/create-review.dto';


@Injectable()
export class ReviewsService {


constructor(

@InjectModel(Review.name)

private reviewModel: Model<ReviewDocument>

){}



// Create Review

async create(
data:CreateReviewDto
){

const review = new this.reviewModel({

...data,

isApproved:true

});


return review.save();

}



// Get All Reviews

async findAll(){

return this.reviewModel

.find()

.populate(
'userId',
'name email'
)

.populate(
'packageId',
'title country'
);

}



// Get Reviews By Package

async findByPackage(
packageId:string
){

return this.reviewModel

.find({
packageId:packageId
})

.populate(
'userId',
'name email'
);

}



// Delete Review

async remove(
id:string
){

const review = await this.reviewModel.findByIdAndDelete(
id
);



if(!review){

throw new NotFoundException(
"Review not found"
);

}



return {

message:"Review deleted successfully"

};

}



// Calculate Package Rating

async getPackageRating(
packageId:string
){

const reviews = await this.reviewModel.find({
packageId:packageId
});


const totalReviews = reviews.length;



if(totalReviews === 0){

return {

packageId,

averageRating:0,

totalReviews:0

};

}



const totalRating = reviews.reduce(
(sum, review)=> sum + review.rating,
0
);



const averageRating = totalRating / totalReviews;



return {

packageId,

averageRating:Number(
averageRating.toFixed(1)
),

totalReviews

};


}


}
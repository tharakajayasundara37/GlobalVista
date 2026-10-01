import {
  Injectable,
  NotFoundException
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Package,
  PackageDocument
} from './schemas/package.schema';

import { CreatePackageDto } from './dto/create-package.dto';

import {
  Review,
  ReviewDocument
} from '../reviews/schemas/review.schema';


@Injectable()
export class PackagesService {


constructor(

@InjectModel(Package.name)
private packageModel: Model<PackageDocument>,

@InjectModel(Review.name)
private reviewModel: Model<ReviewDocument>

){}



// Create Package

async create(
data:CreatePackageDto
){

const newPackage = new this.packageModel(data);

return newPackage.save();

}



// Get All Packages

async findAll(filters?:any){

const query:any = {};


if(filters?.country){

query.country = filters.country;

}


if(filters?.category){

query.category = filters.category;

}


if(filters?.maxPrice){

query.price = {

$lte:Number(filters.maxPrice)

};

}



const packages = await this.packageModel.find(query);



const result = await Promise.all(

packages.map(async(pkg)=>{


const reviews = await this.reviewModel.find({

packageId:pkg._id.toString()

});


const totalReviews = reviews.length;


const averageRating =

totalReviews === 0

?

0

:

Number(

(

reviews.reduce(

(sum,r)=>sum+r.rating,

0

)

/

totalReviews

).toFixed(1)

);



return {

...pkg.toObject(),

reviewInfo:{

averageRating,

totalReviews

}

};


})

);



return result;

}



// Get One Package

async findOne(id:string){


const pkg = await this.packageModel.findById(id);



if(!pkg){

throw new NotFoundException(

"Package not found"

);

}



return pkg;


}



// Update Package

async update(
id:string,
data:any
){


const pkg = await this.packageModel.findByIdAndUpdate(

id,

data,

{

new:true

}

);



if(!pkg){

throw new NotFoundException(

"Package not found"

);

}



return pkg;

}



// Delete Package

async remove(id:string){


const pkg = await this.packageModel.findByIdAndDelete(

id

);



if(!pkg){

throw new NotFoundException(

"Package not found"

);

}



return {

message:"Package deleted successfully"

};


}


}
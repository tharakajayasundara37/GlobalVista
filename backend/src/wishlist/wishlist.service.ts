import {
  Injectable,
  NotFoundException
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Wishlist,
  WishlistDocument
} from './schemas/wishlist.schema';

import { CreateWishlistDto } from './dto/create-wishlist.dto';


@Injectable()
export class WishlistService {


constructor(

@InjectModel(Wishlist.name)

private wishlistModel: Model<WishlistDocument>

){}



// Add Wishlist

async create(
data:CreateWishlistDto
){


const exists = await this.wishlistModel.findOne({

userId:data.userId,

packageId:data.packageId

});



if(exists){

return {

message:"Package already in wishlist"

};

}



const wishlist = new this.wishlistModel(data);


return wishlist.save();


}




// Get User Wishlist

async findByUser(
userId:string
){

return this.wishlistModel

.find({

userId:userId

})

.populate(

'packageId',

'title country price duration category images'

);


}




// Remove Wishlist

async remove(
id:string
){


const wishlist = await this.wishlistModel.findByIdAndDelete(
id
);



if(!wishlist){

throw new NotFoundException(

"Wishlist item not found"

);

}



return {

message:"Wishlist removed successfully"

};


}


}
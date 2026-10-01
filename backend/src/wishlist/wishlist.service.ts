import {
  Injectable,
  NotFoundException,
  ForbiddenException
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

  ) {}



  // Add Wishlist

  async create(
    user: any,
    data: CreateWishlistDto
  ) {


    const exists =
      await this.wishlistModel.findOne({

        userId: user.id,

        packageId: data.packageId

      });



    if (exists) {

      return {

        message: 'Package already in wishlist'

      };

    }



    const wishlist =
      new this.wishlistModel({

        ...data,

        userId: user.id

      });



    return wishlist.save();

  }



  // Get User Wishlist

  async findByUser(
    user: any,
    userId: string
  ) {


    if (
      user.role !== 'ADMIN' &&
      user.id !== userId
    ) {

      throw new ForbiddenException(
        'Access denied'
      );

    }



    return this.wishlistModel

      .find({
        userId
      })

      .populate(
        'packageId',
        'title country price duration category images'
      );

  }



  // Remove Wishlist

  async remove(
    user: any,
    id: string
  ) {


    const wishlist =
      await this.wishlistModel.findById(id);



    if (!wishlist) {

      throw new NotFoundException(
        'Wishlist item not found'
      );

    }



    if (
      user.role !== 'ADMIN' &&
      wishlist.userId.toString() !== user.id
    ) {

      throw new ForbiddenException(
        'Access denied'
      );

    }



    await this.wishlistModel.findByIdAndDelete(
      id
    );



    return {

      message: 'Wishlist removed successfully'

    };

  }


}
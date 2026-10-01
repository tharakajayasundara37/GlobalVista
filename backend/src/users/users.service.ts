import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  User,
  UserDocument
} from './schemas/user.schema';


@Injectable()
export class UsersService {

  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>
  ) {}


  async create(data: any) {

    const user = new this.userModel(data);

    return user.save();

  }


  async findByEmail(email: string) {

    return this.userModel.findOne({
      email
    });

  }


  async findAll() {

    return this.userModel
      .find()
      .select('-password');

  }


  async findOne(id: string) {

    const user = await this.userModel
      .findById(id)
      .select('-password');


    if (!user) {

      throw new NotFoundException(
        'User not found'
      );

    }


    return user;

  }


  async remove(id: string) {

    const user = await this.userModel.findByIdAndDelete(id);


    if (!user) {

      throw new NotFoundException(
        'User not found'
      );

    }


    return {
      message: 'User deleted successfully'
    };

  }

}
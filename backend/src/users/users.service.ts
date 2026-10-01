import {
  Injectable,
  NotFoundException
} from '@nestjs/common';

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

  // Create User
  async create(data: any) {
    const user = new this.userModel(data);

    return user.save();
  }

  // Find User By Email
  // Password is included because AuthService needs it for login
  async findByEmail(email: string) {
    return this.userModel.findOne({
      email
    });
  }

  // Get All Users
  async findAll() {
    return this.userModel
      .find()
      .select('-password')
      .sort({
        createdAt: -1
      });
  }

  // Get Single User
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

  // Delete User
  async remove(id: string) {
    const user =
      await this.userModel.findByIdAndDelete(id);

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
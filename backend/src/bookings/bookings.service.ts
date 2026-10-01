import {
  Injectable,
  NotFoundException,
  ForbiddenException
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Booking,
  BookingDocument
} from './schemas/booking.schema';

import { BookingStatus } from './enums/booking-status.enum';
import { CreateBookingDto } from './dto/create-booking.dto';


@Injectable()
export class BookingsService {

  constructor(
    @InjectModel(Booking.name)
    private bookingModel: Model<BookingDocument>
  ) {}


  async create(
    user: any,
    data: CreateBookingDto
  ) {

    const booking =
      new this.bookingModel({

        ...data,

        userId: user.id,

        status: 'PENDING',

        paymentStatus: 'UNPAID'

      });


    return booking.save();

  }



  async findAll() {

    return this.bookingModel

      .find()

      .sort({
        createdAt: -1
      })

      .populate(
        'userId',
        'name email country'
      )

      .populate(
        'packageId',
        'title country price duration category'
      );

  }



  async findOne(
    id: string
  ) {

    const booking =
      await this.bookingModel

        .findById(id)

        .populate(
          'userId',
          'name email country'
        )

        .populate(
          'packageId',
          'title country price duration category'
        );


    if (!booking) {

      throw new NotFoundException(
        'Booking not found'
      );

    }


    return booking;

  }



  async findUserBookings(
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


    return this.bookingModel

      .find({
        userId
      })

      .populate(
        'userId',
        'name email country'
      )

      .populate(
        'packageId',
        'title country price duration category'
      );

  }



  async updateStatus(
    id: string,
    status: BookingStatus
  ) {

    const booking =
      await this.bookingModel.findByIdAndUpdate(

        id,

        {
          status
        },

        {
          new: true
        }

      );


    if (!booking) {

      throw new NotFoundException(
        'Booking not found'
      );

    }


    return booking;

  }



  async remove(
    id: string
  ) {

    const booking =
      await this.bookingModel.findByIdAndDelete(id);


    if (!booking) {

      throw new NotFoundException(
        'Booking not found'
      );

    }


    return {

      message:
        'Booking deleted successfully'

    };

  }

}
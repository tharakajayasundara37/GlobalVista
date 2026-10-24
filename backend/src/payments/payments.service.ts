import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectModel,
} from '@nestjs/mongoose';

import {
  Model,
  Types,
} from 'mongoose';

import {
  Payment,
  PaymentDocument,
} from './schemas/payment.schema';

import {
  Booking,
  BookingDocument,
} from '../bookings/schemas/booking.schema';

import {
  CreatePaymentDto,
} from './dto/create-payment.dto';


@Injectable()
export class PaymentsService {

  constructor(
    @InjectModel(
      Payment.name,
    )
    private paymentModel:
      Model<PaymentDocument>,

    @InjectModel(
      Booking.name,
    )
    private bookingModel:
      Model<BookingDocument>,
  ) {}


  /* =========================
     CLEAN OBJECT ID
  ========================= */

  private cleanObjectId(
    id: string,
    fieldName = 'ID',
  ) {

    const cleanId =
      String(id).trim();

    if (
      !Types.ObjectId.isValid(
        cleanId,
      )
    ) {

      throw new BadRequestException(
        `Invalid ${fieldName}`,
      );

    }

    return cleanId;
  }


  /* =========================
     CREATE PAYMENT
  ========================= */

  async create(
    user: any,
    data: CreatePaymentDto,
  ) {

    const bookingId =
      this.cleanObjectId(
        data.bookingId,
        'booking ID',
      );


    const booking =
      await this.bookingModel.findById(
        bookingId,
      );


    if (!booking) {

      throw new NotFoundException(
        'Booking not found',
      );

    }


    /* =========================
       OWNERSHIP
    ========================= */

    if (
      user.role !== 'ADMIN' &&
      String(
        booking.userId,
      ) !==
        String(
          user.id,
        )
    ) {

      throw new ForbiddenException(
        'Access denied',
      );

    }


    /* =========================
       ALREADY PAID
    ========================= */

    if (
      booking.paymentStatus ===
      'PAID'
    ) {

      throw new BadRequestException(
        'This booking is already paid',
      );

    }


    /* =========================
       VALIDATE BOOKING TOTAL
    ========================= */

    if (
      typeof booking.totalPrice !==
        'number' ||
      booking.totalPrice < 0
    ) {

      throw new BadRequestException(
        'Booking total is not configured correctly',
      );

    }


    /* =========================
       DUPLICATE TRANSACTION
    ========================= */

    if (
      data.transactionId
    ) {

      const existingTransaction =
        await this.paymentModel.findOne({
          transactionId:
            data.transactionId,
        });


      if (
        existingTransaction
      ) {

        throw new BadRequestException(
          'Transaction ID already exists',
        );

      }

    }


    /* =========================
       IMPORTANT

       NEVER TRUST
       FRONTEND AMOUNT

       Payment amount comes
       from booking.totalPrice
    ========================= */

    const payment =
      new this.paymentModel({

        bookingId:
          booking._id,

        userId:
          booking.userId,

        amount:
          booking.totalPrice,

        paymentMethod:
          data.paymentMethod,

        transactionId:
          data.transactionId,

        bankReference:
          data.bankReference || '',

        slipUrl:
          data.slipUrl || '',

        notes:
          data.notes || '',

        currency:
          data.currency || 'USD',

        status:
          'SUCCESS',

      });


    const savedPayment =
      await payment.save();


    /* =========================
       MARK BOOKING PAID
    ========================= */

    await this.bookingModel.findByIdAndUpdate(

      bookingId,

      {
        paymentStatus:
          'PAID',
        status:
          'CONFIRMED',
      },

      {
        runValidators:
          true,
      },

    );


    return savedPayment;
  }


  /* =========================
     ADMIN - ALL PAYMENTS
  ========================= */

  async findAll() {

    return this.paymentModel

      .find()

      .sort({
        createdAt: -1,
      })

      .populate(
        'bookingId',
        'travelDate numberOfPeople basePrice selectedAddOns addOnsTotal totalPrice status paymentStatus',
      )

      .populate(
        'userId',
        'publicId name email country role',
      );

  }


  /* =========================
     SINGLE PAYMENT
  ========================= */

  async findOne(
    user: any,
    id: string,
  ) {

    const cleanId =
      this.cleanObjectId(
        id,
        'payment ID',
      );


    const payment =
      await this.paymentModel

        .findById(
          cleanId,
        )

        .populate(
          'bookingId',
          'travelDate numberOfPeople basePrice selectedAddOns addOnsTotal totalPrice status paymentStatus',
        )

        .populate(
          'userId',
          'publicId name email country role',
        );


    if (!payment) {

      throw new NotFoundException(
        'Payment not found',
      );

    }


    if (user?.role !== 'ADMIN' && String((payment.userId as any)?._id || payment.userId) !== String(user?.id)) {
      throw new ForbiddenException('Access denied');
    }

    return payment;
  }


  /* =========================
     PAYMENTS BY BOOKING
  ========================= */

  async findByBooking(
    user: any,
    bookingId: string,
  ) {

    const cleanBookingId =
      this.cleanObjectId(
        bookingId,
        'booking ID',
      );

    const booking = await this.bookingModel.findById(cleanBookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (user?.role !== 'ADMIN' && String(booking.userId) !== String(user?.id)) {
      throw new ForbiddenException('Access denied');
    }

    return this.paymentModel

      .find({
        bookingId:
          cleanBookingId,
      })

      .sort({
        createdAt: -1,
      })

      .populate(
        'userId',
        'publicId name email country role',
      );

  }


  /* =========================
     ADMIN UPDATE STATUS
  ========================= */

  async updateStatus(
    id: string,
    status: string,
  ) {

    const cleanId =
      this.cleanObjectId(
        id,
        'payment ID',
      );


    const allowedStatuses =
      [
        'PENDING',
        'SUCCESS',
        'FAILED',
      ];


    if (
      !allowedStatuses.includes(
        status,
      )
    ) {

      throw new BadRequestException(
        'Invalid payment status',
      );

    }


    const payment =
      await this.paymentModel.findByIdAndUpdate(

        cleanId,

        {
          status,
        },

        {
          new: true,
          runValidators:
            true,
        },

      );


    if (!payment) {

      throw new NotFoundException(
        'Payment not found',
      );

    }


    /* =========================
       SYNC BOOKING STATUS
    ========================= */

    if (
      status ===
      'SUCCESS'
    ) {

      await this.bookingModel.findByIdAndUpdate(

        payment.bookingId,

        {
          paymentStatus:
            'PAID',
        },

      );

    } else {

      await this.bookingModel.findByIdAndUpdate(

        payment.bookingId,

        {
          paymentStatus:
            'UNPAID',
        },

      );

    }


    return payment;
  }


  /* =========================
     ADMIN DELETE PAYMENT
  ========================= */

  async remove(
    id: string,
  ) {

    const cleanId =
      this.cleanObjectId(
        id,
        'payment ID',
      );


    const payment =
      await this.paymentModel.findByIdAndDelete(
        cleanId,
      );


    if (!payment) {

      throw new NotFoundException(
        'Payment not found',
      );

    }


    /* =========================
       RESET BOOKING PAYMENT
    ========================= */

    await this.bookingModel.findByIdAndUpdate(

      payment.bookingId,

      {
        paymentStatus:
          'UNPAID',
      },

    );


    return {
      message:
        'Payment deleted successfully',
    };
  }

}
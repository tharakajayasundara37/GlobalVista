import {
  Injectable
} from '@nestjs/common';

import {
  InjectModel
} from '@nestjs/mongoose';

import {
  Model
} from 'mongoose';

import {
  User,
  UserDocument
} from '../users/schemas/user.schema';

import {
  Package,
  PackageDocument
} from '../packages/schemas/package.schema';

import {
  Booking,
  BookingDocument
} from '../bookings/schemas/booking.schema';

import {
  Payment,
  PaymentDocument
} from '../payments/schemas/payment.schema';

import {
  BookingStatus
} from '../bookings/enums/booking-status.enum';


@Injectable()
export class AdminDashboardService {


  constructor(

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

    @InjectModel(Package.name)
    private packageModel: Model<PackageDocument>,

    @InjectModel(Booking.name)
    private bookingModel: Model<BookingDocument>,

    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>

  ) {}


  // Dashboard Summary

  async getDashboard() {

    const totalUsers =
      await this.userModel.countDocuments();

    const totalPackages =
      await this.packageModel.countDocuments();

    const totalBookings =
      await this.bookingModel.countDocuments();

    const totalPayments =
      await this.paymentModel.countDocuments();

    const revenue =
      await this.paymentModel.aggregate([

        {
          $match: {
            status: 'SUCCESS'
          }
        },

        {
          $group: {
            _id: null,
            total: {
              $sum: '$amount'
            }
          }
        }

      ]);

    const pendingBookings =
      await this.bookingModel.countDocuments({
        status: BookingStatus.PENDING
      });

    const confirmedBookings =
      await this.bookingModel.countDocuments({
        status: BookingStatus.CONFIRMED
      });

    return {

      totalUsers,

      totalPackages,

      totalBookings,

      totalPayments,

      totalRevenue:
        revenue[0]?.total || 0,

      pendingBookings,

      confirmedBookings

    };

  }


  // Recent Bookings

  async getRecentBookings() {

    return this.bookingModel

      .find()

      .sort({
        createdAt: -1
      })

      .limit(10)

      .populate(
        'userId',
        'name email country'
      )

      .populate(
        'packageId',
        'title country price duration category'
      );

  }


  // Recent Payments

  async getRecentPayments() {

    return this.paymentModel

      .find()

      .sort({
        createdAt: -1
      })

      .limit(10)

      .populate(
        'userId',
        'name email country role'
      )

      .populate(
        'bookingId',
        'travelDate numberOfPeople totalPrice status paymentStatus'
      );

  }


  // Revenue Analytics

  async getRevenue() {

    const totalRevenue =
      await this.paymentModel.aggregate([

        {
          $match: {
            status: 'SUCCESS'
          }
        },

        {
          $group: {
            _id: null,
            total: {
              $sum: '$amount'
            }
          }
        }

      ]);

    const successfulPayments =
      await this.paymentModel.countDocuments({
        status: 'SUCCESS'
      });

    const averagePayment =
      successfulPayments > 0
        ? (totalRevenue[0]?.total || 0) /
          successfulPayments
        : 0;

    const monthlyRevenue =
      await this.paymentModel.aggregate([

        {
          $match: {
            status: 'SUCCESS'
          }
        },

        {
          $group: {

            _id: {
              month: {
                $month: '$createdAt'
              },

              year: {
                $year: '$createdAt'
              }

            },

            revenue: {
              $sum: '$amount'
            }

          }
        },

        {
          $sort: {
            '_id.year': 1,
            '_id.month': 1
          }
        }

      ]);

    return {

      totalRevenue:
        totalRevenue[0]?.total || 0,

      successfulPayments,

      averagePayment,

      monthlyRevenue

    };

  }

}
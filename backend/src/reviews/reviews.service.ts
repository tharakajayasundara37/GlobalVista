import {
  BadRequestException,
  ConflictException,
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
  Review,
  ReviewDocument,
} from './schemas/review.schema';

import {
  Booking,
  BookingDocument,
} from '../bookings/schemas/booking.schema';

import {
  BookingStatus,
} from '../bookings/enums/booking-status.enum';

import {
  CreateReviewDto,
} from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel:
      Model<ReviewDocument>,

    @InjectModel(Booking.name)
    private readonly bookingModel:
      Model<BookingDocument>,
  ) {}

  private cleanObjectId(
    id: string,
    fieldName = 'ID',
  ): string {
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

  async create(
    user: any,
    data: CreateReviewDto,
  ) {
    const role =
      String(
        user?.role || '',
      )
        .trim()
        .toUpperCase();

    if (
      role !== 'USER'
    ) {
      throw new ForbiddenException(
        'Only travellers can submit reviews',
      );
    }

    if (
      !user?.id
    ) {
      throw new ForbiddenException(
        'Unable to identify the logged-in user',
      );
    }

    const userId =
      this.cleanObjectId(
        user.id,
        'user ID',
      );

    const bookingId =
      this.cleanObjectId(
        data.bookingId,
        'booking ID',
      );

    const packageId =
      this.cleanObjectId(
        data.packageId,
        'package ID',
      );

    const booking =
      await this.bookingModel
        .findById(
          bookingId,
        )
        .select(
          'userId packageId status',
        )
        .lean();

    if (
      !booking
    ) {
      throw new NotFoundException(
        'Booking not found',
      );
    }

    const bookingUserId =
      String(
        booking.userId || '',
      ).trim();

    const bookingPackageId =
      String(
        booking.packageId || '',
      ).trim();

    const bookingStatus =
      String(
        booking.status || '',
      )
        .trim()
        .toUpperCase();

    if (
      bookingUserId !==
      userId
    ) {
      throw new ForbiddenException(
        'This booking does not belong to the logged-in traveller',
      );
    }

    if (
      bookingPackageId !==
      packageId
    ) {
      throw new BadRequestException(
        'Booking package does not match the selected package',
      );
    }

    if (
      bookingStatus !==
      BookingStatus.COMPLETED
    ) {
      throw new ForbiddenException(
        'You can review this package only after completing the trip',
      );
    }

    const userObjectId =
      new Types.ObjectId(
        userId,
      );

    const packageObjectId =
      new Types.ObjectId(
        packageId,
      );

    const existingReview =
      await this.reviewModel
        .findOne({
          userId:
            userObjectId,

          packageId:
            packageObjectId,
        });

    if (
      existingReview
    ) {
      throw new ConflictException(
        'You have already reviewed this package',
      );
    }

    try {
      const review =
        new this.reviewModel({
          userId:
            userObjectId,

          packageId:
            packageObjectId,

          rating:
            data.rating,

          comment:
            data.comment.trim(),

          isApproved:
            true,
        });

      return await review.save();
    } catch (
      error: any
    ) {
      if (
        error?.code ===
        11000
      ) {
        throw new ConflictException(
          'You have already reviewed this package',
        );
      }

      throw error;
    }
  }

  /*
   * ADMIN
   * Get every review.
   */
  async findAll() {
    return this.reviewModel
      .find()
      .sort({
        createdAt: -1,
      })
      .populate(
        'userId',
        'name email country',
      )
      .populate(
        'packageId',
        'title destination country price duration images',
      );
  }

  /*
   * PUBLIC HOMEPAGE REVIEWS
   *
   * Only approved reviews.
   * Latest 3 reviews only.
   * No private user data such as email.
   */
  async findPublicRecent() {
    return this.reviewModel
      .find({
        isApproved:
          true,
      })
      .sort({
        createdAt: -1,
      })
      .limit(
        10,
      )
      .select(
        'userId packageId rating comment createdAt',
      )
      .populate(
        'userId',
        'name country',
      )
      .populate(
        'packageId',
        'title destination country',
      )
      .lean();
  }

  /*
   * PUBLIC
   * Reviews for one package.
   */
  async findByPackage(
    packageId: string,
  ) {
    const cleanPackageId =
      this.cleanObjectId(
        packageId,
        'package ID',
      );

    return this.reviewModel
      .find({
        packageId:
          new Types.ObjectId(
            cleanPackageId,
          ),

        isApproved:
          true,
      })
      .sort({
        createdAt: -1,
      })
      .populate(
        'userId',
        'name country',
      );
  }

  /*
   * PUBLIC
   * Average rating for package.
   */
  async getPackageRating(
    packageId: string,
  ) {
    const cleanPackageId =
      this.cleanObjectId(
        packageId,
        'package ID',
      );

    const result =
      await this.reviewModel
        .aggregate([
          {
            $match: {
              packageId:
                new Types.ObjectId(
                  cleanPackageId,
                ),

              isApproved:
                true,
            },
          },

          {
            $group: {
              _id:
                '$packageId',

              averageRating: {
                $avg:
                  '$rating',
              },

              totalReviews: {
                $sum:
                  1,
              },
            },
          },
        ]);

    if (
      result.length ===
      0
    ) {
      return {
        packageId:
          cleanPackageId,

        averageRating:
          0,

        totalReviews:
          0,
      };
    }

    return {
      packageId:
        cleanPackageId,

      averageRating:
        Number(
          Number(
            result[0]
              .averageRating,
          ).toFixed(
            1,
          ),
        ),

      totalReviews:
        Number(
          result[0]
            .totalReviews,
        ),
    };
  }

  /*
   * ADMIN
   * Delete review.
   */
  async remove(
    id: string,
  ) {
    const cleanId =
      this.cleanObjectId(
        id,
        'review ID',
      );

    const review =
      await this.reviewModel
        .findByIdAndDelete(
          cleanId,
        );

    if (
      !review
    ) {
      throw new NotFoundException(
        'Review not found',
      );
    }

    return {
      message:
        'Review deleted successfully',
    };
  }
}
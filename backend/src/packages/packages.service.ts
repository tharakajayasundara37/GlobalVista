
import {
  BadRequestException,
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
  Package,
  PackageDocument,
} from './schemas/package.schema';

import {
  CreatePackageDto,
  UpdatePackageDto,
} from './dto/create-package.dto';

import {
  Review,
  ReviewDocument,
} from '../reviews/schemas/review.schema';

@Injectable()
export class PackagesService {
  constructor(
    @InjectModel(Package.name)
    private readonly packageModel:
      Model<PackageDocument>,

    @InjectModel(Review.name)
    private readonly reviewModel:
      Model<ReviewDocument>,
  ) {}

  /* =========================
     DESTINATION LINK VALIDATION

     Only when destinationId is supplied.
     Uses the existing destinations MongoDB
     collection without changing the
     Destinations module or its map data.
  ========================= */

  private async resolveDestination(
    destinationId: string,
  ): Promise<{ name: string; country: string }> {
    if (!/^[a-f\d]{24}$/i.test(destinationId)) {
      throw new BadRequestException(
        'Select a valid destination.',
      );
    }

    const destination = await this.packageModel.db
      .collection('destinations')
      .findOne({
        _id: new Types.ObjectId(destinationId),
      });

    if (!destination) {
      throw new BadRequestException(
        'Selected destination does not exist.',
      );
    }

    if (
      typeof destination.name !== 'string' ||
      typeof destination.country !== 'string'
    ) {
      throw new BadRequestException(
        'Selected destination is missing a name or country.',
      );
    }

    return {
      name: destination.name,
      country: destination.country,
    };
  }

  /* =========================
     SPECIAL OFFER CALCULATION
  ========================= */

  private normalizeOfferData(
    data: Record<string, any>,
  ) {
    const normalized = {
      ...data,
    };

    const isSpecialOffer =
      Boolean(
        normalized.isSpecialOffer,
      );

    if (!isSpecialOffer) {
      normalized.isSpecialOffer =
        false;

      normalized.originalPrice =
        0;

      normalized.discountPercentage =
        0;

      return normalized;
    }

    const price =
      Number(
        normalized.price,
      );

    const originalPrice =
      Number(
        normalized.originalPrice,
      );

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      throw new BadRequestException(
        'Offer price must be greater than 0',
      );
    }

    if (
      !Number.isFinite(
        originalPrice,
      ) ||
      originalPrice <= 0
    ) {
      throw new BadRequestException(
        'Original price is required for a special offer',
      );
    }

    if (
      originalPrice <= price
    ) {
      throw new BadRequestException(
        'Original price must be greater than the current offer price',
      );
    }

    const discountPercentage =
      Math.round(
        (
          (
            originalPrice -
            price
          ) /
          originalPrice
        ) *
          100,
      );

    normalized.isSpecialOffer =
      true;

    normalized.price =
      price;

    normalized.originalPrice =
      originalPrice;

    normalized.discountPercentage =
      discountPercentage;

    return normalized;
  }

  /* =========================
     EXISTING PACKAGE REVIEWS

     Only approved reviews.
     Existing review system unchanged.
  ========================= */

  private async getReviewInfo(
    packageId: any,
  ) {
    const reviews =
      await this.reviewModel
        .find({
          packageId,
          isApproved: true,
        })
        .select('rating')
        .lean();

    const totalReviews =
      reviews.length;

    if (
      totalReviews === 0
    ) {
      return {
        averageRating: 0,
        totalReviews: 0,
      };
    }

    const totalRating =
      reviews.reduce(
        (
          total,
          review,
        ) =>
          total +
          Number(
            review.rating || 0,
          ),
        0,
      );

    const averageRating =
      Number(
        (
          totalRating /
          totalReviews
        ).toFixed(1),
      );

    return {
      averageRating,
      totalReviews,
    };
  }

  /* =========================
     CREATE PACKAGE

     Supports both old packages
     and new destination-linked packages.
  ========================= */

  async create(
    data:
      CreatePackageDto,
  ) {
    const linkedData: Record<string, any> = {
      ...data,
    };

    if (data.destinationId) {
      const destination =
        await this.resolveDestination(
          data.destinationId,
        );

      linkedData.destination =
        destination.name;

      linkedData.country =
        destination.country;
    }

    const normalizedData =
      this.normalizeOfferData(
        linkedData,
      );

    const newPackage =
      new this.packageModel(
        normalizedData,
      );

    return newPackage.save();
  }

  /* =========================
     GET ALL PACKAGES

     Existing filters preserved.

     New filter:
     destinationId
  ========================= */

  async findAll(
    filters?: any,
  ) {
    const query: any =
      {};

    if (
      filters?.country
    ) {
      query.country =
        filters.country;
    }

    /* =========================
       FILTER BY DESTINATION ID
    ========================= */

    if (filters?.destinationId) {
      const id = String(
        filters.destinationId,
      );

      if (!/^[a-f\d]{24}$/i.test(id)) {
        throw new BadRequestException(
          'Invalid destinationId filter.',
        );
      }

      query.destinationId =
        new Types.ObjectId(id);
    }

    /* =========================
       CATEGORY FILTER
    ========================= */

    if (
      filters?.category
    ) {
      query.category =
        filters.category;
    }

    /* =========================
       MAX PRICE FILTER
    ========================= */

    if (
      filters?.maxPrice
    ) {
      const maxPrice =
        Number(
          filters.maxPrice,
        );

      if (
        Number.isFinite(
          maxPrice,
        )
      ) {
        query.price = {
          $lte:
            maxPrice,
        };
      }
    }

    /* =========================
       AVAILABILITY FILTER
    ========================= */

    if (
      filters?.availability ===
      'true'
    ) {
      query.availability =
        true;
    }

    if (
      filters?.availability ===
      'false'
    ) {
      query.availability =
        false;
    }

    /* =========================
       SPECIAL OFFER FILTER
    ========================= */

    if (
      filters?.specialOffer ===
      'true'
    ) {
      query.isSpecialOffer =
        true;
    }

    if (
      filters?.specialOffer ===
      'false'
    ) {
      query.isSpecialOffer =
        false;
    }

    /* =========================
       FETCH PACKAGES
    ========================= */

    const packages =
      await this.packageModel
        .find(query)
        .sort({
          createdAt: -1,
        });

    /* =========================
       ATTACH REVIEW INFORMATION
    ========================= */

    const result =
      await Promise.all(
        packages.map(
          async (pkg) => {
            const reviewInfo =
              await this.getReviewInfo(
                pkg._id,
              );

            return {
              ...pkg.toObject(),
              reviewInfo,
            };
          },
        ),
      );

    return result;
  }

  /* =========================
     GET SINGLE PACKAGE
  ========================= */

  async findOne(
    id: string,
  ) {
    const pkg =
      await this.packageModel.findById(
        id,
      );

    if (!pkg) {
      throw new NotFoundException(
        'Package not found',
      );
    }

    const reviewInfo =
      await this.getReviewInfo(
        pkg._id,
      );

    return {
      ...pkg.toObject(),
      reviewInfo,
    };
  }

  /* =========================
     UPDATE PACKAGE

     Existing functionality preserved.
     Destination link updated only
     when destinationId is supplied.
  ========================= */

  async update(
    id: string,
    data:
      UpdatePackageDto,
  ) {
    const existingPackage =
      await this.packageModel.findById(
        id,
      );

    if (
      !existingPackage
    ) {
      throw new NotFoundException(
        'Package not found',
      );
    }

    const mergedData: Record<string, any> = {
      ...existingPackage.toObject(),
      ...data,
    };

    /* =========================
       UPDATE DESTINATION LINK
    ========================= */

    if (data.destinationId) {
      const destination =
        await this.resolveDestination(
          data.destinationId,
        );

      mergedData.destination =
        destination.name;

      mergedData.country =
        destination.country;
    }

    /* =========================
       PRESERVE SPECIAL OFFER LOGIC
    ========================= */

    const normalizedData =
      this.normalizeOfferData(
        mergedData,
      );

    delete normalizedData._id;
    delete normalizedData.__v;
    delete normalizedData.createdAt;
    delete normalizedData.updatedAt;

    const pkg =
      await this.packageModel
        .findByIdAndUpdate(
          id,
          normalizedData,
          {
            new: true,
            runValidators: true,
          },
        );

    if (!pkg) {
      throw new NotFoundException(
        'Package not found',
      );
    }

    const reviewInfo =
      await this.getReviewInfo(
        pkg._id,
      );

    return {
      ...pkg.toObject(),
      reviewInfo,
    };
  }

  /* =========================
     DELETE PACKAGE
  ========================= */

  async remove(
    id: string,
  ) {
    const pkg =
      await this.packageModel
        .findByIdAndDelete(
          id,
        );

    if (!pkg) {
      throw new NotFoundException(
        'Package not found',
      );
    }

    return {
      message:
        'Package deleted successfully',
    };
  }
}

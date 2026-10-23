import { User, UserDocument } from '../users/schemas/user.schema';
import { SystemSetting, SystemSettingDocument } from '../admin-dashboard/schemas/system-setting.schema';
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
  Booking,
  BookingDocument,
} from './schemas/booking.schema';

import {
  AddOnPricingType,
  Package,
  PackageDocument,
} from '../packages/schemas/package.schema';

import {
  TravelPlan,
  TravelPlanDocument,
} from '../travel-plans/schemas/travel-plan.schema';

import {
  BookingStatus,
} from './enums/booking-status.enum';

import {
  CreateBookingDto,
} from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(
      Booking.name,
    )
    private readonly bookingModel:
      Model<BookingDocument>,

    @InjectModel(
      Package.name,
    )
    private readonly packageModel:
      Model<PackageDocument>,

    @InjectModel(
      TravelPlan.name,
    )
    private readonly travelPlanModel:
      Model<TravelPlanDocument>,
    @InjectModel(User.name)
    private readonly userModel:
      Model<UserDocument>,
    @InjectModel(SystemSetting.name)
    private readonly systemSettingModel:
      Model<SystemSettingDocument>,
  ) {}

  private cleanObjectId(
    id: string,
    fieldName =
      'ID',
  ): string {
    const cleanId =
      String(
        id,
      ).trim();

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

  private normalizeRole(
    role:
      unknown,
  ): string {
    return String(
      role ?? '',
    )
      .trim()
      .toUpperCase();
  }

  private validateTravelDate(
    travelDate:
      string,
  ) {
    const [
      year,
      month,
      day,
    ] =
      travelDate
        .split('-')
        .map(
          Number,
        );

    const requestedDate =
      new Date(
        year,
        month - 1,
        day,
      );

    if (
      requestedDate.getFullYear() !==
        year ||
      requestedDate.getMonth() !==
        month - 1 ||
      requestedDate.getDate() !==
        day
    ) {
      throw new BadRequestException(
        'Invalid travel date',
      );
    }

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0,
    );

    requestedDate.setHours(
      0,
      0,
      0,
      0,
    );

    if (
      requestedDate <
      today
    ) {
      throw new BadRequestException(
        'Travel date cannot be in the past',
      );
    }
  }

  /* =========================
     CREATE BOOKING
  ========================= */

  async create(
    user:
      any,
    data:
      CreateBookingDto,
  ) {
    const role = this.normalizeRole(user?.role);
    if (role !== 'USER' && role !== 'ADMIN') {
      throw new ForbiddenException('Only travellers or administrators can create bookings');
    }

    const userId =
      this.cleanObjectId(
        user?.id,
        'user ID',
      );

    const packageId =
      this.cleanObjectId(
        data.packageId,
        'package ID',
      );

    const travelPlanId =
      this.cleanObjectId(
        data.travelPlanId,
        'travel plan ID',
      );

    this.validateTravelDate(
      data.travelDate,
    );

    const [
      travelPackage,
      travelPlan,
    ] =
      await Promise.all([
        this.packageModel
          .findById(
            packageId,
          ),

        this.travelPlanModel
          .findById(
            travelPlanId,
          ),
      ]);

    if (
      !travelPackage
    ) {
      throw new NotFoundException(
        'Package not found',
      );
    }

    if (
      !travelPlan
    ) {
      throw new NotFoundException(
        'Travel plan not found',
      );
    }

    if (
      travelPackage
        .availability ===
      false
    ) {
      throw new BadRequestException(
        'This package is currently unavailable',
      );
    }

    if (
      travelPlan
        .isActive !==
      true
    ) {
      throw new BadRequestException(
        'This travel plan is currently unavailable',
      );
    }

    if (
      typeof travelPackage
        .price !==
        'number' ||
      travelPackage.price <
        0
    ) {
      throw new BadRequestException(
        'Package price is not configured correctly',
      );
    }

    if (
      typeof travelPlan
        .price !==
        'number' ||
      travelPlan.price <
        0
    ) {
      throw new BadRequestException(
        'Travel plan price is not configured correctly',
      );
    }

    /* =========================
       PACKAGE TOTAL
    ========================= */

    const basePrice =
      travelPackage.price;

    const baseTotal =
      basePrice *
      data.numberOfPeople;

    /* =========================
       TRAVEL PLAN TOTAL
    ========================= */

    const travelPlanTotal =
      travelPlan.price *
      data.numberOfPeople;

    const selectedTravelPlan = {
      name:
        travelPlan.name,

      price:
        travelPlan.price,

      priceSuffix:
        travelPlan
          .priceSuffix ||
        '/ person',

      features:
        (
          travelPlan
            .features ??
          []
        ).map(
          (
            feature,
          ) =>
            String(
              feature,
            ).trim(),
        ),

      quantity:
        data.numberOfPeople,

      calculatedAmount:
        travelPlanTotal,
    };

    /* =========================
       SELECTED ADD-ONS
    ========================= */

    const selectedAddOnIds =
      data
        .selectedAddOnIds ??
      [];

    const packageAddOns =
      travelPackage
        .addOns ??
      [];

    const selectedAddOns:
      Array<{
        addOnId:
          string;

        name:
          string;

        price:
          number;

        pricingType:
          AddOnPricingType;

        quantity:
          number;

        calculatedAmount:
          number;
      }> = [];

    let addOnsTotal =
      0;

    for (
      const selectedAddOnId
      of selectedAddOnIds
    ) {
      const cleanAddOnId =
        this.cleanObjectId(
          selectedAddOnId,
          'add-on ID',
        );

      const addOn =
        packageAddOns.find(
          (
            item,
          ) =>
            String(
              (
                item as any
              )._id,
            ) ===
            cleanAddOnId,
        );

      if (
        !addOn
      ) {
        throw new BadRequestException(
          `Selected add-on ${cleanAddOnId} is not available for this package`,
        );
      }

      if (
        typeof addOn
          .price !==
          'number' ||
        addOn.price <
          0
      ) {
        throw new BadRequestException(
          `Invalid price configured for add-on "${addOn.name}"`,
        );
      }

      if (
        addOn.pricingType !==
          AddOnPricingType
            .PER_PERSON &&
        addOn.pricingType !==
          AddOnPricingType
            .PER_BOOKING
      ) {
        throw new BadRequestException(
          `Invalid pricing type for add-on "${addOn.name}"`,
        );
      }

      const quantity =
        addOn.pricingType ===
        AddOnPricingType
          .PER_PERSON
          ? data.numberOfPeople
          : 1;

      const calculatedAmount =
        addOn.price *
        quantity;

      addOnsTotal +=
        calculatedAmount;

      selectedAddOns.push({
        addOnId:
          cleanAddOnId,

        name:
          addOn.name,

        price:
          addOn.price,

        pricingType:
          addOn.pricingType,

        quantity,

        calculatedAmount,
      });
    }

    /* =========================
       FINAL TOTAL
    ========================= */

    const totalPrice =
      baseTotal +
      travelPlanTotal +
      addOnsTotal;

    const booking =
      new this.bookingModel({
        userId:
          new Types.ObjectId(
            userId,
          ),

        packageId:
          travelPackage._id,

        travelPlanId:
          travelPlan._id,

        selectedTravelPlan,

        travelDate:
          data.travelDate,

        numberOfPeople:
          data.numberOfPeople,

        basePrice,

        baseTotal,

        selectedAddOns,

        addOnsTotal,

        totalPrice,

        status:
          BookingStatus.PENDING,

        paymentStatus:
          'UNPAID',
      });

    return booking.save();
  }

  /* =========================
     ADMIN - ALL BOOKINGS
  ========================= */

  async findAll() {
    return this.bookingModel
      .find()
      .sort({
        createdAt:
          -1,
      })
      .populate(
        'userId',
        'publicId name email country mobile role',
      )
      .populate(
        'packageId',
        'title destination country price duration category images',
      )
      .populate(
        'travelPlanId',
        'name price priceSuffix features isPopular isActive',
      );
  }

  /* =========================
     SINGLE BOOKING
  ========================= */

  async findOne(
    user:
      any,
    id:
      string,
  ) {
    const cleanId =
      this.cleanObjectId(
        id,
        'booking ID',
      );

    const booking =
      await this.bookingModel
        .findById(
          cleanId,
        );

    if (
      !booking
    ) {
      throw new NotFoundException(
        'Booking not found',
      );
    }

    const role =
      this.normalizeRole(
        user?.role,
      );

    if (
      role !==
        'ADMIN' &&
      String(
        booking.userId,
      ) !==
        String(
          user?.id,
        )
    ) {
      throw new ForbiddenException(
        'Access denied',
      );
    }

    await booking.populate([
      {
        path:
          'userId',

        select:
          'publicId name email country mobile role',
      },
      {
        path:
          'packageId',

        select:
          'title destination country price duration category images',
      },
      {
        path:
          'travelPlanId',

        select:
          'name price priceSuffix features isPopular isActive',
      },
    ]);

    return booking;
  }

  /* =========================
     USER BOOKING HISTORY
  ========================= */

  async findUserBookings(
    user:
      any,
    userId:
      string,
  ) {
    const cleanUserId =
      this.cleanObjectId(
        userId,
        'user ID',
      );

    if (
      this.normalizeRole(
        user?.role,
      ) !==
        'ADMIN' &&
      String(
        user?.id,
      ) !==
        String(
          cleanUserId,
        )
    ) {
      throw new ForbiddenException(
        'Access denied',
      );
    }

    const userObjId = new Types.ObjectId(cleanUserId);
    return this.bookingModel.find({
      $or: [{ userId: cleanUserId }, { userId: userObjId }],
    })
      .sort({
        createdAt:
          -1,
      })
      .populate(
        'userId',
        'publicId name email country mobile role',
      )
      .populate(
        'packageId',
        'title destination country price duration category images',
      )
      .populate(
        'travelPlanId',
        'name price priceSuffix features isPopular isActive',
      );
  }

  /* =========================
     ADMIN UPDATE STATUS
  ========================= */

  async updateStatus(
    id:
      string,
    status:
      BookingStatus,
  ) {
    const cleanId =
      this.cleanObjectId(
        id,
        'booking ID',
      );

    if (
      !Object.values(
        BookingStatus,
      ).includes(
        status,
      )
    ) {
      throw new BadRequestException(
        'Invalid booking status',
      );
    }

    const booking =
      await this.bookingModel
        .findByIdAndUpdate(
          cleanId,
          {
            status,
          },
          {
            returnDocument:
              'after',

            runValidators:
              true,
          },
        );

    if (
      !booking
    ) {
      throw new NotFoundException(
        'Booking not found',
      );
    }

    return booking;
  }

  /* =========================
     ADMIN DELETE BOOKING
  ========================= */

  async remove(
    id:
      string,
  ) {
    const cleanId =
      this.cleanObjectId(
        id,
        'booking ID',
      );

    const booking =
      await this.bookingModel
        .findByIdAndDelete(
          cleanId,
        );

    if (
      !booking
    ) {
      throw new NotFoundException(
        'Booking not found',
      );
    }

    return {
      message:
        'Booking deleted successfully',
    };
  }

  async getVehiclePricingSetting() {
    let setting = await this.systemSettingModel.findOne({ key: 'DEFAULT_SETTINGS' });
    if (!setting) {
      setting = await this.systemSettingModel.create({
        key: 'DEFAULT_SETTINGS',
        pricePerKm: 100,
        carRatePerKm: 100,
        vanRatePerKm: 150,
        busRatePerKm: 250,
      });
    }
    return {
      pricePerKm: setting.pricePerKm ?? 100,
      carRatePerKm: setting.carRatePerKm ?? 100,
      vanRatePerKm: setting.vanRatePerKm ?? 150,
      busRatePerKm: setting.busRatePerKm ?? 250,
    };
  }

  /* =========================
     GUIDE ASSIGNED TOURS
  ========================= */

  async findGuideBookings(user: any) {
    const guideId = this.cleanObjectId(user?.id, 'guide ID');
    return this.bookingModel
      .find({ assignedGuideId: new Types.ObjectId(guideId) })
      .populate('packageId')
      .populate('travelPlanId')
      .populate('userId', 'name email mobile country')
      .sort({ createdAt: -1 });
  }

}
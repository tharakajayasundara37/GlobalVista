import { User, UserDocument, Role, GuideStatus } from '../users/schemas/user.schema';
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
     DATE & DURATION HELPERS
  ========================= */

  public extractDurationDays(durationStr: string | number | undefined): number {
    if (typeof durationStr === 'number' && durationStr > 0) return durationStr;
    if (!durationStr || typeof durationStr !== 'string') return 1;
    const match = durationStr.match(/(\d+)\s*Days?/i);
    if (match) {
      const parsed = parseInt(match[1], 10);
      return isNaN(parsed) || parsed <= 0 ? 1 : parsed;
    }
    return 1;
  }

  public calculateDateRange(
    startDateStr: string,
    durationStrOrDays: string | number | undefined,
  ): { start: string; end: string; durationDays: number } {
    const cleanStart = String(startDateStr || '').trim().split('T')[0];
    const durationDays = this.extractDurationDays(durationStrOrDays);
    const [y, m, d] = cleanStart.split('-').map(Number);
    const startDate = new Date(Date.UTC(y, m - 1, d));
    const endDate = new Date(startDate.getTime());
    endDate.setUTCDate(endDate.getUTCDate() + Math.max(0, durationDays - 1));
    return {
      start: cleanStart,
      end: endDate.toISOString().split('T')[0],
      durationDays,
    };
  }

  public areDateRangesOverlapping(
    startA: string,
    endA: string,
    startB: string,
    endB: string,
  ): boolean {
    if (!startA || !endA || !startB || !endB) return false;
    return startA <= endB && startB <= endA;
  }

  /* =========================
     FIND BUSY GUIDES ON DATES
     Checks active bookings for date overlap
  ========================= */

  async findBusyGuides(
    travelDate: string,
    durationDaysOrString?: string | number,
    packageId?: string,
  ) {
    if (!travelDate) {
      return {
        requestedRange: null,
        busyGuideIds: [],
        busyGuides: [],
      };
    }

    let duration: string | number = durationDaysOrString || 1;
    if (!durationDaysOrString && packageId && Types.ObjectId.isValid(packageId)) {
      const pkg = await this.packageModel.findById(packageId).select('duration').lean();
      if (pkg?.duration) {
        duration = pkg.duration;
      }
    }

    const requestedRange = this.calculateDateRange(travelDate, duration);

    const activeBookings = await this.bookingModel
      .find({
        assignedGuideId: { $ne: null },
        status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      })
      .populate('packageId', 'title duration')
      .lean();

    const busyGuideIdsSet = new Set<string>();
    const busyGuides: Array<{
      guideId: string;
      bookingId: string;
      startDate: string;
      endDate: string;
      packageTitle: string;
    }> = [];

    for (const booking of activeBookings) {
      if (!booking.travelDate || !booking.assignedGuideId) continue;
      const bDuration = (booking.packageId as any)?.duration || 1;
      const bRange = this.calculateDateRange(booking.travelDate, bDuration);

      if (
        this.areDateRangesOverlapping(
          requestedRange.start,
          requestedRange.end,
          bRange.start,
          bRange.end,
        )
      ) {
        const guideIdStr = String(booking.assignedGuideId);
        busyGuideIdsSet.add(guideIdStr);
        busyGuides.push({
          guideId: guideIdStr,
          bookingId: String(booking._id),
          startDate: bRange.start,
          endDate: bRange.end,
          packageTitle: (booking.packageId as any)?.title || 'Tour',
        });
      }
    }

    return {
      requestedRange,
      busyGuideIds: Array.from(busyGuideIdsSet),
      busyGuides,
    };
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
       VEHICLE & GUIDE TRANSPORT
    ========================= */
    const vehicleType =
      data.vehicleType && ['CAR', 'VAN', 'BUS'].includes(String(data.vehicleType).toUpperCase())
        ? String(data.vehicleType).toUpperCase()
        : 'NONE';

    const vehiclePricing = await this.getVehiclePricingSetting();
    const ratePerKm =
      vehicleType === 'BUS'
        ? vehiclePricing.busRatePerKm
        : vehicleType === 'VAN'
        ? vehiclePricing.vanRatePerKm
        : vehiclePricing.carRatePerKm;

    const distanceKm =
      typeof data.distanceKm === 'number' && data.distanceKm > 0
        ? data.distanceKm
        : (travelPackage as any).distanceKm || 150;

    const vehicleFare =
      vehicleType !== 'NONE' ? Math.round(distanceKm * ratePerKm) : 0;

    let assignedGuideId: Types.ObjectId | undefined = undefined;
    let vehicleNumber = data.vehicleNumber ? String(data.vehicleNumber).trim() : undefined;

    const requestedRange = this.calculateDateRange(data.travelDate, travelPackage.duration);

    if (data.assignedGuideId && Types.ObjectId.isValid(data.assignedGuideId)) {
      assignedGuideId = new Types.ObjectId(data.assignedGuideId);

      // Verify that this guide does NOT already have an overlapping active booking
      const activeGuideBookings = await this.bookingModel
        .find({
          assignedGuideId,
          status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        })
        .populate('packageId', 'title duration')
        .lean();

      for (const existing of activeGuideBookings) {
        if (!existing.travelDate) continue;
        const existingDuration = (existing.packageId as any)?.duration || 1;
        const existingRange = this.calculateDateRange(existing.travelDate, existingDuration);

        if (
          this.areDateRangesOverlapping(
            requestedRange.start,
            requestedRange.end,
            existingRange.start,
            existingRange.end,
          )
        ) {
          const guideUser = await this.userModel.findById(assignedGuideId).select('name').lean();
          const guideName = guideUser?.name || 'The selected tour guide';
          const tourTitle = (existing.packageId as any)?.title || 'another tour';
          throw new BadRequestException(
            `Guide "${guideName}" is already booked for "${tourTitle}" from ${existingRange.start} to ${existingRange.end}. Please choose another available guide or select different travel dates.`,
          );
        }
      }
    } else if (vehicleType !== 'NONE') {
      // Auto-assign: pick a guide with this vehicleType who has NO date collision
      const candidateGuides = await this.userModel
        .find({
          role: Role.GUIDE,
          guideStatus: GuideStatus.APPROVED,
          $or: [
            { vehicleType: vehicleType },
            { vehicleType: { $exists: false } },
            { vehicleType: null },
          ],
        } as any)
        .select('_id name vehicleNumber vehicleType')
        .lean();

      for (const candidate of candidateGuides) {
        const candidateBookings = await this.bookingModel
          .find({
            assignedGuideId: candidate._id,
            status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          })
          .populate('packageId', 'duration')
          .lean();

        let hasConflict = false;
        for (const existing of candidateBookings) {
          if (!existing.travelDate) continue;
          const existingRange = this.calculateDateRange(
            existing.travelDate,
            (existing.packageId as any)?.duration || 1,
          );
          if (
            this.areDateRangesOverlapping(
              requestedRange.start,
              requestedRange.end,
              existingRange.start,
              existingRange.end,
            )
          ) {
            hasConflict = true;
            break;
          }
        }

        if (!hasConflict) {
          assignedGuideId = candidate._id as Types.ObjectId;
          if (candidate.vehicleNumber && !vehicleNumber) {
            vehicleNumber = candidate.vehicleNumber;
          }
          break;
        }
      }
    }

    if (assignedGuideId && !vehicleNumber) {
      const guideUser = await this.userModel.findById(assignedGuideId).select('vehicleNumber').lean();
      if (guideUser?.vehicleNumber) {
        vehicleNumber = guideUser.vehicleNumber;
      }
    }

    /* =========================
       FINAL TOTAL
    ========================= */

    const totalPrice =
      baseTotal +
      travelPlanTotal +
      addOnsTotal +
      vehicleFare;

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

        vehicleType,

        vehicleNumber,

        assignedGuideId,

        distanceKm,

        vehicleFare,

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
      )
      .populate(
        'assignedGuideId',
        'name email mobile vehicleType vehicleNumber languages experienceYears profileImage',
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
      {
        path:
          'assignedGuideId',

        select:
          'name email mobile vehicleType vehicleNumber languages experienceYears profileImage',
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
      )
      .populate(
        'assignedGuideId',
        'name email mobile vehicleType vehicleNumber languages experienceYears profileImage',
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
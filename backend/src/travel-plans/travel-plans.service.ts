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
  CreateTravelPlanDto,
  UpdateTravelPlanDto,
} from './dto/create-travel-plan.dto';

import {
  TravelPlan,
  TravelPlanDocument,
} from './schemas/travel-plan.schema';

@Injectable()
export class TravelPlansService {
  constructor(
    @InjectModel(
      TravelPlan.name,
    )
    private readonly travelPlanModel:
      Model<TravelPlanDocument>,
  ) {}

  private cleanObjectId(
    id: string,
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
        'Invalid travel plan ID',
      );
    }

    return cleanId;
  }

  async create(
    data: CreateTravelPlanDto,
  ) {
    const plan =
      new this.travelPlanModel({
        name:
          data.name.trim(),

        price:
          data.price,

        priceSuffix:
          data.priceSuffix
            ?.trim() ||
          '/ person',

        features:
          data.features.map(
            (
              feature,
            ) =>
              feature.trim(),
          ),

        isPopular:
          data.isPopular ??
          false,

        isActive:
          data.isActive ??
          true,

        sortOrder:
          data.sortOrder ??
          0,
      });

    return plan.save();
  }

  async findAll() {
    return this.travelPlanModel
      .find()
      .sort({
        sortOrder: 1,
        createdAt: 1,
      });
  }

  async findActive() {
    return this.travelPlanModel
      .find({
        isActive:
          true,
      })
      .sort({
        sortOrder: 1,
        createdAt: 1,
      });
  }

  async findOne(
    id: string,
  ) {
    const cleanId =
      this.cleanObjectId(
        id,
      );

    const plan =
      await this.travelPlanModel
        .findById(
          cleanId,
        );

    if (
      !plan
    ) {
      throw new NotFoundException(
        'Travel plan not found',
      );
    }

    return plan;
  }

  async update(
    id: string,
    data: UpdateTravelPlanDto,
  ) {
    const cleanId =
      this.cleanObjectId(
        id,
      );

    const updateData:
      Record<
        string,
        unknown
      > = {};

    if (
      data.name !==
      undefined
    ) {
      updateData.name =
        data.name.trim();
    }

    if (
      data.price !==
      undefined
    ) {
      updateData.price =
        data.price;
    }

    if (
      data.priceSuffix !==
      undefined
    ) {
      updateData.priceSuffix =
        data.priceSuffix.trim();
    }

    if (
      data.features !==
      undefined
    ) {
      updateData.features =
        data.features.map(
          (
            feature,
          ) =>
            feature.trim(),
        );
    }

    if (
      data.isPopular !==
      undefined
    ) {
      updateData.isPopular =
        data.isPopular;
    }

    if (
      data.isActive !==
      undefined
    ) {
      updateData.isActive =
        data.isActive;
    }

    if (
      data.sortOrder !==
      undefined
    ) {
      updateData.sortOrder =
        data.sortOrder;
    }

    const plan =
      await this.travelPlanModel
        .findByIdAndUpdate(
          cleanId,
          updateData,
          {
            new:
              true,

            runValidators:
              true,
          },
        );

    if (
      !plan
    ) {
      throw new NotFoundException(
        'Travel plan not found',
      );
    }

    return plan;
  }

  async remove(
    id: string,
  ) {
    const cleanId =
      this.cleanObjectId(
        id,
      );

    const plan =
      await this.travelPlanModel
        .findByIdAndDelete(
          cleanId,
        );

    if (
      !plan
    ) {
      throw new NotFoundException(
        'Travel plan not found',
      );
    }

    return {
      message:
        'Travel plan deleted successfully',
    };
  }
}
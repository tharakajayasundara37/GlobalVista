
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import {
  Model,
  Types,
} from 'mongoose';

import {
  Destination,
  DestinationDocument,
} from './schemas/destination.schema';

import {
  CreateDestinationDto,
} from './dto/create-destination.dto';

import {
  UpdateDestinationDto,
} from './dto/update-destination.dto';

@Injectable()
export class DestinationsService {
  constructor(
    @InjectModel(Destination.name)
    private readonly destinationModel:
      Model<DestinationDocument>,
  ) {}

  // ==========================================
  // VALIDATE MONGODB OBJECT ID
  // ==========================================

  private objectId(
    id: string,
  ): Types.ObjectId {
    if (
      typeof id !== 'string' ||
      !/^[a-f\d]{24}$/i.test(id)
    ) {
      throw new BadRequestException(
        'Invalid destination or account ID.',
      );
    }

    return new Types.ObjectId(id);
  }

  // ==========================================
  // ESCAPE REGULAR EXPRESSION
  // ==========================================

  private escapeRegex(
    value: string,
  ): string {
    return value.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&',
    );
  }

  // ==========================================
  // VALIDATE DESTINATION COORDINATES
  // ==========================================

  private validateCoordinates(
    latitude?: number | null,
    longitude?: number | null,
  ): void {
    const hasLatitude =
      latitude !== null &&
      latitude !== undefined;

    const hasLongitude =
      longitude !== null &&
      longitude !== undefined;

    if (hasLatitude !== hasLongitude) {
      throw new BadRequestException(
        'Latitude and longitude must be provided together.',
      );
    }

    if (hasLatitude) {
      if (
        typeof latitude !== 'number' ||
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90
      ) {
        throw new BadRequestException(
          'Latitude must be between -90 and 90.',
        );
      }
    }

    if (hasLongitude) {
      if (
        typeof longitude !== 'number' ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
      ) {
        throw new BadRequestException(
          'Longitude must be between -180 and 180.',
        );
      }
    }
  }

  // ==========================================
  // CHECK DUPLICATE DESTINATIONS
  // NO FilterQuery TYPE REQUIRED
  // ==========================================

  private async ensureUniqueDestination(
    name: string,
    country: string,
    excludeId?: string,
  ): Promise<void> {
    const query = {
      name: {
        $regex:
          `^${this.escapeRegex(name.trim())}$`,
        $options: 'i',
      },

      country: {
        $regex:
          `^${this.escapeRegex(country.trim())}$`,
        $options: 'i',
      },

      ...(excludeId
        ? {
            _id: {
              $ne: this.objectId(excludeId),
            },
          }
        : {}),
    };

    const exists =
      await this.destinationModel.exists(
        query,
      );

    if (exists) {
      throw new ConflictException(
        'This destination already exists.',
      );
    }
  }

  // ==========================================
  // EXTRACT ALLOWED DESTINATION FIELDS
  //
  // Prevent users from changing:
  // approvalStatus
  // createdBy
  // approvedBy
  // approvedAt
  // rejectionReason
  // ==========================================

  private destinationFields(
    data:
      | CreateDestinationDto
      | UpdateDestinationDto,
  ): Record<string, unknown> {
    const result:
      Record<string, unknown> = {};

    if (data.name !== undefined) {
      result.name = data.name.trim();
    }

    if (data.country !== undefined) {
      result.country =
        data.country.trim();
    }

    if (data.description !== undefined) {
      result.description =
        data.description.trim();
    }

    if (data.images !== undefined) {
      result.images =
        data.images
          .map((image) => image.trim())
          .filter(Boolean);
    }

    if (data.rating !== undefined) {
      result.rating = data.rating;
    }

    if (data.bestTimeToVisit !== undefined) {
      result.bestTimeToVisit =
        data.bestTimeToVisit.trim();
    }

    if (data.activities !== undefined) {
      result.activities =
        data.activities
          .map((activity) =>
            activity.trim(),
          )
          .filter(Boolean);
    }

    if (data.budget !== undefined) {
      result.budget =
        data.budget.trim();
    }

    if (data.latitude !== undefined) {
      result.latitude =
        data.latitude;
    }

    if (data.longitude !== undefined) {
      result.longitude =
        data.longitude;
    }

    return result;
  }

  // ==========================================
  // PUBLIC DESTINATION FILTER
  //
  // FIXED MONGOOSE TYPESCRIPT ERROR:
  // 'APPROVED' as const
  //
  // Public visibility requirements:
  // isActive === true
  // approvalStatus === APPROVED
  //
  // Existing admin destinations created
  // before this approval system remain
  // publicly visible.
  // ==========================================

  private publicQuery() {
    return {
      isActive: true,

      $or: [
        {
          approvalStatus:
            'APPROVED' as const,
        },

        {
          approvalStatus: {
            $exists: false,
          },

          createdBy: {
            $exists: false,
          },
        },
      ],
    };
  }

  // ==========================================
  // ADMIN - CREATE DESTINATION
  //
  // Admin destinations are approved
  // immediately.
  // ==========================================

  async create(
    data: CreateDestinationDto,
  ) {
    this.validateCoordinates(
      data.latitude,
      data.longitude,
    );

    await this.ensureUniqueDestination(
      data.name,
      data.country,
    );

    const fields =
      this.destinationFields(data);

    return this.destinationModel.create({
      ...fields,

      isActive:
        data.isActive ?? true,

      createdBy: null,

      approvalStatus: 'APPROVED',

      rejectionReason: '',

      approvedBy: null,

      approvedAt: null,
    });
  }

  // ==========================================
  // GUIDE - CREATE DESTINATION
  //
  // Guide destinations always start
  // as PENDING.
  //
  // They are not public until approval.
  // ==========================================

  async createByGuide(
    data: CreateDestinationDto,
    guideId: string,
  ) {
    const ownerId =
      this.objectId(guideId);

    this.validateCoordinates(
      data.latitude,
      data.longitude,
    );

    await this.ensureUniqueDestination(
      data.name,
      data.country,
    );

    const fields =
      this.destinationFields(data);

    // Guide cannot assign public rating.
    delete fields.rating;

    return this.destinationModel.create({
      ...fields,

      rating: 0,

      createdBy: ownerId,

      isActive: false,

      approvalStatus: 'PENDING',

      rejectionReason: '',

      approvedBy: null,

      approvedAt: null,
    });
  }

  // ==========================================
  // ADMIN - GET ALL DESTINATIONS
  // ==========================================

  async findAll() {
    return this.destinationModel
      .find({})
      .sort({
        createdAt: -1,
      })
      .lean()
      .exec();
  }

  // ==========================================
  // ADMIN - GET PENDING DESTINATIONS
  // ==========================================

  async findPending() {
    return this.destinationModel
      .find({
        approvalStatus: 'PENDING',
      })
      .sort({
        createdAt: -1,
      })
      .lean()
      .exec();
  }

  // ==========================================
  // GUIDE - GET OWN DESTINATIONS
  //
  // Only destinations belonging to
  // the logged-in Guide.
  // ==========================================

  async findGuideDestinations(
    guideId: string,
  ) {
    return this.destinationModel
      .find({
        createdBy:
          this.objectId(guideId),
      })
      .sort({
        createdAt: -1,
      })
      .lean()
      .exec();
  }

  // ==========================================
  // PUBLIC - GET APPROVED DESTINATIONS
  //
  // Used by Home Page.
  // ==========================================

  async findActive() {
    return this.destinationModel
      .find(this.publicQuery())
      .sort({
        country: 1,
        name: 1,
      })
      .lean()
      .exec();
  }

  // ==========================================
  // PUBLIC - GET MAP DESTINATIONS
  //
  // Only approved destinations
  // with latitude and longitude.
  // ==========================================

  async findMapDestinations() {
    return this.destinationModel
      .find({
        ...this.publicQuery(),

        latitude: {
          $ne: null,
        },

        longitude: {
          $ne: null,
        },
      })
      .select(
        [
          'name',
          'country',
          'description',
          'images',
          'rating',
          'bestTimeToVisit',
          'activities',
          'budget',
          'latitude',
          'longitude',
        ].join(' '),
      )
      .sort({
        country: 1,
        name: 1,
      })
      .lean()
      .exec();
  }

  // ==========================================
  // PUBLIC - GET SINGLE DESTINATION
  //
  // Pending and rejected destinations
  // cannot be viewed publicly.
  // ==========================================

  async findOne(
    id: string,
  ) {
    const destination =
      await this.destinationModel
        .findOne({
          _id: this.objectId(id),

          ...this.publicQuery(),
        })
        .lean()
        .exec();

    if (!destination) {
      throw new NotFoundException(
        'Destination not found.',
      );
    }

    return destination;
  }

  // ==========================================
  // ADMIN - GET SINGLE DESTINATION
  //
  // Admin can view any status.
  // ==========================================

  async findOneForAdmin(
    id: string,
  ) {
    const destination =
      await this.destinationModel
        .findById(
          this.objectId(id),
        )
        .lean()
        .exec();

    if (!destination) {
      throw new NotFoundException(
        'Destination not found.',
      );
    }

    return destination;
  }

  // ==========================================
  // ADMIN - UPDATE DESTINATION
  //
  // Preserve existing Admin editing.
  // ==========================================

  async update(
    id: string,
    data: UpdateDestinationDto,
  ) {
    const destination =
      await this.destinationModel
        .findById(
          this.objectId(id),
        );

    if (!destination) {
      throw new NotFoundException(
        'Destination not found.',
      );
    }

    const nextName =
      data.name?.trim() ??
      destination.name;

    const nextCountry =
      data.country?.trim() ??
      destination.country;

    this.validateCoordinates(
      data.latitude !== undefined
        ? data.latitude
        : destination.latitude,

      data.longitude !== undefined
        ? data.longitude
        : destination.longitude,
    );

    if (
      data.name !== undefined ||
      data.country !== undefined
    ) {
      await this.ensureUniqueDestination(
        nextName,
        nextCountry,
        id,
      );
    }

    destination.set(
      this.destinationFields(data),
    );

    if (data.isActive !== undefined) {
      destination.isActive =
        data.isActive;
    }

    return destination.save();
  }

  // ==========================================
  // GUIDE - UPDATE OWN DESTINATION
  //
  // Approved or rejected destination
  // becomes PENDING after Guide edits.
  //
  // Admin approval is required again.
  // ==========================================

  async updateByGuide(
    id: string,
    guideId: string,
    data: UpdateDestinationDto,
  ) {
    const destination =
      await this.destinationModel
        .findOne({
          _id: this.objectId(id),

          createdBy:
            this.objectId(guideId),
        });

    if (!destination) {
      throw new NotFoundException(
        'Destination not found in your account.',
      );
    }

    const nextName =
      data.name?.trim() ??
      destination.name;

    const nextCountry =
      data.country?.trim() ??
      destination.country;

    this.validateCoordinates(
      data.latitude !== undefined
        ? data.latitude
        : destination.latitude,

      data.longitude !== undefined
        ? data.longitude
        : destination.longitude,
    );

    if (
      data.name !== undefined ||
      data.country !== undefined
    ) {
      await this.ensureUniqueDestination(
        nextName,
        nextCountry,
        id,
      );
    }

    const fields =
      this.destinationFields(data);

    // Guide cannot alter public ratings.
    delete fields.rating;

    destination.set(fields);

    // Reset approval after every edit.

    destination.approvalStatus =
      'PENDING';

    destination.isActive =
      false;

    destination.rejectionReason =
      '';

    destination.approvedBy =
      null;

    destination.approvedAt =
      null;

    return destination.save();
  }

  // ==========================================
  // ADMIN - APPROVE DESTINATION
  //
  // After approval, destination is
  // publicly visible on Home Page.
  // ==========================================

  async approve(
    id: string,
    adminId: string,
  ) {
    const destination =
      await this.destinationModel
        .findById(
          this.objectId(id),
        );

    if (!destination) {
      throw new NotFoundException(
        'Destination not found.',
      );
    }

    if (
      destination.approvalStatus ===
      'APPROVED'
    ) {
      throw new BadRequestException(
        'Destination is already approved.',
      );
    }

    destination.approvalStatus =
      'APPROVED';

    destination.isActive =
      true;

    destination.rejectionReason =
      '';

    destination.approvedBy =
      this.objectId(adminId);

    destination.approvedAt =
      new Date();

    return destination.save();
  }

  // ==========================================
  // ADMIN - REJECT DESTINATION
  //
  // Reason required.
  // Destination remains hidden.
  // ==========================================

  async reject(
    id: string,
    reason: unknown,
  ) {
    if (
      typeof reason !== 'string' ||
      reason.trim().length === 0 ||
      reason.trim().length > 500
    ) {
      throw new BadRequestException(
        'A rejection reason between 1 and 500 characters is required.',
      );
    }

    const destination =
      await this.destinationModel
        .findById(
          this.objectId(id),
        );

    if (!destination) {
      throw new NotFoundException(
        'Destination not found.',
      );
    }

    if (
      destination.approvalStatus ===
      'APPROVED'
    ) {
      throw new BadRequestException(
        'Approved destinations cannot be rejected directly.',
      );
    }

    destination.approvalStatus =
      'REJECTED';

    destination.isActive =
      false;

    destination.rejectionReason =
      reason.trim();

    destination.approvedBy =
      null;

    destination.approvedAt =
      null;

    return destination.save();
  }

  // ==========================================
  // GUIDE - DELETE OWN DESTINATION
  //
  // Guides can delete their own
  // pending or rejected destinations.
  //
  // Approved destinations require
  // Admin intervention for deletion.
  // ==========================================

  async removeByGuide(
    id: string,
    guideId: string,
  ) {
    const destination =
      await this.destinationModel
        .findOne({
          _id: this.objectId(id),

          createdBy:
            this.objectId(guideId),
        });

    if (!destination) {
      throw new NotFoundException(
        'Destination not found in your account.',
      );
    }

    if (
      destination.approvalStatus ===
      'APPROVED'
    ) {
      throw new ForbiddenException(
        'Contact an admin to remove an approved destination.',
      );
    }

    await destination.deleteOne();

    return {
      message:
        'Destination deleted successfully.',
    };
  }

  // ==========================================
  // ADMIN - DELETE DESTINATION
  // ==========================================

  async remove(
    id: string,
  ) {
    const deleted =
      await this.destinationModel
        .findByIdAndDelete(
          this.objectId(id),
        );

    if (!deleted) {
      throw new NotFoundException(
        'Destination not found.',
      );
    }

    return {
      message:
        'Destination deleted successfully.',
    };
  }
}

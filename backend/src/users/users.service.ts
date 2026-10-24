
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import {
  InjectModel,
} from '@nestjs/mongoose';

import {
  isValidObjectId,
  Model,
} from 'mongoose';

import * as bcrypt from 'bcrypt';

import {
  mkdir,
  open,
  realpath,
  stat,
} from 'fs/promises';

import {
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from 'path';

import {
  GovernmentIdType,
  GuideStatus,
  Role,
  User,
  UserDocument,
} from './schemas/user.schema';

// ==========================================
// TYPES
// ==========================================

type ProfileUpdateData = {
  name?: string;
  mobile?: string;
  country?: string;
  city?: string;
  profileImage?: string;
  about?: string;
  languages?: string[];
  experienceYears?: number;
  vehicleType?: string;
  vehicleNumber?: string;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel:
      Model<UserDocument>,
  ) {}

  // ==========================================
  // HELPER: VALIDATE MONGODB ID
  // ==========================================

  private validateUserId(
    id: string,
  ): void {
    if (
      !id ||
      !isValidObjectId(id)
    ) {
      throw new BadRequestException(
        'Invalid user ID',
      );
    }
  }

  // ==========================================
  // HELPER: REMOVE SENSITIVE FIELDS
  //
  // Never return passwords, encrypted
  // government ID numbers, or private
  // document filenames to ordinary APIs.
  // ==========================================

  private sanitizeUser(
    user: UserDocument,
  ) {
    const result =
      user.toObject() as Record<
        string,
        unknown
      >;

    delete result.password;

    delete result.governmentIdNumber;

    delete result.guideIdFrontPath;

    delete result.guideIdBackPath;

    delete result.guideLicensePath;

    delete result.__v;

    return result;
  }

  // ==========================================
  // CREATE USER
  //
  // Used by AuthService.
  // ==========================================

  async create(
    data: any,
  ) {
    const user =
      new this.userModel(data);

    try {
      return await user.save();
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 11000
      ) {
        throw new ConflictException(
          'Email or account ID already exists',
        );
      }

      throw error;
    }
  }

  // ==========================================
  // FIND USER BY EMAIL
  //
  // Internal authentication method.
  // Password must remain available here
  // for bcrypt verification.
  // ==========================================

  async findByEmail(
    email: string,
  ) {
    return this.userModel.findOne({
      email:
        email.trim().toLowerCase(),
    });
  }

  // ==========================================
  // FIND USER BY PUBLIC ID
  // ==========================================

  async findByPublicId(
    publicId: string,
  ) {
    return this.userModel.findOne({
      publicId,
    });
  }

  // ==========================================
  // ADMIN: ALL USERS
  // ==========================================

  async findAll() {
    return this.userModel
      .find()
      .select(
        '-password -governmentIdNumber -guideIdFrontPath -guideIdBackPath -guideIdFrontData -guideIdBackData -guideLicensePath',
      )
      .sort({
        createdAt: -1,
      });
  }

  // ==========================================
  // SINGLE USER
  //
  // Also used by JwtStrategy to validate
  // the user's current role and status.
  // ==========================================

  async findOne(
    id: string,
  ) {
    this.validateUserId(id);

    const user =
      await this.userModel
        .findById(id)
        .select(
          '-password -governmentIdNumber -guideIdFrontPath -guideIdBackPath -guideIdFrontData -guideIdBackData -guideLicensePath',
        );

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return user;
  }

  // ==========================================
  // UPDATE MY PROFILE
  //
  // Never allow role, guideStatus,
  // email verification, or document fields
  // to be changed through this method.
  // ==========================================

  async updateMyProfile(
    userId: string,
    data: ProfileUpdateData,
  ) {
    this.validateUserId(userId);

    if (
      !data ||
      typeof data !== 'object' ||
      Array.isArray(data)
    ) {
      throw new BadRequestException(
        'Invalid profile details',
      );
    }

    const updates: ProfileUpdateData = {};

    if (
      data.name !== undefined
    ) {
      if (
        typeof data.name !== 'string' ||
        data.name.trim().length < 2 ||
        data.name.trim().length > 100
      ) {
        throw new BadRequestException(
          'Name must contain 2 to 100 characters',
        );
      }

      updates.name =
        data.name.trim();
    }

    if (
      data.mobile !== undefined
    ) {
      if (
        typeof data.mobile !== 'string' ||
        data.mobile.trim().length < 7 ||
        data.mobile.trim().length > 30
      ) {
        throw new BadRequestException(
          'Invalid mobile number',
        );
      }

      updates.mobile =
        data.mobile.trim();
    }

    if (
      data.country !== undefined
    ) {
      if (
        typeof data.country !== 'string' ||
        !data.country.trim() ||
        data.country.trim().length > 100
      ) {
        throw new BadRequestException(
          'Invalid country',
        );
      }

      updates.country =
        data.country.trim();
    }

    if (data.city !== undefined && typeof data.city === 'string') {
      updates.city = data.city.trim();
    }

    if (data.profileImage !== undefined && typeof data.profileImage === 'string') {
      updates.profileImage = data.profileImage.trim();
    }

    if (data.about !== undefined && typeof data.about === 'string') {
      updates.about = data.about.trim();
    }

    if (data.languages !== undefined && Array.isArray(data.languages)) {
      updates.languages = data.languages.map((l) => String(l).trim()).filter(Boolean);
    }

    if (data.vehicleType !== undefined && typeof data.vehicleType === 'string') {
      const v = data.vehicleType.trim().toUpperCase();
      if (['CAR', 'VAN', 'BUS'].includes(v)) {
        updates.vehicleType = v as any;
      }
    }

    if (data.vehicleNumber !== undefined && typeof data.vehicleNumber === 'string') {
      updates.vehicleNumber = data.vehicleNumber.trim().toUpperCase();
    }

    if (data.experienceYears !== undefined) {
      const exp = Number(data.experienceYears);
      if (!isNaN(exp) && exp >= 0) {
        updates.experienceYears = exp;
      }
    }

    if (
      Object.keys(updates).length === 0
    ) {
      throw new BadRequestException(
        'No profile changes provided',
      );
    }

    const user =
      await this.userModel
        .findByIdAndUpdate(
          userId,
          {
            $set: updates,
          },
          {
            new: true,
            runValidators: true,
          },
        );

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return {
      message:
        'Profile updated successfully',

      user:
        this.sanitizeUser(user),
    };
  }

  // ==========================================
  // UPDATE PROFILE PHOTO
  //
  // Public profile pictures only.
  // NEVER use this method for NIC or
  // passport document images.
  // ==========================================

  async updateProfileImage(
    userId: string,
    imagePath: string,
  ) {
    this.validateUserId(userId);

    if (
      typeof imagePath !== 'string'
    ) {
      throw new BadRequestException(
        'Invalid profile image',
      );
    }

    const normalizedPath =
      imagePath.startsWith('/')
        ? imagePath
        : `/${imagePath}`;

    // Accept files located in the public
    // user-profile image directory only.

    if (
      !/^\/uploads\/users\/[a-zA-Z0-9_.-]+\.(jpg|jpeg|png|webp)$/i
        .test(normalizedPath)
    ) {
      throw new BadRequestException(
        'Invalid profile image path',
      );
    }

    const user =
      await this.userModel
        .findByIdAndUpdate(
          userId,
          {
            $set: {
              profileImage:
                normalizedPath,
            },
          },
          {
            new: true,
            runValidators: true,
          },
        );

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return {
      message:
        'Profile image updated successfully',

      user:
        this.sanitizeUser(user),
    };
  }

  // ==========================================
  // CHANGE MY PASSWORD
  // ==========================================

  async changeMyPassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    this.validateUserId(userId);

    if (
      typeof currentPassword !== 'string' ||
      typeof newPassword !== 'string'
    ) {
      throw new BadRequestException(
        'Current password and new password are required',
      );
    }

    if (
      newPassword.length < 8 ||
      newPassword.length > 128
    ) {
      throw new BadRequestException(
        'New password must contain 8 to 128 characters',
      );
    }

    const user =
      await this.userModel
        .findById(userId)
        .select('+password');

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    const passwordMatches =
      await bcrypt.compare(
        currentPassword,
        user.password,
      );

    if (!passwordMatches) {
      throw new UnauthorizedException(
        'Current password is incorrect',
      );
    }

    const samePassword =
      await bcrypt.compare(
        newPassword,
        user.password,
      );

    if (samePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    if (
      user.role === Role.GUIDE
    ) {
      const strongPassword =
        newPassword.length >= 10 &&
        /[A-Z]/.test(newPassword) &&
        /[a-z]/.test(newPassword) &&
        /[0-9]/.test(newPassword) &&
        /[^A-Za-z0-9]/.test(newPassword);

      if (!strongPassword) {
        throw new BadRequestException(
          'Guide passwords require at least 10 characters, uppercase, lowercase, number and special character',
        );
      }
    }

    user.password =
      await bcrypt.hash(
        newPassword,
        12,
      );

    await user.save();

    return {
      message:
        'Password changed successfully',
    };
  }

  // ==========================================
  // ADMIN: PENDING GUIDES
  //
  // Do not expose encrypted ID numbers
  // or private document filenames.
  // ==========================================

  async findPendingGuides() {
    return this.userModel
      .find({
        role:
          Role.GUIDE,

        guideStatus:
          GuideStatus.PENDING,
      })
      .select(
        '-password -governmentIdNumber -guideIdFrontPath -guideIdBackPath -guideIdFrontData -guideIdBackData -guideLicensePath',
      )
      .sort({
        createdAt: -1,
      });
  }

  // ==========================================
  // ADMIN: ALL GUIDES
  // ==========================================

  async findAllGuides() {
    return this.userModel
      .find({
        role:
          Role.GUIDE,
      })
      .select(
        '-password -governmentIdNumber -guideIdFrontPath -guideIdBackPath -guideIdFrontData -guideIdBackData -guideLicensePath',
      )
      .sort({
        createdAt: -1,
      });
  }

  // ==========================================
  // PRIVATE DOCUMENT STORAGE LOCATION
  // ==========================================

  private async getPrivateDirectory():
    Promise<string> {
    const configuredDirectory =
      process.env
        .GUIDE_PRIVATE_UPLOAD_DIR;

    const directory =
      resolve(
        configuredDirectory ||
          join(
            process.cwd(),
            'private-data',
            'guide-ids',
          ),
      );

    let actualDirectory: string;

    try {
      await mkdir(directory, { recursive: true, mode: 0o700 });
      actualDirectory =
        await realpath(directory);
    } catch {
      actualDirectory = directory;
    }

    const publicDirectory =
      resolve(
        process.cwd(),
        'uploads',
      );

    let actualPublicDirectory =
      publicDirectory;

    try {
      actualPublicDirectory =
        await realpath(
          publicDirectory,
        );
    } catch {
      // The public directory may not exist.
    }

    const pathFromPublic =
      relative(
        actualPublicDirectory,
        actualDirectory,
      );

    const isPublicLocation =
      pathFromPublic === '' ||
      (
        pathFromPublic !== '..' &&
        !pathFromPublic.startsWith(
          `..${sep}`,
        ) &&
        !isAbsolute(pathFromPublic)
      );

    if (isPublicLocation) {
      throw new ForbiddenException(
        'Guide identity documents must use private storage',
      );
    }

    return actualDirectory;
  }

  // ==========================================
  // CHECK ENCRYPTED DOCUMENT EXISTS
  //
  // Only random document filenames are
  // accepted. Never accept client paths.
  // ==========================================

  private async verifyPrivateDocument(
    filename: string | undefined,
  ): Promise<void> {
    if (
      typeof filename !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.gvid$/i
        .test(filename)
    ) {
      throw new BadRequestException(
        'Valid encrypted identity document is required',
      );
    }

    const directory =
      await this.getPrivateDirectory();

    const fullPath =
      join(
        directory,
        filename,
      );

    try {
      const fileInfo =
        await stat(fullPath);

      if (
        !fileInfo.isFile() ||
        fileInfo.size < 35 ||
        fileInfo.size >
          6 * 1024 * 1024
      ) {
        throw new Error(
          'Invalid document file',
        );
      }

      const handle =
        await open(
          fullPath,
          'r',
        );

      try {
        const header =
          Buffer.alloc(6);

        const readResult =
          await handle.read(
            header,
            0,
            6,
            0,
          );

        if (
          readResult.bytesRead !== 6 ||
          !header.equals(
            Buffer.from('GVID01'),
          )
        ) {
          throw new Error(
            'Invalid encrypted document format',
          );
        }
      } finally {
        await handle.close();
      }
    } catch {
      throw new BadRequestException(
        'Guide identity document is missing or invalid',
      );
    }
  }

  // ==========================================
  // ADMIN: APPROVE GUIDE
  //
  // Only PENDING guides with required
  // identity documents may be approved.
  //
  // Admin authentication/authorization
  // must be applied at controller level.
  // ==========================================

  async approveGuide(
    id: string,
    reviewedBy?: string,
  ) {
    this.validateUserId(id);

    const guide =
      await this.userModel
        .findOne({
          _id: id,
          role: Role.GUIDE,
        })
        .select(
          '+governmentIdNumber +guideIdFrontPath +guideIdBackPath',
        );

    if (!guide) {
      throw new NotFoundException(
        'Tour guide not found',
      );
    }

    if (
      guide.guideStatus !==
      GuideStatus.PENDING
    ) {
      throw new BadRequestException(
        'Only pending guides can be approved',
      );
    }

    if (
      !guide.guideTermsAcceptedAt
    ) {
      throw new BadRequestException(
        'Guide terms consent is missing',
      );
    }

    if (
      !guide.governmentIdNumber ||
      !guide.governmentIdNumber.startsWith(
        'v1:',
      )
    ) {
      throw new BadRequestException(
        'Encrypted NIC or Passport number is missing',
      );
    }

    if (
      guide.governmentIdType !==
        GovernmentIdType.NIC &&
      guide.governmentIdType !==
        GovernmentIdType.PASSPORT
    ) {
      throw new BadRequestException(
        'Valid NIC or Passport type is required',
      );
    }

    // Front image is always required.

    await this.verifyPrivateDocument(
      guide.guideIdFrontPath,
    );

    // NIC requires back image too.

    if (
      guide.governmentIdType ===
      GovernmentIdType.NIC
    ) {
      await this.verifyPrivateDocument(
        guide.guideIdBackPath,
      );
    }

    // Guard against approving an application
    // changed by a concurrent upload.

    const updatedGuide =
      await this.userModel
        .findOneAndUpdate(
          {
            _id: id,

            role:
              Role.GUIDE,

            guideStatus:
              GuideStatus.PENDING,

            guideIdFrontPath:
              guide.guideIdFrontPath,

            ...(guide.governmentIdType ===
            GovernmentIdType.NIC
              ? {
                  guideIdBackPath:
                    guide.guideIdBackPath,
                }
              : {}),
          },
          {
            $set: {
              guideStatus:
                GuideStatus.APPROVED,

              guideReviewedAt:
                new Date(),

              guideReviewedBy:
                reviewedBy || '',

              guideReviewReason:
                '',
            },
          },
          {
            new: true,

            runValidators:
              true,
          },
        );

    if (!updatedGuide) {
      throw new ConflictException(
        'Guide application changed. Please review again',
      );
    }

    return {
      message:
        'Tour guide approved successfully',

      guide:
        this.sanitizeUser(
          updatedGuide,
        ),
    };
  }

  // ==========================================
  // ADMIN: REJECT GUIDE
  // ==========================================

  async rejectGuide(
    id: string,
    reason = '',
    reviewedBy?: string,
  ) {
    this.validateUserId(id);

    if (
      typeof reason !== 'string' ||
      reason.length > 1000
    ) {
      throw new BadRequestException(
        'Invalid review reason',
      );
    }

    const guide =
      await this.userModel
        .findOneAndUpdate(
          {
            _id: id,

            role:
              Role.GUIDE,

            guideStatus:
              GuideStatus.PENDING,
          },
          {
            $set: {
              guideStatus:
                GuideStatus.REJECTED,

              guideReviewReason:
                reason.trim(),

              guideReviewedAt:
                new Date(),

              guideReviewedBy:
                reviewedBy || '',
            },
          },
          {
            new: true,

            runValidators:
              true,
          },
        );

    if (!guide) {
      const existing =
        await this.userModel.findOne({
          _id: id,
          role: Role.GUIDE,
        });

      if (!existing) {
        throw new NotFoundException(
          'Tour guide not found',
        );
      }

      throw new BadRequestException(
        'Only pending guides can be rejected',
      );
    }

    return {
      message:
        'Tour guide rejected successfully',

      guide:
        this.sanitizeUser(guide),
    };
  }

  // ==========================================
  // ADMIN: DELETE USER
  // ==========================================

  async remove(
    id: string,
  ) {
    this.validateUserId(id);

    const user =
      await this.userModel
        .findByIdAndDelete(id);

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return {
      message:
        'User deleted successfully',
    };
  }

  /* ==========================================
     PUBLIC: APPROVED GUIDES FILTERED BY VEHICLE
  ========================================== */

  async findApprovedGuides(vehicleType?: string, language?: string) {
    const filter: Record<string, any> = {
      role: Role.GUIDE,
      guideStatus: GuideStatus.APPROVED,
    };
    if (
      vehicleType &&
      typeof vehicleType === 'string' &&
      vehicleType.trim() &&
      vehicleType.toUpperCase() !== 'ALL' &&
      vehicleType.toUpperCase() !== 'NONE'
    ) {
      filter.vehicleType = vehicleType.trim().toUpperCase();
    }
    if (
      language &&
      typeof language === 'string' &&
      language.trim() &&
      language.toUpperCase() !== 'ALL'
    ) {
      filter.languages = { $regex: new RegExp(language.trim(), 'i') };
    }
    return this.userModel
      .find(filter)
      .select(
        '_id name publicId email mobile country city languages experienceYears profileImage about vehicleType vehicleNumber guideStatus createdAt',
      )
      .sort({ experienceYears: -1, createdAt: -1 });
  }

}
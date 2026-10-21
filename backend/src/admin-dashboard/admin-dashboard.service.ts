
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import {
  InjectModel,
} from '@nestjs/mongoose';

import {
  isValidObjectId,
  Model,
} from 'mongoose';

import {
  createDecipheriv,
  hkdfSync,
} from 'crypto';

import {
  lstat,
  readFile,
  realpath,
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
} from '../users/schemas/user.schema';

import {
  Package,
  PackageDocument,
} from '../packages/schemas/package.schema';

import {
  Booking,
  BookingDocument,
} from '../bookings/schemas/booking.schema';

import {
  Payment,
  PaymentDocument,
} from '../payments/schemas/payment.schema';

import {
  BookingStatus,
} from '../bookings/enums/booking-status.enum';

// ==========================================
// PRIVATE IDENTITY DOCUMENT CONFIGURATION
// ==========================================

const DOCUMENT_MAGIC = 'GVID01';

const MAX_ENCRYPTED_DOCUMENT_SIZE =
  5 * 1024 * 1024 + 4096;

const PRIVATE_FILENAME_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.gvid$/i;

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel:
      Model<UserDocument>,

    @InjectModel(Package.name)
    private readonly packageModel:
      Model<PackageDocument>,

    @InjectModel(Booking.name)
    private readonly bookingModel:
      Model<BookingDocument>,

    @InjectModel(Payment.name)
    private readonly paymentModel:
      Model<PaymentDocument>,
  ) {}

  // ==========================================
  // HELPER: VALIDATE USER ID
  // ==========================================

  private validateId(id: string): void {
    if (
      typeof id !== 'string' ||
      !/^[0-9a-f]{24}$/i.test(id) ||
      !isValidObjectId(id)
    ) {
      throw new BadRequestException(
        'Invalid guide ID',
      );
    }
  }

  // ==========================================
  // HELPER: SAFE GUIDE API RESPONSE
  //
  // Never expose:
  // - Password
  // - Encrypted government ID number
  // - Private document filenames
  // - Raw identity images
  // ==========================================

  private toSafeGuide(
    guide: UserDocument,
  ) {
    return {
      _id: String(guide._id),

      id: String(guide._id),

      publicId: guide.publicId,

      name: guide.name,

      email: guide.email,

      mobile: guide.mobile,

      country: guide.country,

      city: guide.city,

      languages: guide.languages || [],

      experienceYears:
        guide.experienceYears ?? 0,

      about: guide.about || '',

      governmentIdType:
        guide.governmentIdType,

      role: guide.role,

      guideStatus: guide.guideStatus,

      profileImage:
        guide.profileImage || '',

      guideTermsAcceptedAt:
        guide.guideTermsAcceptedAt ?? null,

      guideReviewReason:
        guide.guideReviewReason || '',

      guideReviewedAt:
        guide.guideReviewedAt ?? null,

      guideReviewedBy:
        guide.guideReviewedBy || '',

      hasIdFrontDocument:
        Boolean(guide.guideIdFrontPath),

      hasIdBackDocument:
        Boolean(guide.guideIdBackPath),

      createdAt:
        guide.get('createdAt'),

      updatedAt:
        guide.get('updatedAt'),
    };
  }

  // ==========================================
  // HELPER: GUIDE SELECT FIELDS
  // ==========================================

  private readonly guideSelectFields = `
    publicId
    name
    email
    mobile
    country
    city
    languages
    experienceYears
    about
    governmentIdType
    role
    guideStatus
    profileImage
    guideTermsAcceptedAt
    guideReviewReason
    guideReviewedAt
    guideReviewedBy
    createdAt
    updatedAt
    +guideIdFrontPath
    +guideIdBackPath
  `;

  // ==========================================
  // DASHBOARD SUMMARY
  //
  // EXISTING FUNCTIONALITY PRESERVED
  // ==========================================

  async getDashboard() {
    const [
      totalAccounts,
      totalUsers,
      totalGuides,
      pendingGuides,
      approvedGuides,
      rejectedGuides,
      totalPackages,
      totalBookings,
      totalPayments,
      pendingBookings,
      confirmedBookings,
      revenue,
    ] = await Promise.all([
      this.userModel.countDocuments(),

      this.userModel.countDocuments({
        role: Role.USER,
      }),

      this.userModel.countDocuments({
        role: Role.GUIDE,
      }),

      this.userModel.countDocuments({
        role: Role.GUIDE,
        guideStatus: GuideStatus.PENDING,
      }),

      this.userModel.countDocuments({
        role: Role.GUIDE,
        guideStatus: GuideStatus.APPROVED,
      }),

      this.userModel.countDocuments({
        role: Role.GUIDE,
        guideStatus: GuideStatus.REJECTED,
      }),

      this.packageModel.countDocuments(),

      this.bookingModel.countDocuments(),

      this.paymentModel.countDocuments(),

      this.bookingModel.countDocuments({
        status: BookingStatus.PENDING,
      }),

      this.bookingModel.countDocuments({
        status: BookingStatus.CONFIRMED,
      }),

      this.paymentModel.aggregate([
        {
          $match: {
            status: 'SUCCESS',
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$amount',
            },
          },
        },
      ]),
    ]);

    return {
      totalAccounts,
      totalUsers,
      totalGuides,
      pendingGuides,
      approvedGuides,
      rejectedGuides,
      totalPackages,
      totalBookings,
      totalPayments,

      totalRevenue:
        revenue[0]?.total || 0,

      pendingBookings,
      confirmedBookings,
    };
  }

  // ==========================================
  // RECENT BOOKINGS
  //
  // EXISTING FUNCTIONALITY PRESERVED
  // ==========================================

  async getRecentBookings() {
    return this.bookingModel
      .find()
      .sort({
        createdAt: -1,
      })
      .limit(10)
      .populate(
        'userId',
        'publicId name email country mobile role',
      )
      .populate(
        'packageId',
        'title country price duration category',
      );
  }

  // ==========================================
  // RECENT PAYMENTS
  //
  // EXISTING FUNCTIONALITY PRESERVED
  // ==========================================

  async getRecentPayments() {
    return this.paymentModel
      .find()
      .sort({
        createdAt: -1,
      })
      .limit(10)
      .populate(
        'userId',
        'publicId name email country role',
      )
      .populate(
        'bookingId',
        'travelDate numberOfPeople totalPrice status paymentStatus',
      );
  }

  // ==========================================
  // REVENUE ANALYTICS
  //
  // EXISTING FUNCTIONALITY PRESERVED
  // ==========================================

  async getRevenue() {
    const totalRevenue =
      await this.paymentModel.aggregate([
        {
          $match: {
            status: 'SUCCESS',
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$amount',
            },
          },
        },
      ]);

    const successfulPayments =
      await this.paymentModel.countDocuments({
        status: 'SUCCESS',
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
            status: 'SUCCESS',
          },
        },
        {
          $group: {
            _id: {
              month: {
                $month: '$createdAt',
              },
              year: {
                $year: '$createdAt',
              },
            },
            revenue: {
              $sum: '$amount',
            },
            payments: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            '_id.year': 1,
            '_id.month': 1,
          },
        },
      ]);

    return {
      totalRevenue:
        totalRevenue[0]?.total || 0,

      successfulPayments,
      averagePayment,
      monthlyRevenue,
    };
  }

  // ==========================================
  // PENDING GUIDE APPLICATIONS
  // ==========================================

  async getPendingGuides() {
    const guides = await this.userModel
      .find({
        role: Role.GUIDE,
        guideStatus: GuideStatus.PENDING,
      })
      .select(this.guideSelectFields)
      .sort({
        createdAt: -1,
      });

    return guides.map((guide) =>
      this.toSafeGuide(guide),
    );
  }

  // ==========================================
  // ALL GUIDES
  // ==========================================

  async getAllGuides() {
    const guides = await this.userModel
      .find({
        role: Role.GUIDE,
      })
      .select(this.guideSelectFields)
      .sort({
        createdAt: -1,
      });

    return guides.map((guide) =>
      this.toSafeGuide(guide),
    );
  }

  // ==========================================
  // SINGLE GUIDE
  // ==========================================

  async getGuide(id: string) {
    this.validateId(id);

    const guide = await this.userModel
      .findOne({
        _id: id,
        role: Role.GUIDE,
      })
      .select(this.guideSelectFields);

    if (!guide) {
      throw new NotFoundException(
        'Tour guide not found',
      );
    }

    return this.toSafeGuide(guide);
  }

  // ==========================================
  // PRIVATE DIRECTORY VALIDATION
  //
  // DO NOT SERVE PRIVATE FILES PUBLICLY
  // ==========================================

  private isWithinDirectory(
    parent: string,
    candidate: string,
  ): boolean {
    const pathBetween = relative(
      parent,
      candidate,
    );

    return (
      pathBetween === '' ||
      (
        pathBetween !== '..' &&
        !pathBetween.startsWith(
          `..${sep}`,
        ) &&
        !isAbsolute(pathBetween)
      )
    );
  }

  private async getPrivateDirectory():
    Promise<string> {
    const configuredDirectory =
      process.env.GUIDE_PRIVATE_UPLOAD_DIR;

    const directory = resolve(
      configuredDirectory ||
        join(
          process.cwd(),
          'private-data',
          'guide-ids',
        ),
    );

    let actualDirectory: string;

    try {
      actualDirectory =
        await realpath(directory);
    } catch {
      throw new BadRequestException(
        'Guide identity documents have not been uploaded',
      );
    }

    const publicDirectory = resolve(
      process.cwd(),
      'uploads',
    );

    let actualPublicDirectory =
      publicDirectory;

    try {
      actualPublicDirectory =
        await realpath(publicDirectory);
    } catch {
      // Public directory may not exist.
    }

    if (
      this.isWithinDirectory(
        actualPublicDirectory,
        actualDirectory,
      )
    ) {
      throw new ServiceUnavailableException(
        'Private document storage is incorrectly configured',
      );
    }

    return actualDirectory;
  }

  // ==========================================
  // DERIVE DOCUMENT ENCRYPTION KEY
  //
  // Same derivation used by AuthController.
  // ==========================================

  private getDocumentKey(): Buffer {
    const secret =
      process.env.GUIDE_ID_ENCRYPTION_KEY;

    if (
      !secret ||
      !/^[a-fA-F0-9]{64}$/.test(secret)
    ) {
      throw new ServiceUnavailableException(
        'Guide document encryption is not configured',
      );
    }

    return Buffer.from(
      hkdfSync(
        'sha256',
        Buffer.from(secret, 'hex'),
        Buffer.from(
          'globalvista-guide-document-salt-v1',
        ),
        Buffer.from(
          'guide-documents-v1',
        ),
        32,
      ),
    );
  }

  // ==========================================
  // VERIFY ENCRYPTED ID DOCUMENT
  //
  // Checks:
  // 1. Filename
  // 2. Private directory
  // 3. File size
  // 4. Encrypted file header
  // 5. AES-GCM authentication tag
  // 6. Basic image signature
  //
  // Does NOT establish that the identity
  // document is genuine.
  // ==========================================

  private async verifyPrivateDocument(
    filename: string | undefined,
  ): Promise<void> {
    if (
      !filename ||
      !PRIVATE_FILENAME_PATTERN.test(
        filename,
      )
    ) {
      throw new BadRequestException(
        'Required identity document is missing',
      );
    }

    const directory =
      await this.getPrivateDirectory();

    const filePath =
      join(directory, filename);

    const documentKey =
      this.getDocumentKey();

    try {
      const fileInfo =
        await lstat(filePath);

      if (
        !fileInfo.isFile() ||
        fileInfo.isSymbolicLink() ||
        fileInfo.size < 35 ||
        fileInfo.size >
          MAX_ENCRYPTED_DOCUMENT_SIZE
      ) {
        throw new Error(
          'Invalid document file',
        );
      }

      const actualFilePath =
        await realpath(filePath);

      if (
        !this.isWithinDirectory(
          directory,
          actualFilePath,
        )
      ) {
        throw new Error(
          'Document path is invalid',
        );
      }

      const encrypted =
        await readFile(filePath);

      const header = encrypted
        .subarray(0, 6)
        .toString('utf8');

      if (
        header !== DOCUMENT_MAGIC
      ) {
        throw new Error(
          'Invalid document header',
        );
      }

      const iv =
        encrypted.subarray(6, 18);

      const authTag =
        encrypted.subarray(18, 34);

      const ciphertext =
        encrypted.subarray(34);

      const decipher =
        createDecipheriv(
          'aes-256-gcm',
          documentKey,
          iv,
        );

      decipher.setAuthTag(
        authTag,
      );

      const decrypted =
        Buffer.concat([
          decipher.update(ciphertext),
          decipher.final(),
        ]);

      const isJpeg =
        decrypted.length >= 3 &&
        decrypted[0] === 0xff &&
        decrypted[1] === 0xd8 &&
        decrypted[2] === 0xff;

      const pngSignature =
        Buffer.from([
          137,
          80,
          78,
          71,
          13,
          10,
          26,
          10,
        ]);

      const isPng =
        decrypted.length >= 8 &&
        decrypted
          .subarray(0, 8)
          .equals(pngSignature);

      if (
        !isJpeg &&
        !isPng
      ) {
        throw new Error(
          'Invalid identity image',
        );
      }
    } catch {
      throw new BadRequestException(
        'Identity document is missing, invalid or cannot be decrypted',
      );
    }
  }

  // ==========================================
  // APPROVE TOUR GUIDE
  //
  // Only pending applications are eligible.
  // Required documents must pass integrity
  // checks before database status changes.
  // ==========================================

  async approveGuide(
    id: string,
    reviewedBy?: string,
  ) {
    this.validateId(id);

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

    // ======================================
    // REGISTRATION CONSENT CHECK
    // ======================================

    if (
      !guide.guideTermsAcceptedAt
    ) {
      throw new BadRequestException(
        'Guide registration consent is missing',
      );
    }

    // ======================================
    // ENCRYPTED ID NUMBER CHECK
    // ======================================

    if (
      !guide.governmentIdNumber ||
      !guide.governmentIdNumber.startsWith(
        'v1:',
      )
    ) {
      throw new BadRequestException(
        'Valid encrypted NIC or Passport number is required',
      );
    }

    // ======================================
    // ID TYPE CHECK
    // ======================================

    if (
      guide.governmentIdType !==
        GovernmentIdType.NIC &&
      guide.governmentIdType !==
        GovernmentIdType.PASSPORT
    ) {
      throw new BadRequestException(
        'Guide NIC or Passport type is invalid',
      );
    }

    // ======================================
    // FRONT DOCUMENT REQUIRED
    // ======================================

    await this.verifyPrivateDocument(
      guide.guideIdFrontPath,
    );

    // ======================================
    // NIC BACK DOCUMENT REQUIRED
    // ======================================

    if (
      guide.governmentIdType ===
      GovernmentIdType.NIC
    ) {
      await this.verifyPrivateDocument(
        guide.guideIdBackPath,
      );
    }

    // ======================================
    // UPDATE APPROVAL STATUS
    //
    // Conditional update prevents approval
    // if document references/status changed
    // after validation.
    // ======================================

    const updatedGuide =
      await this.userModel
        .findOneAndUpdate(
          {
            _id: id,

            role: Role.GUIDE,

            guideStatus:
              GuideStatus.PENDING,

            guideIdFrontPath:
              guide.guideIdFrontPath,

            guideTermsAcceptedAt:
              guide.guideTermsAcceptedAt,

            governmentIdNumber:
              guide.governmentIdNumber,

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
            runValidators: true,
          },
        )
        .select(
          this.guideSelectFields,
        );

    if (!updatedGuide) {
      throw new ConflictException(
        'Guide application changed during review. Please try again',
      );
    }

    return {
      message:
        'Tour guide approved successfully',

      guide:
        this.toSafeGuide(
          updatedGuide,
        ),
    };
  }

  // ==========================================
  // REJECT TOUR GUIDE
  //
  // Existing reject endpoint preserved.
  // Only pending applications can be rejected.
  // ==========================================

  async rejectGuide(
    id: string,
    reason = '',
    reviewedBy?: string,
  ) {
    this.validateId(id);

    if (
      typeof reason !== 'string' ||
      reason.length > 1000
    ) {
      throw new BadRequestException(
        'Invalid rejection reason',
      );
    }

    const guide =
      await this.userModel
        .findOneAndUpdate(
          {
            _id: id,

            role: Role.GUIDE,

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
            runValidators: true,
          },
        )
        .select(
          this.guideSelectFields,
        );

    if (!guide) {
      const existingGuide =
        await this.userModel.findOne({
          _id: id,
          role: Role.GUIDE,
        });

      if (!existingGuide) {
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
        this.toSafeGuide(guide),
    };
  }
}

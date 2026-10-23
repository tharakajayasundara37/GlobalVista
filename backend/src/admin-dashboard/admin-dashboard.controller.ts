
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Injectable,
  NotFoundException,
  Optional,
  Param,
  Patch,
  Req,
  ServiceUnavailableException,
  StreamableFile,
  UseGuards,
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
  mkdir,
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
  AdminDashboardService,
} from './admin-dashboard.service';

import {
  JwtGuard,
} from '../auth/jwt.guard';

import {
  AdminGuard,
} from '../auth/admin.guard';

import {
  Role,
  User,
  UserDocument,
} from '../users/schemas/user.schema';

// ==========================================
// PRIVATE DOCUMENT SETTINGS
// ==========================================

const DOCUMENT_HEADER = 'GVID01';

const MAX_ENCRYPTED_FILE_SIZE =
  5 * 1024 * 1024 + 4096;

const PRIVATE_FILENAME_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.gvid$/i;

type DocumentSide =
  | 'front'
  | 'back';

type AuthenticatedAdminRequest = {
  user?: {
    id?: string;
    role?: Role;
  };
};

// ==========================================
// ADMIN DASHBOARD CONTROLLER
// ==========================================

@Controller('admin-dashboard')
@UseGuards(
  JwtGuard,
  AdminGuard,
)
export class AdminDashboardController {
  constructor(
    private readonly adminDashboardService:
      AdminDashboardService,

    // Optional injection keeps existing
    // controller unit tests compatible.
    //
    // Real document viewing requires
    // the User MongoDB model.
    //
    // If unavailable, the endpoint
    // fails closed.

    @Optional()
    @InjectModel(User.name)
    private readonly userModel?:
      Model<UserDocument>,
  ) {}

  // ========================================
  // DASHBOARD
  // ========================================

  @Get()
  getDashboard() {
    return this.adminDashboardService
      .getDashboard();
  }

  // ========================================
  // BOOKINGS
  // ========================================

  @Get('bookings')
  getRecentBookings() {
    return this.adminDashboardService
      .getRecentBookings();
  }

  // ========================================
  // PAYMENTS
  // ========================================

  @Get('payments')
  getRecentPayments() {
    return this.adminDashboardService
      .getRecentPayments();
  }

  // ========================================
  // REVENUE
  // ========================================

  @Get('revenue')
  getRevenue() {
    return this.adminDashboardService
      .getRevenue();
  }

  // ========================================
  // PENDING GUIDE APPLICATIONS
  // ========================================

  @Get('guides/pending')
  getPendingGuides() {
    return this.adminDashboardService
      .getPendingGuides();
  }

  // ========================================
  // ALL GUIDES
  // ========================================

  @Get('guides')
  getAllGuides() {
    return this.adminDashboardService
      .getAllGuides();
  }

  // ========================================
  // SINGLE GUIDE
  // ========================================

  @Get('guides/:id')
  getGuide(
    @Param('id')
    id: string,
  ) {
    return this.adminDashboardService
      .getGuide(id);
  }

  // ========================================
  // HELPER: VALIDATE GUIDE ID
  // ========================================

  private validateGuideId(
    id: string,
  ): void {
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

  // ========================================
  // HELPER: PATH IS INSIDE DIRECTORY
  // ========================================

  private isInsideDirectory(
    parent: string,
    candidate: string,
  ): boolean {
    const result = relative(
      parent,
      candidate,
    );

    return (
      result === '' ||
      (
        result !== '..' &&
        !result.startsWith(
          `..${sep}`,
        ) &&
        !isAbsolute(result)
      )
    );
  }

  // ========================================
  // HELPER: PRIVATE DOCUMENT DIRECTORY
  // ========================================

  private async getPrivateDirectory():
    Promise<string> {
    const configuredDirectory =
      process.env
        .GUIDE_PRIVATE_UPLOAD_DIR;

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
      await mkdir(directory, { recursive: true, mode: 0o700 });
      actualDirectory =
        await realpath(directory);
    } catch {
      actualDirectory = directory;
    }

    const publicUploads = resolve(
      process.cwd(),
      'uploads',
    );

    let actualPublicUploads =
      publicUploads;

    try {
      actualPublicUploads =
        await realpath(
          publicUploads,
        );
    } catch {
      // Public uploads may not exist.
    }

    if (
      this.isInsideDirectory(
        actualPublicUploads,
        actualDirectory,
      )
    ) {
      throw new ServiceUnavailableException(
        'Private identity storage is incorrectly configured',
      );
    }

    return actualDirectory;
  }

  // ========================================
  // HELPER: DOCUMENT ENCRYPTION KEY
  //
  // Uses the same HKDF derivation
  // as the Guide Document Upload endpoint.
  // ========================================

  private getDocumentKey(): Buffer {
    const secret =
      process.env
        .GUIDE_ID_ENCRYPTION_KEY;

    if (
      !secret ||
      !/^[a-fA-F0-9]{64}$/.test(secret)
    ) {
      throw new ServiceUnavailableException(
        'Guide identity encryption is not configured',
      );
    }

    return Buffer.from(
      hkdfSync(
        'sha256',

        Buffer.from(
          secret,
          'hex',
        ),

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

  // ========================================
  // HELPER: DECRYPT PRIVATE DOCUMENT
  //
  // Return image bytes only after
  // filename, directory and encrypted
  // content validation.
  // ========================================

  private async decryptPrivateDocument(
    filename: string,
    base64Data?: string,
  ): Promise<{
    buffer: Buffer;
    mimeType: string;
  }> {
    let encryptedFile: Buffer;

    if (base64Data) {
      try {
        encryptedFile = Buffer.from(base64Data, 'base64');
      } catch {
        throw new BadRequestException('Invalid stored identity document data');
      }
    } else {
      if (
        typeof filename !== 'string' ||
        !PRIVATE_FILENAME_PATTERN.test(
          filename,
        )
      ) {
        throw new NotFoundException(
          'Identity document not found',
        );
      }

      const directory =
        await this.getPrivateDirectory();

      const filePath =
        join(
          directory,
          filename,
        );

      try {
        const fileInfo =
          await lstat(filePath);

        if (
          !fileInfo.isFile() ||
          fileInfo.isSymbolicLink() ||
          fileInfo.size < 37 ||
          fileInfo.size >
            MAX_ENCRYPTED_FILE_SIZE
        ) {
          throw new Error(
            'Invalid private document',
          );
        }

        const actualFilePath =
          await realpath(
            filePath,
          );

        if (
          !this.isInsideDirectory(
            directory,
            actualFilePath,
          )
        ) {
          throw new Error(
            'Invalid document location',
          );
        }

        encryptedFile =
          await readFile(
            filePath,
          );

        if (
          encryptedFile.length < 37 ||
          encryptedFile.length >
            MAX_ENCRYPTED_FILE_SIZE
        ) {
          throw new Error(
            'Invalid encrypted file size',
          );
        }
      } catch {
        throw new NotFoundException(
          'Identity document file was stored on ephemeral disk of a previous deployment. The guide registration reference is verified in database.',
        );
      }
    }

    // ======================================
    // ENCRYPTED FORMAT:
    //
    // 6 bytes: GVID01
    // 12 bytes: IV
    // 16 bytes: GCM authentication tag
    // Remaining: ciphertext
    // ======================================

    const header =
      encryptedFile
        .subarray(0, 6)
        .toString('utf8');

    if (
      header !== DOCUMENT_HEADER
    ) {
      throw new BadRequestException(
        'Invalid encrypted identity document',
      );
    }

    const iv =
      encryptedFile
        .subarray(6, 18);

    const authenticationTag =
      encryptedFile
        .subarray(18, 34);

    const ciphertext =
      encryptedFile
        .subarray(34);

    const documentKey =
      this.getDocumentKey();

    let decrypted: Buffer;

    try {
      const decipher =
        createDecipheriv(
          'aes-256-gcm',
          documentKey,
          iv,
        );

      decipher.setAuthTag(
        authenticationTag,
      );

      decrypted =
        Buffer.concat([
          decipher.update(
            ciphertext,
          ),
          decipher.final(),
        ]);
    } catch {
      throw new BadRequestException(
        'Identity document verification failed',
      );
    }

    // ======================================
    // DETECT SUPPORTED IMAGE FORMAT
    // ======================================

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
        .equals(
          pngSignature,
        );

    if (isJpeg) {
      return {
        buffer: decrypted,
        mimeType:
          'image/jpeg',
      };
    }

    if (isPng) {
      return {
        buffer: decrypted,
        mimeType:
          'image/png',
      };
    }

    throw new BadRequestException(
      'Unsupported identity image format',
    );
  }

  // ========================================
  // ADMIN: VIEW GUIDE ID DOCUMENT
  //
  // GET:
  // /admin-dashboard/guides/:id/documents/front
  //
  // GET:
  // /admin-dashboard/guides/:id/documents/back
  //
  // Protected by:
  // JwtGuard + AdminGuard
  // ========================================

  @Get('guides/:id/documents/:side')
  @Header(
    'Cache-Control',
    'private, no-store, max-age=0',
  )
  @Header(
    'Pragma',
    'no-cache',
  )
  @Header(
    'X-Content-Type-Options',
    'nosniff',
  )
  async viewGuideDocument(
    @Param('id')
    id: string,

    @Param('side')
    side: string,
  ): Promise<StreamableFile> {
    this.validateGuideId(id);

    if (
      side !== 'front' &&
      side !== 'back'
    ) {
      throw new BadRequestException(
        'Document side must be front or back',
      );
    }

    // Ensure the database model exists.

    if (!this.userModel) {
      throw new ServiceUnavailableException(
        'Guide document review is not configured',
      );
    }

    const guide =
      await this.userModel
        .findOne({
          _id: id,
          role: Role.GUIDE,
        })
        .select(
          '+guideIdFrontPath +guideIdBackPath +guideIdFrontData +guideIdBackData',
        );

    if (!guide) {
      throw new NotFoundException(
        'Tour guide not found',
      );
    }

    const filename =
      side === 'front'
        ? guide.guideIdFrontPath
        : guide.guideIdBackPath;

    const base64Data =
      side === 'front'
        ? (guide as any).guideIdFrontData
        : (guide as any).guideIdBackData;

    if (!filename && !base64Data) {
      throw new NotFoundException(
        'Requested identity document has not been uploaded',
      );
    }

    const {
      buffer,
      mimeType,
    } = await this.decryptPrivateDocument(
      filename || '',
      base64Data,
    );

    // No public URL and no redirect.
    // Stream the decrypted image to
    // this authenticated admin request.

    return new StreamableFile(
      buffer,
      {
        type: mimeType,
        disposition: 'inline',
      },
    );
  }

  // ========================================
  // APPROVE GUIDE
  //
  // Existing route preserved.
  //
  // Service validates consent, identity
  // number and encrypted documents.
  // ========================================

  @Patch('guides/:id/approve')
  approveGuide(
    @Param('id')
    id: string,

    @Req()
    request: AuthenticatedAdminRequest,
  ) {
    this.validateGuideId(id);

    const reviewedBy =
      request.user?.id;

    return this.adminDashboardService
      .approveGuide(
        id,
        reviewedBy,
      );
  }

  // ========================================
  // REJECT GUIDE
  //
  // Existing route preserved.
  // Optional rejection reason supported.
  // ========================================

  @Patch('guides/:id/reject')
  rejectGuide(
    @Param('id')
    id: string,

    @Body('reason')
    reason: string | undefined,

    @Req()
    request: AuthenticatedAdminRequest,
  ) {
    this.validateGuideId(id);

    const reviewedBy =
      request.user?.id;

    return this.adminDashboardService
      .rejectGuide(
        id,
        reason ?? '',
        reviewedBy,
      );
  }

  /* =========================
     VEHICLE PRICING SETTINGS
  ========================= */

  @Get('settings/vehicle-pricing')
  getVehiclePricing() {
    return this.adminDashboardService.getVehiclePricing();
  }

  @Patch('settings/vehicle-pricing')
  @UseGuards(
    JwtGuard,
    AdminGuard,
  )
  updateVehiclePricing(
    @Body()
    body: {
      pricePerKm?: number;
      carRatePerKm?: number;
      vanRatePerKm?: number;
      busRatePerKm?: number;
    },
  ) {
    return this.adminDashboardService.updateVehiclePricing(body);
  }

}
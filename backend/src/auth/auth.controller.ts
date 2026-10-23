
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
  UnauthorizedException,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';

import {
  FileFieldsInterceptor,
} from '@nestjs/platform-express';

import {
  memoryStorage,
} from 'multer';

import * as bcrypt from 'bcrypt';

import {
  createCipheriv,
  hkdfSync,
  randomBytes,
  randomUUID,
} from 'crypto';

import {
  mkdir,
  realpath,
  unlink,
  writeFile,
} from 'fs/promises';

import {
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from 'path';

import {
  AuthService,
} from './auth.service';

import {
  UsersService,
} from '../users/users.service';

import {
  LoginDto,
} from './dto/login.dto';

import {
  RegisterDto,
} from './dto/register.dto';

import {
  GovernmentIdType,
  GuideStatus,
  Role,
} from '../users/schemas/user.schema';

// ==========================================
// GUIDE DOCUMENT CONFIGURATION
// ==========================================

const MAX_DOCUMENT_SIZE =
  5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
];

// ==========================================
// AUTH CONTROLLER
// ==========================================

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService:
      AuthService,

    private readonly usersService:
      UsersService,
  ) {}

  // ========================================
  // REGISTER
  //
  // Existing Traveller and Guide
  // registration functionality preserved.
  // ========================================

  @Post('register')
  register(
    @Body()
    body: RegisterDto,
  ) {
    return this.authService.register(
      body,
    );
  }

  // ========================================
  // LOGIN
  //
  // Existing login functionality preserved.
  // ========================================

  @Post('login')
  login(
    @Body()
    body: LoginDto,
  ) {
    return this.authService.login(
      body.email,
      body.password,
    );
  }

  // ========================================
  // VALIDATE IMAGE CONTENT
  // ========================================

  private validateImage(
    file: Express.Multer.File,
  ): void {
    if (
      !file ||
      !Buffer.isBuffer(file.buffer) ||
      file.buffer.length === 0
    ) {
      throw new BadRequestException(
        'Invalid identity image',
      );
    }

    if (
      file.size > MAX_DOCUMENT_SIZE
    ) {
      throw new BadRequestException(
        'Image must not exceed 5 MB',
      );
    }

    const isJpeg =
      file.buffer.length >= 3 &&
      file.buffer[0] === 0xff &&
      file.buffer[1] === 0xd8 &&
      file.buffer[2] === 0xff;

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
      file.buffer.length >= 8 &&
      file.buffer
        .subarray(0, 8)
        .equals(pngSignature);

    if (
      !isJpeg &&
      !isPng
    ) {
      throw new BadRequestException(
        'Only valid JPEG or PNG images are allowed',
      );
    }

    if (
      file.mimetype === 'image/jpeg' &&
      !isJpeg
    ) {
      throw new BadRequestException(
        'JPEG file content is invalid',
      );
    }

    if (
      file.mimetype === 'image/png' &&
      !isPng
    ) {
      throw new BadRequestException(
        'PNG file content is invalid',
      );
    }

    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.mimetype,
      )
    ) {
      throw new BadRequestException(
        'Unsupported image type',
      );
    }
  }

  // ========================================
  // PRIVATE DOCUMENT DIRECTORY
  //
  // Identity documents must never be
  // stored in publicly served /uploads.
  // ========================================

  private async getPrivateDirectory():
    Promise<string> {
    const configuredDirectory =
      process.env
        .GUIDE_PRIVATE_UPLOAD_DIR;

    const privateDirectory =
      resolve(
        configuredDirectory ||
          join(
            process.cwd(),
            'private-data',
            'guide-ids',
          ),
      );

    await mkdir(
      privateDirectory,
      {
        recursive: true,
        mode: 0o700,
      },
    );

    const actualPrivateDirectory =
      await realpath(
        privateDirectory,
      );

    const publicUploadsDirectory =
      resolve(
        process.cwd(),
        'uploads',
      );

    let actualPublicDirectory =
      publicUploadsDirectory;

    try {
      actualPublicDirectory =
        await realpath(
          publicUploadsDirectory,
        );
    } catch {
      // Public folder may not exist yet.
    }

    const relativePath =
      relative(
        actualPublicDirectory,
        actualPrivateDirectory,
      );

    const isInsidePublicUploads =
      relativePath === '' ||
      (
        relativePath !== '..' &&
        !relativePath.startsWith(
          `..${sep}`,
        ) &&
        !isAbsolute(relativePath)
      );

    if (isInsidePublicUploads) {
      throw new InternalServerErrorException(
        'Private identity documents cannot be stored inside public uploads',
      );
    }

    return actualPrivateDirectory;
  }

  // ========================================
  // ENCRYPT DOCUMENT IMAGE
  //
  // AES-256-GCM
  //
  // Stored binary format:
  // GVID01 + IV + AUTH TAG + CIPHERTEXT
  //
  // Uses a derived document-specific key.
  // ========================================

  private encryptDocument(
    buffer: Buffer,
  ): Buffer {
    const secret =
      process.env
        .GUIDE_ID_ENCRYPTION_KEY;

    if (
      !secret ||
      !/^[a-fA-F0-9]{64}$/.test(secret)
    ) {
      throw new InternalServerErrorException(
        'Guide document encryption is not configured',
      );
    }

    const documentKey =
      Buffer.from(
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

    const iv =
      randomBytes(12);

    const cipher =
      createCipheriv(
        'aes-256-gcm',
        documentKey,
        iv,
      );

    const encrypted =
      Buffer.concat([
        cipher.update(buffer),
        cipher.final(),
      ]);

    const authenticationTag =
      cipher.getAuthTag();

    return Buffer.concat([
      Buffer.from('GVID01'),
      iv,
      authenticationTag,
      encrypted,
    ]);
  }

  // ========================================
  // SAVE ENCRYPTED DOCUMENT
  // ========================================

  private async savePrivateFile(
    file: Express.Multer.File,
    directory: string,
  ): Promise<string> {
    this.validateImage(file);

    const encrypted =
      this.encryptDocument(
        file.buffer,
      );

    const filename =
      `${randomUUID()}.gvid`;

    const absolutePath =
      join(
        directory,
        filename,
      );

    await writeFile(
      absolutePath,
      encrypted,
      {
        flag: 'wx',
        mode: 0o600,
      },
    );

    // Store only the random filename
    // in MongoDB, not a public URL.

    return filename;
  }

  // ========================================
  // GUIDE IDENTITY DOCUMENT UPLOAD
  //
  // POST /auth/guide/documents
  //
  // Email and password required because
  // pending guides cannot receive a JWT.
  // ========================================

  @Post('guide/documents')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        {
          name: 'idFront',
          maxCount: 1,
        },
        {
          name: 'idBack',
          maxCount: 1,
        },
      ],
      {
        storage: memoryStorage(),

        limits: {
          fileSize:
            MAX_DOCUMENT_SIZE,

          files: 2,

          fields: 2,

          parts: 4,
        },

        // ==================================
        // MULTER FILE FILTER
        //
        // FIX:
        // callback(error, acceptFile)
        //
        // Both arguments are required.
        // ==================================

        fileFilter: (
          _request,
          file,
          callback,
        ) => {
          if (
            !ALLOWED_IMAGE_TYPES.includes(
              file.mimetype,
            )
          ) {
            return callback(
              new BadRequestException(
                'Only JPEG and PNG images are allowed',
              ),
              false,
            );
          }

          callback(
            null,
            true,
          );
        },
      },
    ),
  )
  async uploadGuideDocuments(
    @Body('email')
    email: string,

    @Body('password')
    password: string,

    @UploadedFiles()
    files: {
      idFront?:
        Express.Multer.File[];

      idBack?:
        Express.Multer.File[];
    },
  ) {
    // ======================================
    // VALIDATE EMAIL AND PASSWORD INPUT
    // ======================================

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      throw new BadRequestException(
        'Email and password are required',
      );
    }

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    // ======================================
    // FIND REGISTERED USER
    // ======================================

    const user =
      await this.usersService
        .findByEmail(
          normalizedEmail,
        );

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    // ======================================
    // VERIFY PASSWORD
    // ======================================

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password,
      );

    if (!passwordMatches) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    // ======================================
    // TOUR GUIDE ONLY
    // ======================================

    if (
      user.role !== Role.GUIDE
    ) {
      throw new ForbiddenException(
        'Only tour guides can upload identity documents',
      );
    }

    // ======================================
    // ONLY PENDING GUIDES MAY UPLOAD
    //
    // Prevent approved guides from
    // resetting their account status.
    // ======================================

    if (
      user.guideStatus !==
      GuideStatus.PENDING
    ) {
      throw new ForbiddenException(
        'Identity documents can only be submitted while your guide application is pending',
      );
    }

    // ======================================
    // VERIFY ID DOCUMENT TYPE
    // ======================================

    if (
      user.governmentIdType !==
        GovernmentIdType.NIC &&
      user.governmentIdType !==
        GovernmentIdType.PASSPORT
    ) {
      throw new BadRequestException(
        'Valid guide identity type is required',
      );
    }

    // ======================================
    // GET UPLOADED IMAGES
    // ======================================

    const frontFile =
      files?.idFront?.[0];

    const backFile =
      files?.idBack?.[0];

    if (!frontFile) {
      throw new BadRequestException(
        'Identity document front image is required',
      );
    }

    // NIC requires two images.
    // Passport photo page requires one.

    if (
      user.governmentIdType ===
        GovernmentIdType.NIC &&
      !backFile
    ) {
      throw new BadRequestException(
        'NIC front and back images are required',
      );
    }

    // ======================================
    // VALIDATE IMAGE CONTENT
    // ======================================

    this.validateImage(
      frontFile,
    );

    if (backFile) {
      this.validateImage(
        backFile,
      );
    }

    // ======================================
    // PREPARE PRIVATE STORAGE
    // ======================================

    const directory =
      await this.getPrivateDirectory();

    const createdFiles:
      string[] = [];

    try {
      // ====================================
      // SAVE FRONT IMAGE
      // ====================================

      const frontFilename =
        await this.savePrivateFile(
          frontFile,
          directory,
        );

      createdFiles.push(
        frontFilename,
      );

      // ====================================
      // SAVE BACK IMAGE IF PROVIDED
      // ====================================

      let backFilename:
        string | undefined;

      if (backFile) {
        backFilename =
          await this.savePrivateFile(
            backFile,
            directory,
          );

        createdFiles.push(
          backFilename,
        );
      }

      // ====================================
      // SAVE DOCUMENT REFERENCES
      // ====================================

      const encryptedFront = this.encryptDocument(frontFile.buffer);
      user.guideIdFrontPath = frontFilename;
      user.guideIdFrontData = encryptedFront.toString('base64');

      // Clear previous back reference
      // for single-page passport uploads.

      user.guideIdBackPath = backFilename;
      if (backFile) {
        const encryptedBack = this.encryptDocument(backFile.buffer);
        user.guideIdBackData = encryptedBack.toString('base64');
      } else {
        user.guideIdBackData = undefined;
      }

      // Keep application pending until
      // manual admin verification.

      user.guideStatus =
        GuideStatus.PENDING;

      user.guideReviewedAt =
        null;

      user.guideReviewedBy =
        '';

      user.guideReviewReason =
        '';

      await user.save();

      // ====================================
      // SUCCESS RESPONSE
      //
      // Never return original image data,
      // filesystem paths, or ID numbers.
      // ====================================

      return {
        success: true,

        message:
          'Identity documents uploaded securely. Your guide application is awaiting admin review.',

        guideStatus:
          GuideStatus.PENDING,

        documents: {
          frontUploaded: true,

          backUploaded:
            Boolean(backFilename),
        },
      };
    } catch (error) {
      // ====================================
      // CLEAN UP NEW FILES ON FAILURE
      // ====================================

      for (
        const filename of createdFiles
      ) {
        try {
          await unlink(
            join(
              directory,
              filename,
            ),
          );
        } catch {
          // Keep the original error.
        }
      }

      throw error;
    }
  }
}

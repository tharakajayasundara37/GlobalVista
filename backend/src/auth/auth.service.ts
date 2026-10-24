
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

import {
  JwtService,
} from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import {
  createCipheriv,
  randomBytes,
  randomInt,
  randomUUID,
} from 'crypto';

import {
  RegisterDto,
} from './dto/register.dto';

import {
  UsersService,
} from '../users/users.service';

import {
  GuideStatus,
  GovernmentIdType,
  Role,
} from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService:
      UsersService,

    private readonly jwtService:
      JwtService,
  ) {}

  // ==========================================
  // SECURE PUBLIC ID GENERATOR
  // ==========================================

  private async generatePublicId(
    role: Role,
  ): Promise<string> {
    const prefix =
      role === Role.GUIDE
        ? 'GVG'
        : 'GVU';

    const characters =
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    for (
      let attempt = 0;
      attempt < 10;
      attempt++
    ) {
      let code = '';

      for (
        let index = 0;
        index < 6;
        index++
      ) {
        const position = randomInt(
          characters.length,
        );

        code += characters[position];
      }

      const publicId =
        `${prefix}-${code}`;

      const existing =
        await this.usersService
          .findByPublicId(publicId);

      if (!existing) {
        return publicId;
      }
    }

    throw new InternalServerErrorException(
      'Unable to generate account ID',
    );
  }

  // ==========================================
  // ENCRYPT GUIDE NIC / PASSPORT NUMBER
  //
  // AES-256-GCM
  //
  // Environment variable required:
  // GUIDE_ID_ENCRYPTION_KEY
  //
  // Must be exactly 64 hexadecimal characters
  // representing 32 random bytes.
  // ==========================================

  private encryptGovernmentId(
    value: string,
  ): string {
    const keyHex =
      process.env.GUIDE_ID_ENCRYPTION_KEY;

    if (
      !keyHex ||
      !/^[a-fA-F0-9]{64}$/.test(keyHex)
    ) {
      throw new ServiceUnavailableException(
        'Guide identity encryption is not configured',
      );
    }

    const encryptionKey =
      Buffer.from(keyHex, 'hex');

    const iv = randomBytes(12);

    const cipher = createCipheriv(
      'aes-256-gcm',
      encryptionKey,
      iv,
    );

    const encrypted = Buffer.concat([
      cipher.update(
        value,
        'utf8',
      ),
      cipher.final(),
    ]);

    const authTag =
      cipher.getAuthTag();

    return [
      'v1',
      iv.toString('hex'),
      authTag.toString('hex'),
      encrypted.toString('hex'),
    ].join(':');
  }

  // ==========================================
  // GUIDE REGISTRATION VALIDATION
  // ==========================================

  private validateGuideDetails(
    data: RegisterDto,
  ): void {
    if (
      !data.city ||
      !data.city.trim()
    ) {
      throw new BadRequestException(
        'Guide city is required',
      );
    }

    if (
      !Array.isArray(data.languages) ||
      data.languages.length === 0
    ) {
      throw new BadRequestException(
        'At least one language is required',
      );
    }

    if (
      !data.languages.every(
        (language) =>
          typeof language === 'string' &&
          language.trim().length > 0,
      )
    ) {
      throw new BadRequestException(
        'Invalid guide languages',
      );
    }

    if (
      !Number.isInteger(
        data.experienceYears,
      ) ||
      Number(data.experienceYears) < 0 ||
      Number(data.experienceYears) > 80
    ) {
      throw new BadRequestException(
        'Valid guide experience is required',
      );
    }

    if (
      data.governmentIdType !==
        GovernmentIdType.NIC &&
      data.governmentIdType !==
        GovernmentIdType.PASSPORT
    ) {
      throw new BadRequestException(
        'NIC or Passport is required',
      );
    }

    if (
      !data.governmentIdNumber ||
      data.governmentIdNumber.trim().length < 4
    ) {
      throw new BadRequestException(
        'Valid NIC or Passport number is required',
      );
    }

    if (
      !data.about ||
      data.about.trim().length < 20
    ) {
      throw new BadRequestException(
        'Guide biography must contain at least 20 characters',
      );
    }

    if (
      data.acceptGuideTerms !== true
    ) {
      throw new BadRequestException(
        'Please accept guide terms and privacy policy',
      );
    }
  }

  // ==========================================
  // REGISTER
  // ==========================================

  async register(
    data: RegisterDto,
  ) {
    // Public registration supports only
    // Traveller or Guide accounts.
    // ADMIN accounts cannot self-register.

    if (
      data.role !== Role.USER &&
      data.role !== Role.GUIDE
    ) {
      throw new BadRequestException(
        'Invalid registration role',
      );
    }

    const email =
      data.email.trim().toLowerCase();

    const existingUser =
      await this.usersService
        .findByEmail(email);

    if (existingUser) {
      throw new ConflictException(
        'Email already exists',
      );
    }

    // Validate guide-specific information
    // before creating the account.

    if (data.role === Role.GUIDE) {
      this.validateGuideDetails(data);
    }

    const hashedPassword =
      await bcrypt.hash(
        data.password,
        12,
      );

    const publicId =
      await this.generatePublicId(
        data.role,
      );

    const userData: Record<
      string,
      unknown
    > = {
      publicId,

      name:
        data.name.trim(),

      email,

      password:
        hashedPassword,

      country:
        data.country.trim(),

      mobile:
        data.mobile.trim(),

      role:
        data.role,

      guideStatus:
        data.role === Role.GUIDE
          ? GuideStatus.PENDING
          : null,

      emailVerified:
        false,

      profileImage:
        '',
    };

    // ========================================
    // GUIDE-SPECIFIC INFORMATION
    // ========================================

    if (data.role === Role.GUIDE) {
      userData.city =
        data.city!.trim();

      userData.languages =
        data.languages!.map(
          (language) =>
            language.trim(),
        );

      userData.experienceYears =
        Number(
          data.experienceYears,
        );

      userData.governmentIdType =
        data.governmentIdType;

      // Never store raw NIC/Passport
      // numbers in the database.

      userData.governmentIdNumber =
        this.encryptGovernmentId(
          data.governmentIdNumber!
            .trim()
            .toUpperCase(),
        );

      userData.vehicleType = data.vehicleType ? (data.vehicleType.toUpperCase() as any) : null;
      userData.vehicleNumber = data.vehicleNumber ? data.vehicleNumber.trim().toUpperCase() : '';

      if (data.idFrontData) {
        userData.guideIdFrontData = data.idFrontData;
        userData.guideIdFrontPath = `${randomUUID()}.gvid`;
      }
      if (data.idBackData) {
        userData.guideIdBackData = data.idBackData;
        userData.guideIdBackPath = `${randomUUID()}.gvid`;
      }

      userData.about =
        data.about!.trim();

      userData.guideTermsAcceptedAt =
        new Date();

      userData.guideReviewReason =
        '';

      userData.guideReviewedAt =
        null;

      userData.guideReviewedBy =
        '';
    }

    // ========================================
    // CREATE ACCOUNT
    // ========================================

    let user;

    try {
      user =
        await this.usersService
          .create(userData);
    } catch (error: unknown) {
      // Handle database unique-index conflicts
      // even when two requests arrive together.

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

    // ========================================
    // GUIDE ACCOUNT
    //
    // Do not issue JWT at registration.
    // Login requires admin approval.
    // ========================================

    if (
      user.role === Role.GUIDE
    ) {
      return {
        message:
          'Your tour guide application has been submitted and is awaiting admin approval.',

        requiresApproval:
          true,

        user: {
          id:
            String(user._id),

          publicId:
            user.publicId,

          name:
            user.name,

          email:
            user.email,

          country:
            user.country,

          mobile:
            user.mobile,

          role:
            user.role,

          guideStatus:
            user.guideStatus,
        },
      };
    }

    // ========================================
    // TRAVELLER REGISTRATION
    //
    // Preserve existing direct-login flow.
    // ========================================

    const token =
      this.jwtService.sign({
        sub:
          String(user._id),

        publicId:
          user.publicId,

        email:
          user.email,

        role:
          user.role,
      });

    return {
      message:
        'Account created successfully',

      access_token:
        token,

      user: {
        id:
          String(user._id),

        publicId:
          user.publicId,

        name:
          user.name,

        email:
          user.email,

        country:
          user.country,

        mobile:
          user.mobile,

        role:
          user.role,
      },
    };
  }

  // ==========================================
  // LOGIN
  // ==========================================

  async login(
    email: string,
    password: string,
  ) {
    const normalizedEmail =
      email.trim().toLowerCase();

    const user =
      await this.usersService
        .findByEmail(
          normalizedEmail,
        );

    // Do not reveal whether
    // the email address exists.

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password,
      );

    if (!passwordMatch) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    // ========================================
    // TOUR GUIDE APPROVAL CHECK
    // ========================================

    if (
      user.role === Role.GUIDE
    ) {
      if (
        user.guideStatus ===
        GuideStatus.PENDING
      ) {
        throw new ForbiddenException(
          'Your tour guide account is awaiting admin approval.',
        );
      }

      if (
        user.guideStatus ===
        GuideStatus.REJECTED
      ) {
        throw new ForbiddenException(
          'Your tour guide application was rejected.',
        );
      }

      if (
        user.guideStatus ===
        GuideStatus.SUSPENDED
      ) {
        throw new ForbiddenException(
          'Your tour guide account has been suspended.',
        );
      }

      if (
        user.guideStatus !==
        GuideStatus.APPROVED
      ) {
        throw new ForbiddenException(
          'Your tour guide account is not approved.',
        );
      }
    }

    // ========================================
    // GENERATE AUTHENTICATION TOKEN
    // ========================================

    const token =
      this.jwtService.sign({
        sub:
          String(user._id),

        publicId:
          user.publicId,

        email:
          user.email,

        role:
          user.role,
      });

    return {
      message:
        'Login successful',

      access_token:
        token,

      user: {
        id:
          String(user._id),

        publicId:
          user.publicId,

        name:
          user.name,

        email:
          user.email,

        country:
          user.country,

        mobile:
          user.mobile,

        role:
          user.role,

        guideStatus:
          user.guideStatus,

        profileImage:
          user.profileImage || '',
      },
    };
  }
}

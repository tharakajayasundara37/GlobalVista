
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  Equals,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  Validate,
  ValidateIf,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

import {
  Type,
} from 'class-transformer';

import {
  GovernmentIdType,
  Role,
} from '../../users/schemas/user.schema';

// ============================================
// GUIDE PASSWORD SECURITY VALIDATION
// ============================================

@ValidatorConstraint({
  name: 'StrongGuidePassword',
  async: false,
})
export class StrongGuidePasswordValidator
  implements ValidatorConstraintInterface
{
  validate(
    password: unknown,
    args: ValidationArguments,
  ): boolean {
    const registration =
      args.object as RegisterDto;

    // Preserve existing Traveller password rules.
    if (registration.role !== Role.GUIDE) {
      return true;
    }

    if (typeof password !== 'string') {
      return false;
    }

    // Guide passwords require:
    // 10+ characters
    // Uppercase, lowercase, number, special character
    return (
      password.length >= 10 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  }

  defaultMessage(): string {
    return (
      'Guide password must contain at least ' +
      '10 characters, including uppercase, ' +
      'lowercase, number and special character'
    );
  }
}

// ============================================
// GLOBALVISTA REGISTRATION DTO
// ============================================

export class RegisterDto {

  // ==========================================
  // FULL NAME
  // ==========================================

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  // ==========================================
  // EMAIL ADDRESS
  // ==========================================

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  email: string;

  // ==========================================
  // PASSWORD
  // ==========================================

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  @Validate(StrongGuidePasswordValidator)
  password: string;

  // ==========================================
  // COUNTRY
  // ==========================================

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;

  // ==========================================
  // MOBILE NUMBER
  // ==========================================

  @IsString()
  @IsNotEmpty()
  @MinLength(7)
  @MaxLength(30)
  mobile: string;

  // ==========================================
  // ACCOUNT ROLE
  // Only USER or GUIDE can self-register.
  // Never allow public ADMIN registration.
  // ==========================================

  @IsIn([
    Role.USER,
    Role.GUIDE,
  ])
  role: Role;

  // ==========================================
  // GUIDE ONLY - CITY
  // ==========================================

  @ValidateIf(
    (data: RegisterDto) =>
      data.role === Role.GUIDE,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city?: string;

  // ==========================================
  // GUIDE ONLY - SPOKEN LANGUAGES
  // ==========================================

  @ValidateIf(
    (data: RegisterDto) =>
      data.role === Role.GUIDE,
  )
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(15)
  @ArrayUnique()
  @IsString({
    each: true,
  })
  @IsNotEmpty({
    each: true,
  })
  @MaxLength(50, {
    each: true,
  })
  languages?: string[];

  // ==========================================
  // GUIDE ONLY - EXPERIENCE
  // ==========================================

  @ValidateIf(
    (data: RegisterDto) =>
      data.role === Role.GUIDE,
  )
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(80)
  experienceYears?: number;

  // ==========================================
  // GUIDE ONLY - GOVERNMENT ID TYPE
  // NIC OR PASSPORT
  // ==========================================

  @ValidateIf(
    (data: RegisterDto) =>
      data.role === Role.GUIDE,
  )
  @IsIn([
    GovernmentIdType.NIC,
    GovernmentIdType.PASSPORT,
  ])
  governmentIdType?: GovernmentIdType;

  // ==========================================
  // GUIDE ONLY - GOVERNMENT ID NUMBER
  // Sensitive personal information.
  // Must be encrypted in backend service.
  // ==========================================

  @ValidateIf(
    (data: RegisterDto) =>
      data.role === Role.GUIDE,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(40)
  governmentIdNumber?: string;

  // ==========================================
  // GUIDE ONLY - ABOUT / BIO
  // ==========================================

  @ValidateIf(
    (data: RegisterDto) =>
      data.role === Role.GUIDE,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(2000)
  about?: string;

  // ==========================================
  // GUIDE ONLY - TERMS & PRIVACY CONSENT
  // Must be explicitly accepted.
  // ==========================================

  @ValidateIf(
    (data: RegisterDto) =>
      data.role === Role.GUIDE,
  )
  @Equals(true, {
    message:
      'Guide registration requires acceptance ' +
      'of terms and privacy policy',
  })
  acceptGuideTerms?: boolean;

  // ==========================================
  // GUIDE VEHICLE TYPE (CAR, VAN, BUS)
  // ==========================================
  @IsOptional()
  @IsIn(['CAR', 'VAN', 'BUS'])
  vehicleType?: string;

  // ==========================================
  // GUIDE VEHICLE NUMBER PLATE
  // ==========================================
  @IsOptional()
  @IsString()
  @MaxLength(30)
  vehicleNumber?: string;

}

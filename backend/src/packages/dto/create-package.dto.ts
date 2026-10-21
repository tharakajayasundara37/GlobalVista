
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import {
  Type,
} from 'class-transformer';

import {
  AddOnPricingType,
} from '../schemas/package.schema';

/* =========================
   PACKAGE ADD-ON DTO
========================= */

export class CreatePackageAddOnDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsEnum(AddOnPricingType)
  pricingType: AddOnPricingType;
}

/* =========================
   CREATE PACKAGE DTO
========================= */

export class CreatePackageDto {
  @IsString()
  title: string;

  /* =========================
     DESTINATION LINK

     Optional to preserve
     existing packages.
  ========================= */

  @IsOptional()
  @IsMongoId()
  destinationId?: string;

  @IsString()
  destination: string;

  @IsString()
  country: string;

  @IsString()
  duration: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  category: string;

  @IsString()
  description: string;

  /* =========================
     FREE INCLUDED ITEMS
     Maximum 6
  ========================= */

  @IsArray()
  @ArrayMaxSize(6, {
    message:
      'You can select a maximum of 6 free included items',
  })
  @IsString({ each: true })
  included: string[];

  /* =========================
     PAID OPTIONAL ADD-ONS
  ========================= */

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePackageAddOnDto)
  addOns: CreatePackageAddOnDto[];

  /* =========================
     PACKAGE IMAGES
  ========================= */

  @IsArray()
  @IsString({ each: true })
  images: string[];

  /* =========================
     AVAILABILITY
  ========================= */

  @IsBoolean()
  availability: boolean;

  /* =========================
     SPECIAL OFFER
  ========================= */

  @IsOptional()
  @IsBoolean()
  isSpecialOffer?: boolean;

  /* =========================
     ORIGINAL PRICE
  ========================= */

  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  /* =========================
     DISCOUNT PERCENTAGE
  ========================= */

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;
}

/* =========================
   UPDATE PACKAGE DTO
========================= */

export class UpdatePackageDto {
  @IsOptional()
  @IsString()
  title?: string;

  /* =========================
     UPDATE DESTINATION LINK
  ========================= */

  @IsOptional()
  @IsMongoId()
  destinationId?: string;

  @IsOptional()
  @IsString()
  destination?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  /* =========================
     FREE INCLUDED ITEMS
  ========================= */

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6, {
    message:
      'You can select a maximum of 6 free included items',
  })
  @IsString({ each: true })
  included?: string[];

  /* =========================
     PAID OPTIONAL ADD-ONS
  ========================= */

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePackageAddOnDto)
  addOns?: CreatePackageAddOnDto[];

  /* =========================
     PACKAGE IMAGES
  ========================= */

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  /* =========================
     AVAILABILITY
  ========================= */

  @IsOptional()
  @IsBoolean()
  availability?: boolean;

  /* =========================
     SPECIAL OFFER
  ========================= */

  @IsOptional()
  @IsBoolean()
  isSpecialOffer?: boolean;

  /* =========================
     ORIGINAL PRICE
  ========================= */

  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  /* =========================
     DISCOUNT PERCENTAGE
  ========================= */

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;
}

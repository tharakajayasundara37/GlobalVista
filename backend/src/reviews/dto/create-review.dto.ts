import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @IsMongoId()
  bookingId: string;

  @IsMongoId()
  packageId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  comment: string;
}
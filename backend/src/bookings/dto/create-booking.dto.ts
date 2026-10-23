import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @IsMongoId()
  @IsNotEmpty()
  packageId: string;

  /*
   * Selected travel plan:
   * Basic / Premium / Luxury
   *
   * Frontend sends only the ID.
   * Price is loaded from database
   * in backend.
   */
  @IsMongoId()
  @IsNotEmpty()
  travelPlanId: string;

  /*
   * Travel date format:
   * YYYY-MM-DD
   */
  @IsString()
  @Matches(
    /^\d{4}-\d{2}-\d{2}$/,
    {
      message:
        'travelDate must be in YYYY-MM-DD format',
    },
  )
  travelDate: string;

  @IsInt()
  @Min(1)
  @Max(20)
  numberOfPeople: number;

  /*
   * Optional package add-ons.
   */
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(20)
  @IsMongoId({
    each: true,
  })
  selectedAddOnIds?: string[];

  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @IsOptional()
  @IsMongoId()
  assignedGuideId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  distanceKm?: number;

}
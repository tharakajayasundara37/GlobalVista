import {
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @IsOptional()
  @IsString()
  bankReference?: string;

  @IsOptional()
  @IsString()
  slipUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}

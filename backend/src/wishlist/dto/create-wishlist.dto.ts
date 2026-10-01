import {
  IsNotEmpty,
  IsString
} from 'class-validator';


export class CreateWishlistDto {

  @IsNotEmpty()
  @IsString()
  packageId: string;

}
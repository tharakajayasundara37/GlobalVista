import {
  IsString,
  IsNumber,
  IsNotEmpty,
  Min
} from 'class-validator';

export class CreateBookingDto {


@IsString()
@IsNotEmpty()
userId:string;

@IsString()
@IsNotEmpty()
packageId:string;

@IsString()
@IsNotEmpty()
travelDate:string;

@IsNumber()
@Min(1)
numberOfPeople:number;

@IsNumber()
@Min(0)
totalPrice:number;

}
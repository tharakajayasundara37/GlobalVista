import {
  IsString,
  IsNumber,
  IsNotEmpty,
  Min
} from 'class-validator';



export class CreatePaymentDto {



@IsString()
@IsNotEmpty()
bookingId:string;



@IsString()
@IsNotEmpty()
userId:string;



@IsNumber()
@Min(0)
amount:number;



@IsString()
@IsNotEmpty()
paymentMethod:string;



@IsString()
@IsNotEmpty()
transactionId:string;



}
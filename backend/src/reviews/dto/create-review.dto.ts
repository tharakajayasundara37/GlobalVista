import {
  IsString,
  IsNumber,
  IsNotEmpty,
  Min,
  Max
} from 'class-validator';



export class CreateReviewDto {



@IsString()
@IsNotEmpty()
userId:string;



@IsString()
@IsNotEmpty()
packageId:string;



@IsNumber()
@Min(1)
@Max(5)
rating:number;



@IsString()
@IsNotEmpty()
comment:string;



}
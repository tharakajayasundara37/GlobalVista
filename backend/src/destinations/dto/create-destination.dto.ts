import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsNumber,
  IsOptional
} from 'class-validator';


export class CreateDestinationDto {


@IsNotEmpty()
@IsString()
name:string;


@IsNotEmpty()
@IsString()
country:string;


@IsOptional()
@IsString()
description:string;


@IsOptional()
@IsArray()
images:string[];


@IsOptional()
@IsNumber()
rating:number;


@IsOptional()
@IsString()
bestTimeToVisit:string;


@IsOptional()
@IsArray()
activities:string[];


@IsOptional()
@IsString()
budget:string;


}
import {
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  IsOptional,
  Min,
  Max
} from 'class-validator';



export class CreatePackageDto {



@IsString()
title:string;



@IsString()
destination:string;



@IsString()
country:string;



@IsString()
duration:string;



@IsNumber()
@Min(0)
price:number;



@IsString()
category:string;



@IsString()
description:string;



@IsArray()
@IsString({
  each:true
})
included:string[];



@IsArray()
@IsString({
  each:true
})
images:string[];



@IsBoolean()
availability:boolean;



@IsNumber()
@Min(0)
@Max(5)
rating:number;



}
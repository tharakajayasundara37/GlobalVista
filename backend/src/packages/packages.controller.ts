import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards
} from '@nestjs/common';


import { PackagesService } from './packages.service';


import { CreatePackageDto } from './dto/create-package.dto';


import { JwtGuard } from '../auth/jwt.guard';

import { AdminGuard } from '../auth/admin.guard';



@Controller('packages')
export class PackagesController {



constructor(
 private packagesService: PackagesService
){}




@Post()
@UseGuards(JwtGuard, AdminGuard)
create(
 @Body() body:CreatePackageDto
){

 return this.packagesService.create(body);

}





@Get()
findAll(
 @Query() query:any
){

 return this.packagesService.findAll(query);

}





@Get(':id')
findOne(
 @Param('id') id:string
){

 return this.packagesService.findOne(id);

}





@Patch(':id')
@UseGuards(JwtGuard, AdminGuard)
update(
 @Param('id') id:string,

 @Body() body:any
){

 return this.packagesService.update(
  id,
  body
 );

}





@Delete(':id')
@UseGuards(JwtGuard, AdminGuard)
remove(
 @Param('id') id:string
){

 return this.packagesService.remove(id);

}



}
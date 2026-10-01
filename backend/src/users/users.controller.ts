import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards
} from '@nestjs/common';

import { UsersService } from './users.service';

import { JwtGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../auth/admin.guard';


@Controller('users')
export class UsersController {


constructor(
 private usersService:UsersService
){}


// Get All Users (ADMIN)

@Get()
@UseGuards(JwtGuard, AdminGuard)
findAll(){

 return this.usersService.findAll();

}



// Get Single User (ADMIN)

@Get(':id')
@UseGuards(JwtGuard, AdminGuard)
findOne(
 @Param('id') id:string
){

 return this.usersService.findOne(id);

}



// Delete User (ADMIN)

@Delete(':id')
@UseGuards(JwtGuard, AdminGuard)
remove(
 @Param('id') id:string
){

 return this.usersService.remove(id);

}


}
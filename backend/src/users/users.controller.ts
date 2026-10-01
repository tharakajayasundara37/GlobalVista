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
@UseGuards(JwtGuard, AdminGuard)
export class UsersController {
  constructor(
    private usersService: UsersService
  ) {}

  // Get All Users
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // Get Single User
  @Get(':id')
  findOne(
    @Param('id') id: string
  ) {
    return this.usersService.findOne(id);
  }

  // Delete User
  @Delete(':id')
  remove(
    @Param('id') id: string
  ) {
    return this.usersService.remove(id);
  }
}
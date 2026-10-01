import {
  Injectable,
  BadRequestException,
  UnauthorizedException
} from '@nestjs/common';

import { UsersService } from '../users/users.service';

import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
constructor(
  private usersService: UsersService,
  private jwtService: JwtService
){}
// REGISTER
async register(data:any){
  const existingUser =
  await this.usersService.findByEmail(
      data.email
  );
  if(existingUser){
      throw new BadRequestException(
          "Email already exists"
      );
  }
  const hashedPassword =
  await bcrypt.hash(
      data.password,
      10
  );
  const user =
  await this.usersService.create({
      name:data.name,
      email:data.email,
      password:hashedPassword,
      country:data.country,
      role:data.role || "USER"
  });
  return {
      message:"User registered successfully",
      user:{
          id:user._id,
          name:user.name,
          email:user.email,
          country:user.country,
          role:user.role
      }
  };

}
// LOGIN
async login(
  email:string,
  password:string
){
  const user =
  await this.usersService.findByEmail(
      email
  );
  if(!user){
      throw new UnauthorizedException(
          "User not found"
      );
  }
  const passwordMatch =
  await bcrypt.compare(
      password,
      user.password
  );
  if(!passwordMatch){
      throw new UnauthorizedException(
          "Invalid password"
      );
  }
  const token =
  this.jwtService.sign({
      sub:user._id,
      email:user.email,
      role:user.role
  });
  return {
      message:"Login successful",
      access_token:token,
      user:{

          id:user._id,
          name:user.name,
          email:user.email,
          role:user.role
      }
    };

}

}
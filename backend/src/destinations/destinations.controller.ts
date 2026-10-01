import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards
} from '@nestjs/common';

import { DestinationsService } from './destinations.service';

import { CreateDestinationDto } from './dto/create-destination.dto';

import { JwtGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../auth/admin.guard';


@Controller('destinations')
export class DestinationsController {


constructor(
private destinationsService:DestinationsService
){}


// Create Destination (ADMIN)

@Post()
@UseGuards(JwtGuard, AdminGuard)
create(
@Body() body:CreateDestinationDto
){

return this.destinationsService.create(body);

}


// Get All Destinations (PUBLIC)

@Get()
findAll(){

return this.destinationsService.findAll();

}


// Get Single Destination (PUBLIC)

@Get(':id')
findOne(
@Param('id') id:string
){

return this.destinationsService.findOne(id);

}


// Update Destination (ADMIN)

@Patch(':id')
@UseGuards(JwtGuard, AdminGuard)
update(
@Param('id') id:string,
@Body() body:any
){

return this.destinationsService.update(
id,
body
);

}


// Delete Destination (ADMIN)

@Delete(':id')
@UseGuards(JwtGuard, AdminGuard)
remove(
@Param('id') id:string
){

return this.destinationsService.remove(id);

}


}
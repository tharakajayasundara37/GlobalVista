import {
  Injectable,
  NotFoundException
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Destination,
  DestinationDocument
} from './schemas/destination.schema';

import { CreateDestinationDto } from './dto/create-destination.dto';


@Injectable()
export class DestinationsService {


constructor(

@InjectModel(Destination.name)

private destinationModel: Model<DestinationDocument>

){}



// Create Destination

async create(
data:CreateDestinationDto
){

const destination = new this.destinationModel(data);

return destination.save();

}



// Get All Destinations

async findAll(){

return this.destinationModel.find();

}



// Get Single Destination

async findOne(id:string){

const destination = await this.destinationModel.findById(id);


if(!destination){

throw new NotFoundException(
"Destination not found"
);

}


return destination;

}



// Update Destination

async update(
id:string,
data:any
){

const destination = await this.destinationModel.findByIdAndUpdate(

id,

data,

{
new:true
}

);



if(!destination){

throw new NotFoundException(
"Destination not found"
);

}


return destination;

}



// Delete Destination

async remove(id:string){

const destination = await this.destinationModel.findByIdAndDelete(
id
);



if(!destination){

throw new NotFoundException(
"Destination not found"
);

}



return {

message:"Destination deleted successfully"

};

}


}
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document } from 'mongoose';


export type UserDocument = User & Document;



export enum Role {

  USER = "USER",

  ADMIN = "ADMIN"

}



@Schema({

  timestamps:true

})
export class User {



  @Prop({
    required:true
  })
  name:string;



  @Prop({

    required:true,

    unique:true

  })
  email:string;



  @Prop({

    required:true

  })
  password:string;



  @Prop()
  country:string;



  @Prop({

    enum: Role,

    default: Role.USER

  })
  role:Role;


}



export const UserSchema =
SchemaFactory.createForClass(User);
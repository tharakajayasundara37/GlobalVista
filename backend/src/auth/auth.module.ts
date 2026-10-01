import { Module, forwardRef } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';

import { PassportModule } from '@nestjs/passport';


import { AuthController } from './auth.controller';

import { AuthService } from './auth.service';


import { UsersModule } from '../users/users.module';


import { JwtStrategy } from './jwt.strategy';



@Module({

imports:[


forwardRef(() => UsersModule),



PassportModule.register({

defaultStrategy:'jwt'

}),



JwtModule.register({

global:true,

secret:'GLOBALVISTA_SECRET_KEY',

signOptions:{

expiresIn:'7d'

}

})


],



controllers:[

AuthController

],



providers:[

AuthService,

JwtStrategy

],



exports:[

JwtModule,

PassportModule,

JwtStrategy

]


})


export class AuthModule {}
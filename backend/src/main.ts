import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

import { ValidationPipe } from '@nestjs/common';

import {
  SwaggerModule,
  DocumentBuilder
} from '@nestjs/swagger';



async function bootstrap() {


const app = await NestFactory.create(
AppModule
);



app.enableCors();



app.useGlobalPipes(

new ValidationPipe({

whitelist:true,

forbidNonWhitelisted:true

})

);



const config = new DocumentBuilder()

.setTitle(
'GlobalVista Travel API'
)

.setDescription(
'Travel Booking Management System API Documentation'
)

.setVersion(
'1.0'
)

.addBearerAuth()

.build();



const document =
SwaggerModule.createDocument(
app,
config
);



SwaggerModule.setup(
'api',
app,
document
);



await app.listen(3000);


}


bootstrap();
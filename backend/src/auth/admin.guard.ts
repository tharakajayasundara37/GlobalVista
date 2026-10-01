import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException
} from '@nestjs/common';



@Injectable()
export class AdminGuard implements CanActivate {


  canActivate(
    context: ExecutionContext
  ): boolean {


    const request =
    context.switchToHttp().getRequest();


    console.log("ADMIN CHECK USER:", request.user);



    if(!request.user){

      throw new ForbiddenException(
        'User not authenticated'
      );

    }



    if(request.user.role !== 'ADMIN'){

      throw new ForbiddenException(
        'Admin access required'
      );

    }



    return true;

  }


}
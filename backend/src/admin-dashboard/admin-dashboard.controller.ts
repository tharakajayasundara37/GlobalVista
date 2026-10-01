import {
  Controller,
  Get,
  UseGuards
} from '@nestjs/common';



import { AdminDashboardService } from './admin-dashboard.service';



import { JwtGuard } from '../auth/jwt.guard';


import { AdminGuard } from '../auth/admin.guard';





@Controller('admin-dashboard')


@UseGuards(
  JwtGuard,
  AdminGuard
)


export class AdminDashboardController {



constructor(

private adminDashboardService:AdminDashboardService

){}







// Dashboard Summary

@Get()

getDashboard(){

return this.adminDashboardService.getDashboard();

}







// Recent Bookings

@Get('bookings')

getRecentBookings(){

return this.adminDashboardService.getRecentBookings();

}







// Recent Payments

@Get('payments')

getRecentPayments(){

return this.adminDashboardService.getRecentPayments();

}







// Revenue Analytics

@Get('revenue')

getRevenue(){

return this.adminDashboardService.getRevenue();

}



}
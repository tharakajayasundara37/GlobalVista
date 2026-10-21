import {
  Module,
} from '@nestjs/common';
import {
  MongooseModule,
} from '@nestjs/mongoose';
import {
  ReviewsController,
} from './reviews.controller';
import {
  ReviewsService,
} from './reviews.service';
import {
  Review,
  ReviewSchema,
} from './schemas/review.schema';
import {
  Booking,
  BookingSchema,
} from '../bookings/schemas/booking.schema';
import {
  AuthModule,
} from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      {
        name: Review.name,
        schema: ReviewSchema,
      },
      {
        name: Booking.name,
        schema: BookingSchema,
      },
    ]),
  ],
  controllers: [
    ReviewsController,
  ],
  providers: [
    ReviewsService,
  ],
  exports: [
    ReviewsService,
  ],
})
export class ReviewsModule {}
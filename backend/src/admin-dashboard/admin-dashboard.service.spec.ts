import {
  Test,
  TestingModule,
} from '@nestjs/testing';

import {
  getModelToken,
} from '@nestjs/mongoose';

import {
  AdminDashboardService,
} from './admin-dashboard.service';

import {
  User,
} from '../users/schemas/user.schema';

import {
  Package,
} from '../packages/schemas/package.schema';

import {
  Booking,
} from '../bookings/schemas/booking.schema';

import {
  Payment,
} from '../payments/schemas/payment.schema';

describe(
  'AdminDashboardService',
  () => {
    let service:
      AdminDashboardService;

    beforeEach(
      async () => {
        const module:
          TestingModule =
          await Test
            .createTestingModule(
              {
                providers: [
                  AdminDashboardService,

                  {
                    provide:
                      getModelToken(
                        User.name,
                      ),

                    useValue: {},
                  },

                  {
                    provide:
                      getModelToken(
                        Package.name,
                      ),

                    useValue: {},
                  },

                  {
                    provide:
                      getModelToken(
                        Booking.name,
                      ),

                    useValue: {},
                  },

                  {
                    provide:
                      getModelToken(
                        Payment.name,
                      ),

                    useValue: {},
                  },
                ],
              },
            )
            .compile();

        service =
          module.get<AdminDashboardService>(
            AdminDashboardService,
          );
      },
    );

    it(
      'should be defined',
      () => {
        expect(
          service,
        ).toBeDefined();
      },
    );
  },
);
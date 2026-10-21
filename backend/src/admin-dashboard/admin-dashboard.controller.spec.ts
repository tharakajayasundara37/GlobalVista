import {
  Test,
  TestingModule,
} from '@nestjs/testing';

import {
  AdminDashboardController,
} from './admin-dashboard.controller';

import {
  AdminDashboardService,
} from './admin-dashboard.service';

describe(
  'AdminDashboardController',
  () => {
    let controller:
      AdminDashboardController;

    const mockAdminDashboardService =
      {
        getDashboard:
          jest.fn(),

        getRecentBookings:
          jest.fn(),

        getRecentPayments:
          jest.fn(),

        getRevenue:
          jest.fn(),

        getPendingGuides:
          jest.fn(),

        getAllGuides:
          jest.fn(),

        getGuide:
          jest.fn(),

        approveGuide:
          jest.fn(),

        rejectGuide:
          jest.fn(),
      };

    beforeEach(
      async () => {
        const module:
          TestingModule =
          await Test
            .createTestingModule(
              {
                controllers: [
                  AdminDashboardController,
                ],

                providers: [
                  {
                    provide:
                      AdminDashboardService,

                    useValue:
                      mockAdminDashboardService,
                  },
                ],
              },
            )
            .compile();

        controller =
          module.get<AdminDashboardController>(
            AdminDashboardController,
          );
      },
    );

    it(
      'should be defined',
      () => {
        expect(
          controller,
        ).toBeDefined();
      },
    );
  },
);
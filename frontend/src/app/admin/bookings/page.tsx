'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useRouter,
} from 'next/navigation';

import {
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Eye,
  MapPin,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
  XCircle,
} from 'lucide-react';

import styles from './page.module.css';

const API_URL =
  'http://localhost:3001';

type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED';

type BookingUser = {
  _id?: string;
  name?: string;
  email?: string;
  country?: string;
};

type BookingPackage = {
  _id?: string;
  title?: string;
  country?: string;
  price?: number;
  duration?: string;
  category?: string;
};

type Booking = {
  _id: string;

  userId?:
    | BookingUser
    | string;

  packageId?:
    | BookingPackage
    | string;

  travelDate?: string;

  numberOfPeople?: number;

  totalPrice?: number;

  status?: BookingStatus;

  paymentStatus?: string;

  createdAt?: string;
};

export default function BookingsPage() {
  const router =
    useRouter();

  const [
    bookings,
    setBookings,
  ] =
    useState<Booking[]>([]);

  const [
    selectedBooking,
    setSelectedBooking,
  ] =
    useState<Booking | null>(
      null,
    );

  const [
    search,
    setSearch,
  ] =
    useState('');

  const [
    filter,
    setFilter,
  ] =
    useState<
      'ALL' | BookingStatus
    >('ALL');

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    actionLoading,
    setActionLoading,
  ] =
    useState<string | null>(
      null,
    );

  const [
    error,
    setError,
  ] =
    useState('');

  /* =========================
     AUTH
  ========================= */

  const getToken = () =>
    localStorage.getItem(
      'globalvista_token',
    ) ||
    localStorage.getItem(
      'token',
    );

  const getStoredUser = () => {
    const rawUser =
      localStorage.getItem(
        'globalvista_user',
      ) ||
      localStorage.getItem(
        'user',
      );

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(
        rawUser,
      );
    } catch {
      return null;
    }
  };

  const clearSession = () => {
    localStorage.removeItem(
      'globalvista_token',
    );

    localStorage.removeItem(
      'globalvista_user',
    );

    localStorage.removeItem(
      'token',
    );

    localStorage.removeItem(
      'user',
    );
  };

  /* =========================
     LOAD BOOKINGS
  ========================= */

  const loadBookings =
    async (
      refresh = false,
    ) => {
      const token =
        getToken();

      const user =
        getStoredUser();

      if (
        !token ||
        !user
      ) {
        router.replace(
          '/login',
        );

        return;
      }

      if (
        user.role !==
        'ADMIN'
      ) {
        router.replace('/');

        return;
      }

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      try {
        const response =
          await fetch(
            `${API_URL}/bookings`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              cache:
                'no-store',
            },
          );

        if (
          response.status ===
            401 ||
          response.status ===
            403
        ) {
          clearSession();

          router.replace(
            '/login',
          );

          return;
        }

        const data =
          await response
            .json()
            .catch(
              () => [],
            );

        if (!response.ok) {
          throw new Error(
            Array.isArray(
              data.message,
            )
              ? data.message.join(
                  ', ',
                )
              : data.message ||
                  'Unable to load bookings.',
          );
        }

        setBookings(
          Array.isArray(data)
            ? data
            : [],
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load bookings.',
        );
      } finally {
        setLoading(false);

        setRefreshing(
          false,
        );
      }
    };

  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          void loadBookings();
        },
        0,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================
     UPDATE STATUS
  ========================= */

  const updateStatus =
    async (
      booking: Booking,
      status: BookingStatus,
    ) => {
      const token =
        getToken();

      if (!token) {
        return;
      }

      setActionLoading(
        booking._id,
      );

      setError('');

      try {
        const response =
          await fetch(
            `${API_URL}/bookings/${booking._id}`,
            {
              method:
                'PATCH',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify({
                  status,
                }),
            },
          );

        const data =
          await response
            .json()
            .catch(
              () => ({}),
            );

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Unable to update booking.',
          );
        }

        setBookings(
          (current) =>
            current.map(
              (item) =>
                item._id ===
                booking._id
                  ? {
                      ...item,
                      status,
                    }
                  : item,
            ),
        );

        setSelectedBooking(
          (current) =>
            current?._id ===
            booking._id
              ? {
                  ...current,
                  status,
                }
              : current,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to update booking.',
        );
      } finally {
        setActionLoading(
          null,
        );
      }
    };

  /* =========================
     DELETE BOOKING
  ========================= */

  const deleteBooking =
    async (
      booking: Booking,
    ) => {
      const confirmed =
        window.confirm(
          'Delete this booking permanently?',
        );

      if (!confirmed) {
        return;
      }

      const token =
        getToken();

      if (!token) {
        return;
      }

      setActionLoading(
        booking._id,
      );

      setError('');

      try {
        const response =
          await fetch(
            `${API_URL}/bookings/${booking._id}`,
            {
              method:
                'DELETE',

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        const data =
          await response
            .json()
            .catch(
              () => ({}),
            );

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Unable to delete booking.',
          );
        }

        setBookings(
          (current) =>
            current.filter(
              (item) =>
                item._id !==
                booking._id,
            ),
        );

        setSelectedBooking(
          null,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to delete booking.',
        );
      } finally {
        setActionLoading(
          null,
        );
      }
    };

  /* =========================
     FILTER / SEARCH
  ========================= */

  const filteredBookings =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return bookings.filter(
        (booking) => {
          const user =
            typeof booking.userId ===
            'object'
              ? booking.userId
              : null;

          const travelPackage =
            typeof booking.packageId ===
            'object'
              ? booking.packageId
              : null;

          const statusMatch =
            filter === 'ALL' ||
            booking.status ===
              filter;

          const searchMatch =
            !query ||
            [
              booking._id,
              user?.name,
              user?.email,
              user?.country,
              travelPackage?.title,
              travelPackage?.country,
              booking.status,
              booking.paymentStatus,
            ].some(
              (value) =>
                String(
                  value || '',
                )
                  .toLowerCase()
                  .includes(
                    query,
                  ),
            );

          return (
            statusMatch &&
            searchMatch
          );
        },
      );
    }, [
      bookings,
      search,
      filter,
    ]);

  /* =========================
     SUMMARY
  ========================= */

  const pendingCount =
    bookings.filter(
      (booking) =>
        booking.status ===
        'PENDING',
    ).length;

  const confirmedCount =
    bookings.filter(
      (booking) =>
        booking.status ===
        'CONFIRMED',
    ).length;

  const completedCount =
    bookings.filter(
      (booking) =>
        booking.status ===
        'COMPLETED',
    ).length;

  const cancelledCount =
    bookings.filter(
      (booking) =>
        booking.status ===
        'CANCELLED',
    ).length;

  const paidCount =
    bookings.filter(
      (booking) =>
        booking.paymentStatus ===
        'PAID',
    ).length;

  const totalValue =
    bookings.reduce(
      (
        total,
        booking,
      ) =>
        total +
        Number(
          booking.totalPrice ||
            0,
        ),

      0,
    );

  if (loading) {
    return (
      <main
        className={
          styles.loadingPage
        }
      >
        <div
          className={
            styles.loader
          }
        />

        <span>
          Loading bookings...
        </span>
      </main>
    );
  }

  return (
    <main
      className={
        styles.page
      }
    >
      <section
        className={
          styles.shell
        }
      >
        {/* HEADER */}

        <header
          className={
            styles.header
          }
        >
          <div
            className={
              styles.headerLeft
            }
          >
            <button
              type="button"
              className={
                styles.backButton
              }
              onClick={() =>
                router.push(
                  '/admin',
                )
              }
            >
              <ArrowLeft
                size={18}
              />
            </button>

            <div>
              <span>
                ADMINISTRATION
              </span>

              <h1>
                Bookings
                Management
              </h1>

              <p>
                Review, confirm and
                manage traveller
                bookings.
              </p>
            </div>
          </div>

          <button
            type="button"
            className={
              styles.refreshButton
            }
            disabled={
              refreshing
            }
            onClick={() =>
              loadBookings(
                true,
              )
            }
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? styles.spin
                  : ''
              }
            />

            Refresh
          </button>
        </header>

        {/* SUMMARY */}

        <section
          className={
            styles.summaryGrid
          }
        >
          <SummaryCard
            icon={
              BookOpenCheck
            }
            title="Total Bookings"
            value={
              bookings.length
            }
            color="blue"
          />

          <SummaryCard
            icon={
              Clock3
            }
            title="Pending"
            value={
              pendingCount
            }
            color="orange"
          />

          <SummaryCard
            icon={
              CheckCircle2
            }
            title="Confirmed"
            value={
              confirmedCount
            }
            color="green"
          />

          <SummaryCard
            icon={
              CreditCard
            }
            title="Paid"
            value={
              paidCount
            }
            color="purple"
          />

          <SummaryCard
            icon={
              CircleDollarSign
            }
            title="Booking Value"
            value={`$${formatMoney(
              totalValue,
            )}`}
            color="cyan"
          />
        </section>

        {/* STATUS MINI BAR */}

        <section
          className={
            styles.statusStrip
          }
        >
          <div>
            <span
              className={
                styles.greenDot
              }
            />

            Confirmed

            <strong>
              {
                confirmedCount
              }
            </strong>
          </div>

          <div>
            <span
              className={
                styles.orangeDot
              }
            />

            Pending

            <strong>
              {
                pendingCount
              }
            </strong>
          </div>

          <div>
            <span
              className={
                styles.blueDot
              }
            />

            Completed

            <strong>
              {
                completedCount
              }
            </strong>
          </div>

          <div>
            <span
              className={
                styles.redDot
              }
            />

            Cancelled

            <strong>
              {
                cancelledCount
              }
            </strong>
          </div>
        </section>

        {/* TOOLBAR */}

        <section
          className={
            styles.toolbar
          }
        >
          <div
            className={
              styles.searchBox
            }
          >
            <Search
              size={16}
            />

            <input
              value={
                search
              }
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target
                    .value,
                )
              }
              placeholder="Search booking, traveller, package..."
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch('')
                }
              >
                <X
                  size={14}
                />
              </button>
            )}
          </div>

          <div
            className={
              styles.filterWrap
            }
          >
            <select
              value={
                filter
              }
              onChange={(
                event,
              ) =>
                setFilter(
                  event.target
                    .value as
                    | 'ALL'
                    | BookingStatus,
                )
              }
            >
              <option value="ALL">
                All Status
              </option>

              <option value="PENDING">
                Pending
              </option>

              <option value="CONFIRMED">
                Confirmed
              </option>

              <option value="COMPLETED">
                Completed
              </option>

              <option value="CANCELLED">
                Cancelled
              </option>
            </select>

            <ChevronDown
              size={14}
            />
          </div>

          <span
            className={
              styles.resultCount
            }
          >
            {
              filteredBookings.length
            }{' '}
            bookings
          </span>
        </section>

        {/* ERROR */}

        {error && (
          <div
            className={
              styles.errorBox
            }
          >
            <XCircle
              size={16}
            />

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError('')
              }
            >
              <X
                size={14}
              />
            </button>
          </div>
        )}

        {/* TABLE */}

        {filteredBookings.length >
        0 ? (
          <section
            className={
              styles.tableCard
            }
          >
            <div
              className={
                styles.tableHeader
              }
            >
              <span>
                Traveller
              </span>

              <span>
                Package
              </span>

              <span>
                Travel Date
              </span>

              <span>
                Guests
              </span>

              <span>
                Payment
              </span>

              <span>
                Status
              </span>

              <span>
                Total
              </span>

              <span>
                Actions
              </span>
            </div>

            {filteredBookings.map(
              (booking) => {
                const user =
                  typeof booking.userId ===
                  'object'
                    ? booking.userId
                    : null;

                const travelPackage =
                  typeof booking.packageId ===
                  'object'
                    ? booking.packageId
                    : null;

                return (
                  <div
                    key={
                      booking._id
                    }
                    className={
                      styles.tableRow
                    }
                  >
                    <div
                      className={
                        styles.userCell
                      }
                    >
                      <div
                        className={
                          styles.avatar
                        }
                      >
                        {(
                          user?.name ||
                          'T'
                        )
                          .charAt(
                            0,
                          )
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>
                          {user?.name ||
                            'Traveller'}
                        </strong>

                        <span>
                          {user?.email ||
                            '—'}
                        </span>
                      </div>
                    </div>

                    <div
                      className={
                        styles.packageCell
                      }
                    >
                      <strong>
                        {travelPackage?.title ||
                          'Package'}
                      </strong>

                      <span>
                        {travelPackage?.country ||
                          '—'}
                      </span>
                    </div>

                    <span>
                      {formatDate(
                        booking.travelDate,
                      )}
                    </span>

                    <div
                      className={
                        styles.peopleCell
                      }
                    >
                      <Users
                        size={13}
                      />

                      {
                        booking.numberOfPeople ||
                        0
                      }
                    </div>

                    <PaymentBadge
                      status={
                        booking.paymentStatus ||
                        'UNPAID'
                      }
                    />

                    <StatusBadge
                      status={
                        booking.status ||
                        'PENDING'
                      }
                    />

                    <strong
                      className={
                        styles.price
                      }
                    >
                      $
                      {formatMoney(
                        booking.totalPrice ||
                          0,
                      )}
                    </strong>

                    <div
                      className={
                        styles.actions
                      }
                    >
                      <button
                        type="button"
                        className={
                          styles.viewButton
                        }
                        title="View"
                        onClick={() =>
                          setSelectedBooking(
                            booking,
                          )
                        }
                      >
                        <Eye
                          size={
                            15
                          }
                        />
                      </button>

                      <button
                        type="button"
                        className={
                          styles.deleteButton
                        }
                        title="Delete"
                        disabled={
                          actionLoading ===
                          booking._id
                        }
                        onClick={() =>
                          deleteBooking(
                            booking,
                          )
                        }
                      >
                        <Trash2
                          size={
                            14
                          }
                        />
                      </button>
                    </div>
                  </div>
                );
              },
            )}
          </section>
        ) : (
          <section
            className={
              styles.emptyState
            }
          >
            <BookOpenCheck
              size={35}
            />

            <h2>
              No bookings found
            </h2>

            <p>
              Try changing the
              search or status
              filter.
            </p>
          </section>
        )}
      </section>

      {/* DETAILS MODAL */}

      {selectedBooking && (
        <div
          className={
            styles.modalOverlay
          }
          onMouseDown={() =>
            setSelectedBooking(
              null,
            )
          }
        >
          <section
            className={
              styles.modal
            }
            onMouseDown={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            <div
              className={
                styles.modalHeader
              }
            >
              <div>
                <span>
                  BOOKING DETAILS
                </span>

                <h2>
                  Manage Booking
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedBooking(
                    null,
                  )
                }
              >
                <X
                  size={18}
                />
              </button>
            </div>

            <BookingHero
              booking={
                selectedBooking
              }
            />

            <div
              className={
                styles.infoGrid
              }
            >
              <InfoBox
                icon={
                  UserRound
                }
                label="Traveller"
                value={
                  getUserName(
                    selectedBooking,
                  )
                }
              />

              <InfoBox
                icon={
                  BookOpenCheck
                }
                label="Package"
                value={
                  getPackageName(
                    selectedBooking,
                  )
                }
              />

              <InfoBox
                icon={
                  CalendarDays
                }
                label="Travel Date"
                value={
                  formatDate(
                    selectedBooking.travelDate,
                  )
                }
              />

              <InfoBox
                icon={
                  Users
                }
                label="Travellers"
                value={String(
                  selectedBooking.numberOfPeople ||
                    0,
                )}
              />

              <InfoBox
                icon={
                  CreditCard
                }
                label="Payment"
                value={
                  selectedBooking.paymentStatus ||
                  'UNPAID'
                }
              />

              <InfoBox
                icon={
                  CircleDollarSign
                }
                label="Total Price"
                value={`$${formatMoney(
                  selectedBooking.totalPrice ||
                    0,
                )}`}
              />
            </div>

            <div
              className={
                styles.statusSection
              }
            >
              <span>
                UPDATE BOOKING
                STATUS
              </span>

              <div
                className={
                  styles.statusButtons
                }
              >
                <button
                  type="button"
                  className={
                    styles.pendingButton
                  }
                  disabled={
                    actionLoading ===
                    selectedBooking._id
                  }
                  onClick={() =>
                    updateStatus(
                      selectedBooking,
                      'PENDING',
                    )
                  }
                >
                  Pending
                </button>

                <button
                  type="button"
                  className={
                    styles.confirmButton
                  }
                  disabled={
                    actionLoading ===
                    selectedBooking._id
                  }
                  onClick={() =>
                    updateStatus(
                      selectedBooking,
                      'CONFIRMED',
                    )
                  }
                >
                  Confirm
                </button>

                <button
                  type="button"
                  className={
                    styles.completeButton
                  }
                  disabled={
                    actionLoading ===
                    selectedBooking._id
                  }
                  onClick={() =>
                    updateStatus(
                      selectedBooking,
                      'COMPLETED',
                    )
                  }
                >
                  Complete
                </button>

                <button
                  type="button"
                  className={
                    styles.cancelButton
                  }
                  disabled={
                    actionLoading ===
                    selectedBooking._id
                  }
                  onClick={() =>
                    updateStatus(
                      selectedBooking,
                      'CANCELLED',
                    )
                  }
                >
                  Cancel
                </button>
              </div>
            </div>

            <div
              className={
                styles.modalFooter
              }
            >
              <button
                type="button"
                className={
                  styles.closeButton
                }
                onClick={() =>
                  setSelectedBooking(
                    null,
                  )
                }
              >
                Close
              </button>

              <button
                type="button"
                className={
                  styles.modalDeleteButton
                }
                disabled={
                  actionLoading ===
                  selectedBooking._id
                }
                onClick={() =>
                  deleteBooking(
                    selectedBooking,
                  )
                }
              >
                <Trash2
                  size={15}
                />

                Delete Booking
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

/* =========================
   COMPONENTS
========================= */

function SummaryCard({
  icon: Icon,
  title,
  value,
  color,
}: {
  icon:
    typeof BookOpenCheck;

  title: string;

  value:
    | string
    | number;

  color:
    | 'blue'
    | 'orange'
    | 'green'
    | 'purple'
    | 'cyan';
}) {
  return (
    <article
      className={`${styles.summaryCard} ${styles[color]}`}
    >
      <div
        className={
          styles.summaryIcon
        }
      >
        <Icon
          size={20}
        />
      </div>

      <div>
        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>
      </div>
    </article>
  );
}

function StatusBadge({
  status,
}: {
  status:
    BookingStatus;
}) {
  return (
    <span
      className={`${styles.statusBadge} ${
        styles[
          `status${status}`
        ]
      }`}
    >
      {status}
    </span>
  );
}

function PaymentBadge({
  status,
}: {
  status: string;
}) {
  const paid =
    status === 'PAID';

  return (
    <span
      className={
        paid
          ? styles.paidBadge
          : styles.unpaidBadge
      }
    >
      {status}
    </span>
  );
}

function BookingHero({
  booking,
}: {
  booking: Booking;
}) {
  return (
    <div
      className={
        styles.bookingHero
      }
    >
      <div
        className={
          styles.heroIcon
        }
      >
        <BookOpenCheck
          size={24}
        />
      </div>

      <div>
        <span>
          Booking ID
        </span>

        <strong>
          {booking._id}
        </strong>

        <StatusBadge
          status={
            booking.status ||
            'PENDING'
          }
        />
      </div>
    </div>
  );
}

function InfoBox({
  icon: Icon,
  label,
  value,
}: {
  icon:
    typeof BookOpenCheck;

  label: string;

  value: string;
}) {
  return (
    <div
      className={
        styles.infoBox
      }
    >
      <div>
        <Icon
          size={17}
        />
      </div>

      <section>
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>
      </section>
    </div>
  );
}

/* =========================
   HELPERS
========================= */

function getUserName(
  booking: Booking,
) {
  if (
    typeof booking.userId ===
    'object'
  ) {
    return (
      booking.userId?.name ||
      booking.userId?.email ||
      'Traveller'
    );
  }

  return 'Traveller';
}

function getPackageName(
  booking: Booking,
) {
  if (
    typeof booking.packageId ===
    'object'
  ) {
    return (
      booking.packageId
        ?.title ||
      'Travel Package'
    );
  }

  return 'Travel Package';
}

function formatMoney(
  value: number,
) {
  return new Intl.NumberFormat(
    'en-US',
    {
      maximumFractionDigits:
        2,
    },
  ).format(value);
}

function formatDate(
  value?: string,
) {
  if (!value) {
    return '—';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    'en-GB',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  );
}
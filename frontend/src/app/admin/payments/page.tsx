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
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  Eye,
  Hash,
  ReceiptText,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  WalletCards,
  X,
  XCircle,
} from 'lucide-react';

import styles from './page.module.css';

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL || 'https://globalvista-d7uz.onrender.com');

type PaymentStatus =
  | 'SUCCESS'
  | 'PENDING'
  | 'FAILED';

type PaymentUser = {
  _id?: string;
  publicId?: string;
  name?: string;
  email?: string;
  country?: string;
  role?: string;
};

type PaymentBooking = {
  _id?: string;

  travelDate?: string;

  numberOfPeople?: number;

  totalPrice?: number;

  status?: string;

  paymentStatus?: string;
};

type Payment = {
  _id: string;

  bookingId?:
    | PaymentBooking
    | string;

  userId?:
    | PaymentUser
    | string;

  amount?: number;

  paymentMethod?: string;

  transactionId?: string;

  status?: PaymentStatus;

  createdAt?: string;

  updatedAt?: string;
};

export default function PaymentsPage() {
  const router =
    useRouter();

  const [
    payments,
    setPayments,
  ] =
    useState<Payment[]>([]);

  const [
    selectedPayment,
    setSelectedPayment,
  ] =
    useState<Payment | null>(
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
      'ALL' | PaymentStatus
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
     LOAD PAYMENTS
  ========================= */

  const loadPayments =
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
            `${API_URL}/payments`,
            {
              method:
                'GET',

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
                  'Unable to load payments.',
          );
        }

        const paymentList =
          Array.isArray(data)
            ? data
            : [];

        /*
         * Newest payment first.
         */
        paymentList.sort(
          (
            a: Payment,
            b: Payment,
          ) =>
            new Date(
              b.createdAt ||
                0,
            ).getTime() -
            new Date(
              a.createdAt ||
                0,
            ).getTime(),
        );

        setPayments(
          paymentList,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load payments.',
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
          void loadPayments();
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
      payment: Payment,
      status: PaymentStatus,
    ) => {
      const token =
        getToken();

      if (!token) {
        return;
      }

      const confirmed =
        window.confirm(
          `Change this payment status to ${status}?`,
        );

      if (!confirmed) {
        return;
      }

      setActionLoading(
        payment._id,
      );

      setError('');

      try {
        const response =
          await fetch(
            `${API_URL}/payments/${payment._id}`,
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
            Array.isArray(
              data.message,
            )
              ? data.message.join(
                  ', ',
                )
              : data.message ||
                  'Unable to update payment.',
          );
        }

        setPayments(
          (current) =>
            current.map(
              (item) =>
                item._id ===
                payment._id
                  ? {
                      ...item,
                      status,
                    }
                  : item,
            ),
        );

        setSelectedPayment(
          (current) =>
            current?._id ===
            payment._id
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
            : 'Unable to update payment.',
        );
      } finally {
        setActionLoading(
          null,
        );
      }
    };

  /* =========================
     DELETE PAYMENT
  ========================= */

  const deletePayment =
    async (
      payment: Payment,
    ) => {
      const confirmed =
        window.confirm(
          'Delete this payment record permanently?',
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
        payment._id,
      );

      setError('');

      try {
        const response =
          await fetch(
            `${API_URL}/payments/${payment._id}`,
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
            Array.isArray(
              data.message,
            )
              ? data.message.join(
                  ', ',
                )
              : data.message ||
                  'Unable to delete payment.',
          );
        }

        setPayments(
          (current) =>
            current.filter(
              (item) =>
                item._id !==
                payment._id,
            ),
        );

        setSelectedPayment(
          null,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to delete payment.',
        );
      } finally {
        setActionLoading(
          null,
        );
      }
    };

  /* =========================
     SEARCH / FILTER
  ========================= */

  const filteredPayments =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return payments.filter(
        (payment) => {
          const user =
            typeof payment.userId ===
            'object'
              ? payment.userId
              : null;

          const booking =
            typeof payment.bookingId ===
            'object'
              ? payment.bookingId
              : null;

          const bookingId =
            typeof payment.bookingId ===
            'string'
              ? payment.bookingId
              : booking?._id;

          const statusMatch =
            filter === 'ALL' ||
            payment.status ===
              filter;

          const searchMatch =
            !query ||
            [
              payment._id,
              payment.transactionId,
              payment.paymentMethod,
              payment.status,
              user?.name,
              user?.email,
              user?.publicId,
              user?.country,
              bookingId,
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
      payments,
      search,
      filter,
    ]);

  /* =========================
     SUMMARY
  ========================= */

  const successfulPayments =
    payments.filter(
      (payment) =>
        payment.status ===
        'SUCCESS',
    );

  const pendingPayments =
    payments.filter(
      (payment) =>
        payment.status ===
        'PENDING',
    );

  const failedPayments =
    payments.filter(
      (payment) =>
        payment.status ===
        'FAILED',
    );

  const totalRevenue =
    successfulPayments.reduce(
      (
        total,
        payment,
      ) =>
        total +
        Number(
          payment.amount ||
            0,
        ),

      0,
    );

  const averagePayment =
    successfulPayments.length >
    0
      ? totalRevenue /
        successfulPayments.length
      : 0;

  /* =========================
     LOADING
  ========================= */

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
          Loading payments...
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
        {/* =====================
            HEADER
        ===================== */}

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
                FINANCE
                ADMINISTRATION
              </span>

              <h1>
                Payments
                Management
              </h1>

              <p>
                Review and manage
                GlobalVista payment
                transactions.
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
              loadPayments(
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

        {/* =====================
            SUMMARY
        ===================== */}

        <section
          className={
            styles.summaryGrid
          }
        >
          <SummaryCard
            icon={
              WalletCards
            }
            label="Total Payments"
            value={
              payments.length
            }
            color="blue"
          />

          <SummaryCard
            icon={
              CheckCircle2
            }
            label="Successful"
            value={
              successfulPayments.length
            }
            color="green"
          />

          <SummaryCard
            icon={
              ReceiptText
            }
            label="Pending"
            value={
              pendingPayments.length
            }
            color="orange"
          />

          <SummaryCard
            icon={
              XCircle
            }
            label="Failed"
            value={
              failedPayments.length
            }
            color="red"
          />

          <SummaryCard
            icon={
              CircleDollarSign
            }
            label="Revenue"
            value={`$${formatMoney(
              totalRevenue,
            )}`}
            color="purple"
          />

          <SummaryCard
            icon={
              Banknote
            }
            label="Avg. Payment"
            value={`$${formatMoney(
              averagePayment,
            )}`}
            color="cyan"
          />
        </section>

        {/* =====================
            TOOLBAR
        ===================== */}

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
              placeholder="Search transaction, traveller, booking..."
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
                    | PaymentStatus,
                )
              }
            >
              <option value="ALL">
                All Payments
              </option>

              <option value="SUCCESS">
                Success
              </option>

              <option value="PENDING">
                Pending
              </option>

              <option value="FAILED">
                Failed
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
              filteredPayments.length
            }{' '}
            payments
          </span>
        </section>

        {/* =====================
            ERROR
        ===================== */}

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

        {/* =====================
            PAYMENT TABLE
        ===================== */}

        {filteredPayments.length >
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
                Transaction
              </span>

              <span>
                Booking
              </span>

              <span>
                Method
              </span>

              <span>
                Date
              </span>

              <span>
                Status
              </span>

              <span>
                Amount
              </span>

              <span>
                Actions
              </span>
            </div>

            {filteredPayments.map(
              (payment) => {
                const user =
                  getPaymentUser(
                    payment,
                  );

                return (
                  <div
                    key={
                      payment._id
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
                        styles.transactionCell
                      }
                    >
                      <Hash
                        size={12}
                      />

                      <span>
                        {payment.transactionId ||
                          '—'}
                      </span>
                    </div>

                    <span
                      className={
                        styles.bookingId
                      }
                    >
                      {shortId(
                        getBookingId(
                          payment,
                        ),
                      )}
                    </span>

                    <span
                      className={
                        styles.methodBadge
                      }
                    >
                      <CreditCard
                        size={
                          11
                        }
                      />

                      {payment.paymentMethod ||
                        'CARD'}
                    </span>

                    <span>
                      {formatDate(
                        payment.createdAt,
                      )}
                    </span>

                    <PaymentStatusBadge
                      status={
                        payment.status ||
                        'PENDING'
                      }
                    />

                    <strong
                      className={
                        styles.amount
                      }
                    >
                      $
                      {formatMoney(
                        payment.amount ||
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
                        title="View payment"
                        onClick={() =>
                          setSelectedPayment(
                            payment,
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
                        title="Delete payment"
                        disabled={
                          actionLoading ===
                          payment._id
                        }
                        onClick={() =>
                          deletePayment(
                            payment,
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
            <WalletCards
              size={36}
            />

            <h2>
              No payments found
            </h2>

            <p>
              Try another search or
              payment status filter.
            </p>
          </section>
        )}
      </section>

      {/* =====================
          PAYMENT DETAILS
      ===================== */}

      {selectedPayment && (
        <div
          className={
            styles.modalOverlay
          }
          onMouseDown={() =>
            setSelectedPayment(
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
                  PAYMENT RECORD
                </span>

                <h2>
                  Transaction
                  Details
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedPayment(
                    null,
                  )
                }
              >
                <X
                  size={18}
                />
              </button>
            </div>

            <div
              className={
                styles.paymentHero
              }
            >
              <div
                className={
                  styles.heroIcon
                }
              >
                <WalletCards
                  size={25}
                />
              </div>

              <div
                className={
                  styles.heroContent
                }
              >
                <span>
                  TRANSACTION
                </span>

                <strong>
                  {selectedPayment.transactionId ||
                    'No transaction ID'}
                </strong>

                <PaymentStatusBadge
                  status={
                    selectedPayment.status ||
                    'PENDING'
                  }
                />
              </div>

              <div
                className={
                  styles.heroAmount
                }
              >
                <span>
                  AMOUNT
                </span>

                <strong>
                  $
                  {formatMoney(
                    selectedPayment.amount ||
                      0,
                  )}
                </strong>
              </div>
            </div>

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
                    selectedPayment,
                  )
                }
              />

              <InfoBox
                icon={
                  Hash
                }
                label="User ID"
                value={
                  getUserPublicId(
                    selectedPayment,
                  )
                }
              />

              <InfoBox
                icon={
                  ReceiptText
                }
                label="Booking ID"
                value={
                  getBookingId(
                    selectedPayment,
                  )
                }
              />

              <InfoBox
                icon={
                  CreditCard
                }
                label="Method"
                value={
                  selectedPayment.paymentMethod ||
                  'Not provided'
                }
              />

              <InfoBox
                icon={
                  CalendarDays
                }
                label="Created"
                value={
                  formatDateTime(
                    selectedPayment.createdAt,
                  )
                }
              />

              <InfoBox
                icon={
                  CircleDollarSign
                }
                label="Amount"
                value={`$${formatMoney(
                  selectedPayment.amount ||
                    0,
                )}`}
              />
            </div>

            {typeof selectedPayment.bookingId ===
              'object' && (
              <div
                className={
                  styles.bookingSection
                }
              >
                <div
                  className={
                    styles.sectionTitle
                  }
                >
                  BOOKING INFORMATION
                </div>

                <div
                  className={
                    styles.bookingGrid
                  }
                >
                  <div>
                    <span>
                      Travel Date
                    </span>

                    <strong>
                      {formatDate(
                        selectedPayment
                          .bookingId
                          ?.travelDate,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Travellers
                    </span>

                    <strong>
                      {selectedPayment
                        .bookingId
                        ?.numberOfPeople ||
                        0}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Booking Status
                    </span>

                    <strong>
                      {selectedPayment
                        .bookingId
                        ?.status ||
                        '—'}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Payment Status
                    </span>

                    <strong>
                      {selectedPayment
                        .bookingId
                        ?.paymentStatus ||
                        '—'}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* STATUS MANAGEMENT */}

            <div
              className={
                styles.statusSection
              }
            >
              <div
                className={
                  styles.sectionTitle
                }
              >
                UPDATE PAYMENT STATUS
              </div>

              <p>
                Changing the payment
                status can also affect
                the linked booking&apos;s
                payment status.
              </p>

              <div
                className={
                  styles.statusActions
                }
              >
                <button
                  type="button"
                  className={
                    styles.pendingButton
                  }
                  disabled={
                    actionLoading ===
                    selectedPayment._id
                  }
                  onClick={() =>
                    updateStatus(
                      selectedPayment,
                      'PENDING',
                    )
                  }
                >
                  <ReceiptText
                    size={
                      14
                    }
                  />

                  Pending
                </button>

                <button
                  type="button"
                  className={
                    styles.successButton
                  }
                  disabled={
                    actionLoading ===
                    selectedPayment._id
                  }
                  onClick={() =>
                    updateStatus(
                      selectedPayment,
                      'SUCCESS',
                    )
                  }
                >
                  <CheckCircle2
                    size={
                      14
                    }
                  />

                  Success
                </button>

                <button
                  type="button"
                  className={
                    styles.failedButton
                  }
                  disabled={
                    actionLoading ===
                    selectedPayment._id
                  }
                  onClick={() =>
                    updateStatus(
                      selectedPayment,
                      'FAILED',
                    )
                  }
                >
                  <XCircle
                    size={
                      14
                    }
                  />

                  Failed
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
                  setSelectedPayment(
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
                  selectedPayment._id
                }
                onClick={() =>
                  deletePayment(
                    selectedPayment,
                  )
                }
              >
                <Trash2
                  size={15}
                />

                {actionLoading ===
                selectedPayment._id
                  ? 'Processing...'
                  : 'Delete Payment'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

/* =========================
   SUMMARY CARD
========================= */

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon:
    typeof WalletCards;

  label: string;

  value:
    | number
    | string;

  color:
    | 'blue'
    | 'green'
    | 'orange'
    | 'red'
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
          {label}
        </span>

        <strong>
          {value}
        </strong>
      </div>
    </article>
  );
}

/* =========================
   PAYMENT STATUS
========================= */

function PaymentStatusBadge({
  status,
}: {
  status:
    PaymentStatus;
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

/* =========================
   INFO BOX
========================= */

function InfoBox({
  icon: Icon,
  label,
  value,
}: {
  icon:
    typeof WalletCards;

  label: string;

  value: string;
}) {
  return (
    <div
      className={
        styles.infoBox
      }
    >
      <div
        className={
          styles.infoIcon
        }
      >
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

function getPaymentUser(
  payment: Payment,
) {
  if (
    typeof payment.userId ===
    'object'
  ) {
    return payment.userId;
  }

  return null;
}

function getUserName(
  payment: Payment,
) {
  const user =
    getPaymentUser(
      payment,
    );

  return (
    user?.name ||
    user?.email ||
    'Traveller'
  );
}

function getUserPublicId(
  payment: Payment,
) {
  const user =
    getPaymentUser(
      payment,
    );

  return (
    user?.publicId ||
    user?._id ||
    'Not available'
  );
}

function getBookingId(
  payment: Payment,
) {
  if (
    typeof payment.bookingId ===
    'string'
  ) {
    return payment.bookingId;
  }

  return (
    payment.bookingId?._id ||
    'Not available'
  );
}

function shortId(
  value: string,
) {
  if (
    !value ||
    value === 'Not available'
  ) {
    return '—';
  }

  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(
    0,
    6,
  )}...${value.slice(-4)}`;
}

function formatMoney(
  value: number,
) {
  return new Intl.NumberFormat(
    'en-US',
    {
      minimumFractionDigits:
        0,

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
    return '—';
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

function formatDateTime(
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
    return '—';
  }

  return date.toLocaleString(
    'en-GB',
    {
      day: '2-digit',

      month: 'short',

      year: 'numeric',

      hour: '2-digit',

      minute: '2-digit',
    },
  );
}
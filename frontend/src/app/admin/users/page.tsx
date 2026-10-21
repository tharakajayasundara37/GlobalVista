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
  CalendarDays,
  ChevronRight,
  CircleUserRound,
  Globe2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
  XCircle,
} from 'lucide-react';

import styles from './page.module.css';

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL || 'https://globalvista-d7uz.onrender.com');

type User = {
  _id: string;

  publicId?: string;

  name?: string;

  email?: string;

  mobile?: string;

  country?: string;

  city?: string;

  role?: string;

  createdAt?: string;

  updatedAt?: string;
};

export default function UsersPage() {
  const router =
    useRouter();

  const [
    users,
    setUsers,
  ] =
    useState<User[]>([]);

  const [
    selectedUser,
    setSelectedUser,
  ] =
    useState<User | null>(
      null,
    );

  const [
    search,
    setSearch,
  ] =
    useState('');

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
    deleting,
    setDeleting,
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

  const getStoredUser =
    () => {
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

  const clearSession =
    () => {
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
     LOAD USERS
  ========================= */

  const loadUsers =
    async (
      refresh = false,
    ) => {
      const token =
        getToken();

      const currentUser =
        getStoredUser();

      if (
        !token ||
        !currentUser
      ) {
        router.replace(
          '/login',
        );

        return;
      }

      if (
        currentUser.role !==
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
            `${API_URL}/users`,
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
                  'Unable to load users.',
          );
        }

        /*
         * Users Management page only
         * shows traveller accounts.
         */
        const travellers =
          Array.isArray(data)
            ? data.filter(
                (
                  item: User,
                ) =>
                  item.role ===
                  'USER',
              )
            : [];

        setUsers(
          travellers,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load users.',
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
          void loadUsers();
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
     USER DETAILS
  ========================= */

  const openUser =
    async (
      user: User,
    ) => {
      const token =
        getToken();

      if (!token) {
        return;
      }

      setSelectedUser(
        user,
      );

      try {
        const response =
          await fetch(
            `${API_URL}/users/${user._id}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              cache:
                'no-store',
            },
          );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        setSelectedUser(
          data,
        );
      } catch {
        /*
         * Existing card information
         * remains visible.
         */
      }
    };

  /* =========================
     DELETE USER
  ========================= */

  const deleteUser =
    async (
      user: User,
    ) => {
      const confirmed =
        window.confirm(
          `Delete ${user.name || 'this user'} permanently?`,
        );

      if (!confirmed) {
        return;
      }

      const token =
        getToken();

      if (!token) {
        return;
      }

      setDeleting(
        user._id,
      );

      setError('');

      try {
        const response =
          await fetch(
            `${API_URL}/users/${user._id}`,
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
              'Unable to delete user.',
          );
        }

        setUsers(
          (current) =>
            current.filter(
              (item) =>
                item._id !==
                user._id,
            ),
        );

        setSelectedUser(
          null,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to delete user.',
        );
      } finally {
        setDeleting(
          null,
        );
      }
    };

  /* =========================
     SEARCH
  ========================= */

  const filteredUsers =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return users;
      }

      return users.filter(
        (user) =>
          [
            user.name,
            user.email,
            user.mobile,
            user.publicId,
            user.country,
            user.city,
          ].some(
            (value) =>
              value
                ?.toLowerCase()
                .includes(
                  query,
                ),
          ),
      );
    }, [
      users,
      search,
    ]);

  /* =========================
     COUNTRIES COUNT
  ========================= */

  const countryCount =
    new Set(
      users
        .map(
          (user) =>
            user.country,
        )
        .filter(Boolean),
    ).size;

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
          Loading
          travellers...
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
                ADMINISTRATION
              </span>

              <h1>
                Users Management
              </h1>

              <p>
                Manage registered
                traveller
                accounts.
              </p>
            </div>
          </div>

          <div
            className={
              styles.headerRight
            }
          >
            <button
              type="button"
              className={
                styles.refreshButton
              }
              disabled={
                refreshing
              }
              onClick={() =>
                loadUsers(
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
          </div>
        </header>

        {/* =====================
            SUMMARY CARDS
        ===================== */}

        <section
          className={
            styles.summaryGrid
          }
        >
          <article
            className={`${styles.summaryCard} ${styles.blueSummary}`}
          >
            <div
              className={
                styles.summaryIconBlue
              }
            >
              <Users
                size={21}
              />
            </div>

            <div>
              <span>
                Total
                Travellers
              </span>

              <strong>
                {
                  users.length
                }
              </strong>

              <p>
                Registered
                traveller
                accounts
              </p>
            </div>
          </article>

          <article
            className={`${styles.summaryCard} ${styles.purpleSummary}`}
          >
            <div
              className={
                styles.summaryIconPurple
              }
            >
              <Globe2
                size={21}
              />
            </div>

            <div>
              <span>
                Countries
              </span>

              <strong>
                {
                  countryCount
                }
              </strong>

              <p>
                Traveller
                locations
              </p>
            </div>
          </article>

          <article
            className={`${styles.summaryCard} ${styles.greenSummary}`}
          >
            <div
              className={
                styles.summaryIconGreen
              }
            >
              <ShieldCheck
                size={21}
              />
            </div>

            <div>
              <span>
                Account Type
              </span>

              <strong>
                USER
              </strong>

              <p>
                Traveller
                accounts only
              </p>
            </div>
          </article>
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
              size={17}
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
              placeholder="Search by name, email, user ID, country..."
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
              styles.resultCount
            }
          >
            {
              filteredUsers.length
            }{' '}
            users
          </div>
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
              size={17}
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
                size={15}
              />
            </button>
          </div>
        )}

        {/* =====================
            USERS TABLE
        ===================== */}

        {filteredUsers.length >
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
                User ID
              </span>

              <span>
                Location
              </span>

              <span>
                Contact
              </span>

              <span>
                Role
              </span>

              <span>
                Action
              </span>
            </div>

            {filteredUsers.map(
              (user) => (
                <div
                  key={
                    user._id
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
                        user.name ||
                        'U'
                      )
                        .charAt(
                          0,
                        )
                        .toUpperCase()}
                    </div>

                    <div>
                      <strong>
                        {user.name ||
                          'Traveller'}
                      </strong>

                      <span>
                        {user.email ||
                          '—'}
                      </span>
                    </div>
                  </div>

                  <span
                    className={
                      styles.publicId
                    }
                  >
                    {user.publicId ||
                      '—'}
                  </span>

                  <div
                    className={
                      styles.location
                    }
                  >
                    <MapPin
                      size={13}
                    />

                    <span>
                      {[
                        user.city,
                        user.country,
                      ]
                        .filter(
                          Boolean,
                        )
                        .join(
                          ', ',
                        ) ||
                        '—'}
                    </span>
                  </div>

                  <div
                    className={
                      styles.contact
                    }
                  >
                    <Phone
                      size={13}
                    />

                    <span>
                      {user.mobile ||
                        '—'}
                    </span>
                  </div>

                  <span
                    className={
                      styles.roleBadge
                    }
                  >
                    USER
                  </span>

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
                      title="View user"
                      onClick={() =>
                        openUser(
                          user,
                        )
                      }
                    >
                      <ChevronRight
                        size={
                          16
                        }
                      />
                    </button>

                    <button
                      type="button"
                      className={
                        styles.deleteButton
                      }
                      title="Delete user"
                      disabled={
                        deleting ===
                        user._id
                      }
                      onClick={() =>
                        deleteUser(
                          user,
                        )
                      }
                    >
                      <Trash2
                        size={
                          15
                        }
                      />
                    </button>
                  </div>
                </div>
              ),
            )}
          </section>
        ) : (
          <section
            className={
              styles.emptyState
            }
          >
            <div
              className={
                styles.emptyIcon
              }
            >
              <Users
                size={32}
              />
            </div>

            <h2>
              No travellers
              found
            </h2>

            <p>
              Traveller accounts
              will appear here.
            </p>
          </section>
        )}
      </section>

      {/* =====================
          USER MODAL
      ===================== */}

      {selectedUser && (
        <div
          className={
            styles.modalOverlay
          }
          onMouseDown={() =>
            setSelectedUser(
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
                  TRAVELLER
                  PROFILE
                </span>

                <h2>
                  User Details
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedUser(
                    null,
                  )
                }
              >
                <X
                  size={19}
                />
              </button>
            </div>

            <div
              className={
                styles.profileHero
              }
            >
              <div
                className={
                  styles.largeAvatar
                }
              >
                {(
                  selectedUser.name ||
                  'U'
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <h3>
                  {selectedUser.name ||
                    'Traveller'}
                </h3>

                <span>
                  {selectedUser.publicId ||
                    'No public ID'}
                </span>

                <div
                  className={
                    styles.userBadge
                  }
                >
                  <UserRound
                    size={
                      11
                    }
                  />

                  Traveller
                </div>
              </div>
            </div>

            <div
              className={
                styles.infoGrid
              }
            >
              <InfoItem
                icon={
                  CircleUserRound
                }
                label="Full Name"
                value={
                  selectedUser.name
                }
              />

              <InfoItem
                icon={
                  Mail
                }
                label="Email"
                value={
                  selectedUser.email
                }
              />

              <InfoItem
                icon={
                  Phone
                }
                label="Mobile"
                value={
                  selectedUser.mobile
                }
              />

              <InfoItem
                icon={
                  Globe2
                }
                label="Country"
                value={
                  selectedUser.country
                }
              />

              <InfoItem
                icon={
                  MapPin
                }
                label="City"
                value={
                  selectedUser.city
                }
              />

              <InfoItem
                icon={
                  CalendarDays
                }
                label="Joined"
                value={
                  formatDate(
                    selectedUser.createdAt,
                  )
                }
              />
            </div>

            <div
              className={
                styles.modalActions
              }
            >
              <button
                type="button"
                className={
                  styles.closeButton
                }
                onClick={() =>
                  setSelectedUser(
                    null,
                  )
                }
              >
                Close
              </button>

              <button
                type="button"
                className={
                  styles.deleteUserButton
                }
                disabled={
                  deleting ===
                  selectedUser._id
                }
                onClick={() =>
                  deleteUser(
                    selectedUser,
                  )
                }
              >
                <Trash2
                  size={16}
                />

                {deleting ===
                selectedUser._id
                  ? 'Deleting...'
                  : 'Delete User'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

/* =========================
   INFO ITEM
========================= */

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon:
    typeof CircleUserRound;

  label: string;

  value?:
    | string
    | null;
}) {
  return (
    <div
      className={
        styles.infoItem
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

      <div>
        <span>
          {label}
        </span>

        <strong>
          {value ||
            'Not provided'}
        </strong>
      </div>
    </div>
  );
}

/* =========================
   DATE
========================= */

function formatDate(
  value?: string,
) {
  if (!value) {
    return 'Not available';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'Not available';
  }

  return date.toLocaleDateString(
    'en-GB',
    {
      day:
        '2-digit',

      month:
        'short',

      year:
        'numeric',
    },
  );
}
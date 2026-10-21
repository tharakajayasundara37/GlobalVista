'use client';
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Edit3,
  EyeOff,
  Globe2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://globalvista-d7uz.onrender.com');
type Destination = {
  _id: string;
  name: string;
  country: string;
  description?: string;
  images?: string[];
  rating?: number;
  bestTimeToVisit?: string;
  activities?: string[];
  budget?: string;
  latitude?: number | null;
  longitude?: number | null;
  isActive?: boolean;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
type FilterType =
  | 'ALL'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';
type EditForm = {
  name: string;
  country: string;
  description: string;
  images: string;
  rating: string;
  bestTimeToVisit: string;
  activities: string;
  budget: string;
  latitude: string;
  longitude: string;
  isActive: boolean;
};
const emptyEditForm: EditForm = {
  name: '',
  country: '',
  description: '',
  images: '',
  rating: '0',
  bestTimeToVisit: '',
  activities: '',
  budget: '',
  latitude: '',
  longitude: '',
  isActive: true,
};
function getToken() {
  return (
    localStorage.getItem(
      'globalvista_token',
    ) ||
    localStorage.getItem(
      'token',
    )
  );
}
function clearSession() {
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
}
function splitLines(
  value: string,
) {
  return value
    .split('\n')
    .map((item) =>
      item.trim(),
    )
    .filter(Boolean);
}
function getApiMessage(
  data: unknown,
  fallback: string,
) {
  if (
    data &&
    typeof data ===
      'object' &&
    'message' in data
  ) {
    const message = (
      data as {
        message?:
          | string
          | string[];
      }
    ).message;
    if (
      Array.isArray(
        message,
      )
    ) {
      return message.join(
        ', ',
      );
    }
    if (
      typeof message ===
        'string' &&
      message.trim()
    ) {
      return message;
    }
  }
  return fallback;
}
function isMapped(
  destination: Destination,
) {
  return (
    typeof destination.latitude ===
      'number' &&
    Number.isFinite(
      destination.latitude,
    ) &&
    typeof destination.longitude ===
      'number' &&
    Number.isFinite(
      destination.longitude,
    )
  );
}
export default function DestinationsAdminPage() {
  const router =
    useRouter();
  const [
    destinations,
    setDestinations,
  ] = useState<
    Destination[]
  >([]);
  const [
    loading,
    setLoading,
  ] = useState(true);
  const [
    refreshing,
    setRefreshing,
  ] = useState(false);
  const [
    search,
    setSearch,
  ] = useState('');
  const [
    filter,
    setFilter,
  ] =
    useState<FilterType>(
      'ALL',
    );
  const [
    error,
    setError,
  ] = useState('');
  const [
    success,
    setSuccess,
  ] = useState('');
  const [
    editingDestination,
    setEditingDestination,
  ] =
    useState<Destination | null>(
      null,
    );
  const [
    editForm,
    setEditForm,
  ] =
    useState<EditForm>(
      emptyEditForm,
    );
  const [
    saving,
    setSaving,
  ] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectingDestination, setRejectingDestination] = useState<Destination | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const isApproved = (destination: Destination) =>
    !destination.approvalStatus || destination.approvalStatus === 'APPROVED';
  const isPublic = (destination: Destination) =>
    isApproved(destination) && destination.isActive !== false;
  const statusOf = (destination: Destination) => destination.approvalStatus ?? 'APPROVED';
  const loadDestinations =
    async (
      refresh = false,
    ) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      const token =
        getToken();
      if (!token) {
        clearSession();
        router.replace(
          '/login',
        );
        return;
      }
      try {
        const response =
          await fetch(
            `${API_URL}/destinations/admin/all`,
            {
              method: 'GET',
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
              cache:
                'no-store',
            },
          );
        const data =
          await response
            .json()
            .catch(
              () => null,
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
        if (
          !response.ok
        ) {
          throw new Error(
            getApiMessage(
              data,
              'Unable to load destinations.',
            ),
          );
        }
        setDestinations(
          Array.isArray(data)
            ? data
            : [],
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load destinations.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          void loadDestinations();
        },
        0,
      );
    return () =>
      window.clearTimeout(
        timer,
      );
  }, []);
  const filteredDestinations =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();
      return destinations.filter(
        (
          destination,
        ) => {
          const matchesSearch =
            !query ||
            destination.name
              .toLowerCase()
              .includes(
                query,
              ) ||
            destination.country
              .toLowerCase()
              .includes(
                query,
              );
          const active = isPublic(destination);
          const matchesFilter =
            filter === 'ALL' ||
            (filter === 'ACTIVE' && active) ||
            (filter === 'INACTIVE' && !active && isApproved(destination)) ||
            (filter === 'PENDING' && statusOf(destination) === 'PENDING') ||
            (filter === 'APPROVED' && statusOf(destination) === 'APPROVED') ||
            (filter === 'REJECTED' && statusOf(destination) === 'REJECTED');
          return (
            matchesSearch &&
            matchesFilter
          );
        },
      );
    }, [
      destinations,
      search,
      filter,
    ]);
  const totalCount =
    destinations.length;
  const activeCount = destinations.filter(isPublic).length;
  const inactiveCount = destinations.filter((destination) =>
    isApproved(destination) && destination.isActive === false,
  ).length;
  const pendingCount = destinations.filter((destination) => statusOf(destination) === 'PENDING').length;
  const rejectedCount = destinations.filter((destination) => statusOf(destination) === 'REJECTED').length;
  const mappedCount =
    destinations.filter(
      isMapped,
    ).length;
  const openEdit = (
    destination: Destination,
  ) => {
    setError('');
    setSuccess('');
    if (statusOf(destination) === 'PENDING') {
      setError('Approve or reject this guide submission before editing it.');
      return;
    }
    setEditingDestination(
      destination,
    );
    setEditForm({
      name:
        destination.name ??
        '',
      country:
        destination.country ??
        '',
      description:
        destination.description ??
        '',
      images:
        destination.images?.join(
          '\n',
        ) ?? '',
      rating:
        String(
          destination.rating ??
            0,
        ),
      bestTimeToVisit:
        destination.bestTimeToVisit ??
        '',
      activities:
        destination.activities?.join(
          '\n',
        ) ?? '',
      budget:
        destination.budget ??
        '',
      latitude:
        typeof destination.latitude ===
        'number'
          ? String(
              destination.latitude,
            )
          : '',
      longitude:
        typeof destination.longitude ===
        'number'
          ? String(
              destination.longitude,
            )
          : '',
      isActive:
        destination.isActive !==
        false,
    });
  };
  const closeEdit = () => {
    if (saving) {
      return;
    }
    setEditingDestination(
      null,
    );
    setEditForm(
      emptyEditForm,
    );
  };
  const updateEditField = <
    K extends keyof EditForm,
  >(
    key: K,
    value: EditForm[K],
  ) => {
    setEditForm(
      (current) => ({
        ...current,
        [key]: value,
      }),
    );
  };
  const handleEditSubmit =
    async (
      event: FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();
      if (
        !editingDestination
      ) {
        return;
      }
      setError('');
      setSuccess('');
      const name =
        editForm.name.trim();
      const country =
        editForm.country.trim();
      if (
        !name ||
        !country
      ) {
        setError(
          'Destination name and country are required.',
        );
        return;
      }
      const rating =
        Number(
          editForm.rating,
        );
      if (
        !Number.isFinite(
          rating,
        ) ||
        rating < 0 ||
        rating > 5
      ) {
        setError(
          'Rating must be between 0 and 5.',
        );
        return;
      }
      const latitudeText =
        editForm.latitude.trim();
      const longitudeText =
        editForm.longitude.trim();
      const hasLatitude =
        latitudeText !== '';
      const hasLongitude =
        longitudeText !== '';
      if (
        hasLatitude !==
        hasLongitude
      ) {
        setError(
          'Latitude and longitude must both be entered.',
        );
        return;
      }
      let latitude:
        number | undefined;
      let longitude:
        number | undefined;
      if (
        hasLatitude &&
        hasLongitude
      ) {
        latitude =
          Number(
            latitudeText,
          );
        longitude =
          Number(
            longitudeText,
          );
        if (
          !Number.isFinite(
            latitude,
          ) ||
          latitude < -90 ||
          latitude > 90
        ) {
          setError(
            'Latitude must be between -90 and 90.',
          );
          return;
        }
        if (
          !Number.isFinite(
            longitude,
          ) ||
          longitude <
            -180 ||
          longitude > 180
        ) {
          setError(
            'Longitude must be between -180 and 180.',
          );
          return;
        }
      }
      const token =
        getToken();
      if (!token) {
        clearSession();
        router.replace(
          '/login',
        );
        return;
      }
      const payload: Record<
        string,
        unknown
      > = {
        name,
        country,
        description:
          editForm.description.trim(),
        images:
          splitLines(
            editForm.images,
          ),
        rating,
        bestTimeToVisit:
          editForm.bestTimeToVisit.trim(),
        activities:
          splitLines(
            editForm.activities,
          ),
        budget:
          editForm.budget.trim(),
        isActive:
          editForm.isActive,
      };
      if (
        latitude !==
          undefined &&
        longitude !==
          undefined
      ) {
        payload.latitude =
          latitude;
        payload.longitude =
          longitude;
      }
      setSaving(true);
      try {
        const response =
          await fetch(
            `${API_URL}/destinations/${editingDestination._id}`,
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
                JSON.stringify(
                  payload,
                ),
            },
          );
        const data =
          await response
            .json()
            .catch(
              () => null,
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
        if (
          !response.ok
        ) {
          throw new Error(
            getApiMessage(
              data,
              'Unable to update destination.',
            ),
          );
        }
        setSuccess(
          'Destination updated successfully.',
        );
        setEditingDestination(
          null,
        );
        await loadDestinations(
          true,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to update destination.',
        );
      } finally {
        setSaving(false);
      }
    };
  const reviewDestination = async (destination: Destination, action: 'approve' | 'reject', reason?: string) => {
    const token = getToken();
    if (!token) {
      clearSession();
      router.replace('/login');
      return;
    }
    setError('');
    setSuccess('');
    setReviewingId(destination._id);
    try {
      const response = await fetch(
        `${API_URL}/destinations/admin/${destination._id}/${action}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          ...(action === 'reject' ? { body: JSON.stringify({ reason: reason?.trim() }) } : {}),
        },
      );
      const data = await response.json().catch(() => null);
      if (response.status === 401) {
        clearSession();
        router.replace('/login');
        return;
      }
      if (!response.ok) throw new Error(getApiMessage(data, `Unable to ${action} destination.`));
      setSuccess(action === 'approve' ? 'Destination approved and published.' : 'Destination rejected.');
      setRejectingDestination(null);
      setRejectionReason('');
      await loadDestinations(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to review destination.');
    } finally {
      setReviewingId(null);
    }
  };
  const submitRejection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rejectingDestination) return;
    if (!rejectionReason.trim() || rejectionReason.trim().length > 500) {
      setError('Enter a rejection reason (1–500 characters).');
      return;
    }
    setRejecting(true);
    try {
      await reviewDestination(rejectingDestination, 'reject', rejectionReason);
    } finally {
      setRejecting(false);
    }
  };
  const toggleActive =
    async (
      destination: Destination,
    ) => {
      if (!isApproved(destination)) {
        setError('Only approved destinations can be enabled or disabled.');
        return;
      }
      const token =
        getToken();
      if (!token) {
        clearSession();
        router.replace(
          '/login',
        );
        return;
      }
      setError('');
      setSuccess('');
      try {
        const response =
          await fetch(
            `${API_URL}/destinations/${destination._id}`,
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
                JSON.stringify(
                  {
                    isActive:
                      destination.isActive ===
                      false,
                  },
                ),
            },
          );
        const data =
          await response
            .json()
            .catch(
              () => null,
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
        if (
          !response.ok
        ) {
          throw new Error(
            getApiMessage(
              data,
              'Unable to update destination.',
            ),
          );
        }
        setSuccess(
          destination.isActive ===
          false
            ? 'Destination activated.'
            : 'Destination deactivated.',
        );
        await loadDestinations(
          true,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to update destination.',
        );
      }
    };
  const deleteDestination =
    async (
      destination: Destination,
    ) => {
      const confirmed =
        window.confirm(
          `Delete "${destination.name}"? This action cannot be undone.`,
        );
      if (!confirmed) {
        return;
      }
      const token =
        getToken();
      if (!token) {
        clearSession();
        router.replace(
          '/login',
        );
        return;
      }
      setError('');
      setSuccess('');
      try {
        const response =
          await fetch(
            `${API_URL}/destinations/${destination._id}`,
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
              () => null,
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
        if (
          !response.ok
        ) {
          throw new Error(
            getApiMessage(
              data,
              'Unable to delete destination.',
            ),
          );
        }
        setSuccess(
          'Destination deleted successfully.',
        );
        await loadDestinations(
          true,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to delete destination.',
        );
      }
    };
  return (
    <main
      className={
        styles.page
      }
    >
      <div
        className={
          styles.shell
        }
      >
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
                size={19}
              />
            </button>
            <div>
              <span
                className={
                  styles.eyebrow
                }
              >
                DESTINATION
                MANAGEMENT
              </span>
              <h1>
                Destinations
              </h1>
              <p>
                Manage destination
                details,
                visibility and real
                map coordinates.
              </p>
            </div>
          </div>
          <div
            className={
              styles.headerActions
            }
          >
            <button
              type="button"
              className={
                styles.refreshButton
              }
              onClick={() =>
                void loadDestinations(
                  true,
                )
              }
              disabled={
                refreshing
              }
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? styles.spinning
                    : ''
                }
              />
              Refresh
            </button>
            <button
              type="button"
              className={
                styles.addButton
              }
              onClick={() =>
                router.push(
                  '/admin/destinations/add',
                )
              }
            >
              <Plus
                size={17}
              />
              Add Destination
            </button>
          </div>
        </header>
        <section
          className={
            styles.summaryGrid
          }
        >
          <article
            className={
              styles.summaryCard
            }
          >
            <div
              className={
                styles.summaryIcon
              }
            >
              <Globe2
                size={20}
              />
            </div>
            <div>
              <span>
                Total Destinations
              </span>
              <strong>
                {
                  totalCount
                }
              </strong>
            </div>
          </article>
          <article
            className={
              styles.summaryCard
            }
          >
            <div
              className={
                styles.summaryIcon
              }
            >
              <CheckCircle2
                size={20}
              />
            </div>
            <div>
              <span>
                Active
              </span>
              <strong>
                {
                  activeCount
                }
              </strong>
            </div>
          </article>
          <article
            className={
              styles.summaryCard
            }
          >
            <div
              className={
                styles.summaryIcon
              }
            >
              <EyeOff
                size={20}
              />
            </div>
            <div>
              <span>
                Inactive
              </span>
              <strong>
                {
                  inactiveCount
                }
              </strong>
            </div>
          </article>
          <article
            className={
              styles.summaryCard
            }
          >
            <div
              className={
                styles.summaryIcon
              }
            >
              <MapPin
                size={20}
              />
            </div>
            <div>
              <span>
                Mapped
              </span>
              <strong>
                {
                  mappedCount
                }
              </strong>
            </div>
          </article>
        </section>
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
                  event
                    .target
                    .value,
                )
              }
              placeholder="Search by destination or country..."
            />
            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch(
                    '',
                  )
                }
              >
                <X
                  size={15}
                />
              </button>
            )}
          </div>
          <div
            className={
              styles.filterTabs
            }
          >
            {(
              [
                  'ALL',
                'ACTIVE',
                'INACTIVE',
                  'PENDING',
                  'APPROVED',
                  'REJECTED',
              ] as FilterType[]
            ).map(
              (
                value,
              ) => (
                <button
                  type="button"
                  key={
                    value
                  }
                  className={
                    filter ===
                    value
                      ? styles.filterActive
                      : ''
                  }
                  onClick={() =>
                    setFilter(
                      value,
                    )
                  }
                >
                  {value ===
                  'ALL'
                    ? 'All'
                    : value ===
                        'ACTIVE'
                      ? 'Active'
                      : value === 'INACTIVE' ? 'Inactive' : value === 'PENDING' ? `Pending (${pendingCount})` : value === 'APPROVED' ? 'Approved' : `Rejected (${rejectedCount})`}
                </button>
              ),
            )}
          </div>
        </section>
        {error && (
          <div
            className={
              styles.errorMessage
            }
          >
            {error}
          </div>
        )}
        {success && (
          <div
            className={
              styles.successMessage
            }
          >
            <CheckCircle2
              size={16}
            />
            {
              success
            }
          </div>
        )}
        {loading ? (
          <div
            className={
              styles.stateBox
            }
          >
            <RefreshCw
              size={22}
              className={
                styles.spinning
              }
            />
            <strong>
              Loading
              destinations...
            </strong>
          </div>
        ) : filteredDestinations.length ===
          0 ? (
          <div
            className={
              styles.stateBox
            }
          >
            <Globe2
              size={26}
            />
            <strong>
              No destinations
              found
            </strong>
            <span>
              Add a destination
              or change your
              search filters.
            </span>
          </div>
        ) : (
          <section
            className={
              styles.destinationGrid
            }
          >
            {filteredDestinations.map(
              (
                destination,
              ) => {
                                  const active = isPublic(destination);
                  const approvalStatus = statusOf(destination);
                const mapped =
                  isMapped(
                    destination,
                  );
                return (
                  <article
                    className={
                      styles.destinationCard
                    }
                    key={
                      destination._id
                    }
                  >
                    <div
                      className={
                        styles.cardTop
                      }
                    >
                      <div
                        className={
                          styles.locationIcon
                        }
                      >
                        <MapPin
                          size={20}
                        />
                      </div>
                      <div
                        className={
                          styles.badges
                        }
                      >
                        <span className={`${styles.approvalBadge} ${approvalStatus === 'PENDING' ? styles.pendingApproval : approvalStatus === 'REJECTED' ? styles.rejectedApproval : styles.approvedApproval}`}>
                          {approvalStatus}
                        </span>
                        {mapped && (
                          <span
                            className={
                              styles.mappedBadge
                            }
                          >
                            Mapped
                          </span>
                        )}
                        <span
                          className={
                            active
                              ? styles.activeBadge
                              : styles.inactiveBadge
                          }
                        >
                          {active
                            ? 'Active'
                            : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={
                        styles.country
                      }
                    >
                      {
                        destination.country
                      }
                    </span>
                    <h2>
                      {
                        destination.name
                      }
                    </h2>
                    <p
                      className={
                        styles.description
                      }
                    >
                      {destination.description ||
                        'No description added.'}
                    </p>
                    <div
                      className={
                        styles.detailsGrid
                      }
                    >
                      <div>
                        <span>
                          Rating
                        </span>
                        <strong
                          className={
                            styles.rating
                          }
                        >
                          <Star
                            size={14}
                          />
                          {Number(
                            destination.rating ??
                              0,
                          ).toFixed(
                            1,
                          )}
                        </strong>
                      </div>
                      <div>
                        <span>
                          Best Time
                        </span>
                        <strong>
                          {destination.bestTimeToVisit ||
                            'Not set'}
                        </strong>
                      </div>
                      <div>
                        <span>
                          Budget
                        </span>
                        <strong>
                          {destination.budget ||
                            'Not set'}
                        </strong>
                      </div>
                      <div>
                        <span>
                          Location
                        </span>
                        <strong>
                          {mapped
                            ? `${destination.latitude}, ${destination.longitude}`
                            : 'Not mapped'}
                        </strong>
                      </div>
                    </div>
                    {destination.activities &&
                      destination.activities.length >
                        0 && (
                        <div
                          className={
                            styles.activities
                          }
                        >
                          {destination.activities
                            .slice(
                              0,
                              3,
                            )
                            .map(
                              (
                                activity,
                              ) => (
                                <span
                                  key={
                                    activity
                                  }
                                >
                                  {
                                    activity
                                  }
                                </span>
                              ),
                            )}
                        </div>
                      )}
                    {approvalStatus === 'REJECTED' && destination.rejectionReason && (
                      <p className={styles.rejectionNote}>Reason: {destination.rejectionReason}</p>
                    )}
                    <div
                      className={
                        styles.cardActions
                      }
                    >
                      <button
                        type="button"
                        className={
                          styles.editButton
                        }
                        onClick={() =>
                          openEdit(
                            destination,
                          )
                        }
                      >
                        <Edit3
                          size={15}
                        />
                        Edit
                      </button>
                      {approvalStatus === 'PENDING' && (
                        <>
                          <button type="button" className={styles.approveButton} disabled={reviewingId === destination._id} onClick={() => void reviewDestination(destination, 'approve')}>
                            <CheckCircle2 size={15} /> Approve & Publish
                          </button>
                          <button type="button" className={styles.rejectButton} disabled={reviewingId === destination._id} onClick={() => { setRejectingDestination(destination); setRejectionReason(''); }}>
                            <X size={15} /> Reject
                          </button>
                        </>
                      )}
                      {approvalStatus === 'REJECTED' && (
                        <button type="button" className={styles.approveButton} disabled={reviewingId === destination._id} onClick={() => void reviewDestination(destination, 'approve')}>
                          <CheckCircle2 size={15} /> Approve
                        </button>
                      )}
                      {approvalStatus === 'APPROVED' && (
                      <button
                        type="button"
                        className={
                          active
                            ? styles.disableButton
                            : styles.enableButton
                        }
                        onClick={() =>
                          void toggleActive(
                            destination,
                          )
                        }
                      >
                        {active ? (
                          <EyeOff
                            size={15}
                          />
                        ) : (
                          <CheckCircle2
                            size={15}
                          />
                        )}
                        {active
                          ? 'Disable'
                          : 'Enable'}
                      </button>
                      )}
                      <button
                        type="button"
                        className={
                          styles.deleteButton
                        }
                        onClick={() =>
                          void deleteDestination(
                            destination,
                          )
                        }
                      >
                        <Trash2
                          size={15}
                        />
                      </button>
                    </div>
                  </article>
                );
              },
            )}
          </section>
        )}
      </div>
              {rejectingDestination && (
          <div className={styles.modalOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget && !rejecting) setRejectingDestination(null); }}>
            <form className={styles.modal} onSubmit={(event) => void submitRejection(event)}>
              <div className={styles.modalHeader}>
                <div><span>GUIDE SUBMISSION</span><h2>Reject {rejectingDestination.name}</h2></div>
                <button type="button" disabled={rejecting} onClick={() => setRejectingDestination(null)}><X size={18} /></button>
              </div>
              <div className={styles.modalBody}>
                <label className={styles.field}>
                  <span>Reason for rejection *</span>
                  <textarea required maxLength={500} rows={5} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Explain what the guide should correct before resubmitting." />
                </label>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelButton} disabled={rejecting} onClick={() => setRejectingDestination(null)}>Cancel</button>
                <button type="submit" className={styles.rejectButton} disabled={rejecting || !rejectionReason.trim()}>{rejecting ? 'Rejecting...' : 'Reject Destination'}</button>
              </div>
            </form>
          </div>
        )}
        {editingDestination && (
        <div
          className={
            styles.modalOverlay
          }
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeEdit();
            }
          }}
        >
          <form
            className={
              styles.modal
            }
            onSubmit={
              handleEditSubmit
            }
          >
            <div
              className={
                styles.modalHeader
              }
            >
              <div>
                <span>
                  EDIT
                  DESTINATION
                </span>
                <h2>
                  {
                    editingDestination.name
                  }
                </h2>
              </div>
              <button
                type="button"
                onClick={
                  closeEdit
                }
                disabled={
                  saving
                }
              >
                <X
                  size={18}
                />
              </button>
            </div>
            <div
              className={
                styles.modalBody
              }
            >
              <div
                className={
                  styles.formGrid
                }
              >
                <label
                  className={
                    styles.field
                  }
                >
                  <span>
                    Destination
                    Name *
                  </span>
                  <input
                    value={
                      editForm.name
                    }
                    onChange={(
                      event,
                    ) =>
                      updateEditField(
                        'name',
                        event
                          .target
                          .value,
                      )
                    }
                    required
                  />
                </label>
                <label
                  className={
                    styles.field
                  }
                >
                  <span>
                    Country *
                  </span>
                  <input
                    value={
                      editForm.country
                    }
                    onChange={(
                      event,
                    ) =>
                      updateEditField(
                        'country',
                        event
                          .target
                          .value,
                      )
                    }
                    required
                  />
                </label>
                <label
                  className={
                    styles.field
                  }
                >
                  <span>
                    Rating
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={
                      editForm.rating
                    }
                    onChange={(
                      event,
                    ) =>
                      updateEditField(
                        'rating',
                        event
                          .target
                          .value,
                      )
                    }
                  />
                </label>
                <label
                  className={
                    styles.field
                  }
                >
                  <span>
                    Budget
                  </span>
                  <input
                    value={
                      editForm.budget
                    }
                    onChange={(
                      event,
                    ) =>
                      updateEditField(
                        'budget',
                        event
                          .target
                          .value,
                      )
                    }
                  />
                </label>
                <label
                  className={
                    styles.field
                  }
                >
                  <span>
                    Best Time to
                    Visit
                  </span>
                  <input
                    value={
                      editForm.bestTimeToVisit
                    }
                    onChange={(
                      event,
                    ) =>
                      updateEditField(
                        'bestTimeToVisit',
                        event
                          .target
                          .value,
                      )
                    }
                  />
                </label>
                <label
                  className={
                    styles.field
                  }
                >
                  <span>
                    Latitude
                  </span>
                  <input
                    type="number"
                    min="-90"
                    max="90"
                    step="any"
                    value={
                      editForm.latitude
                    }
                    onChange={(
                      event,
                    ) =>
                      updateEditField(
                        'latitude',
                        event
                          .target
                          .value,
                      )
                    }
                  />
                </label>
                <label
                  className={
                    styles.field
                  }
                >
                  <span>
                    Longitude
                  </span>
                  <input
                    type="number"
                    min="-180"
                    max="180"
                    step="any"
                    value={
                      editForm.longitude
                    }
                    onChange={(
                      event,
                    ) =>
                      updateEditField(
                        'longitude',
                        event
                          .target
                          .value,
                      )
                    }
                  />
                </label>
                <label
                  className={`${styles.field} ${styles.fullField}`}
                >
                  <span>
                    Description
                  </span>
                  <textarea
                    rows={4}
                    value={
                      editForm.description
                    }
                    onChange={(
                      event,
                    ) =>
                      updateEditField(
                        'description',
                        event
                          .target
                          .value,
                      )
                    }
                  />
                </label>
                <label
                  className={`${styles.field} ${styles.fullField}`}
                >
                  <span>
                    Activities
                    — one per
                    line
                  </span>
                  <textarea
                    rows={4}
                    value={
                      editForm.activities
                    }
                    onChange={(
                      event,
                    ) =>
                      updateEditField(
                        'activities',
                        event
                          .target
                          .value,
                      )
                    }
                  />
                </label>
                <label
                  className={`${styles.field} ${styles.fullField}`}
                >
                  <span>
                    Image URLs
                    — one per
                    line
                  </span>
                  <textarea
                    rows={3}
                    value={
                      editForm.images
                    }
                    onChange={(
                      event,
                    ) =>
                      updateEditField(
                        'images',
                        event
                          .target
                          .value,
                      )
                    }
                  />
                </label>
              </div>
              <button
                type="button"
                className={`${styles.activeToggle} ${
                  editForm.isActive
                    ? styles.activeToggleOn
                    : ''
                }`}
                onClick={() =>
                  updateEditField(
                    'isActive',
                    !editForm.isActive,
                  )
                }
              >
                <CheckCircle2
                  size={17}
                />
                <div>
                  <strong>
                    {editForm.isActive
                      ? 'Active'
                      : 'Inactive'}
                  </strong>
                  <span>
                    Show this
                    destination
                    publicly.
                  </span>
                </div>
              </button>
            </div>
            <div
              className={
                styles.modalFooter
              }
            >
              <button
                type="button"
                className={
                  styles.cancelButton
                }
                onClick={
                  closeEdit
                }
                disabled={
                  saving
                }
              >
                Cancel
              </button>
              <button
                type="submit"
                className={
                  styles.saveButton
                }
                disabled={
                  saving
                }
              >
                {saving
                  ? 'Saving...'
                  : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

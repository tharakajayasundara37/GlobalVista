'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Globe2,
  Info,
  Lock,
  LogOut,
  MapPin,
  PackageCheck,
  Plane,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  WalletCards,
  X,
} from 'lucide-react';
import styles from './page.module.css';

const API_URL = 'http://localhost:3001';

type StoredUser = {
  id?: string;
  _id?: string;
  publicId?: string;
  name?: string;
  email?: string;
  country?: string;
  mobile?: string;
  role?: string;
};

type BookingAddOn = {
  addOnId?: string;
  name?: string;
  price?: number;
  pricingType?: 'PER_PERSON' | 'PER_BOOKING';
  quantity?: number;
  calculatedAmount?: number;
};

type BookingPackage = {
  _id?: string;
  title?: string;
  country?: string;
  destination?: string;
  price?: number;
  duration?: string;
  category?: string;
  images?: string[];
};

type Booking = {
  _id: string;
  userId?: string | { _id?: string; publicId?: string; name?: string; email?: string };
  packageId?: string | BookingPackage;
  travelDate?: string;
  numberOfPeople?: number;
  basePrice?: number;
  selectedAddOns?: BookingAddOn[];
  addOnsTotal?: number;
  totalPrice?: number;
  status?: string;
  paymentStatus?: string;
  createdAt?: string;
};

type ReviewRecord = {
  _id?: string;
  userId?: string | { _id?: string; id?: string; name?: string };
  packageId?: string | { _id?: string };
  rating?: number;
  comment?: string;
};

type ReviewTarget = {
  bookingId: string;
  packageId: string;
  packageTitle: string;
};

type FilterTab = 'ALL' | 'CONFIRMED' | 'UNPAID' | 'COMPLETED';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('globalvista_token') || localStorage.getItem('token');
}

function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  const rawUser = localStorage.getItem('globalvista_user') || localStorage.getItem('user');
  if (!rawUser) return null;
  try {
    return JSON.parse(rawUser) as StoredUser;
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem('globalvista_token');
  localStorage.removeItem('globalvista_user');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function formatMoney(value?: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

function getPackage(booking: Booking): BookingPackage | null {
  if (booking.packageId && typeof booking.packageId === 'object') {
    return booking.packageId;
  }
  return null;
}

function getPackageId(booking: Booking): string {
  if (typeof booking.packageId === 'string') return booking.packageId;
  if (booking.packageId && typeof booking.packageId === 'object') {
    return booking.packageId._id || '';
  }
  return '';
}

function getStatusClass(status?: string) {
  switch (status?.trim().toUpperCase()) {
    case 'CONFIRMED':
    case 'COMPLETED':
      return styles.statusSuccess;
    case 'CANCELLED':
      return styles.statusDanger;
    default:
      return styles.statusPending;
  }
}

function getPaymentClass(status?: string) {
  if (status?.trim().toUpperCase() === 'PAID') {
    return styles.statusSuccess;
  }
  return styles.statusUnpaid;
}

export default function TravellerPage() {
  const router = useRouter();

  const [user, setUser] = useState<StoredUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');

  // Detail Modal State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Review Modal State
  const [reviewedPackageIds, setReviewedPackageIds] = useState<string[]>([]);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const loadBookings = useCallback(
    async (refresh = false) => {
      const token = getToken();
      const storedUser = getStoredUser();

      setAuthChecked(true);

      if (!token || !storedUser) {
        setLoading(false);
        setUser(null);
        return;
      }

      setUser(storedUser);

      const userId = storedUser.id || storedUser._id;
      if (!userId) {
        setError('Traveller account ID could not be found. Please log in again.');
        setLoading(false);
        return;
      }

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      try {
        let response = await fetch(`${API_URL}/bookings/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          cache: 'no-store',
        });

        if (!response.ok && userId) {
          response = await fetch(`${API_URL}/bookings/user/${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
            cache: 'no-store',
          });
        }

        const data = await response.json().catch(() => []);

        if (response.status === 401) {
          clearSession();
          setUser(null);
          setLoading(false);
          setRefreshing(false);
          return;
        }

        if (!response.ok) {
          throw new Error(data?.message || 'Unable to load your bookings.');
        }

        const loadedBookings: Booking[] = Array.isArray(data) ? data : [];
        setBookings(loadedBookings);

        // Fetch completed package reviews
        const completedIds = loadedBookings
          .filter((b) => b.status?.trim().toUpperCase() === 'COMPLETED')
          .map(getPackageId)
          .filter(Boolean);

        if (completedIds.length > 0) {
          const reviewed = await Promise.all(
            completedIds.map(async (pkgId) => {
              try {
                const res = await fetch(`${API_URL}/reviews/package/${pkgId}`, { cache: 'no-store' });
                if (!res.ok) return null;
                const revs = await res.json().catch(() => []);
                const hasRev = Array.isArray(revs) && revs.some((r: any) => {
                  const uid = typeof r.userId === 'string' ? r.userId : r.userId?._id || r.userId?.id;
                  return String(uid) === String(userId);
                });
                return hasRev ? pkgId : null;
              } catch {
                return null;
              }
            }),
          );
          setReviewedPackageIds(reviewed.filter((x): x is string => Boolean(x)));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load your bookings.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  // Demo Login Helper for Visitors / Portfolio Evaluators
  const activateDemoSession = async () => {
    try {
      setLoading(true);
      // Login with pre-configured verified traveller account
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'tharaka@gmail.com', password: 'password123' }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.access_token) {
        localStorage.setItem('globalvista_token', data.access_token);
        localStorage.setItem('globalvista_user', JSON.stringify(data.user));
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        await loadBookings();
      } else {
        // Fallback demo user
        const demoUser: StoredUser = {
          id: '6ab8c72b3926b3a7f82d0d66',
          name: 'Tharaka Jayasundara',
          email: 'tharaka@gmail.com',
          role: 'USER',
          country: 'Sri Lanka',
          publicId: 'GV-EXPLORER-01',
        };
        setUser(demoUser);
        setError('');
      }
    } catch {
      setError('Unable to activate demo mode.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setBookings([]);
    router.replace('/login');
  };

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    if (activeFilter === 'CONFIRMED') {
      return bookings.filter((b) => b.status?.trim().toUpperCase() === 'CONFIRMED');
    }
    if (activeFilter === 'UNPAID') {
      return bookings.filter((b) => b.paymentStatus?.trim().toUpperCase() !== 'PAID');
    }
    if (activeFilter === 'COMPLETED') {
      return bookings.filter((b) => b.status?.trim().toUpperCase() === 'COMPLETED');
    }
    return bookings;
  }, [bookings, activeFilter]);

  // Summary Metrics
  const summary = useMemo(() => {
    const totalBookings = bookings.length;
    const confirmed = bookings.filter((b) => b.status?.trim().toUpperCase() === 'CONFIRMED').length;
    const pending = bookings.filter((b) => b.status?.trim().toUpperCase() === 'PENDING').length;
    const unpaid = bookings.filter((b) => b.paymentStatus?.trim().toUpperCase() !== 'PAID').length;
    const completed = bookings.filter((b) => b.status?.trim().toUpperCase() === 'COMPLETED').length;
    return { totalBookings, confirmed, pending, unpaid, completed };
  }, [bookings]);

  // Review Actions
  const openReview = (booking: Booking) => {
    const packageId = getPackageId(booking);
    const pkg = getPackage(booking);
    if (!booking._id || !packageId) return;

    setReviewTarget({
      bookingId: booking._id,
      packageId,
      packageTitle: pkg?.title || 'Travel Package',
    });
    setReviewRating(5);
    setReviewComment('');
    setReviewError('');
    setReviewSuccess('');
  };

  const closeReview = () => {
    if (reviewSubmitting) return;
    setReviewTarget(null);
  };

  const submitReview = async () => {
    if (!reviewTarget) return;
    setReviewError('');
    setReviewSuccess('');

    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError('Please select a rating from 1 to 5 stars.');
      return;
    }

    const cleanComment = reviewComment.trim();
    if (!cleanComment) {
      setReviewError('Please write a brief comment about your expedition experience.');
      return;
    }

    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      setReviewSubmitting(true);
      const response = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: reviewTarget.bookingId,
          packageId: reviewTarget.packageId,
          rating: reviewRating,
          comment: cleanComment,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || 'Unable to submit review.');
      }

      setReviewedPackageIds((curr) => Array.from(new Set([...curr, reviewTarget.packageId])));
      setReviewSuccess('Thank you! Your verified travel review has been recorded.');
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Unable to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // ==========================================================
  // CASE 1: NOT LOGGED IN -> LUXURY AUTHENTICATION PROMPT
  // ==========================================================
  if (authChecked && !user && !loading) {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand}>
            Global<span>Vista</span>
          </Link>
          <div className={styles.headerActions}>
            <Link href="/" className={styles.homeButton}>
              <ArrowLeft size={16} /> Home
            </Link>
          </div>
        </header>

        <div className={styles.authPromptCard}>
          <div className={styles.authPromptIcon}>
            <Lock size={32} />
          </div>
          <h2 style={{ margin: '0 0 10px', fontSize: 24, fontWeight: 800, color: '#0c2c43' }}>
            Traveller Sign-In Required
          </h2>
          <p style={{ color: '#536d7d', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>
            Please sign in to view your booked expeditions, download official travel vouchers, and manage trip itineraries.
          </p>

          <div className={styles.authPromptActions}>
            <Link href="/login" className={styles.authButtonPrimary}>
              Sign In to Your Account
            </Link>
            <Link href="/register" className={styles.authButtonSecondary}>
              Create New Traveller Account
            </Link>
            <button
              type="button"
              className={styles.authButtonSecondary}
              style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#059669' }}
              onClick={() => void activateDemoSession()}
            >
              <Sparkles size={16} /> Preview Dashboard with Verified Bookings
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      {/* HEADER */}
      <header className={styles.header}>
        <button type="button" className={styles.brand} onClick={() => router.push('/')}>
          Global<span>Vista</span>
        </button>

        <div className={styles.headerActions}>
          <button type="button" className={styles.homeButton} onClick={() => router.push('/')}>
            <ArrowLeft size={17} />
            Back to Home
          </button>

          {user?.role === 'ADMIN' && (
            <button
              type="button"
              className={styles.homeButton}
              style={{ borderColor: '#f59e0b', color: '#b45309' }}
              onClick={() => router.push('/admin')}
            >
              <ShieldCheck size={16} /> Admin Portal
            </button>
          )}

          <button type="button" className={styles.logoutButton} onClick={handleLogout}>
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>TRAVELLER RESERVATION SUITE</span>
          <h1>Welcome back, {user?.name?.trim().split(/\s+/)[0] || 'Explorer'}</h1>
          <p>Manage your luxury itineraries, complete checkout, and access official travel vouchers.</p>
        </div>

        <div className={styles.profileCard}>
          <div className={styles.avatar}>{user?.name?.charAt(0).toUpperCase() || 'T'}</div>
          <div>
            <strong>{user?.name || 'Explorer'}</strong>
            <span>{user?.publicId || user?.email || 'GlobalVista Traveller'}</span>
          </div>
        </div>
      </section>

      {/* ADMIN SESSION NOTICE (IF ADMIN) */}
      {user?.role === 'ADMIN' && (
        <div style={{ width: 'min(1180px, calc(100% - 40px))', margin: '0 auto 20px' }}>
          <div className={styles.adminBanner}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={18} />
              <span>You are viewing this portal with full <strong>Administrator Privileges</strong>.</span>
            </div>
            <Link href="/admin" style={{ color: '#b45309', textDecoration: 'underline' }}>
              Switch to Admin Dashboard →
            </Link>
          </div>
        </div>
      )}

      {/* SUMMARY STAT CARDS */}
      <section className={styles.summaryGrid}>
        <article
          className={styles.summaryCard}
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveFilter('ALL')}
        >
          <div className={styles.summaryIcon}>
            <PackageCheck size={22} />
          </div>
          <div>
            <span>Total Bookings</span>
            <strong>{summary.totalBookings}</strong>
          </div>
        </article>

        <article
          className={styles.summaryCard}
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveFilter('CONFIRMED')}
        >
          <div className={styles.summaryIcon} style={{ background: '#ecfdf5', color: '#059669' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span>Confirmed</span>
            <strong>{summary.confirmed}</strong>
          </div>
        </article>

        <article
          className={styles.summaryCard}
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveFilter('UNPAID')}
        >
          <div className={styles.summaryIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
            <WalletCards size={22} />
          </div>
          <div>
            <span>Pending Payment</span>
            <strong>{summary.unpaid}</strong>
          </div>
        </article>

        <article
          className={styles.summaryCard}
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveFilter('COMPLETED')}
        >
          <div className={styles.summaryIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Clock3 size={22} />
          </div>
          <div>
            <span>Completed Trips</span>
            <strong>{summary.completed}</strong>
          </div>
        </article>
      </section>

      {/* BOOKINGS SECTION */}
      <section className={styles.bookingsSection}>
        <div className={styles.sectionHeader}>
          <div>
            <span>YOUR EXPEDITIONS</span>
            <h2>Bookings & Travel Records</h2>
          </div>

          <button
            type="button"
            className={styles.refreshButton}
            disabled={refreshing}
            onClick={() => void loadBookings(true)}
          >
            <RefreshCw size={17} className={refreshing ? styles.spinning : ''} />
            Refresh
          </button>
        </div>

        {/* FILTER TABS */}
        <div className={styles.filterTabs}>
          <button
            type="button"
            className={`${styles.filterTab} ${activeFilter === 'ALL' ? styles.filterTabActive : ''}`}
            onClick={() => setActiveFilter('ALL')}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            type="button"
            className={`${styles.filterTab} ${activeFilter === 'CONFIRMED' ? styles.filterTabActive : ''}`}
            onClick={() => setActiveFilter('CONFIRMED')}
          >
            Confirmed & Paid ({summary.confirmed})
          </button>
          <button
            type="button"
            className={`${styles.filterTab} ${activeFilter === 'UNPAID' ? styles.filterTabActive : ''}`}
            onClick={() => setActiveFilter('UNPAID')}
          >
            Pending Checkout ({summary.unpaid})
          </button>
          <button
            type="button"
            className={`${styles.filterTab} ${activeFilter === 'COMPLETED' ? styles.filterTabActive : ''}`}
            onClick={() => setActiveFilter('COMPLETED')}
          >
            Completed ({summary.completed})
          </button>
        </div>

        {loading && <div className={styles.stateBox}>Loading your reservations from GlobalVista cloud...</div>}

        {!loading && error && <div className={styles.errorBox}>{error}</div>}

        {!loading && !error && filteredBookings.length === 0 && (
          <div className={styles.emptyState}>
            <Plane size={36} />
            <h3>No trips in this view</h3>
            <p>
              {activeFilter === 'ALL'
                ? 'You have not booked any expeditions yet. Explore our world-class destinations to begin.'
                : `There are currently no bookings matching the "${activeFilter}" filter.`}
            </p>
            <button type="button" onClick={() => router.push('/')}>
              Explore Destinations
            </button>
          </div>
        )}

        {!loading && !error && filteredBookings.length > 0 && (
          <div className={styles.bookingList}>
            {filteredBookings.map((booking) => {
              const pkg = getPackage(booking);
              const packageId = getPackageId(booking);
              const addOns = booking.selectedAddOns ?? [];
              const isCompleted = String(booking.status || '').trim().toUpperCase() === 'COMPLETED';
              const isPaid = String(booking.paymentStatus || '').trim().toUpperCase() === 'PAID';
              const hasReviewed = packageId ? reviewedPackageIds.includes(packageId) : false;

              return (
                <article key={booking._id} className={styles.bookingCard}>
                  <div className={styles.bookingTop}>
                    <div>
                      <span className={styles.bookingLabel}>RESERVATION #{booking._id.slice(-6).toUpperCase()}</span>
                      <h3>{pkg?.title || 'Bespoke Travel Package'}</h3>

                      <div className={styles.packageMeta}>
                        <span>
                          <MapPin size={14} />
                          {pkg?.country || pkg?.destination || 'International'}
                        </span>
                        <span>
                          <CalendarDays size={14} />
                          {formatDate(booking.travelDate)}
                        </span>
                        <span>
                          <Users size={14} />
                          {booking.numberOfPeople || 1} guest{(booking.numberOfPeople || 1) > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className={styles.statusGroup}>
                      <span className={`${styles.statusBadge} ${getStatusClass(booking.status)}`}>
                        {booking.status || 'PENDING'}
                      </span>
                      <span className={`${styles.statusBadge} ${getPaymentClass(booking.paymentStatus)}`}>
                        {booking.paymentStatus || 'UNPAID'}
                      </span>
                    </div>
                  </div>

                  {addOns.length > 0 && (
                    <div className={styles.addOnsBox}>
                      <span className={styles.addOnsTitle}>SELECTED ADD-ONS</span>
                      {addOns.map((addOn, index) => (
                        <div key={`${addOn.addOnId || addOn.name}-${index}`} className={styles.addOnRow}>
                          <div>
                            <strong>{addOn.name || 'Add-on Service'}</strong>
                            <span>
                              {addOn.pricingType === 'PER_PERSON' ? 'Per person rate' : 'Per booking fixed'}
                              {addOn.quantity ? ` × ${addOn.quantity}` : ''}
                            </span>
                          </div>
                          <strong>${formatMoney(addOn.calculatedAmount || addOn.price)}</strong>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={styles.priceSummary}>
                    <div>
                      <span>Base Package</span>
                      <strong>
                        ${formatMoney(
                          booking.basePrice && booking.numberOfPeople
                            ? booking.basePrice * booking.numberOfPeople
                            : Number(booking.totalPrice || 0) - Number(booking.addOnsTotal || 0),
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Add-ons</span>
                      <strong>${formatMoney(booking.addOnsTotal || 0)}</strong>
                    </div>

                    <div className={styles.totalRow}>
                      <span>Total Amount</span>
                      <strong>${formatMoney(booking.totalPrice)}</strong>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className={styles.bookingActions}>
                    {/* 1. VIEW DETAILS (MODAL) */}
                    <button
                      type="button"
                      className={styles.detailsButton}
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <Info size={15} /> View Details
                    </button>

                    {/* 2. UNPAID -> PAY NOW */}
                    {!isPaid && (
                      <button
                        type="button"
                        className={styles.payButton}
                        onClick={() => router.push(`/traveller/payments?bookingId=${booking._id}`)}
                      >
                        <CreditCard size={16} /> Pay Now (${formatMoney(booking.totalPrice)})
                      </button>
                    )}

                    {/* 3. PAID -> OFFICIAL BILL / VOUCHER */}
                    {isPaid && (
                      <button
                        type="button"
                        className={styles.invoiceButton}
                        onClick={() => router.push(`/traveller/payments?bookingId=${booking._id}`)}
                      >
                        <Receipt size={16} /> Official Bill
                      </button>
                    )}

                    {/* 4. WRITE REVIEW */}
                    {isCompleted && packageId && !hasReviewed && (
                      <button
                        type="button"
                        className={styles.reviewButton}
                        onClick={() => openReview(booking)}
                      >
                        <Star size={16} /> Write Review
                      </button>
                    )}

                    {isCompleted && packageId && hasReviewed && (
                      <span className={styles.reviewedBadge}>
                        <CheckCircle2 size={15} /> Reviewed
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ==========================================================
          RESERVATION DETAILS MODAL (FIX FOR BROKEN 404 URL)
         ========================================================== */}
      {selectedBooking && (
        <div className={styles.detailsModalOverlay} onClick={() => setSelectedBooking(null)}>
          <div className={styles.detailsModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailsModalHeader}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1785f2', letterSpacing: '1px' }}>
                  EXPEDITION DETAILS #{selectedBooking._id.slice(-6).toUpperCase()}
                </span>
                <h2 style={{ margin: '4px 0 0', fontSize: 20, color: '#0c2c43' }}>
                  {getPackage(selectedBooking)?.title || 'Travel Reservation'}
                </h2>
              </div>
              <button
                type="button"
                className={styles.closeIconButton}
                onClick={() => setSelectedBooking(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.detailsModalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12 }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                    Destination
                  </div>
                  <strong style={{ fontSize: 14, color: '#0f172a' }}>
                    {getPackage(selectedBooking)?.destination || 'Global'}, {getPackage(selectedBooking)?.country || ''}
                  </strong>
                </div>

                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12 }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                    Departure Date
                  </div>
                  <strong style={{ fontSize: 14, color: '#0f172a' }}>
                    {formatDate(selectedBooking.travelDate)}
                  </strong>
                </div>

                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12 }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                    Party Size
                  </div>
                  <strong style={{ fontSize: 14, color: '#0f172a' }}>
                    {selectedBooking.numberOfPeople || 1} Person(s)
                  </strong>
                </div>

                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12 }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                    Payment Status
                  </div>
                  <strong
                    style={{
                      fontSize: 14,
                      color: selectedBooking.paymentStatus === 'PAID' ? '#059669' : '#d97706',
                    }}
                  >
                    {selectedBooking.paymentStatus || 'UNPAID'}
                  </strong>
                </div>
              </div>

              {selectedBooking.selectedAddOns && selectedBooking.selectedAddOns.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>
                    Included Add-on Upgrades
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedBooking.selectedAddOns.map((addon, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: '#f1f5f9',
                          borderRadius: 8,
                          fontSize: 13,
                        }}
                      >
                        <span>{addon.name}</span>
                        <strong>${formatMoney(addon.calculatedAmount || addon.price)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ borderTop: '2px solid #edf2f7', paddingTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800 }}>
                  <span>Grand Total Payable:</span>
                  <span style={{ color: '#1785f2', fontSize: 20 }}>
                    ${formatMoney(selectedBooking.totalPrice)}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.detailsModalFooter}>
              <button
                type="button"
                className={styles.detailsButton}
                onClick={() => setSelectedBooking(null)}
              >
                Close
              </button>

              {selectedBooking.paymentStatus === 'PAID' ? (
                <button
                  type="button"
                  className={styles.invoiceButton}
                  onClick={() => router.push(`/traveller/payments?bookingId=${selectedBooking._id}`)}
                >
                  <Receipt size={16} /> Official Travel Voucher & Bill
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.payButton}
                  onClick={() => router.push(`/traveller/payments?bookingId=${selectedBooking._id}`)}
                >
                  <CreditCard size={16} /> Proceed to Checkout
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          REVIEW MODAL
         ========================================================== */}
      {reviewTarget && (
        <div className={styles.reviewOverlay} onClick={closeReview}>
          <section className={styles.reviewModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.reviewModalHeader}>
              <div>
                <span>EXPEDITION REVIEW</span>
                <h2>{reviewTarget.packageTitle}</h2>
              </div>
              <button type="button" className={styles.closeReviewButton} onClick={closeReview}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.reviewForm}>
              <div className={styles.ratingSection}>
                <span>Your Rating</span>
                <div className={styles.starPicker}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      disabled={reviewSubmitting || Boolean(reviewSuccess)}
                      className={`${styles.starButton} ${star <= reviewRating ? styles.starSelected : ''}`}
                      onClick={() => {
                        setReviewRating(star);
                        setReviewError('');
                      }}
                    >
                      <Star size={30} fill={star <= reviewRating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
                <span>
                  {reviewRating === 1 && 'Poor'}
                  {reviewRating === 2 && 'Fair'}
                  {reviewRating === 3 && 'Good'}
                  {reviewRating === 4 && 'Very Good'}
                  {reviewRating === 5 && 'Excellent'}
                </span>
              </div>

              <label className={styles.reviewCommentField}>
                <span>Tell us about your experience</span>
                <textarea
                  rows={5}
                  maxLength={1000}
                  value={reviewComment}
                  disabled={reviewSubmitting || Boolean(reviewSuccess)}
                  placeholder="Share details of your journey, your guide, accommodations and memorable highlights..."
                  onChange={(e) => {
                    setReviewComment(e.target.value);
                    setReviewError('');
                  }}
                />
                <small>{reviewComment.length}/1000</small>
              </label>

              {reviewError && <div className={styles.reviewError}>{reviewError}</div>}
              {reviewSuccess && (
                <div className={styles.reviewSuccess}>
                  <CheckCircle2 size={18} /> {reviewSuccess}
                </div>
              )}
            </div>

            <div className={styles.reviewModalActions}>
              <button
                type="button"
                className={styles.cancelReviewButton}
                disabled={reviewSubmitting}
                onClick={closeReview}
              >
                {reviewSuccess ? 'Close' : 'Cancel'}
              </button>

              {!reviewSuccess && (
                <button
                  type="button"
                  className={styles.submitReviewButton}
                  disabled={reviewSubmitting}
                  onClick={() => void submitReview()}
                >
                  <Star size={17} /> {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

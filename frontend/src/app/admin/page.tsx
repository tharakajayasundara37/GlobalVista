'use client';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  BadgeDollarSign,
  Bell,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Globe2,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Package,
  RefreshCw,
  Camera,
  KeyRound,
  Pencil,
  X,
  Search,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import styles from './page.module.css';
const API_URL = 'http://localhost:3001';
/* =========================
   TYPES
========================= */
type AdminUser = {
  _id?: string;
  id?: string;
  mobile?: string;
  country?: string;
  profileImage?: string;
  publicId?: string;
  name?: string;
  email?: string;
  role?: string;
};
type DashboardStats = {
  totalAccounts?: number;
  users?: number;
  totalUsers?: number;
  guides?: number;
  totalGuides?: number;
  pendingGuides?: number;
  approvedGuides?: number;
  rejectedGuides?: number;
  packages?: number;
  totalPackages?: number;
  bookings?: number;
  totalBookings?: number;
  payments?: number;
  totalPayments?: number;
  revenue?: number;
  totalRevenue?: number;
  pendingBookings?: number;
  confirmedBookings?: number;
};
type MonthlyRevenue = {
  _id: {
    month: number;
    year: number;
  };
  revenue: number;
  payments: number;
};
type RevenueResponse = {
  totalRevenue: number;
  successfulPayments: number;
  averagePayment: number;
  monthlyRevenue: MonthlyRevenue[];
};
type PaymentUser = {
  _id?: string;
  publicId?: string;
  name?: string;
  email?: string;
};
type Payment = {
  _id: string;
  amount?: number;
  paymentMethod?: string;
  transactionId?: string;
  status?: string;
  createdAt?: string;
  userId?: PaymentUser | string;
};
type Guide = {
  _id: string;
  publicId?: string;
  name?: string;
  email?: string;
  country?: string;
  city?: string;
  guideStatus?: string;
  languages?: string[];
};
type SidebarItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
  active?: boolean;
};
type SummaryCardItem = {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  className: string;
  iconClass: string;
  trend: string;
  href?: string;
};
/* =========================
   SIDEBAR
========================= */
const sidebarItems: SidebarItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin',
    active: true,
  },
  {
    label: 'Users',
    icon: Users,
    href: '/admin/users',
  },
  {
    label: 'Guide Applications',
    icon: UserCheck,
    href: '/admin/guides',
  },
  {
    label: 'Destinations',
    icon: MapPinned,
    href: '/admin/destinations',
  },
  {
    label: 'Packages',
    icon: Package,
    href: '/admin/packages',
  },
  {
    label: 'Travel Plans',
    icon: BadgeDollarSign,
    href: '/admin/travel-plans',
  },
  {
    label: 'Bookings',
    icon: BookOpenCheck,
    href: '/admin/bookings',
  },
  {
    label: 'Payments',
    icon: CreditCard,
    href: '/admin/payments',
  },
];
/* =========================
   CHART COLOURS
========================= */
const bookingColors = [
  '#10b981',
  '#f59e0b',
  '#3b82f6',
];
const guideColors = [
  '#22c55e',
  '#f59e0b',
  '#ef4444',
];
/* =========================
   COMPONENT
========================= */
export default function AdminPage() {
  const router = useRouter();
  const [admin, setAdmin,] = useState<AdminUser | null>(null);
  const [stats, setStats,] = useState<DashboardStats>({});
  const [revenue, setRevenue,] = useState<RevenueResponse>({
    totalRevenue: 0,
    successfulPayments: 0,
    averagePayment: 0,
    monthlyRevenue: [],
  });
  const [payments, setPayments,] = useState<Payment[]>([]);
  const [pendingGuides, setPendingGuides,] = useState<Guide[]>([]);
  const [loading, setLoading,] = useState(true);
  const [refreshing, setRefreshing,] = useState(false);
  const [error, setError,] = useState('');

  /* =========================
     ADMIN PROFILE - NEW
  ========================= */
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileFileInputRef = useRef<HTMLInputElement | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileModal, setProfileModal] = useState<'edit' | 'password' | null>(null);
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileMobile, setProfileMobile] = useState('');
  const [profileCountry, setProfileCountry] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileImageFailed, setProfileImageFailed] = useState(false);

  const getProfileImageUrl = (image?: string): string => {
    if (!image) return '';
    if (image.startsWith('http://') || image.startsWith('https://')) return image;
    return image.startsWith('/') ? `${API_URL}${image}` : `${API_URL}/${image}`;
  };

  const saveAdminLocally = (updatedUser: AdminUser) => {
    const previous = getStoredUser();
    const mergedUser = { ...previous, ...updatedUser };
    setAdmin(mergedUser);
    const serialized = JSON.stringify(mergedUser);
    localStorage.setItem('globalvista_user', serialized);
    localStorage.setItem('user', serialized);
  };

  const openProfileModal = (mode: 'edit' | 'password') => {
    setProfileName(admin?.name || '');
    setProfileMobile(admin?.mobile || '');
    setProfileCountry(admin?.country || '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setProfileError('');
    setProfileMessage('');
    setProfileModal(mode);
    setProfileMenuOpen(false);
  };

  const closeProfileModal = () => {
    if (profileSaving || imageUploading || passwordSaving) return;
    setProfileModal(null);
    setProfileError('');
    setProfileMessage('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const requestProfile = async (url: string, init: RequestInit) => {
    const token = getToken();
    if (!token) {
      clearSession();
      router.replace('/login');
      throw new Error('Your session has expired. Please log in again.');
    }
    const response = await fetch(`${API_URL}${url}`, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
    const body = await response.json().catch(() => ({}));
    if (response.status === 401) {
      clearSession();
      router.replace('/login');
      throw new Error('Your session has expired. Please log in again.');
    }
    if (!response.ok) {
      const message = body.message;
      throw new Error(Array.isArray(message)
        ? message.join(', ')
        : typeof message === 'string' ? message : 'Request failed. Please try again.');
    }
    return body;
  };

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError('');
    setProfileMessage('');
    if (!profileName.trim() || !profileMobile.trim() || !profileCountry.trim()) {
      setProfileError('Please fill in your name, mobile number and country.');
      return;
    }
    setProfileSaving(true);
    try {
      const body = await requestProfile('/users/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName.trim(),
          mobile: profileMobile.trim(),
          country: profileCountry.trim(),
        }),
      });
      if (body.user) saveAdminLocally(body.user);
      setProfileMessage('Profile updated successfully.');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Unable to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUploadProfileImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setProfileError('');
    setProfileMessage('');
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!supportedTypes.includes(file.type)) {
      setProfileError('Choose a JPG, PNG or WEBP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileError('Your profile photo must be 5 MB or smaller.');
      return;
    }
    const formData = new FormData();
    formData.append('image', file);
    setImageUploading(true);
    try {
      const body = await requestProfile('/users/me/profile-image', {
        method: 'POST',
        body: formData,
      });
      if (body.user) saveAdminLocally(body.user);
      setProfileImageFailed(false);
      setProfileMessage('Profile photo uploaded successfully.');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Unable to upload photo.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError('');
    setProfileMessage('');
    if (newPassword.length < 8) {
      setProfileError('Your new password must have at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setProfileError('New password and confirmation do not match.');
      return;
    }
    setPasswordSaving(true);
    try {
      await requestProfile('/users/me/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setProfileMessage('Password changed successfully.');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Unable to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [profileMenuOpen]);

  /* =========================

     STORAGE

  ========================= */
  const getToken = () => {
    return (localStorage.getItem('globalvista_token') ||
      localStorage.getItem('token'));
  };
  const getStoredUser = (): AdminUser | null => {
    const rawUser = localStorage.getItem('globalvista_user') ||
      localStorage.getItem('user');
    if (!rawUser) {
      return null;
    }
    try {
      return JSON.parse(rawUser) as AdminUser;
    }
    catch {
      return null;
    }
  };
  const clearSession = () => {
    localStorage.removeItem('globalvista_token');
    localStorage.removeItem('globalvista_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };
  /* =========================

     NAVIGATION

  ========================= */
  const navigateTo = (href?: string) => {
    if (!href) {
      return;
    }
    router.push(href);
  };
  /* =========================

     LOGOUT

  ========================= */
  const handleLogout = () => {
    setLogoutConfirmationOpen(false);
    setProfileMenuOpen(false);
    clearSession();
    router.replace('/login');
  };
  const askLogout = () => {
    setProfileMenuOpen(false);
    setLogoutConfirmationOpen(true);
  };
  /* =========================

     DASHBOARD LOAD

  ========================= */
  const loadDashboard = async (showRefresh = false) => {
    const token = getToken();
    const storedUser = getStoredUser();
    if (!token ||
      !storedUser) {
      router.replace('/login');
      return;
    }
    if (storedUser.role !==
      'ADMIN') {
      router.replace('/');
      return;
    }
    setAdmin(storedUser);
    // Get the latest saved profile without delaying existing dashboard requests.
    void fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }).then(async (response) => {
      if (!response.ok) return;
      const me = await response.json();
      if (me && me.role === 'ADMIN') saveAdminLocally(me);
    }).catch((profileLoadError) => {
      console.error('Admin profile fetch error:', profileLoadError);
    });
    if (showRefresh) {
      setRefreshing(true);
    }
    else {
      setLoading(true);
    }
    setError('');
    try {
      const [dashboardResponse, revenueResponse, paymentsResponse, guidesResponse,] = await Promise.all([
        fetch(`${API_URL}/admin-dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        }),
        fetch(`${API_URL}/admin-dashboard/revenue`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        }),
        fetch(`${API_URL}/admin-dashboard/payments`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        }),
        fetch(`${API_URL}/admin-dashboard/guides/pending`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        }),
      ]);
      if (dashboardResponse.status ===
        401 ||
        dashboardResponse.status ===
          403) {
        clearSession();
        router.replace('/login');
        return;
      }
      if (!dashboardResponse.ok) {
        const apiError = await dashboardResponse
          .json()
          .catch(() => ({}));
        throw new Error(Array.isArray(apiError.message)
          ? apiError.message.join(', ')
          : apiError.message ||
            'Unable to load dashboard.');
      }
      const dashboardData = await dashboardResponse.json();
      setStats(dashboardData);
      if (revenueResponse.ok) {
        const revenueData = await revenueResponse.json();
        setRevenue({
          totalRevenue: revenueData.totalRevenue ??
            0,
          successfulPayments: revenueData.successfulPayments ??
            0,
          averagePayment: revenueData.averagePayment ??
            0,
          monthlyRevenue: Array.isArray(revenueData.monthlyRevenue)
            ? revenueData.monthlyRevenue
            : [],
        });
      }
      if (paymentsResponse.ok) {
        const paymentData = await paymentsResponse.json();
        setPayments(Array.isArray(paymentData)
          ? paymentData
          : []);
      }
      if (guidesResponse.ok) {
        const guideData = await guidesResponse.json();
        setPendingGuides(Array.isArray(guideData)
          ? guideData
          : []);
      }
    }
    catch (err) {
      setError(err instanceof Error
        ? err.message
        : 'Unable to load dashboard.');
    }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  /* =========================

     INITIAL LOAD

  ========================= */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* =========================

     VALUES

  ========================= */
  const totalUsers = stats.users ??
    stats.totalUsers ??
    0;
  const totalGuides = stats.guides ??
    stats.totalGuides ??
    0;
  const totalPackages = stats.packages ??
    stats.totalPackages ??
    0;
  const totalBookings = stats.bookings ??
    stats.totalBookings ??
    0;
  const totalPayments = stats.payments ??
    stats.totalPayments ??
    revenue.successfulPayments ??
    0;
  const totalAccounts = stats.totalAccounts ??
    totalUsers +
      totalGuides;
  const confirmedBookings = stats.confirmedBookings ??
    0;
  const pendingBookingCount = stats.pendingBookings ??
    0;
  const approvedGuides = stats.approvedGuides ??
    0;
  const rejectedGuides = stats.rejectedGuides ??
    0;
  const pendingGuideCount = stats.pendingGuides ??
    pendingGuides.length;
  const totalRevenue = revenue.totalRevenue ||
    stats.totalRevenue ||
    stats.revenue ||
    0;
  const successfulPayments = revenue.successfulPayments ||
    totalPayments;
  const averagePayment = revenue.averagePayment ||
    0;
  const otherBookings = Math.max(totalBookings -
    confirmedBookings -
    pendingBookingCount, 0);
  /* =========================

     CARD DATA

  ========================= */
  const summaryCards: SummaryCardItem[] = [
    {
      title: 'Total Accounts',
      value: totalAccounts,
      subtitle: 'Platform members',
      icon: Users,
      className: styles.orangeCard,
      iconClass: styles.orangeIcon,
      trend: '+ Active',
    },
    {
      title: 'Travellers',
      value: totalUsers,
      subtitle: 'Registered users',
      icon: Globe2,
      className: styles.blueCard,
      iconClass: styles.blueIcon,
      trend: 'Users',
      href: '/admin/users',
    },
    {
      title: 'Tour Guides',
      value: totalGuides,
      subtitle: `${pendingGuideCount} pending`,
      icon: UserCheck,
      className: styles.pinkCard,
      iconClass: styles.pinkIcon,
      trend: `${approvedGuides} approved`,
      href: '/admin/guides',
    },
    {
      title: 'Packages',
      value: totalPackages,
      subtitle: 'Travel packages',
      icon: Package,
      className: styles.greenCard,
      iconClass: styles.greenIcon,
      trend: 'Available',
      href: '/admin/packages',
    },
    {
      title: 'Bookings',
      value: totalBookings,
      subtitle: `${pendingBookingCount} pending`,
      icon: BookOpenCheck,
      className: styles.purpleCard,
      iconClass: styles.purpleIcon,
      trend: `${confirmedBookings} confirmed`,
      href: '/admin/bookings',
    },
    {
      title: 'Revenue',
      value: `$${formatCompactMoney(totalRevenue)}`,
      subtitle: `${successfulPayments} successful payments`,
      icon: CircleDollarSign,
      className: styles.cyanCard,
      iconClass: styles.cyanIcon,
      trend: 'Total',
    },
    {
      title: 'Payments',
      value: successfulPayments,
      subtitle: 'Successful records',
      icon: CreditCard,
      className: styles.redCard,
      iconClass: styles.redIcon,
      trend: 'Processed',
      href: '/admin/payments',
    },
    {
      title: 'Avg. Payment',
      value: `$${formatCompactMoney(averagePayment)}`,
      subtitle: 'Average transaction',
      icon: WalletCards,
      className: styles.darkCard,
      iconClass: styles.darkIcon,
      trend: 'Average',
    },
  ];
  /* =========================

     CHART DATA

  ========================= */
  const activityData = [
    {
      name: 'Travellers',
      value: totalUsers,
    },
    {
      name: 'Guides',
      value: totalGuides,
    },
    {
      name: 'Packages',
      value: totalPackages,
    },
    {
      name: 'Bookings',
      value: totalBookings,
    },
  ];
  const bookingStatusData = [
    {
      name: 'Confirmed',
      value: confirmedBookings,
    },
    {
      name: 'Pending',
      value: pendingBookingCount,
    },
    {
      name: 'Other',
      value: otherBookings,
    },
  ].filter((item) => item.value > 0);
  const guideStatusData = [
    {
      name: 'Approved',
      value: approvedGuides,
    },
    {
      name: 'Pending',
      value: pendingGuideCount,
    },
    {
      name: 'Rejected',
      value: rejectedGuides,
    },
  ].filter((item) => item.value > 0);
  const monthlyRevenueData = revenue.monthlyRevenue.map((item) => ({
    month: getMonthName(item._id.month),
    revenue: item.revenue,
    payments: item.payments,
  }));
  const revenueChartData = monthlyRevenueData.length >
    0
    ? monthlyRevenueData
    : [
      {
        month: 'No Data',
        revenue: 0,
        payments: 0,
      },
    ];
  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  /* =========================

     LOADING

  ========================= */
  if (loading) {
    return (<main className={styles.loadingPage}>

    <div className={styles.loader}/>

    <span>

      Preparing your

      dashboard...

    </span>

    </main>);
  }
  /* =========================

     UI

  ========================= */
  return (<main className={styles.page}>

    <section className={styles.shell}>

    {/* =====================

      SIDEBAR

    ===================== */}

    <aside className={styles.sidebar}>

      <button type="button" className={styles.logo} title="Dashboard" onClick={() => router.push('/admin')}>

      <Globe2 size={23}/>

      </button>

      <nav className={styles.sideNav}>

      {sidebarItems.map((item) => {
      const Icon = item.icon;
      return (<button key={item.label} type="button" title={item.label} className={`${styles.sideButton} ${item.active
          ? styles.sideButtonActive
          : ''}`} onClick={() => navigateTo(item.href)}>

          <Icon size={18}/>

          </button>);
    })}

      </nav>

      <div className={styles.sideBottom}>

      <button type="button" title="Admin Profile Settings" className={styles.sideButton} onClick={() => openProfileModal('edit')}>

        <Settings size={18}/>

      </button>

      <button type="button" title="Logout" className={styles.sideButton} onClick={askLogout}>

        <LogOut size={18}/>

      </button>

      </div>

    </aside>

    {/* =====================

      MAIN

    ===================== */}

    <div className={styles.main}>

      {/* =================

      TOP BAR

    ================= */}

      <header className={styles.topbar}>

      <button type="button" className={styles.wordmark} onClick={() => router.push('/admin')}>

        Global

        <span>

        Vista

        </span>

      </button>

      <nav className={styles.topNav}>

        <button type="button" className={styles.topNavActive} onClick={() => router.push('/admin')}>

        Dashboard

        </button>

        <button type="button" onClick={() => router.push('/admin/users')}>

        Users

        </button>

        <button type="button" onClick={() => router.push('/admin/guides')}>

        Guides

        </button>

        <button type="button" onClick={() => router.push('/admin/destinations')}>

        Destinations

        </button>

        <button type="button" onClick={() => router.push('/admin/packages')}>

        Packages

        </button>

        <button type="button" onClick={() => router.push('/admin/travel-plans')}>

        Travel Plans

        </button>

        <button type="button" onClick={() => router.push('/admin/bookings')}>

        Bookings

        </button>

        <button type="button" onClick={() => router.push('/admin/payments')}>

        Payments

        </button>

      </nav>

      <div className={styles.topActions}>

        <div className={styles.searchBox}>

        <Search size={15}/>

        <input placeholder="Search"/>

        </div>

        <button type="button" className={styles.circleButton} onClick={() => pendingGuideCount >
      0
      ? router.push('/admin/guides')
      : undefined}>

        <Bell size={17}/>

        {pendingGuideCount >
      0 && (<span className={styles.notification}/>)}

        </button>

        <div className={styles.profileMenuWrapper} ref={profileMenuRef}>
          <button
            type="button"
            className={`${styles.profile} ${styles.profileTrigger}`}
            onClick={() => setProfileMenuOpen((open) => !open)}
            aria-label="Open administrator profile menu"
            aria-expanded={profileMenuOpen}
            aria-haspopup="menu"
          >
            <div className={styles.avatar}>
              {admin?.profileImage && !profileImageFailed ? (
                <img
                  src={getProfileImageUrl(admin.profileImage)}
                  alt="Admin profile"
                  className={styles.profileAvatarImage}
                  onError={() => setProfileImageFailed(true)}
                />
              ) : (
                (admin?.name || 'A').charAt(0).toUpperCase()
              )}
            </div>
            <div className={styles.profileText}>
              <strong>{admin?.name || 'Admin'}</strong>
              <span>Administrator</span>
            </div>
            <ChevronDown size={14} className={profileMenuOpen ? styles.profileChevronOpen : ''} />
          </button>

          {profileMenuOpen && (
            <div className={styles.profileDropdown} role="menu" aria-label="Admin account options">
              <div className={styles.profileDropdownHeader}>
                <div className={styles.profileDropdownAvatar}>
                  {admin?.profileImage && !profileImageFailed ? (
                    <img
                      src={getProfileImageUrl(admin.profileImage)}
                      alt=""
                      onError={() => setProfileImageFailed(true)}
                    />
                  ) : ((admin?.name || 'A').charAt(0).toUpperCase())}
                </div>
                <div>
                  <strong>{admin?.name || 'Admin'}</strong>
                  <span>{admin?.email || 'Administrator'}</span>
                </div>
              </div>
              <div className={styles.profileDropdownDivider} />
              <button type="button" role="menuitem" onClick={() => openProfileModal('edit')}>
                <Pencil size={17} /> Edit Profile
              </button>
              <button type="button" role="menuitem" onClick={() => openProfileModal('password')}>
                <KeyRound size={17} /> Change Password
              </button>
              <div className={styles.profileDropdownDivider} />
              <button type="button" role="menuitem" className={styles.profileDropdownLogout} onClick={askLogout}>
                <LogOut size={17} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      </header>

      {/* =================

      CONTENT

    ================= */}

      <div className={styles.content}>

      {/* WELCOME */}

      <section className={styles.welcome}>

        <div>

        <span className={styles.welcomeLabel}>

          ADMIN DASHBOARD

        </span>

        <h1>

          Welcome Back,{' '}

          <strong>

          {admin?.name ||
      'Admin'}

          </strong>

        </h1>

        <p>

          Here&apos;s

          what&apos;s

          happening with

          GlobalVista today.

        </p>

        </div>

        <div className={styles.welcomeActions}>

        <div className={styles.datePill}>

          <CalendarDays size={15}/>

          {today}

        </div>

        <button type="button" className={styles.refresh} onClick={() => loadDashboard(true)} disabled={refreshing}>

          <RefreshCw size={15} className={refreshing
      ? styles.spin
      : ''}/>

          Refresh

        </button>

        </div>

      </section>

      {/* ERROR */}

      {error && (<div className={styles.errorBox}>

        <strong>

          Unable to load

          dashboard

        </strong>

        <span>

          {error}

        </span>

        </div>)}

      {/* =================

      SUMMARY CARDS

    ================= */}

      <section className={styles.summaryGrid}>

        {summaryCards.map((item) => {
      const Icon = item.icon;
      return (<article key={item.title} className={`${styles.summaryCard} ${item.className}`} onClick={() => item.href
          ? router.push(item.href)
          : undefined} onKeyDown={(event) => {
          if (!item.href) {
            return;
          }
          if (event.key ===
            'Enter' ||
            event.key ===
              ' ') {
            event.preventDefault();
            router.push(item.href);
          }
        }} role={item.href
          ? 'button'
          : undefined} tabIndex={item.href
          ? 0
          : undefined}>

            <div className={styles.summaryCardTop}>

            <div className={`${styles.summaryIcon} ${item.iconClass}`}>

              <Icon size={19}/>

            </div>

            <span className={styles.summaryTrend}>

              {item.trend}

            </span>

            </div>

            <div className={styles.summaryValue}>

            {item.value}

            </div>

            <strong className={styles.summaryTitle}>

            {item.title}

            </strong>

            <span className={styles.summarySubtitle}>

            {item.subtitle}

            </span>

          </article>);
    })}

      </section>

      {/* =================

      MAIN CHARTS

    ================= */}

      <section className={styles.chartGrid}>

        {/* PLATFORM ACTIVITY */}

        <article className={`${styles.panel} ${styles.activityPanel}`}>

        <div className={styles.panelHeader}>

          <div>

          <span>

            PLATFORM OVERVIEW

          </span>

          <h2>

            System Activity

          </h2>

          </div>

          <div className={styles.liveBadge}>

          <i />

          Live

          </div>

        </div>

        <div className={styles.largeChart}>

          <ResponsiveContainer width="100%" height="100%">

          <BarChart data={activityData} barCategoryGap="28%">

            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#edf0f4"/>

            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{
      fill: '#7c8795',
      fontSize: 10,
    }}/>

            <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{
      fill: '#9aa4af',
      fontSize: 9,
    }}/>

            <Tooltip cursor={{
      fill: '#f8fafc',
    }} contentStyle={{
      border: '1px solid #e7ebf0',
      borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(15,23,42,.08)',
    }}/>

            <Bar dataKey="value" radius={[
      9,
      9,
      2,
      2,
    ]}>

            {activityData.map((entry, index) => (<Cell key={entry.name} fill={[
        '#3b82f6',
        '#ec4899',
        '#10b981',
        '#8b5cf6',
      ][index %
        4]}/>))}

            </Bar>

          </BarChart>

          </ResponsiveContainer>

        </div>

        </article>

        {/* BOOKING STATUS */}

        <article className={styles.panel}>

        <div className={styles.panelHeader}>

          <div>

          <span>

            BOOKINGS

          </span>

          <h2>

            Booking Status

          </h2>

          </div>

          <BookOpenCheck size={20} className={styles.orangeText}/>

        </div>

        <div className={styles.pieChart}>

          <ResponsiveContainer width="100%" height="100%">

          <PieChart>

            <Pie data={bookingStatusData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={5}>

            {bookingStatusData.map((item, index) => (<Cell key={item.name} fill={bookingColors[index %
        bookingColors.length]}/>))}

            </Pie>

            <Tooltip />

            <Legend iconType="circle" wrapperStyle={{
      fontSize: '10px',
    }}/>

          </PieChart>

          </ResponsiveContainer>

          <div className={styles.pieCenter}>

          <strong>

            {totalBookings}

          </strong>

          <span>

            Total

          </span>

          </div>

        </div>

        </article>

        {/* GUIDE STATUS */}

        <article className={styles.panel}>

        <div className={styles.panelHeader}>

          <div>

          <span>

            TOUR GUIDES

          </span>

          <h2>

            Guide Status

          </h2>

          </div>

          <button type="button" className={styles.chartAction} onClick={() => router.push('/admin/guides')}>

          <ShieldCheck size={20}/>

          </button>

        </div>

        <div className={styles.pieChart}>

          <ResponsiveContainer width="100%" height="100%">

          <PieChart>

            <Pie data={guideStatusData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={5}>

            {guideStatusData.map((item, index) => (<Cell key={item.name} fill={guideColors[index %
        guideColors.length]}/>))}

            </Pie>

            <Tooltip />

            <Legend iconType="circle" wrapperStyle={{
      fontSize: '10px',
    }}/>

          </PieChart>

          </ResponsiveContainer>

          <div className={styles.pieCenter}>

          <strong>

            {totalGuides}

          </strong>

          <span>

            Guides

          </span>

          </div>

        </div>

        </article>

      </section>

      {/* =================

      REVENUE

    ================= */}

      <section className={styles.revenueGrid}>

        <article className={`${styles.panel} ${styles.revenuePanel}`}>

        <div className={styles.panelHeader}>

          <div>

          <span>

            FINANCIAL

            ANALYTICS

          </span>

          <h2>

            Revenue

            Overview

          </h2>

          </div>

          <div className={styles.revenueTotal}>

          <span>

            Total Revenue

          </span>

          <strong>

            $

            {formatMoney(totalRevenue)}

          </strong>

          </div>

        </div>

        <div className={styles.revenueChart}>

          <ResponsiveContainer width="100%" height="100%">

          <AreaChart data={revenueChartData}>

            <defs>

            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">

              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.38}/>

              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02}/>

            </linearGradient>

            </defs>

            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#edf0f4"/>

            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{
      fill: '#8a94a0',
      fontSize: 10,
    }}/>

            <YAxis axisLine={false} tickLine={false} tick={{
      fill: '#9aa4af',
      fontSize: 9,
    }}/>

            <Tooltip contentStyle={{
      border: '1px solid #e8eaf0',
      borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(15,23,42,.08)',
    }}/>

            <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fill="url(#revenueFill)" activeDot={{
      r: 6,
    }}/>

          </AreaChart>

          </ResponsiveContainer>

        </div>

        </article>

        {/* FINANCIAL INFO */}

        <article className={styles.financialPanel}>

        <div className={styles.financeIcon}>

          <WalletCards size={25}/>

        </div>

        <span className={styles.financeLabel}>

          TOTAL BALANCE

        </span>

        <h2>

          $

          {formatMoney(totalRevenue)}

        </h2>

        <p>

          Revenue from

          successful

          GlobalVista

          transactions.

        </p>

        <div className={styles.financeStats}>

          <div>

          <span>

            Successful

          </span>

          <strong>

            {successfulPayments}

          </strong>

          </div>

          <div>

          <span>

            Average

          </span>

          <strong>

            $

            {formatMoney(averagePayment)}

          </strong>

          </div>

        </div>

        </article>

      </section>

      {/* =================

      TABLES

    ================= */}

      <section className={styles.bottomGrid}>

        {/* PAYMENTS */}

        <article className={`${styles.panel} ${styles.paymentPanel}`}>

        <div className={styles.panelHeader}>

          <div>

          <span>

            TRANSACTIONS

          </span>

          <h2>

            Recent Payments

          </h2>

          </div>

          <button type="button" className={styles.viewButton} onClick={() => router.push('/admin/payments')}>

          View All

          <ArrowUpRight size={14}/>

          </button>

        </div>

        <div className={styles.paymentTable}>

          <div className={styles.tableHeader}>

          <span>

            Customer

          </span>

          <span>

            Date

          </span>

          <span>

            Method

          </span>

          <span>

            Status

          </span>

          <span>

            Amount

          </span>

          </div>

          {payments
      .slice(0, 5)
      .map((payment) => {
      const paymentUser = typeof payment.userId ===
        'object'
        ? payment.userId
        : null;
      const customerName = paymentUser?.name ||
        paymentUser?.email ||
        'Traveller';
      return (<div key={payment._id} className={styles.tableRow}>

              <div className={styles.customerCell}>

                <div className={styles.customerAvatar}>

                {customerName
          .charAt(0)
          .toUpperCase()}

                </div>

                <div>

                <strong>

                  {customerName}

                </strong>

                <small>

                  {payment.transactionId ||
          'Transaction'}

                </small>

                </div>

              </div>

              <span>

                {formatDate(payment.createdAt)}

              </span>

              <span className={styles.methodBadge}>

                {payment.paymentMethod ||
          'CARD'}

              </span>

              <span className={styles.successBadge}>

                <CheckCircle2 size={11}/>

                {payment.status ||
          'SUCCESS'}

              </span>

              <strong className={styles.amount}>

                $

                {formatMoney(payment.amount ||
          0)}

              </strong>

              </div>);
    })}

          {payments.length ===
      0 && (<div className={styles.emptyState}>

            No payments

            available.

          </div>)}

        </div>

        </article>

        {/* GUIDE APPLICATIONS */}

        <article className={styles.panel}>

        <div className={styles.panelHeader}>

          <div>

          <span>

            APPROVAL QUEUE

          </span>

          <h2>

            Guide

            Applications

          </h2>

          </div>

          <div className={styles.guideHeaderActions}>

          <div className={styles.applicationCount}>

            {pendingGuideCount}

          </div>

          <button type="button" className={styles.viewButton} onClick={() => router.push('/admin/guides')}>

            View All

            <ArrowUpRight size={14}/>

          </button>

          </div>

        </div>

        <div className={styles.guideList}>

          {pendingGuides
      .slice(0, 5)
      .map((guide) => (<button type="button" key={guide._id} className={styles.guideItem} onClick={() => router.push('/admin/guides')}>

              <div className={styles.guideAvatar}>

              {(guide.name ||
        'G')
        .charAt(0)
        .toUpperCase()}

              </div>

              <div className={styles.guideInfo}>

              <strong>

                {guide.name ||
        'Tour Guide'}

              </strong>

              <span>

                {guide.city ||
        guide.country ||
        'Location not set'}

              </span>

              </div>

              <div className={styles.pendingBadge}>

              <Clock3 size={11}/>

              Pending

              </div>

            </button>))}

          {pendingGuides.length ===
      0 && (<div className={styles.emptyGuide}>

            <ShieldCheck size={30}/>

            <strong>

            All Clear

            </strong>

            <span>

            No pending guide

            applications.

            </span>

          </div>)}

        </div>

        </article>

      </section>

      </div>

    </div>

    </section>

    {/* =========================
        ADMIN PROFILE MODALS - NEW
    ========================= */}
    {profileModal && (
      <div className={styles.adminProfileOverlay} onMouseDown={closeProfileModal}>
        <section
          className={styles.adminProfileModal}
          role="dialog"
          aria-modal="true"
          aria-label={profileModal === 'edit' ? 'Edit admin profile' : 'Change admin password'}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className={styles.adminProfileModalHeader}>
            <div>
              <span>GLOBALVISTA ADMIN</span>
              <h2>{profileModal === 'edit' ? 'My Profile' : 'Change Password'}</h2>
              <p>{profileModal === 'edit' ? 'Manage your administrator account details.' : 'Keep your administrator account secure.'}</p>
            </div>
            <button type="button" aria-label="Close profile dialog" onClick={closeProfileModal} disabled={profileSaving || imageUploading || passwordSaving}>
              <X size={20} />
            </button>
          </div>
          {profileModal === 'edit' ? (
            <form onSubmit={(event) => void handleSaveProfile(event)} className={styles.adminProfileForm}>
              <div className={styles.adminProfilePhotoRow}>
                <div className={styles.adminProfileBigAvatar}>
                  {admin?.profileImage && !profileImageFailed ? (
                    <img src={getProfileImageUrl(admin.profileImage)} alt="Current administrator profile" onError={() => setProfileImageFailed(true)} />
                  ) : ((admin?.name || 'A').charAt(0).toUpperCase())}
                </div>
                <div>
                  <strong>Profile Photo</strong>
                  <span>JPG, PNG or WEBP. Maximum 5 MB.</span>
                  <button type="button" className={styles.adminProfileUploadBtn} onClick={() => profileFileInputRef.current?.click()} disabled={imageUploading || profileSaving}>
                    {imageUploading ? <RefreshCw size={15} className={styles.spin} /> : <Camera size={15} />}
                    {imageUploading ? 'Uploading...' : 'Upload / Change Photo'}
                  </button>
                </div>
                <input
                  ref={profileFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className={styles.adminProfileHiddenInput}
                  onChange={(event) => void handleUploadProfileImage(event)}
                />
              </div>
              <label className={styles.adminProfileField}>
                <span>Full Name</span>
                <input type="text" value={profileName} onChange={(event) => setProfileName(event.target.value)} maxLength={100} required />
              </label>
              <label className={styles.adminProfileField}>
                <span>Email Address</span>
                <input type="email" value={admin?.email || ''} disabled />
              </label>
              <div className={styles.adminProfileFieldRow}>
                <label className={styles.adminProfileField}>
                  <span>Mobile Number</span>
                  <input type="tel" value={profileMobile} onChange={(event) => setProfileMobile(event.target.value)} maxLength={30} required />
                </label>
                <label className={styles.adminProfileField}>
                  <span>Country</span>
                  <input type="text" value={profileCountry} onChange={(event) => setProfileCountry(event.target.value)} maxLength={100} required />
                </label>
              </div>
              <div className={styles.adminProfileReadonlyNote}><ShieldCheck size={16} /> Email and Admin role cannot be changed here.</div>
              {profileError && <p className={styles.adminProfileError} role="alert">{profileError}</p>}
              {profileMessage && <p className={styles.adminProfileSuccess} role="status">{profileMessage}</p>}
              <div className={styles.adminProfileModalFooter}>
                <button type="button" className={styles.adminProfileCancel} onClick={closeProfileModal} disabled={profileSaving || imageUploading}>Cancel</button>
                <button type="submit" className={styles.adminProfileSubmit} disabled={profileSaving || imageUploading}>
                  {profileSaving ? 'Saving...' : 'Save Changes'} <ArrowUpRight size={16} />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={(event) => void handleChangePassword(event)} className={styles.adminProfileForm}>
              <label className={styles.adminProfileField}>
                <span>Current Password</span>
                <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required autoComplete="current-password" />
              </label>
              <label className={styles.adminProfileField}>
                <span>New Password</span>
                <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} required autoComplete="new-password" />
              </label>
              <label className={styles.adminProfileField}>
                <span>Confirm New Password</span>
                <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required autoComplete="new-password" />
              </label>
              <div className={styles.adminProfileReadonlyNote}><ShieldCheck size={16} /> Use at least 8 characters for your new password.</div>
              {profileError && <p className={styles.adminProfileError} role="alert">{profileError}</p>}
              {profileMessage && <p className={styles.adminProfileSuccess} role="status">{profileMessage}</p>}
              <div className={styles.adminProfileModalFooter}>
                <button type="button" className={styles.adminProfileCancel} onClick={closeProfileModal} disabled={passwordSaving}>Cancel</button>
                <button type="submit" className={styles.adminProfileSubmit} disabled={passwordSaving}>
                  {passwordSaving ? 'Updating...' : 'Update Password'} <KeyRound size={16} />
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    )}

    {logoutConfirmationOpen && (
      <div className={styles.adminProfileOverlay} onMouseDown={() => setLogoutConfirmationOpen(false)}>
        <section className={styles.adminLogoutDialog} role="alertdialog" aria-modal="true" aria-label="Confirm admin logout" onMouseDown={(event) => event.stopPropagation()}>
          <div className={styles.adminLogoutIcon}><LogOut size={24} /></div>
          <h2>Log out of GlobalVista?</h2>
          <p>You will be signed out of your administrator account.</p>
          <div className={styles.adminProfileModalFooter}>
            <button type="button" className={styles.adminProfileCancel} onClick={() => setLogoutConfirmationOpen(false)}>Stay Logged In</button>
            <button type="button" className={styles.adminProfileLogoutConfirm} onClick={handleLogout}>Yes, Logout</button>
          </div>
        </section>
      </div>
    )}

  </main>);
}
/* =========================
   HELPERS
========================= */
function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}
function formatCompactMoney(value: number) {
  if (value >= 1000000) {
    return `${(value /
      1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value /
      1000).toFixed(1)}K`;
  }
  return String(value);
}
function formatDate(value?: string) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
function getMonthName(month: number) {
  return new Date(2026, month - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
  });
}

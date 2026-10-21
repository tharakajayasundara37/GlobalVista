
'use client';

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';

import { useRouter } from 'next/navigation';

import {
  ArrowUpRight,
  BadgeCheck,
  Bell,
  BookOpenCheck,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Globe2,
  KeyRound,
  Languages,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPinned,
  Pencil,
  Phone,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react';

import {
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

// GUIDE DASHBOARD'S OWN CSS.
// Does not import Admin CSS.
import styles from './page.module.css';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://globalvista-d7uz.onrender.com');

type PageName =
  | 'dashboard'
  | 'destinations'
  | 'bookings'
  | 'profile';

type Guide = {
  _id?: string;
  id?: string;
  publicId?: string;
  name?: string;
  email?: string;
  mobile?: string;
  country?: string;
  city?: string;
  languages?: string[];
  experienceYears?: number;
  about?: string;
  profileImage?: string;
  createdAt?: string;
  role?: string;
  guideStatus?: string;
};

type MenuItem = {
  label: string;
  page: PageName;
  icon: LucideIcon;
};

const MENU: MenuItem[] = [
  {
    label: 'Dashboard',
    page: 'dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Destinations',
    page: 'destinations',
    icon: MapPinned,
  },
  {
    label: 'Bookings',
    page: 'bookings',
    icon: BookOpenCheck,
  },
  {
    label: 'My Profile',
    page: 'profile',
    icon: UserRound,
  },
];

function getToken(): string | null {
  return (
    localStorage.getItem('globalvista_token') ||
    localStorage.getItem('token')
  );
}

function clearSession(): void {
  [
    'globalvista_token',
    'globalvista_user',
    'token',
    'user',
  ].forEach((key) => localStorage.removeItem(key));
}

function saveStoredUser(user: Guide): void {
  const json = JSON.stringify(user);
  localStorage.setItem('globalvista_user', json);
  localStorage.setItem('user', json);
}

function getMessage(
  data: unknown,
  fallback = 'Request failed.',
): string {
  if (data && typeof data === 'object') {
    const value = (data as { message?: unknown }).message;

    if (typeof value === 'string') return value;

    if (Array.isArray(value)) {
      return value.join(', ');
    }
  }

  return fallback;
}

function unwrapUser(data: unknown): Guide {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid Backend response.');
  }

  const result = data as Guide & { user?: Guide };

  return result.user &&
    typeof result.user === 'object'
    ? result.user
    : result;
}

function getPhotoUrl(path?: string): string {
  if (!path) return '';

  // Only profile photos. Never display
  // private NIC or passport files.

  const relative = path.startsWith('/')
    ? path
    : `/${path}`;

  if (
    /^\/uploads\/users\/[\w.-]+\.(png|jpg|jpeg|webp)$/i.test(
      relative,
    )
  ) {
    return `${API_URL}${relative}`;
  }

  if (
    /^https?:\/\/(localhost|127\.0\.0\.1):3001\/uploads\/users\/[\w.-]+\.(png|jpg|jpeg|webp)$/i.test(
      path,
    )
  ) {
    return path;
  }

  return '';
}

function formatDate(date?: string): string {
  if (!date) return 'Not available';

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return 'Not available';
  }

  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

async function fetchGuideProfile(
  signal?: AbortSignal,
): Promise<Guide> {
  const token = getToken();

  if (!token) {
    throw new Error('NO_SESSION');
  }

  const response = await fetch(`${API_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
    signal,
  });

  const data: unknown = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}: ${getMessage(data)}`,
    );
  }

  const user = unwrapUser(data);

  if (user.role !== 'GUIDE') {
    throw new Error(
      'This account is not a Tour Guide account.',
    );
  }

  if (user.guideStatus !== 'APPROVED') {
    throw new Error(
      'Your Tour Guide account is not approved.',
    );
  }

  return user;
}

export default function GuideDashboardPage() {
  const router = useRouter();

  const menuRef = useRef<HTMLDivElement | null>(null);
  const photoRef = useRef<HTMLInputElement | null>(null);

  const [guide, setGuide] = useState<Guide | null>(null);
  const [page, setPage] = useState<PageName>('dashboard');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [dialog, setDialog] =
    useState<'edit' | 'password' | null>(null);

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [country, setCountry] = useState('');

  const [currentPassword, setCurrentPassword] =
    useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [photoFailed, setPhotoFailed] = useState(false);

  // INITIAL PROFILE LOAD

  useEffect(() => {
    const controller = new AbortController();

    if (!getToken()) {
      router.replace('/login');
      return () => controller.abort();
    }

    fetchGuideProfile(controller.signal)
      .then((user) => {
        if (controller.signal.aborted) return;

        setGuide(user);
        saveStoredUser(user);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;

        setError(
          reason instanceof Error
            ? reason.message
            : 'Unable to load Guide account.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [router]);

  // CLOSE PROFILE MENU OUTSIDE

  useEffect(() => {
    if (!menuOpen) return;

    const closeOutside = (event: MouseEvent) => {
      if (
        !menuRef.current?.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      closeOutside,
    );
    document.addEventListener(
      'keydown',
      closeEscape,
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        closeOutside,
      );
      document.removeEventListener(
        'keydown',
        closeEscape,
      );
    };
  }, [menuOpen]);

  async function refreshProfile() {
    setRefreshing(true);
    setError('');

    try {
      const user = await fetchGuideProfile();

      setGuide(user);
      saveStoredUser(user);
      setPhotoFailed(false);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to refresh Guide profile.',
      );
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }

  function logout() {
    clearSession();
    setLogoutOpen(false);
    setMenuOpen(false);
    router.replace('/login');
  }

  async function authenticatedRequest(
    path: string,
    options: RequestInit,
  ): Promise<unknown> {
    const token = getToken();

    if (!token) {
      throw new Error('Your login session is missing.');
    }

    const response = await fetch(
      `${API_URL}${path}`,
      {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const result: unknown = await response
      .json()
      .catch(() => null);

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${getMessage(result)}`,
      );
    }

    return result;
  }

  function updateLocalUser(updated: Guide) {
    setGuide((previous) => {
      const combined = {
        ...previous,
        ...updated,
      } as Guide;

      saveStoredUser(combined);

      return combined;
    });

    setPhotoFailed(false);
  }

  function openDialog(mode: 'edit' | 'password') {
    setName(guide?.name || '');
    setMobile(guide?.mobile || '');
    setCountry(guide?.country || '');

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');

    setFormError('');
    setSuccess('');

    setMenuOpen(false);
    setDialog(mode);
  }

  function closeDialog() {
    if (saving || uploading) return;

    setDialog(null);
    setFormError('');
    setSuccess('');
  }

  async function saveProfile(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !name.trim() ||
      !mobile.trim() ||
      !country.trim()
    ) {
      setFormError(
        'Please enter your name, mobile and country.',
      );
      return;
    }

    setSaving(true);
    setFormError('');
    setSuccess('');

    try {
      const result = await authenticatedRequest(
        '/users/me/profile',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            mobile: mobile.trim(),
            country: country.trim(),
          }),
        },
      );

      updateLocalUser(unwrapUser(result));
      setSuccess('Profile updated successfully.');
    } catch (reason) {
      setFormError(
        reason instanceof Error
          ? reason.message
          : 'Unable to save profile.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    setFormError('');
    setSuccess('');

    if (
      ![
        'image/jpeg',
        'image/png',
        'image/webp',
      ].includes(file.type)
    ) {
      setFormError(
        'Choose JPG, PNG or WEBP.',
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError(
        'Photo must be 5 MB or smaller.',
      );
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);

    try {
      const result = await authenticatedRequest(
        '/users/me/profile-image',
        {
          method: 'POST',
          body: formData,
        },
      );

      updateLocalUser(unwrapUser(result));
      setSuccess('Photo uploaded successfully.');
    } catch (reason) {
      setFormError(
        reason instanceof Error
          ? reason.message
          : 'Photo upload failed.',
      );
    } finally {
      setUploading(false);
    }
  }

  async function changePassword(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setFormError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setFormError(
        'New password must have at least 8 characters.',
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setSaving(true);

    try {
      await authenticatedRequest('/users/me/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setSuccess('Password changed successfully.');
    } catch (reason) {
      setFormError(
        reason instanceof Error
          ? reason.message
          : 'Unable to update password.',
      );
    } finally {
      setSaving(false);
    }
  }

  function searchSections(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const query = search.trim().toLowerCase();

    if (!query) return;

    const found = MENU.find((item) =>
      item.label.toLowerCase().includes(query),
    );

    if (found) {
      setPage(found.page);
      setSearch('');
      setError('');
    } else {
      setError(
        'Section not found. Search Dashboard, Destinations, Bookings or My Profile.',
      );
    }
  }

  // LOADING

  if (loading) {
    return (
      <main className={styles.loadingPage}>
        <div className={styles.loader} />
        <span>Preparing your Guide Dashboard...</span>
      </main>
    );
  }

  if (!guide) {
    return (
      <main className={styles.loadingPage}>
        <ShieldCheck size={34} />
        <strong>Unable to load Guide Dashboard</strong>
        <span>
          {error || 'Guide profile is unavailable.'}
        </span>

        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => void refreshProfile()}
        >
          Try Again
        </button>

        <button
          type="button"
          className={styles.outlineButton}
          onClick={logout}
        >
          Sign Out
        </button>
      </main>
    );
  }

  // GUIDE INFORMATION

  const displayName = guide.name || 'Tour Guide';
  const firstName =
    displayName.trim().split(/\s+/)[0] || 'Guide';

  const avatarLetter =
    displayName.charAt(0).toUpperCase();

  const photoUrl = photoFailed
    ? ''
    : getPhotoUrl(guide.profileImage);

  const languages = Array.isArray(guide.languages)
    ? guide.languages
    : [];

  const location =
    [guide.city, guide.country]
      .filter(Boolean)
      .join(', ') || 'Not provided';

  const today = new Date().toLocaleDateString(
    'en-GB',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  );

  const profileFields = [
    { name: 'Name', done: Boolean(guide.name?.trim()) },
    { name: 'Email', done: Boolean(guide.email?.trim()) },
    { name: 'Mobile', done: Boolean(guide.mobile?.trim()) },
    { name: 'Country', done: Boolean(guide.country?.trim()) },
    { name: 'City', done: Boolean(guide.city?.trim()) },
    { name: 'Languages', done: languages.length > 0 },
    { name: 'About', done: Boolean(guide.about?.trim()) },
  ];

  const completed = profileFields.filter(
    (item) => item.done,
  ).length;

  const completion = Math.round(
    (completed / profileFields.length) * 100,
  );

  const activityData = profileFields.map(
    (item) => ({
      name: item.name,
      value: item.done ? 1 : 0,
    }),
  );

  const completionData = [
    {
      name: 'Complete',
      value: completed,
    },
    {
      name: 'Missing',
      value: profileFields.length - completed,
    },
  ].filter((item) => item.value > 0);

  // ADMIN-STYLE 8 SUMMARY CARDS

  const cards = [
    {
      title: 'Account Status',
      value: 'Approved',
      subtitle: 'Admin verified',
      icon: BadgeCheck,
      card: styles.greenCard,
      iconColor: styles.greenIcon,
      trend: 'ACTIVE',
    },
    {
      title: 'Experience',
      value: guide.experienceYears ?? '—',
      subtitle: 'Years of experience',
      icon: Clock3,
      card: styles.orangeCard,
      iconColor: styles.orangeIcon,
      trend: 'GUIDE',
    },
    {
      title: 'Languages',
      value: languages.length,
      subtitle: 'Languages registered',
      icon: Languages,
      card: styles.blueCard,
      iconColor: styles.blueIcon,
      trend: 'SKILLS',
    },
    {
      title: 'Profile Completion',
      value: `${completion}%`,
      subtitle: `${completed} of 7 profile fields`,
      icon: UserRound,
      card: styles.pinkCard,
      iconColor: styles.pinkIcon,
      trend: 'PROFILE',
    },
    {
      title: 'Destinations',
      value: '—',
      subtitle: 'Integration pending',
      icon: MapPinned,
      card: styles.purpleCard,
      iconColor: styles.purpleIcon,
      trend: 'PENDING',
    },
    {
      title: 'Bookings',
      value: '—',
      subtitle: 'Integration pending',
      icon: BookOpenCheck,
      card: styles.cyanCard,
      iconColor: styles.cyanIcon,
      trend: 'PENDING',
    },
    {
      title: 'Account Type',
      value: 'Guide',
      subtitle: 'Verified Tour Guide',
      icon: ShieldCheck,
      card: styles.redCard,
      iconColor: styles.redIcon,
      trend: 'VERIFIED',
    },
    {
      title: 'Registration',
      value: guide.createdAt
        ? new Date(guide.createdAt).getFullYear()
        : '—',
      subtitle: formatDate(guide.createdAt),
      icon: CalendarDays,
      card: styles.darkCard,
      iconColor: styles.darkIcon,
      trend: 'JOINED',
    },
  ];

  // PROFILE AVATAR

  const avatar = (className: string) => (
    <div className={className}>
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt="Guide profile"
          className={styles.profileAvatarImage}
          onError={() => setPhotoFailed(true)}
        />
      ) : (
        avatarLetter
      )}
    </div>
  );

  // PROFILE INFORMATION ITEMS

  const information = [
    {
      label: 'Full Name',
      value: displayName,
      icon: UserRound,
    },
    {
      label: 'Email',
      value: guide.email || 'Not provided',
      icon: Mail,
    },
    {
      label: 'Mobile',
      value: guide.mobile || 'Not provided',
      icon: Phone,
    },
    {
      label: 'Location',
      value: location,
      icon: MapPinned,
    },
    {
      label: 'Languages',
      value: languages.join(', ') || 'Not provided',
      icon: Languages,
    },
  ];

  const profileInformation = (
    <div className={styles.guideList}>
      {information.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className={styles.guideItem}
          >
            <div className={styles.guideAvatar}>
              <Icon size={17} />
            </div>

            <div className={styles.guideInfo}>
              <strong>{item.label}</strong>
              <span>{item.value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        {/* WHITE ICON SIDEBAR */}

        <aside className={styles.sidebar}>
          <button
            type="button"
            title="Guide Dashboard"
            className={styles.logo}
            onClick={() => setPage('dashboard')}
          >
            <Globe2 size={23} />
          </button>

          <nav
            className={styles.sideNav}
            aria-label="Guide navigation"
          >
            {MENU.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.page}
                  type="button"
                  title={item.label}
                  aria-label={item.label}
                  aria-current={
                    page === item.page
                      ? 'page'
                      : undefined
                  }
                  className={[
                    styles.sideButton,
                    page === item.page
                      ? styles.sideButtonActive
                      : '',
                  ].join(' ')}
                  onClick={() => setPage(item.page)}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </nav>

          <div className={styles.sideBottom}>
            <button
              type="button"
              title="Profile Settings"
              className={styles.sideButton}
              onClick={() => openDialog('edit')}
            >
              <Settings size={18} />
            </button>

            <button
              type="button"
              title="Logout"
              className={styles.sideButton}
              onClick={() => setLogoutOpen(true)}
            >
              <LogOut size={18} />
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}

        <div className={styles.main}>
          {/* TOPBAR */}

          <header className={styles.topbar}>
            <button
              type="button"
              className={styles.wordmark}
              onClick={() => setPage('dashboard')}
            >
              Global<span>Vista</span>
            </button>

            <nav
              className={styles.topNav}
              aria-label="Top navigation"
            >
              {MENU.map((item) => (
                <button
                  key={item.page}
                  type="button"
                  className={
                    page === item.page
                      ? styles.topNavActive
                      : ''
                  }
                  onClick={() => setPage(item.page)}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className={styles.topActions}>
              <form
                className={styles.searchBox}
                onSubmit={searchSections}
              >
                <Search size={15} />

                <input
                  type="search"
                  placeholder="Search"
                  aria-label="Search dashboard sections"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />
              </form>

              <button
                type="button"
                title="Guide Verification"
                aria-label="Guide verification"
                className={styles.circleButton}
                onClick={() => setPage('profile')}
              >
                <Bell size={17} />
              </button>

              {/* PROFILE MENU */}

              <div
                className={styles.profileMenuWrapper}
                ref={menuRef}
              >
                <button
                  type="button"
                  className={`${styles.profile} ${styles.profileTrigger}`}
                  aria-label="Guide account menu"
                  aria-expanded={menuOpen}
                  onClick={() =>
                    setMenuOpen((value) => !value)
                  }
                >
                  {avatar(styles.avatar)}

                  <div className={styles.profileText}>
                    <strong>{displayName}</strong>
                    <span>Tour Guide</span>
                  </div>

                  <ChevronDown
                    size={14}
                    className={
                      menuOpen
                        ? styles.profileChevronOpen
                        : ''
                    }
                  />
                </button>

                {menuOpen && (
                  <div
                    className={styles.profileDropdown}
                    role="menu"
                  >
                    <div
                      className={styles.profileDropdownHeader}
                    >
                      {avatar(styles.profileDropdownAvatar)}

                      <div>
                        <strong>{displayName}</strong>
                        <span>{guide.email}</span>
                      </div>
                    </div>

                    <div
                      className={styles.profileDropdownDivider}
                    />

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => openDialog('edit')}
                    >
                      <Pencil size={17} />
                      Edit Profile
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => openDialog('password')}
                    >
                      <KeyRound size={17} />
                      Change Password
                    </button>

                    <div
                      className={styles.profileDropdownDivider}
                    />

                    <button
                      type="button"
                      role="menuitem"
                      className={styles.profileDropdownLogout}
                      onClick={() => {
                        setMenuOpen(false);
                        setLogoutOpen(true);
                      }}
                    >
                      <LogOut size={17} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className={styles.content}>
            {/* WELCOME */}

            <section className={styles.welcome}>
              <div>
                <span className={styles.welcomeLabel}>
                  TOUR GUIDE DASHBOARD
                </span>

                <h1>
                  {page === 'dashboard' ? (
                    <>
                      Welcome Back,{' '}
                      <strong>{firstName}</strong>
                    </>
                  ) : (
                    <strong>
                      {
                        MENU.find(
                          (item) => item.page === page,
                        )?.label
                      }
                    </strong>
                  )}
                </h1>

                <p>
                  Here&apos;s what&apos;s happening
                  with your GlobalVista guide
                  account today.
                </p>
              </div>

              <div className={styles.welcomeActions}>
                <div className={styles.datePill}>
                  <CalendarDays size={15} />
                  {today}
                </div>

                <button
                  type="button"
                  className={styles.refresh}
                  disabled={refreshing}
                  onClick={() =>
                    void refreshProfile()
                  }
                >
                  <RefreshCw
                    size={15}
                    className={
                      refreshing ? styles.spin : ''
                    }
                  />
                  Refresh
                </button>
              </div>
            </section>

            {/* ERROR */}

            {error && (
              <div
                className={styles.errorBox}
                role="alert"
              >
                <strong>Notice</strong>
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError('')}
                  aria-label="Dismiss notice"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {/* DASHBOARD OVERVIEW */}

            {page === 'dashboard' && (
              <>
                {/* EIGHT SUMMARY CARDS */}

                <section className={styles.summaryGrid}>
                  {cards.map((item) => {
                    const Icon = item.icon;

                    return (
                      <article
                        key={item.title}
                        className={`${styles.summaryCard} ${item.card}`}
                      >
                        <div
                          className={styles.summaryCardTop}
                        >
                          <div
                            className={`${styles.summaryIcon} ${item.iconColor}`}
                          >
                            <Icon size={19} />
                          </div>

                          <span
                            className={styles.summaryTrend}
                          >
                            {item.trend}
                          </span>
                        </div>

                        <div
                          className={styles.summaryValue}
                        >
                          {item.value}
                        </div>

                        <strong
                          className={styles.summaryTitle}
                        >
                          {item.title}
                        </strong>

                        <span
                          className={styles.summarySubtitle}
                        >
                          {item.subtitle}
                        </span>
                      </article>
                    );
                  })}
                </section>

                {/* THREE CHART PANELS */}

                <section className={styles.chartGrid}>
                  {/* ACTIVITY BAR CHART */}

                  <article
                    className={`${styles.panel} ${styles.activityPanel}`}
                  >
                    <div
                      className={styles.panelHeader}
                    >
                      <div>
                        <span>GUIDE PROFILE</span>
                        <h2>Profile Readiness</h2>
                      </div>

                      <div className={styles.liveBadge}>
                        <i />
                        Verified
                      </div>
                    </div>

                    <div
                      className={styles.largeChart}
                    >
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <BarChart
                          data={activityData}
                          barCategoryGap="28%"
                        >
                          <CartesianGrid
                            strokeDasharray="4 4"
                            vertical={false}
                            stroke="#edf0f4"
                          />

                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: '#7c8795',
                              fontSize: 9,
                            }}
                          />

                          <YAxis
                            domain={[0, 1]}
                            ticks={[0, 1]}
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: '#9aa4af',
                              fontSize: 9,
                            }}
                          />

                          <Tooltip
                            formatter={(value) =>
                              Number(value) === 1
                                ? 'Complete'
                                : 'Missing'
                            }
                          />

                          <Bar
                            dataKey="value"
                            radius={[9, 9, 2, 2]}
                          >
                            {activityData.map(
                              (entry) => (
                                <Cell
                                  key={entry.name}
                                  fill={
                                    entry.value
                                      ? '#10b981'
                                      : '#e5e7eb'
                                  }
                                />
                              ),
                            )}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </article>

                  {/* COMPLETION PIE CHART */}

                  <article className={styles.panel}>
                    <div
                      className={styles.panelHeader}
                    >
                      <div>
                        <span>YOUR PROFILE</span>
                        <h2>Profile Completion</h2>
                      </div>

                      <UserRound
                        size={20}
                        className={styles.orangeText}
                      />
                    </div>

                    <div className={styles.pieChart}>
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <PieChart>
                          <Pie
                            data={completionData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={52}
                            outerRadius={80}
                            paddingAngle={
                              completionData.length > 1
                                ? 5
                                : 0
                            }
                          >
                            {completionData.map(
                              (entry) => (
                                <Cell
                                  key={entry.name}
                                  fill={
                                    entry.name === 'Complete'
                                      ? '#10b981'
                                      : '#e5e7eb'
                                  }
                                />
                              ),
                            )}
                          </Pie>

                          <Tooltip />

                          <Legend
                            iconType="circle"
                            wrapperStyle={{
                              fontSize: '10px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      <div className={styles.pieCenter}>
                        <strong>{completion}%</strong>
                        <span>Completed</span>
                      </div>
                    </div>
                  </article>

                  {/* GUIDE APPROVAL PIE CHART */}

                  <article className={styles.panel}>
                    <div
                      className={styles.panelHeader}
                    >
                      <div>
                        <span>VERIFICATION</span>
                        <h2>Guide Status</h2>
                      </div>

                      <ShieldCheck
                        size={20}
                        className={styles.greenText}
                      />
                    </div>

                    <div className={styles.pieChart}>
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: 'Approved',
                                value: 1,
                              },
                            ]}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={52}
                            outerRadius={80}
                          >
                            <Cell fill="#22c55e" />
                          </Pie>

                          <Tooltip />

                          <Legend
                            iconType="circle"
                            wrapperStyle={{
                              fontSize: '10px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      <div className={styles.pieCenter}>
                        <strong>
                          <CheckCircle2
                            size={25}
                            color="#10b981"
                          />
                        </strong>

                        <span>Approved</span>
                      </div>
                    </div>
                  </article>
                </section>

                {/* PROFILE + DARK PANEL */}

                <section className={styles.revenueGrid}>
                  <article
                    className={`${styles.panel} ${styles.revenuePanel}`}
                  >
                    <div
                      className={styles.panelHeader}
                    >
                      <div>
                        <span>
                          PERSONAL INFORMATION
                        </span>
                        <h2>Guide Information</h2>
                      </div>

                      <button
                        type="button"
                        className={styles.viewButton}
                        onClick={() =>
                          setPage('profile')
                        }
                      >
                        View Profile
                        <ArrowUpRight size={14} />
                      </button>
                    </div>

                    {profileInformation}
                  </article>

                  <article
                    className={styles.financialPanel}
                  >
                    <div className={styles.financeIcon}>
                      <BadgeCheck size={25} />
                    </div>

                    <span
                      className={styles.financeLabel}
                    >
                      VERIFIED TOUR GUIDE
                    </span>

                    <h2>Approved</h2>

                    <p>
                      Your Tour Guide account
                      is active and approved
                      by GlobalVista.
                    </p>

                    <div
                      className={styles.financeStats}
                    >
                      <div>
                        <span>Languages</span>
                        <strong>
                          {languages.length}
                        </strong>
                      </div>

                      <div>
                        <span>Experience</span>
                        <strong>
                          {
                            guide.experienceYears ??
                            '—'
                          }{' '}
                          years
                        </strong>
                      </div>
                    </div>
                  </article>
                </section>

                {/* BOTTOM PANELS */}

                <section className={styles.bottomGrid}>
                  <article className={styles.panel}>
                    <div
                      className={styles.panelHeader}
                    >
                      <div>
                        <span>GUIDE WORKSPACE</span>
                        <h2>
                          Destinations & Bookings
                        </h2>
                      </div>

                      <MapPinned
                        size={20}
                        className={styles.greenText}
                      />
                    </div>

                    <div className={styles.guideList}>
                      <button
                        type="button"
                        className={styles.guideItem}
                        onClick={() =>
                          setPage('destinations')
                        }
                      >
                        <div
                          className={styles.guideAvatar}
                        >
                          <MapPinned size={17} />
                        </div>

                        <div
                          className={styles.guideInfo}
                        >
                          <strong>
                            My Destinations
                          </strong>

                          <span>
                            Backend integration pending
                          </span>
                        </div>

                        <ArrowUpRight size={15} />
                      </button>

                      <button
                        type="button"
                        className={styles.guideItem}
                        onClick={() =>
                          setPage('bookings')
                        }
                      >
                        <div
                          className={styles.guideAvatar}
                        >
                          <BookOpenCheck size={17} />
                        </div>

                        <div
                          className={styles.guideInfo}
                        >
                          <strong>My Bookings</strong>

                          <span>
                            Backend integration pending
                          </span>
                        </div>

                        <ArrowUpRight size={15} />
                      </button>
                    </div>
                  </article>

                  <article className={styles.panel}>
                    <div
                      className={styles.panelHeader}
                    >
                      <div>
                        <span>MEMBERSHIP</span>
                        <h2>Account Details</h2>
                      </div>

                      <ShieldCheck
                        size={20}
                        className={styles.greenText}
                      />
                    </div>

                    <div className={styles.guideList}>
                      <div className={styles.guideItem}>
                        <div
                          className={styles.guideInfo}
                        >
                          <strong>Guide ID</strong>

                          <span>
                            {guide.publicId ||
                              'Not assigned'}
                          </span>
                        </div>
                      </div>

                      <div className={styles.guideItem}>
                        <div
                          className={styles.guideInfo}
                        >
                          <strong>Joined</strong>

                          <span>
                            {formatDate(
                              guide.createdAt,
                            )}
                          </span>
                        </div>
                      </div>

                      <div className={styles.guideItem}>
                        <div
                          className={styles.guideInfo}
                        >
                          <strong>Status</strong>
                          <span>Approved</span>
                        </div>

                        <CheckCircle2
                          size={16}
                          className={styles.greenText}
                        />
                      </div>
                    </div>
                  </article>
                </section>
              </>
            )}

            {/* PROFILE TAB */}

            {page === 'profile' && (
              <section className={styles.revenueGrid}>
                <article className={styles.panel}>
                  <div
                    className={styles.panelHeader}
                  >
                    <div>
                      <span>MY ACCOUNT</span>
                      <h2>Tour Guide Profile</h2>
                    </div>

                    <button
                      type="button"
                      className={styles.viewButton}
                      onClick={() =>
                        openDialog('edit')
                      }
                    >
                      <Pencil size={14} />
                      Edit Profile
                    </button>
                  </div>

                  <div className={styles.profileIdentity}>
                    {avatar(styles.profileBigAvatar)}

                    <div>
                      <h3>{displayName}</h3>
                      <span>
                        {guide.publicId ||
                          'Tour Guide'}
                      </span>

                      <div
                        className={styles.liveBadge}
                      >
                        <i />
                        Approved
                      </div>
                    </div>
                  </div>

                  {profileInformation}

                  <div className={styles.aboutBox}>
                    <span>ABOUT ME</span>

                    <p>
                      {guide.about ||
                        'No description provided.'}
                    </p>
                  </div>
                </article>

                <article className={styles.financialPanel}>
                  <div className={styles.financeIcon}>
                    <ShieldCheck size={25} />
                  </div>

                  <span className={styles.financeLabel}>
                    ACCOUNT SECURITY
                  </span>

                  <h2>Verified</h2>

                  <p>
                    Your NIC and Passport
                    identity information
                    remains private.
                  </p>

                  <div className={styles.financeStats}>
                    <div>
                      <span>Account Role</span>
                      <strong>GUIDE</strong>
                    </div>

                    <div>
                      <span>Approval</span>
                      <strong>APPROVED</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.darkPanelButton}
                    onClick={() =>
                      openDialog('password')
                    }
                  >
                    <KeyRound size={15} />
                    Change Password
                  </button>
                </article>
              </section>
            )}

            {/* DESTINATIONS / BOOKINGS */}

            {(page === 'destinations' ||
              page === 'bookings') && (
              <section className={styles.bottomGrid}>
                <article className={styles.panel}>
                  <div
                    className={styles.panelHeader}
                  >
                    <div>
                      <span>
                        TOUR GUIDE WORKSPACE
                      </span>

                      <h2>
                        {page === 'destinations'
                          ? 'My Destinations'
                          : 'My Bookings'}
                      </h2>
                    </div>

                    {page === 'destinations' ? (
                      <MapPinned
                        size={20}
                        className={styles.greenText}
                      />
                    ) : (
                      <BookOpenCheck
                        size={20}
                        className={styles.greenText}
                      />
                    )}
                  </div>

                  <div className={styles.emptyGuide}>
                    <Clock3 size={32} />

                    <strong>
                      Integration Pending
                    </strong>

                    <span>
                      {page === 'destinations'
                        ? 'Guide destination submission and Admin approval API is not connected yet.'
                        : 'Guide-specific booking API is not connected yet.'}
                    </span>
                  </div>
                </article>

                <article className={styles.panel}>
                  <div
                    className={styles.panelHeader}
                  >
                    <div>
                      <span>ACCOUNT STATUS</span>
                      <h2>Verified Guide</h2>
                    </div>

                    <BadgeCheck
                      size={20}
                      className={styles.greenText}
                    />
                  </div>

                  <div className={styles.emptyGuide}>
                    <CheckCircle2 size={32} />

                    <strong>
                      Approved Tour Guide
                    </strong>

                    <span>
                      GlobalVista verified account.
                    </span>
                  </div>
                </article>
              </section>
            )}
          </div>
        </div>
      </section>

      {/* EDIT PROFILE / PASSWORD MODAL */}

      {dialog && (
        <div
          className={styles.adminProfileOverlay}
          onMouseDown={closeDialog}
        >
          <section
            className={styles.adminProfileModal}
            role="dialog"
            aria-modal="true"
            aria-label={
              dialog === 'edit'
                ? 'Edit Guide Profile'
                : 'Change Guide Password'
            }
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div
              className={styles.adminProfileModalHeader}
            >
              <div>
                <span>GLOBALVISTA GUIDE</span>

                <h2>
                  {dialog === 'edit'
                    ? 'My Profile'
                    : 'Change Password'}
                </h2>

                <p>
                  Manage your Tour Guide account.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close profile dialog"
                disabled={saving || uploading}
                onClick={closeDialog}
              >
                <X size={20} />
              </button>
            </div>

            {dialog === 'edit' ? (
              <form
                className={styles.adminProfileForm}
                onSubmit={(event) =>
                  void saveProfile(event)
                }
              >
                <div
                  className={styles.adminProfilePhotoRow}
                >
                  {avatar(
                    styles.adminProfileBigAvatar,
                  )}

                  <div>
                    <strong>Profile Photo</strong>

                    <span>
                      JPG, PNG or WEBP.
                      Maximum 5 MB.
                    </span>

                    <button
                      type="button"
                      className={
                        styles.adminProfileUploadBtn
                      }
                      disabled={saving || uploading}
                      onClick={() =>
                        photoRef.current?.click()
                      }
                    >
                      {uploading ? (
                        <RefreshCw
                          size={15}
                          className={styles.spin}
                        />
                      ) : (
                        <Camera size={15} />
                      )}

                      {uploading
                        ? 'Uploading...'
                        : 'Upload / Change Photo'}
                    </button>
                  </div>

                  <input
                    ref={photoRef}
                    className={
                      styles.adminProfileHiddenInput
                    }
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                      void uploadPhoto(event)
                    }
                  />
                </div>

                <label
                  className={styles.adminProfileField}
                >
                  <span>Full Name</span>

                  <input
                    required
                    maxLength={100}
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                  />
                </label>

                <label
                  className={styles.adminProfileField}
                >
                  <span>Email Address</span>

                  <input
                    type="email"
                    value={guide.email || ''}
                    disabled
                  />
                </label>

                <div
                  className={styles.adminProfileFieldRow}
                >
                  <label
                    className={styles.adminProfileField}
                  >
                    <span>Mobile Number</span>

                    <input
                      type="tel"
                      required
                      maxLength={30}
                      value={mobile}
                      onChange={(event) =>
                        setMobile(event.target.value)
                      }
                    />
                  </label>

                  <label
                    className={styles.adminProfileField}
                  >
                    <span>Country</span>

                    <input
                      required
                      maxLength={100}
                      value={country}
                      onChange={(event) =>
                        setCountry(event.target.value)
                      }
                    />
                  </label>
                </div>

                <div
                  className={styles.adminProfileReadonlyNote}
                >
                  <ShieldCheck size={16} />

                  Account role, email and
                  identity details cannot
                  be changed here.
                </div>

                {formError && (
                  <p
                    className={styles.adminProfileError}
                    role="alert"
                  >
                    {formError}
                  </p>
                )}

                {success && (
                  <p
                    className={styles.adminProfileSuccess}
                    role="status"
                  >
                    {success}
                  </p>
                )}

                <div
                  className={styles.adminProfileModalFooter}
                >
                  <button
                    type="button"
                    className={
                      styles.adminProfileCancel
                    }
                    disabled={saving || uploading}
                    onClick={closeDialog}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className={
                      styles.adminProfileSubmit
                    }
                    disabled={saving || uploading}
                  >
                    {saving
                      ? 'Saving...'
                      : 'Save Changes'}

                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </form>
            ) : (
              <form
                className={styles.adminProfileForm}
                onSubmit={(event) =>
                  void changePassword(event)
                }
              >
                <label
                  className={styles.adminProfileField}
                >
                  <span>Current Password</span>

                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={currentPassword}
                    onChange={(event) =>
                      setCurrentPassword(
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label
                  className={styles.adminProfileField}
                >
                  <span>New Password</span>

                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label
                  className={styles.adminProfileField}
                >
                  <span>Confirm New Password</span>

                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value,
                      )
                    }
                  />
                </label>

                <div
                  className={styles.adminProfileReadonlyNote}
                >
                  <ShieldCheck size={16} />
                  Use at least 8 characters
                  for the new password.
                </div>

                {formError && (
                  <p
                    className={styles.adminProfileError}
                    role="alert"
                  >
                    {formError}
                  </p>
                )}

                {success && (
                  <p
                    className={styles.adminProfileSuccess}
                    role="status"
                  >
                    {success}
                  </p>
                )}

                <div
                  className={styles.adminProfileModalFooter}
                >
                  <button
                    type="button"
                    className={
                      styles.adminProfileCancel
                    }
                    disabled={saving}
                    onClick={closeDialog}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className={
                      styles.adminProfileSubmit
                    }
                    disabled={saving}
                  >
                    {saving
                      ? 'Updating...'
                      : 'Update Password'}

                    <KeyRound size={16} />
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {/* LOGOUT CONFIRMATION */}

      {logoutOpen && (
        <div
          className={styles.adminProfileOverlay}
          onMouseDown={() =>
            setLogoutOpen(false)
          }
        >
          <section
            className={styles.adminLogoutDialog}
            role="alertdialog"
            aria-modal="true"
            aria-label="Confirm Logout"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div
              className={styles.adminLogoutIcon}
            >
              <LogOut size={24} />
            </div>

            <h2>Log out of GlobalVista?</h2>

            <p>
              You will be signed out
              of your Tour Guide account.
            </p>

            <div
              className={styles.adminProfileModalFooter}
            >
              <button
                type="button"
                className={
                  styles.adminProfileCancel
                }
                onClick={() =>
                  setLogoutOpen(false)
                }
              >
                Stay Logged In
              </button>

              <button
                type="button"
                className={
                  styles.adminProfileLogoutConfirm
                }
                onClick={logout}
              >
                Yes, Logout
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

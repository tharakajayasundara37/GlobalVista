
'use client';

import {
  useCallback,
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
  Plus,
  Trash2,
  ImagePlus,
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

// IMPORTANT: Guide's own CSS
import styles from './page.module.css';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://globalvista-d7uz.onrender.com');

type Tab = 'dashboard' | 'destinations' | 'bookings' | 'profile';
type Dialog = 'edit' | 'password' | null;

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type DestinationFilter = 'ALL' | ApprovalStatus;

type GuideDestination = {
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
  approvalStatus?: ApprovalStatus;
  rejectionReason?: string;
  isActive?: boolean;
  createdAt?: string;
};

type DestinationForm = {
  name: string;
  country: string;
  description: string;
  images: string;
  bestTimeToVisit: string;
  activities: string;
  budget: string;
  latitude: string;
  longitude: string;
};

const EMPTY_DESTINATION_FORM: DestinationForm = {
  name: '',
  country: '',
  description: '',
  images: '',
  bestTimeToVisit: '',
  activities: '',
  budget: '',
  latitude: '',
  longitude: '',
};

function lines(value: string): string[] {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function approvalStatus(destination: GuideDestination): ApprovalStatus {
  if (destination.approvalStatus === 'APPROVED') return 'APPROVED';
  if (destination.approvalStatus === 'REJECTED') return 'REJECTED';
  return 'PENDING';
}

function destinationList(result: unknown): GuideDestination[] {
  if (Array.isArray(result)) return result as GuideDestination[];
  if (result && typeof result === 'object') {
    const data = result as { destinations?: unknown; data?: unknown };
    if (Array.isArray(data.destinations)) return data.destinations as GuideDestination[];
    if (Array.isArray(data.data)) return data.data as GuideDestination[];
  }
  throw new Error('Unexpected destination response from the server.');
}


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
  tab: Tab;
  label: string;
  icon: LucideIcon;
};

const MENU: MenuItem[] = [
  {
    tab: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    tab: 'destinations',
    label: 'Destinations',
    icon: MapPinned,
  },
  {
    tab: 'bookings',
    label: 'Bookings',
    icon: BookOpenCheck,
  },
  {
    tab: 'profile',
    label: 'My Profile',
    icon: UserRound,
  },
];

function getToken() {
  return (
    localStorage.getItem('globalvista_token') ||
    localStorage.getItem('token')
  );
}

function clearSession() {
  [
    'globalvista_token',
    'globalvista_user',
    'token',
    'user',
  ].forEach((key) => localStorage.removeItem(key));
}

function cacheUser(user: Guide) {
  const value = JSON.stringify(user);
  localStorage.setItem('globalvista_user', value);
  localStorage.setItem('user', value);
}

function errorMessage(data: unknown): string {
  if (
    data &&
    typeof data === 'object' &&
    'message' in data
  ) {
    const message = (
      data as { message?: unknown }
    ).message;

    if (typeof message === 'string') {
      return message;
    }

    if (Array.isArray(message)) {
      return message.join(', ');
    }
  }

  return 'Request failed.';
}

function extractUser(data: unknown): Guide {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid profile response.');
  }

  const result = data as Guide & {
    user?: Guide;
  };

  return result.user &&
    typeof result.user === 'object'
    ? result.user
    : result;
}

function profilePhoto(path?: string): string {
  if (!path) return '';

  const relative = path.startsWith('/')
    ? path
    : `/${path}`;

  // Public profile pictures only.
  if (
    /^\/uploads\/users\/[\w.-]+\.(png|jpe?g|webp)$/i.test(
      relative,
    )
  ) {
    return `${API_URL}${relative}`;
  }

  if (
    /^https?:\/\/(localhost|127\.0\.0\.1):3001\/uploads\/users\/[\w.-]+\.(png|jpe?g|webp)$/i.test(
      path,
    )
  ) {
    return path;
  }

  return '';
}

function dateText(value?: string): string {
  if (!value) return 'Not available';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

async function api(
  path: string,
  options: RequestInit = {},
): Promise<unknown> {
  const token = getToken();

  if (!token) {
    throw new Error('NO_SESSION');
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      cache: 'no-store',
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data: unknown = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}: ${errorMessage(data)}`,
    );
  }

  return data;
}

async function getGuide(): Promise<Guide> {
  const guide = extractUser(
    await api('/users/me'),
  );

  if (guide.role !== 'GUIDE') {
    throw new Error(
      'This is not a Tour Guide account.',
    );
  }

  if (guide.guideStatus !== 'APPROVED') {
    throw new Error(
      'Your Tour Guide account is not approved.',
    );
  }

  return guide;
}

export default function GuideDashboardPage() {
  const router = useRouter();

  const menuRef = useRef<HTMLDivElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  const [guide, setGuide] =
    useState<Guide | null>(null);

  const [tab, setTab] =
    useState<Tab>('dashboard');

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const [dialog, setDialog] =
    useState<Dialog>(null);

  const [logoutOpen, setLogoutOpen] =
    useState(false);

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [country, setCountry] = useState('');

  const [currentPassword, setCurrentPassword] =
    useState('');

  const [newPassword, setNewPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageFailed, setImageFailed] = useState(false);

  // GUIDE DESTINATIONS — independent of existing profile dialogs.
  const [myDestinations, setMyDestinations] = useState<GuideDestination[]>([]);
  const [destinationsLoading, setDestinationsLoading] = useState(false);
  const [destinationsError, setDestinationsError] = useState('');
  const [destinationsSuccess, setDestinationsSuccess] = useState('');
  const [destinationFilter, setDestinationFilter] = useState<DestinationFilter>('ALL');
  const [destinationModalOpen, setDestinationModalOpen] = useState(false);
  const [editingDestinationId, setEditingDestinationId] = useState<string | null>(null);
  const [destinationForm, setDestinationForm] = useState<DestinationForm>(EMPTY_DESTINATION_FORM);
  const [destinationFormError, setDestinationFormError] = useState('');
  const [destinationSaving, setDestinationSaving] = useState(false);
  const [destinationDeleting, setDestinationDeleting] = useState<string | null>(null);
  const [destinationImageUploading, setDestinationImageUploading] = useState(false);

  const loadMyDestinations = useCallback(async () => {
    setDestinationsLoading(true);
    setDestinationsError('');
    try {
      const data = await api('/destinations/guide/mine');
      setMyDestinations(destinationList(data));
    } catch (reason) {
      setDestinationsError(
        reason instanceof Error ? reason.message : 'Failed to load your destinations.',
      );
    } finally {
      setDestinationsLoading(false);
    }
  }, []);

  // Destinations are loaded after authentication succeeds, not from an effect
  // that synchronously calls a state-setting function.

  const updateDestinationField = <K extends keyof DestinationForm>(
    field: K,
    value: DestinationForm[K],
  ) => setDestinationForm((previous) => ({ ...previous, [field]: value }));

  const openAddDestination = () => {
    setEditingDestinationId(null);
    setDestinationForm(EMPTY_DESTINATION_FORM);
    setDestinationFormError('');
    setDestinationsSuccess('');
    setDestinationModalOpen(true);
  };

  const openEditDestination = (destination: GuideDestination) => {
    setEditingDestinationId(destination._id);
    setDestinationForm({
      name: destination.name || '',
      country: destination.country || '',
      description: destination.description || '',
      images: (destination.images || []).join('\n'),
      bestTimeToVisit: destination.bestTimeToVisit || '',
      activities: (destination.activities || []).join('\n'),
      budget: destination.budget || '',
      latitude: typeof destination.latitude === 'number' ? String(destination.latitude) : '',
      longitude: typeof destination.longitude === 'number' ? String(destination.longitude) : '',
    });
    setDestinationFormError('');
    setDestinationsSuccess('');
    setDestinationModalOpen(true);
  };

  const closeDestinationModal = () => {
    if (destinationSaving || destinationImageUploading) return;
    setDestinationModalOpen(false);
    setEditingDestinationId(null);
    setDestinationFormError('');
  };

  const saveDestination = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDestinationFormError('');
    const name = destinationForm.name.trim();
    const country = destinationForm.country.trim();
    if (name.length < 2 || country.length < 2) {
      setDestinationFormError('Name and country must have at least 2 characters.');
      return;
    }
    const latitudeText = destinationForm.latitude.trim();
    const longitudeText = destinationForm.longitude.trim();
    if (Boolean(latitudeText) !== Boolean(longitudeText)) {
      setDestinationFormError('Enter both latitude and longitude, or leave both empty.');
      return;
    }
    const payload: Record<string, unknown> = {
      name,
      country,
      description: destinationForm.description.trim(),
      images: lines(destinationForm.images),
      bestTimeToVisit: destinationForm.bestTimeToVisit.trim(),
      activities: lines(destinationForm.activities),
      budget: destinationForm.budget.trim(),
    };
    if (latitudeText && longitudeText) {
      const latitude = Number(latitudeText);
      const longitude = Number(longitudeText);
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
          !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        setDestinationFormError('Latitude must be -90 to 90, longitude -180 to 180.');
        return;
      }
      payload.latitude = latitude;
      payload.longitude = longitude;
    }
    if (payload.images && (payload.images as string[]).length > 20) {
      setDestinationFormError('Add up to 20 image URLs.');
      return;
    }
    if ((payload.activities as string[]).length > 30) {
      setDestinationFormError('Add up to 30 activities.');
      return;
    }

    setDestinationSaving(true);
    try {
      await api(
        editingDestinationId
          ? `/destinations/guide/${encodeURIComponent(editingDestinationId)}`
          : '/destinations/guide',
        {
          method: editingDestinationId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      setDestinationModalOpen(false);
      setEditingDestinationId(null);
      setDestinationsSuccess(
        editingDestinationId
          ? 'Destination updated and sent for admin review.'
          : 'Destination submitted! Waiting for admin approval.',
      );
      await loadMyDestinations();
    } catch (reason) {
      setDestinationFormError(
        reason instanceof Error ? reason.message : 'Could not submit destination.',
      );
    } finally {
      setDestinationSaving(false);
    }
  };

  const deleteMyDestination = async (destination: GuideDestination) => {
    if (!window.confirm(`Delete "${destination.name}"? This cannot be undone.`)) return;
    setDestinationsError('');
    setDestinationsSuccess('');
    setDestinationDeleting(destination._id);
    try {
      await api(`/destinations/guide/${encodeURIComponent(destination._id)}`, {
        method: 'DELETE',
      });
      setDestinationsSuccess('Destination deleted successfully.');
      await loadMyDestinations();
    } catch (reason) {
      setDestinationsError(
        reason instanceof Error ? reason.message : 'Could not delete destination.',
      );
    } finally {
      setDestinationDeleting(null);
    }
  };

  const uploadDestinationImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;
    if (files.length > 5 || files.some((file) => file.size > 5 * 1024 * 1024 ||
        !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
      setDestinationFormError('Select up to 5 JPG/PNG/WEBP images, each below 5 MB.');
      return;
    }
    setDestinationImageUploading(true);
    setDestinationFormError('');
    try {
      const body = new FormData();
      files.forEach((file) => body.append('images', file));
      const response = await api('/destinations/upload-images', {
        method: 'POST',
        body,
      });
      const urls = response && typeof response === 'object' && 'images' in response
        ? (response as { images?: unknown }).images
        : null;
      if (!Array.isArray(urls) || !urls.every((url) => typeof url === 'string')) {
        throw new Error('Image upload response was invalid.');
      }
      setDestinationForm((previous) => ({
        ...previous,
        images: [...lines(previous.images), ...urls].join('\n'),
      }));
    } catch (reason) {
      setDestinationFormError(
        `${reason instanceof Error ? reason.message : 'Image upload failed.'} You can also enter image URLs below.`,
      );
    } finally {
      setDestinationImageUploading(false);
    }
  };


  // ========================================
  // INITIAL AUTHENTICATION
  // ========================================

  useEffect(() => {
    let mounted = true;

    if (!getToken()) {
      router.replace('/login');
      return;
    }

    getGuide()
      .then(async (user) => {
        if (!mounted) return;

        setGuide(user);
        cacheUser(user);
        await loadMyDestinations();
      })
      .catch((reason: unknown) => {
        if (!mounted) return;

        setError(
          reason instanceof Error
            ? reason.message
            : 'Could not load Guide account.',
        );
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [router, loadMyDestinations]);

  // ========================================
  // CLOSE PROFILE MENU OUTSIDE
  // ========================================

  useEffect(() => {
    if (!menuOpen) return;

    function outside(event: MouseEvent) {
      if (
        !menuRef.current?.contains(
          event.target as Node,
        )
      ) {
        setMenuOpen(false);
      }
    }

    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', escape);

    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [menuOpen]);

  // ========================================
  // ACCOUNT ACTIONS
  // ========================================

  function logout() {
    clearSession();
    setLogoutOpen(false);
    router.replace('/login');
  }

  function applyGuide(user: Guide) {
    setGuide(user);
    cacheUser(user);
    setImageFailed(false);
  }

  async function refresh() {
    setRefreshing(true);
    setError('');

    try {
      applyGuide(await getGuide());
      await loadMyDestinations();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Could not refresh profile.',
      );
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }

  function openDialog(
    mode: Exclude<Dialog, null>,
  ) {
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
    if (!busy && !uploading) {
      setDialog(null);
    }
  }

  // ========================================
  // EDIT PROFILE
  // ========================================

  async function saveProfile(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setFormError('');
    setSuccess('');

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

    setBusy(true);

    try {
      const result = extractUser(
        await api('/users/me/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            mobile: mobile.trim(),
            country: country.trim(),
          }),
        }),
      );

      applyGuide({
        ...guide,
        ...result,
      });

      setSuccess(
        'Profile updated successfully.',
      );
    } catch (reason) {
      setFormError(
        reason instanceof Error
          ? reason.message
          : 'Profile update failed.',
      );
    } finally {
      setBusy(false);
    }
  }

  // ========================================
  // UPLOAD PROFILE PHOTO
  // ========================================

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
        'Use JPG, PNG or WEBP photo.',
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError(
        'Maximum photo size is 5 MB.',
      );
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);

    try {
      const result = extractUser(
        await api('/users/me/profile-image', {
          method: 'POST',
          body: formData,
        }),
      );

      applyGuide({
        ...guide,
        ...result,
      });

      setSuccess(
        'Profile photo uploaded.',
      );
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

  // ========================================
  // CHANGE PASSWORD
  // ========================================

  async function changePassword(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setFormError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setFormError(
        'New password needs at least 8 characters.',
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError(
        'New passwords do not match.',
      );
      return;
    }

    setBusy(true);

    try {
      await api('/users/me/password', {
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

      setSuccess(
        'Password changed successfully.',
      );
    } catch (reason) {
      setFormError(
        reason instanceof Error
          ? reason.message
          : 'Password change failed.',
      );
    } finally {
      setBusy(false);
    }
  }

  // ========================================
  // SEARCH SECTIONS
  // ========================================

  function searchTabs(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const query = search.trim().toLowerCase();
    if (!query) return;

    const match = MENU.find((item) =>
      item.label.toLowerCase().includes(query),
    );

    if (match) {
      setTab(match.tab);
      setSearch('');
      setError('');
    } else {
      setError(
        'Section not found. Try Dashboard, Destinations, Bookings or My Profile.',
      );
    }
  }

  // ========================================
  // LOADING AND ERRORS
  // ========================================

  if (loading) {
    return (
      <main className={styles.loadingPage}>
        <div className={styles.loader} />
        Loading Guide Dashboard...
      </main>
    );
  }

  if (!guide) {
    return (
      <main className={styles.loadingPage}>
        <ShieldCheck size={32} />

        <strong>
          Unable to open Guide Dashboard
        </strong>

        <span>
          {error || 'Guide account unavailable.'}
        </span>

        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => void refresh()}
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

  // ========================================
  // PROFILE DATA
  // ========================================

  const displayName =
    guide.name || 'Tour Guide';

  const firstName =
    displayName.trim().split(/\s+/)[0];

  const letter =
    displayName.charAt(0).toUpperCase();

  const img = imageFailed
    ? ''
    : profilePhoto(guide.profileImage);

  const languages = Array.isArray(guide.languages)
    ? guide.languages
    : [];

  const location =
    [guide.city, guide.country]
      .filter(Boolean)
      .join(', ') || 'Not provided';

  const today = dateText(
    new Date().toISOString(),
  );

  // ========================================
  // PROFILE COMPLETION
  // ========================================

  const fields = [
    {
      name: 'Name',
      done: Boolean(guide.name?.trim()),
    },
    {
      name: 'Email',
      done: Boolean(guide.email?.trim()),
    },
    {
      name: 'Mobile',
      done: Boolean(guide.mobile?.trim()),
    },
    {
      name: 'Country',
      done: Boolean(guide.country?.trim()),
    },
    {
      name: 'City',
      done: Boolean(guide.city?.trim()),
    },
    {
      name: 'Languages',
      done: languages.length > 0,
    },
    {
      name: 'About',
      done: Boolean(guide.about?.trim()),
    },
  ];

  const completed = fields.filter(
    (field) => field.done,
  ).length;

  const completion = Math.round(
    (100 * completed) / fields.length,
  );

  const bars = fields.map((field) => ({
    name: field.name,
    value: field.done ? 1 : 0,
  }));

  const pie = [
    {
      name: 'Complete',
      value: completed,
    },
    {
      name: 'Missing',
      value: fields.length - completed,
    },
  ].filter((part) => part.value > 0);

  // ========================================
  // EIGHT SUMMARY CARDS
  // ========================================

  const stats = [
    {
      title: 'Guide Status',
      value: 'Approved',
      subtitle: 'Admin verified',
      icon: BadgeCheck,
      color: 'green',
      tag: 'ACTIVE',
    },
    {
      title: 'Experience',
      value: guide.experienceYears ?? '—',
      subtitle: 'Years guiding',
      icon: Clock3,
      color: 'orange',
      tag: 'GUIDE',
    },
    {
      title: 'Languages',
      value: languages.length,
      subtitle: 'Registered languages',
      icon: Languages,
      color: 'blue',
      tag: 'SKILLS',
    },
    {
      title: 'Profile Completion',
      value: `${completion}%`,
      subtitle: `${completed} of 7 fields`,
      icon: UserRound,
      color: 'pink',
      tag: 'PROFILE',
    },
    {
      title: 'Destinations',
      value: '—',
      subtitle: 'API integration pending',
      icon: MapPinned,
      color: 'purple',
      tag: 'PENDING',
    },
    {
      title: 'Bookings',
      value: '—',
      subtitle: 'API integration pending',
      icon: BookOpenCheck,
      color: 'cyan',
      tag: 'PENDING',
    },
    {
      title: 'Account Type',
      value: 'Guide',
      subtitle: 'Verified Tour Guide',
      icon: ShieldCheck,
      color: 'red',
      tag: 'VERIFIED',
    },
    {
      title: 'Registered',
      value: guide.createdAt
        ? new Date(guide.createdAt).getFullYear()
        : '—',
      subtitle: dateText(guide.createdAt),
      icon: CalendarDays,
      color: 'dark',
      tag: 'JOINED',
    },
  ];

  const cardClass: Record<string, string> = {
    green: styles.greenCard,
    orange: styles.orangeCard,
    blue: styles.blueCard,
    pink: styles.pinkCard,
    purple: styles.purpleCard,
    cyan: styles.cyanCard,
    red: styles.redCard,
    dark: styles.darkCard,
  };

  const iconClass: Record<string, string> = {
    green: styles.greenIcon,
    orange: styles.orangeIcon,
    blue: styles.blueIcon,
    pink: styles.pinkIcon,
    purple: styles.purpleIcon,
    cyan: styles.cyanIcon,
    red: styles.redIcon,
    dark: styles.darkIcon,
  };

  // ========================================
  // PROFILE AVATAR
  // ========================================

  const avatar = (className: string) => (
    <div className={className}>
      {img ? (
        <img
          src={img}
          alt="Guide profile"
          className={styles.profileAvatarImage}
          onError={() => setImageFailed(true)}
        />
      ) : (
        letter
      )}
    </div>
  );

  // ========================================
  // GUIDE INFORMATION
  // ========================================

  const info = [
    {
      name: 'Full Name',
      value: displayName,
      icon: UserRound,
    },
    {
      name: 'Email',
      value: guide.email || 'Not provided',
      icon: Mail,
    },
    {
      name: 'Mobile',
      value: guide.mobile || 'Not provided',
      icon: Phone,
    },
    {
      name: 'Location',
      value: location,
      icon: MapPinned,
    },
    {
      name: 'Languages',
      value: languages.join(', ') || 'Not provided',
      icon: Languages,
    },
  ];

  const infoPanel = (
    <div className={styles.guideList}>
      {info.map((entry) => {
        const Icon = entry.icon;

        return (
          <div
            className={styles.guideItem}
            key={entry.name}
          >
            <div className={styles.guideAvatar}>
              <Icon size={17} />
            </div>

            <div className={styles.guideInfo}>
              <strong>{entry.name}</strong>
              <span>{entry.value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ========================================
  // MAIN DASHBOARD DESIGN
  // ========================================

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        {/* LEFT WHITE ICON SIDEBAR */}

        <aside className={styles.sidebar}>
          <button
            type="button"
            className={styles.logo}
            title="Dashboard"
            onClick={() => setTab('dashboard')}
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
                  type="button"
                  key={item.tab}
                  title={item.label}
                  aria-label={item.label}
                  aria-current={
                    tab === item.tab
                      ? 'page'
                      : undefined
                  }
                  className={`
                    ${styles.sideButton}
                    ${
                      tab === item.tab
                        ? styles.sideButtonActive
                        : ''
                    }
                  `}
                  onClick={() =>
                    setTab(item.tab)
                  }
                >
                  <Icon size={19} />
                </button>
              );
            })}
          </nav>

          <div className={styles.sideBottom}>
            <button
              type="button"
              className={styles.sideButton}
              title="Settings"
              onClick={() => openDialog('edit')}
            >
              <Settings size={19} />
            </button>

            <button
              type="button"
              className={styles.sideButton}
              title="Sign Out"
              onClick={() => setLogoutOpen(true)}
            >
              <LogOut size={19} />
            </button>
          </div>
        </aside>

        {/* MAIN AREA */}

        <div className={styles.main}>
          {/* TOPBAR */}

          <header className={styles.topbar}>
            <button
              type="button"
              className={styles.wordmark}
              onClick={() => setTab('dashboard')}
            >
              Global<span>Vista</span>
            </button>

            <nav
              className={styles.topNav}
              aria-label="Top navigation"
            >
              {MENU.map((item) => (
                <button
                  type="button"
                  key={item.tab}
                  className={
                    tab === item.tab
                      ? styles.topNavActive
                      : ''
                  }
                  onClick={() => setTab(item.tab)}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className={styles.topActions}>
              <form
                className={styles.searchBox}
                onSubmit={searchTabs}
              >
                <Search size={15} />

                <input
                  aria-label="Search sections"
                  placeholder="Search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />
              </form>

              <button
                type="button"
                className={styles.circleButton}
                title="Verification Status"
                onClick={() => setTab('profile')}
              >
                <Bell size={17} />
              </button>

              {/* PROFILE DROPDOWN */}

              <div
                className={styles.profileMenuWrapper}
                ref={menuRef}
              >
                <button
                  type="button"
                  className={`
                    ${styles.profile}
                    ${styles.profileTrigger}
                  `}
                  aria-expanded={menuOpen}
                  onClick={() =>
                    setMenuOpen(!menuOpen)
                  }
                >
                  {avatar(styles.avatar)}

                  <span className={styles.profileText}>
                    <strong>{displayName}</strong>
                    <small>Tour Guide</small>
                  </span>

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
                  >
                    <div
                      className={
                        styles.profileDropdownHeader
                      }
                    >
                      {avatar(
                        styles.profileDropdownAvatar,
                      )}

                      <div>
                        <strong>{displayName}</strong>
                        <span>{guide.email}</span>
                      </div>
                    </div>

                    <div
                      className={
                        styles.profileDropdownDivider
                      }
                    />

                    <button
                      type="button"
                      onClick={() =>
                        openDialog('edit')
                      }
                    >
                      <Pencil size={16} />
                      Edit Profile
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openDialog('password')
                      }
                    >
                      <KeyRound size={16} />
                      Change Password
                    </button>

                    <div
                      className={
                        styles.profileDropdownDivider
                      }
                    />

                    <button
                      type="button"
                      className={
                        styles.profileDropdownLogout
                      }
                      onClick={() => {
                        setMenuOpen(false);
                        setLogoutOpen(true);
                      }}
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* CONTENT */}

          <div className={styles.content}>
            <div className={styles.welcome}>
              <div>
                <span
                  className={styles.welcomeLabel}
                >
                  GLOBALVISTA TOUR GUIDE PORTAL
                </span>

                <h1>
                  {tab === 'dashboard' ? (
                    <>
                      Welcome Back,{' '}
                      <strong>{firstName}</strong>
                    </>
                  ) : (
                    <strong>
                      {
                        MENU.find(
                          (item) =>
                            item.tab === tab,
                        )?.label
                      }
                    </strong>
                  )}
                </h1>

                <p>
                  Manage your guide profile
                  and travel activities.
                </p>
              </div>

              <div className={styles.welcomeActions}>
                <span className={styles.datePill}>
                  <CalendarDays size={15} />
                  {today}
                </span>

                <button
                  type="button"
                  className={styles.refresh}
                  onClick={() => void refresh()}
                  disabled={refreshing}
                >
                  <RefreshCw
                    size={15}
                    className={
                      refreshing
                        ? styles.spin
                        : ''
                    }
                  />

                  {refreshing
                    ? 'Refreshing'
                    : 'Refresh'}
                </button>
              </div>
            </div>

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
                  aria-label="Dismiss"
                  onClick={() => setError('')}
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {/* DASHBOARD OVERVIEW */}

            {tab === 'dashboard' && (
              <>
                {/* EIGHT SUMMARY CARDS */}

                <section
                  className={styles.summaryGrid}
                >
                  {stats.map((item) => {
                    const Icon = item.icon;

                    return (
                      <article
                        className={`
                          ${styles.summaryCard}
                          ${cardClass[item.color]}
                        `}
                        key={item.title}
                      >
                        <div
                          className={
                            styles.summaryCardTop
                          }
                        >
                          <div
                            className={`
                              ${styles.summaryIcon}
                              ${iconClass[item.color]}
                            `}
                          >
                            <Icon size={19} />
                          </div>

                          <span
                            className={
                              styles.summaryTrend
                            }
                          >
                            {item.tag}
                          </span>
                        </div>

                        <div
                          className={
                            styles.summaryValue
                          }
                        >
                          {item.value}
                        </div>

                        <strong
                          className={
                            styles.summaryTitle
                          }
                        >
                          {item.title}
                        </strong>

                        <span
                          className={
                            styles.summarySubtitle
                          }
                        >
                          {item.subtitle}
                        </span>
                      </article>
                    );
                  })}
                </section>

                {/* SAME ADMIN THREE-PANEL LAYOUT */}

                <section
                  className={styles.chartGrid}
                >
                  <article
                    className={`
                      ${styles.panel}
                      ${styles.activityPanel}
                    `}
                  >
                    <div
                      className={styles.panelHeader}
                    >
                      <div>
                        <span>GUIDE PROFILE</span>
                        <h2>Profile Readiness</h2>
                      </div>

                      <span
                        className={styles.liveBadge}
                      >
                        <i />
                        Verified
                      </span>
                    </div>

                    <div className={styles.largeChart}>
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <BarChart
                          data={bars}
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
                              fontSize: 9,
                              fill: '#7c8795',
                            }}
                          />

                          <YAxis
                            domain={[0, 1]}
                            ticks={[0, 1]}
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fontSize: 9,
                            }}
                          />

                          <Tooltip
                            formatter={(value) =>
                              Number(value)
                                ? 'Complete'
                                : 'Missing'
                            }
                          />

                          <Bar
                            dataKey="value"
                            radius={[9, 9, 2, 2]}
                          >
                            {bars.map((item) => (
                              <Cell
                                key={item.name}
                                fill={
                                  item.value
                                    ? '#10b981'
                                    : '#e5e7eb'
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </article>

                  {/* PROFILE PIE CHART */}

                  <article className={styles.panel}>
                    <div
                      className={styles.panelHeader}
                    >
                      <div>
                        <span>YOUR PROFILE</span>
                        <h2>Profile Completion</h2>
                      </div>

                      <UserRound
                        size={19}
                        color="#f59e0b"
                      />
                    </div>

                    <div className={styles.pieChart}>
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <PieChart>
                          <Pie
                            data={pie}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={52}
                            outerRadius={80}
                            paddingAngle={
                              pie.length > 1 ? 5 : 0
                            }
                          >
                            {pie.map((part) => (
                              <Cell
                                key={part.name}
                                fill={
                                  part.name ===
                                  'Complete'
                                    ? '#10b981'
                                    : '#e5e7eb'
                                }
                              />
                            ))}
                          </Pie>

                          <Tooltip />

                          <Legend
                            iconType="circle"
                            wrapperStyle={{
                              fontSize: 10,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      <div className={styles.pieCenter}>
                        <strong>
                          {completion}%
                        </strong>
                        <span>Complete</span>
                      </div>
                    </div>
                  </article>

                  {/* GUIDE STATUS CHART */}

                  <article className={styles.panel}>
                    <div
                      className={styles.panelHeader}
                    >
                      <div>
                        <span>VERIFICATION</span>
                        <h2>Guide Status</h2>
                      </div>

                      <ShieldCheck
                        size={19}
                        color="#10b981"
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

                {/* INFORMATION + DARK PANEL */}

                <section
                  className={styles.revenueGrid}
                >
                  <article
                    className={`
                      ${styles.panel}
                      ${styles.revenuePanel}
                    `}
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
                          setTab('profile')
                        }
                      >
                        View Profile
                        <ArrowUpRight size={14} />
                      </button>
                    </div>

                    {infoPanel}
                  </article>

                  <article
                    className={
                      styles.financialPanel
                    }
                  >
                    <div
                      className={styles.financeIcon}
                    >
                      <BadgeCheck size={25} />
                    </div>

                    <span
                      className={
                        styles.financeLabel
                      }
                    >
                      VERIFIED TOUR GUIDE
                    </span>

                    <h2>Approved</h2>

                    <p>
                      Your GlobalVista Tour Guide
                      account is approved and active.
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

                <section
                  className={styles.bottomGrid}
                >
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
                        color="#10b981"
                      />
                    </div>

                    <div className={styles.guideList}>
                      <button
                        type="button"
                        className={styles.guideItem}
                        onClick={() =>
                          setTab('destinations')
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
                            View and manage your own destinations
                          </span>
                        </div>

                        <ArrowUpRight size={15} />
                      </button>

                      <button
                        type="button"
                        className={styles.guideItem}
                        onClick={() =>
                          setTab('bookings')
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
                          <strong>
                            My Bookings
                          </strong>
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
                        color="#10b981"
                      />
                    </div>

                    <div className={styles.guideList}>
                      <div
                        className={styles.guideItem}
                      >
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

                      <div
                        className={styles.guideItem}
                      >
                        <div
                          className={styles.guideInfo}
                        >
                          <strong>Registered</strong>
                          <span>
                            {dateText(
                              guide.createdAt,
                            )}
                          </span>
                        </div>
                      </div>

                      <div
                        className={styles.guideItem}
                      >
                        <div
                          className={styles.guideInfo}
                        >
                          <strong>Status</strong>
                          <span>APPROVED</span>
                        </div>

                        <CheckCircle2
                          size={16}
                          color="#10b981"
                        />
                      </div>
                    </div>
                  </article>
                </section>
              </>
            )}

            {/* PROFILE TAB */}

            {tab === 'profile' && (
              <section
                className={styles.revenueGrid}
              >
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

                  <div
                    className={
                      styles.profileIdentity
                    }
                  >
                    {avatar(
                      styles.profileBigAvatar,
                    )}

                    <div>
                      <h3>{displayName}</h3>

                      <span>
                        {guide.publicId ||
                          'Tour Guide'}
                      </span>

                      <span
                        className={
                          styles.liveBadge
                        }
                      >
                        <i />
                        Approved
                      </span>
                    </div>
                  </div>

                  {infoPanel}

                  <div className={styles.aboutBox}>
                    <span>ABOUT ME</span>

                    <p>
                      {guide.about ||
                        'No description provided.'}
                    </p>
                  </div>
                </article>

                <article
                  className={styles.financialPanel}
                >
                  <div
                    className={styles.financeIcon}
                  >
                    <ShieldCheck size={25} />
                  </div>

                  <span
                    className={styles.financeLabel}
                  >
                    ACCOUNT SECURITY
                  </span>

                  <h2>Verified</h2>

                  <p>
                    Your identity documents
                    remain private.
                  </p>

                  <div
                    className={styles.financeStats}
                  >
                    <div>
                      <span>Role</span>
                      <strong>GUIDE</strong>
                    </div>

                    <div>
                      <span>Status</span>
                      <strong>APPROVED</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={
                      styles.darkPanelButton
                    }
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

            {/* GUIDE DESTINATIONS — create / edit / delete / approval status */}
            {tab === 'destinations' && (
              <section className={styles.guideDestinationWorkspace}>
                <div className={styles.destinationHeading}>
                  <div>
                    <span className={styles.destinationEyebrow}>TOUR GUIDE WORKSPACE</span>
                    <h2>My Destinations</h2>
                    <p>Submit destinations for admin approval and manage your submissions.</p>
                  </div>
                  <div className={styles.destinationHeadingActions}>
                    <button type="button" className={styles.destinationRefresh}
                      onClick={() => void loadMyDestinations()} disabled={destinationsLoading}>
                      <RefreshCw size={15} className={destinationsLoading ? styles.spin : ''} />
                      Refresh
                    </button>
                    <button type="button" className={styles.destinationAddButton}
                      onClick={openAddDestination}>
                      <Plus size={17} /> Add Destination
                    </button>
                  </div>
                </div>

                <div className={styles.destinationStats}>
                  {([
                    ['ALL', 'All Destinations'],
                    ['PENDING', 'Pending Review'],
                    ['APPROVED', 'Approved'],
                    ['REJECTED', 'Rejected'],
                  ] as [DestinationFilter, string][]).map(([status, label]) => (
                    <button key={status} type="button"
                      className={`${styles.destinationStat} ${destinationFilter === status ? styles.destinationStatActive : ''}`}
                      onClick={() => setDestinationFilter(status)}>
                      <span>{label}</span>
                      <strong>{status === 'ALL' ? myDestinations.length :
                        myDestinations.filter((destination) => approvalStatus(destination) === status).length}</strong>
                    </button>
                  ))}
                </div>

                {destinationsError && <div className={styles.destinationError} role="alert">{destinationsError}</div>}
                {destinationsSuccess && <div className={styles.destinationSuccess} role="status">{destinationsSuccess}</div>}

                {destinationsLoading ? (
                  <div className={styles.destinationEmpty}><RefreshCw size={24} className={styles.spin} /> Loading destinations...</div>
                ) : myDestinations.filter((destination) =>
                  destinationFilter === 'ALL' || approvalStatus(destination) === destinationFilter,
                ).length === 0 ? (
                  <div className={styles.destinationEmpty}>
                    <MapPinned size={29} />
                    <strong>No destinations found</strong>
                    <span>Click Add Destination to send your first destination for review.</span>
                  </div>
                ) : (
                  <div className={styles.destinationCards}>
                    {myDestinations.filter((destination) =>
                      destinationFilter === 'ALL' || approvalStatus(destination) === destinationFilter,
                    ).map((destination) => {
                      const status = approvalStatus(destination);
                      return (
                        <article className={styles.destinationCard} key={destination._id}>
                          <div className={styles.destinationCardTop}>
                            <span className={styles.destinationCountry}><MapPinned size={14} /> {destination.country}</span>
                            <span className={`${styles.destinationStatus} ${
                              status === 'APPROVED' ? styles.destinationApproved :
                              status === 'REJECTED' ? styles.destinationRejected : styles.destinationPending
                            }`}>{status === 'PENDING' ? 'Pending Approval' : status === 'APPROVED' ? 'Approved' : 'Rejected'}</span>
                          </div>
                          <h3>{destination.name}</h3>
                          <p className={styles.destinationDescription}>{destination.description || 'No description provided.'}</p>
                          <div className={styles.destinationDetails}>
                            <span><strong>Best time:</strong> {destination.bestTimeToVisit || 'Not set'}</span>
                            <span><strong>Budget:</strong> {destination.budget || 'Not set'}</span>
                            <span><strong>Activities:</strong> {(destination.activities || []).slice(0, 3).join(', ') || 'Not set'}</span>
                            <span><strong>Submitted:</strong> {dateText(destination.createdAt)}</span>
                          </div>
                          {status === 'REJECTED' && (
                            <div className={styles.destinationRejectReason}>
                              <strong>Admin feedback:</strong> {destination.rejectionReason || 'No reason provided.'}
                            </div>
                          )}
                          {status === 'PENDING' && (
                            <p className={styles.destinationAwaiting}>This destination is not visible publicly until admin approval.</p>
                          )}
                          <div className={styles.destinationActions}>
                            <button type="button" className={styles.destinationEdit}
                              disabled={destinationDeleting === destination._id}
                              onClick={() => openEditDestination(destination)}>
                              <Pencil size={14} /> Edit
                            </button>
                            <button type="button" className={styles.destinationDelete}
                              disabled={destinationDeleting === destination._id}
                              onClick={() => void deleteMyDestination(destination)}>
                              <Trash2 size={14} /> {destinationDeleting === destination._id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* BOOKINGS — original placeholder stays unchanged */}
            {tab === 'bookings' && (
              <section className={styles.bottomGrid}>
                <article className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div><span>TOUR GUIDE WORKSPACE</span><h2>My Bookings</h2></div>
                    <BookOpenCheck size={20} color="#10b981" />
                  </div>
                  <div className={styles.emptyGuide}>
                    <Clock3 size={32} />
                    <strong>Integration Pending</strong>
                    <span>Guide-specific booking data requires Backend integration.</span>
                  </div>
                </article>
                <article className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div><span>VERIFICATION</span><h2>Verified Guide</h2></div>
                    <BadgeCheck size={20} color="#10b981" />
                  </div>
                  <div className={styles.emptyGuide}>
                    <CheckCircle2 size={32} />
                    <strong>Approved Tour Guide</strong>
                    <span>GlobalVista verified account.</span>
                  </div>
                </article>
              </section>
            )}
          </div>
        </div>
      </section>

        {/* ADD / EDIT DESTINATION MODAL */}
        {destinationModalOpen && (
          <div className={styles.modalOverlay} onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDestinationModal();
          }}>
            <section className={styles.destinationModal} role="dialog" aria-modal="true"
              aria-label={editingDestinationId ? 'Edit Destination' : 'Add Destination'}>
              <div className={styles.modalHeader}>
                <div>
                  <span>GLOBALVISTA GUIDE DESTINATIONS</span>
                  <h2>{editingDestinationId ? 'Edit Destination' : 'Add Destination'}</h2>
                  <p>Admin approval is required before public display.</p>
                </div>
                <button type="button" onClick={closeDestinationModal}
                  disabled={destinationSaving || destinationImageUploading} aria-label="Close destination form">
                  <X size={20} />
                </button>
              </div>
              <form className={styles.destinationForm} onSubmit={(event) => void saveDestination(event)}>
                <div className={styles.destinationFormGrid}>
                  <label className={styles.field}>
                    <span>Destination Name *</span>
                    <input required minLength={2} maxLength={100} value={destinationForm.name}
                      onChange={(event) => updateDestinationField('name', event.target.value)}
                      placeholder="e.g. Sigiriya Rock Fortress" />
                  </label>
                  <label className={styles.field}>
                    <span>Country *</span>
                    <input required minLength={2} maxLength={100} value={destinationForm.country}
                      onChange={(event) => updateDestinationField('country', event.target.value)}
                      placeholder="e.g. Sri Lanka" />
                  </label>
                  <label className={`${styles.field} ${styles.destinationFullField}`}>
                    <span>Description</span>
                    <textarea maxLength={2000} rows={4} value={destinationForm.description}
                      onChange={(event) => updateDestinationField('description', event.target.value)}
                      placeholder="Describe what makes this destination special." />
                  </label>
                  <label className={styles.field}>
                    <span>Best Time to Visit</span>
                    <input maxLength={100} value={destinationForm.bestTimeToVisit}
                      onChange={(event) => updateDestinationField('bestTimeToVisit', event.target.value)}
                      placeholder="e.g. January to April" />
                  </label>
                  <label className={styles.field}>
                    <span>Budget</span>
                    <input maxLength={100} value={destinationForm.budget}
                      onChange={(event) => updateDestinationField('budget', event.target.value)}
                      placeholder="e.g. LKR 5,000 - 10,000" />
                  </label>
                  <label className={styles.field}>
                    <span>Latitude</span>
                    <input type="number" min="-90" max="90" step="any" value={destinationForm.latitude}
                      onChange={(event) => updateDestinationField('latitude', event.target.value)}
                      placeholder="e.g. 7.9570" />
                  </label>
                  <label className={styles.field}>
                    <span>Longitude</span>
                    <input type="number" min="-180" max="180" step="any" value={destinationForm.longitude}
                      onChange={(event) => updateDestinationField('longitude', event.target.value)}
                      placeholder="e.g. 80.7603" />
                  </label>
                  <label className={`${styles.field} ${styles.destinationFullField}`}>
                    <span>Activities — one per line</span>
                    <textarea rows={3} value={destinationForm.activities}
                      onChange={(event) => updateDestinationField('activities', event.target.value)}
                      placeholder={'Sightseeing\nPhotography\nHiking'} />
                  </label>
                  <div className={`${styles.field} ${styles.destinationFullField}`}>
                    <span>Images (up to 5 per upload)</span>
                    <label className={styles.destinationUploadButton}>
                      <ImagePlus size={16} />
                      {destinationImageUploading ? 'Uploading images...' : 'Upload JPG / PNG / WEBP images'}
                      <input type="file" accept="image/jpeg,image/png,image/webp" multiple
                        disabled={destinationSaving || destinationImageUploading}
                        onChange={(event) => void uploadDestinationImages(event)} />
                    </label>
                    <label className={styles.destinationUrlLabel}>
                      Image URLs (one per line)
                      <textarea rows={3} value={destinationForm.images}
                        onChange={(event) => updateDestinationField('images', event.target.value)}
                        placeholder="https://example.com/image.jpg" />
                    </label>
                    <small>If image upload returns 403, the backend upload endpoint must allow GUIDE accounts.</small>
                  </div>
                </div>
                {destinationFormError && (
                  <p className={styles.formError} role="alert">{destinationFormError}</p>
                )}
                <div className={styles.destinationApprovalNotice}>
                  <ShieldCheck size={17} /> New or edited destinations are submitted for admin review.
                </div>
                <div className={styles.modalFooter}>
                  <button type="button" className={styles.cancelButton}
                    disabled={destinationSaving || destinationImageUploading}
                    onClick={closeDestinationModal}>Cancel</button>
                  <button type="submit" className={styles.submitButton}
                    disabled={destinationSaving || destinationImageUploading}>
                    {destinationSaving ? 'Submitting...' : editingDestinationId ? 'Save & Resubmit' : 'Submit for Approval'}
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

      {/* PROFILE MODAL */}

      {dialog && (
        <div
          className={styles.modalOverlay}
          onMouseDown={closeDialog}
        >
          <section
            className={styles.profileModal}
            role="dialog"
            aria-modal="true"
            aria-label={
              dialog === 'edit'
                ? 'Edit Profile'
                : 'Change Password'
            }
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className={styles.modalHeader}>
              <div>
                <span>
                  GLOBALVISTA TOUR GUIDE
                </span>

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
                aria-label="Close"
                disabled={busy || uploading}
                onClick={closeDialog}
              >
                <X size={20} />
              </button>
            </div>

            {dialog === 'edit' ? (
              <form
                className={styles.profileForm}
                onSubmit={(event) =>
                  void saveProfile(event)
                }
              >
                <div className={styles.photoRow}>
                  {avatar(styles.bigAvatar)}

                  <div>
                    <strong>Profile Photo</strong>

                    <span>
                      JPG, PNG or WEBP, up to 5 MB
                    </span>

                    <button
                      type="button"
                      className={styles.uploadButton}
                      disabled={busy || uploading}
                      onClick={() =>
                        photoInput.current?.click()
                      }
                    >
                      <Camera size={15} />

                      {uploading
                        ? 'Uploading...'
                        : 'Upload / Change Photo'}
                    </button>
                  </div>

                  <input
                    ref={photoInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className={styles.hiddenInput}
                    onChange={(event) =>
                      void uploadPhoto(event)
                    }
                  />
                </div>

                <label className={styles.field}>
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

                <label className={styles.field}>
                  <span>Email Address</span>

                  <input
                    value={guide.email || ''}
                    disabled
                  />
                </label>

                <div className={styles.fieldRow}>
                  <label className={styles.field}>
                    <span>Mobile Number</span>

                    <input
                      required
                      maxLength={30}
                      value={mobile}
                      onChange={(event) =>
                        setMobile(event.target.value)
                      }
                    />
                  </label>

                  <label className={styles.field}>
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
                  className={styles.readonlyNote}
                >
                  <ShieldCheck size={16} />
                  Email, role and identity documents
                  cannot be changed here.
                </div>

                {formError && (
                  <p
                    className={styles.formError}
                    role="alert"
                  >
                    {formError}
                  </p>
                )}

                {success && (
                  <p
                    className={styles.formSuccess}
                    role="status"
                  >
                    {success}
                  </p>
                )}

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={closeDialog}
                    disabled={busy || uploading}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={busy || uploading}
                  >
                    {busy
                      ? 'Saving...'
                      : 'Save Changes'}

                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </form>
            ) : (
              <form
                className={styles.profileForm}
                onSubmit={(event) =>
                  void changePassword(event)
                }
              >
                <label className={styles.field}>
                  <span>Current Password</span>

                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) =>
                      setCurrentPassword(
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label className={styles.field}>
                  <span>New Password</span>

                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label className={styles.field}>
                  <span>Confirm New Password</span>

                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value,
                      )
                    }
                  />
                </label>

                {formError && (
                  <p
                    className={styles.formError}
                    role="alert"
                  >
                    {formError}
                  </p>
                )}

                {success && (
                  <p
                    className={styles.formSuccess}
                    role="status"
                  >
                    {success}
                  </p>
                )}

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={closeDialog}
                    disabled={busy}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={busy}
                  >
                    {busy
                      ? 'Updating...'
                      : 'Change Password'}

                    <KeyRound size={16} />
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {/* LOGOUT MODAL */}

      {logoutOpen && (
        <div
          className={styles.modalOverlay}
          onMouseDown={() =>
            setLogoutOpen(false)
          }
        >
          <section
            className={styles.logoutDialog}
            role="alertdialog"
            aria-modal="true"
            aria-label="Confirm Sign Out"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className={styles.logoutIcon}>
              <LogOut size={25} />
            </div>

            <h2>Log out of GlobalVista?</h2>

            <p>
              You will be signed out of your
              Tour Guide account.
            </p>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() =>
                  setLogoutOpen(false)
                }
              >
                Stay Logged In
              </button>

              <button
                type="button"
                className={styles.logoutButton}
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

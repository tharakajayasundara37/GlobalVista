
'use client';

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Edit3,
  Eye,
  Globe2,
  ImageIcon,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  Upload,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

import styles from './page.module.css';

const API_URL = 'http://localhost:3001';

type ReviewInfo = {
  averageRating?: number;
  totalReviews?: number;
};

type AddOnPricingType =
  | 'PER_PERSON'
  | 'PER_BOOKING';

type PackageAddOn = {
  _id?: string;
  name: string;
  price: number;
  pricingType: AddOnPricingType;
};

type AddOnForm = {
  name: string;
  price: string;
  pricingType: AddOnPricingType;
};

type DestinationOption = {
  _id: string;
  name: string;
  country: string;
  isActive?: boolean;
};

const INCLUDED_OPTIONS = [
  'Hotel Accommodation',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Airport Transfers',
  'Local Guide',
  'Private Transport',
  'Entry Tickets',
  'Sightseeing Tours',
  'Activities',
  'Travel Insurance',
  'Wi-Fi',
];

type TravelPackage = {
  _id: string;
  title?: string;
  destinationId?: string | { _id: string } | null;
  destination?: string;
  country?: string;
  duration?: string;
  price?: number;
  category?: string;
  description?: string;
  included?: string[];
  addOns?: PackageAddOn[];
  images?: string[];
  availability?: boolean;

  isSpecialOffer?: boolean;
  originalPrice?: number;
  discountPercentage?: number;

  reviewInfo?: ReviewInfo;

  createdAt?: string;
  updatedAt?: string;
};

type PackageForm = {
  title: string;
  destinationId: string;
  destination: string;
  country: string;
  duration: string;
  price: string;
  category: string;
  description: string;
  included: string[];
  addOns: AddOnForm[];
  availability: boolean;

  isSpecialOffer: boolean;
  originalPrice: string;
};

const emptyForm: PackageForm = {
  title: '',
  destinationId: '',
  destination: '',
  country: '',
  duration: '',
  price: '',
  category: '',
  description: '',
  included: [],
  addOns: [],
  availability: true,

  isSpecialOffer: false,
  originalPrice: '',
};

function readDestinationId(
  value: TravelPackage['destinationId'],
): string {
  if (typeof value === 'string') {
    return value;
  }

  if (
    value &&
    typeof value === 'object' &&
    typeof value._id === 'string'
  ) {
    return value._id;
  }

  return '';
}

export default function PackagesPage() {
  const router = useRouter();

  const [packages, setPackages] =
    useState<TravelPackage[]>([]);

  const [destinations, setDestinations] =
    useState<DestinationOption[]>([]);

  const [destinationsLoading, setDestinationsLoading] =
    useState(false);

  const [destinationsError, setDestinationsError] =
    useState('');

  const [selectedPackage, setSelectedPackage] =
    useState<TravelPackage | null>(null);

  const [editingPackage, setEditingPackage] =
    useState<TravelPackage | null>(null);

  const [form, setForm] =
    useState<PackageForm>(emptyForm);

  const [formOpen, setFormOpen] =
    useState(false);

  const [includedOpen, setIncludedOpen] =
    useState(false);

  const [selectedImages, setSelectedImages] =
    useState<File[]>([]);

  const [imagePreviews, setImagePreviews] =
    useState<string[]>([]);

  const [search, setSearch] =
    useState('');

  const [categoryFilter, setCategoryFilter] =
    useState('ALL');

  const [availabilityFilter, setAvailabilityFilter] =
    useState('ALL');

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const [error, setError] =
    useState('');

  /* =========================
     AUTH
  ========================= */

  const getToken = () =>
    localStorage.getItem('globalvista_token') ||
    localStorage.getItem('token');

  const getStoredUser = () => {
    const rawUser =
      localStorage.getItem('globalvista_user') ||
      localStorage.getItem('user');

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser);
    } catch {
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
     IMAGE PREVIEW CLEANUP
  ========================= */

  const clearImageSelection = () => {
    imagePreviews.forEach((preview) => {
      if (preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    });

    setSelectedImages([]);
    setImagePreviews([]);
  };

  /* =========================
     LOAD PACKAGES
  ========================= */

  const loadPackages = async (
    refresh = false,
  ) => {
    const token = getToken();
    const user = getStoredUser();

    if (!token || !user) {
      router.replace('/login');
      return;
    }

    if (user.role !== 'ADMIN') {
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
      const response = await fetch(
        `${API_URL}/packages`,
        {
          cache: 'no-store',
        },
      );

      const data = await response
        .json()
        .catch(() => []);

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message ||
                'Unable to load packages.',
        );
      }

      setPackages(
        Array.isArray(data) ? data : [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load packages.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* =========================
     LOAD DATABASE DESTINATIONS
  ========================= */

  const loadDestinations = async () => {
    const token = getToken();

    if (!token) {
      return;
    }

    setDestinationsLoading(true);
    setDestinationsError('');

    try {
      const response = await fetch(
        `${API_URL}/destinations/admin/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (
        !response.ok ||
        !Array.isArray(data)
      ) {
        throw new Error(
          'Unable to load destinations. Please try again.',
        );
      }

      setDestinations(data);
    } catch (err) {
      setDestinationsError(
        err instanceof Error
          ? err.message
          : 'Unable to load destinations.',
      );
    } finally {
      setDestinationsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPackages();
      void loadDestinations();
    }, 0);

    return () => window.clearTimeout(timer);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================
     CREATE PACKAGE
  ========================= */

  const openCreate = () => {
    clearImageSelection();

    setEditingPackage(null);

    setForm({
      ...emptyForm,
    });

    setError('');
    setIncludedOpen(false);
    setFormOpen(true);

    void loadDestinations();
  };

  /* =========================
     EDIT PACKAGE
  ========================= */

  const openEdit = (
    item: TravelPackage,
  ) => {
    clearImageSelection();

    setEditingPackage(item);

    setForm({
      title: item.title || '',

      destinationId: readDestinationId(
        item.destinationId,
      ),

      destination:
        item.destination || '',

      country:
        item.country || '',

      duration:
        item.duration || '',

      price:
        String(item.price ?? ''),

      category:
        item.category || '',

      description:
        item.description || '',

      included:
        item.included || [],

      addOns:
        (item.addOns || []).map(
          (addOn) => ({
            name: addOn.name || '',
            price: String(
              addOn.price ?? '',
            ),
            pricingType:
              addOn.pricingType ||
              'PER_PERSON',
          }),
        ),

      availability:
        item.availability ?? true,

      isSpecialOffer:
        item.isSpecialOffer ?? false,

      originalPrice:
        item.isSpecialOffer
          ? String(
              item.originalPrice ?? '',
            )
          : '',
    });

    setImagePreviews(
      (item.images || [])
        .map(getImageUrl)
        .filter(Boolean),
    );

    setError('');
    setIncludedOpen(false);
    setFormOpen(true);

    void loadDestinations();
  };

  /* =========================
     SELECT DATABASE DESTINATION
  ========================= */

  const selectDestination = (
    destinationId: string,
  ) => {
    const chosen = destinations.find(
      (item) => item._id === destinationId,
    );

    if (!chosen) {
      return;
    }

    setForm((current) => ({
      ...current,
      destinationId: chosen._id,
      destination: chosen.name,
      country: chosen.country,
    }));

    setError('');
  };

  /* =========================
     CLOSE FORM
  ========================= */

  const closeForm = () => {
    clearImageSelection();
    setFormOpen(false);
    setEditingPackage(null);

    setForm({
      ...emptyForm,
    });

    setIncludedOpen(false);
  };

  /* =========================
     INCLUDED ITEMS + ADD-ONS
  ========================= */

  const toggleIncludedItem = (
    item: string,
  ) => {
    setForm((current) => {
      if (current.included.includes(item)) {
        return {
          ...current,
          included:
            current.included.filter(
              (value) => value !== item,
            ),
        };
      }

      if (current.included.length >= 6) {
        setError(
          'You can select a maximum of 6 free included items.',
        );

        return current;
      }

      setError('');

      return {
        ...current,
        included: [
          ...current.included,
          item,
        ],
      };
    });
  };

  const addAddOn = () => {
    setForm((current) => ({
      ...current,
      addOns: [
        ...current.addOns,
        {
          name: '',
          price: '',
          pricingType: 'PER_PERSON',
        },
      ],
    }));
  };

  const updateAddOn = (
    index: number,
    key: keyof AddOnForm,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      addOns: current.addOns.map(
        (addOn, currentIndex) =>
          currentIndex === index
            ? {
                ...addOn,
                [key]: value,
              }
            : addOn,
      ),
    }));
  };

  const removeAddOn = (
    index: number,
  ) => {
    setForm((current) => ({
      ...current,
      addOns: current.addOns.filter(
        (_, currentIndex) =>
          currentIndex !== index,
      ),
    }));
  };

  /* =========================
     SELECT IMAGES
  ========================= */

  const handleImageSelect = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(
      event.target.files || [],
    );

    if (files.length === 0) {
      return;
    }

    if (files.length > 5) {
      setError(
        'You can upload a maximum of 5 images.',
      );

      event.target.value = '';
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    const invalidFile = files.find(
      (file) =>
        !allowedTypes.includes(
          file.type,
        ),
    );

    if (invalidFile) {
      setError(
        'Only JPG, JPEG, PNG and WEBP images are allowed.',
      );

      event.target.value = '';
      return;
    }

    const largeFile = files.find(
      (file) =>
        file.size > 5 * 1024 * 1024,
    );

    if (largeFile) {
      setError(
        'Each image must be smaller than 5MB.',
      );

      event.target.value = '';
      return;
    }

    imagePreviews.forEach((preview) => {
      if (preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    });

    const previews = files.map(
      (file) =>
        URL.createObjectURL(file),
    );

    setSelectedImages(files);
    setImagePreviews(previews);
    setError('');
  };

  /* =========================
     REMOVE SELECTED IMAGE
  ========================= */

  const removeSelectedImage = (
    index: number,
  ) => {
    const preview =
      imagePreviews[index];

    if (
      preview?.startsWith('blob:')
    ) {
      URL.revokeObjectURL(preview);
    }

    setSelectedImages((current) =>
      current.filter(
        (_, currentIndex) =>
          currentIndex !== index,
      ),
    );

    setImagePreviews((current) =>
      current.filter(
        (_, currentIndex) =>
          currentIndex !== index,
      ),
    );
  };

  /* =========================
     UPLOAD IMAGES
  ========================= */

  const uploadImages = async () => {
    const token = getToken();

    if (!token) {
      throw new Error(
        'Admin authentication required.',
      );
    }

    if (
      selectedImages.length === 0
    ) {
      return [];
    }

    const uploadData =
      new FormData();

    selectedImages.forEach(
      (file) => {
        uploadData.append(
          'images',
          file,
        );
      },
    );

    const response = await fetch(
      `${API_URL}/packages/upload-images`,
      {
        method: 'POST',

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: uploadData,
      },
    );

    const data = await response
      .json()
      .catch(() => ({}));

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      clearSession();
      router.replace('/login');

      throw new Error(
        'Session expired.',
      );
    }

    if (!response.ok) {
      throw new Error(
        Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message ||
              'Unable to upload images.',
      );
    }

    return Array.isArray(data.images)
      ? data.images
      : [];
  };

  /* =========================
     SAVE PACKAGE
  ========================= */

  const savePackage = async () => {
    const token = getToken();

    if (!token) {
      return;
    }

    // New packages must link to a destination.
    // Old, unlinked packages can still be edited.
    if (
      !editingPackage &&
      !form.destinationId
    ) {
      setError(
        'Please select a destination from the dropdown.',
      );
      return;
    }

    if (
      !form.title.trim() ||
      !form.destination.trim() ||
      !form.country.trim() ||
      !form.duration.trim() ||
      !form.category.trim() ||
      !form.description.trim()
    ) {
      setError(
        'Please complete all required package fields.',
      );
      return;
    }

    const price = Number(
      form.price,
    );

    const originalPrice =
      form.isSpecialOffer
        ? Number(form.originalPrice)
        : 0;

    const discountPercentage =
      form.isSpecialOffer &&
      originalPrice > 0 &&
      originalPrice > price
        ? Math.round(
            (
              (originalPrice - price) /
              originalPrice
            ) * 100,
          )
        : 0;

    if (
      Number.isNaN(price) ||
      price < 0
    ) {
      setError(
        'Please enter a valid package price.',
      );
      return;
    }

    if (
      form.isSpecialOffer &&
      (
        Number.isNaN(originalPrice) ||
        originalPrice <= 0
      )
    ) {
      setError(
        'Please enter a valid original price for the special offer.',
      );
      return;
    }

    if (
      form.isSpecialOffer &&
      originalPrice <= price
    ) {
      setError(
        'Original price must be greater than the current offer price.',
      );
      return;
    }

    if (
      form.included.length > 6
    ) {
      setError(
        'You can select a maximum of 6 free included items.',
      );
      return;
    }

    const addOns: Array<{
      name: string;
      price: number;
      pricingType: AddOnPricingType;
    }> = [];

    for (
      let index = 0;
      index < form.addOns.length;
      index += 1
    ) {
      const addOn =
        form.addOns[index];

      const name =
        addOn.name.trim();

      const addOnPrice =
        Number(addOn.price);

      if (!name) {
        setError(
          `Please enter a name for add-on ${index + 1}.`,
        );
        return;
      }

      if (
        Number.isNaN(addOnPrice) ||
        addOnPrice < 0
      ) {
        setError(
          `Please enter a valid price for add-on "${name}".`,
        );
        return;
      }

      addOns.push({
        name,
        price: addOnPrice,
        pricingType:
          addOn.pricingType,
      });
    }

    const addOnNames =
      addOns.map(
        (addOn) =>
          addOn.name.toLowerCase(),
      );

    if (
      new Set(addOnNames).size !==
      addOnNames.length
    ) {
      setError(
        'Optional add-on names must be unique.',
      );
      return;
    }

    if (
      !editingPackage &&
      selectedImages.length === 0
    ) {
      setError(
        'Please select at least one package image.',
      );
      return;
    }

    setSaving(true);
    setError('');

    try {
      let images =
        editingPackage?.images || [];

      if (
        selectedImages.length > 0
      ) {
        images =
          await uploadImages();
      }

      const body = {
        title:
          form.title.trim(),

        destination:
          form.destination.trim(),

        country:
          form.country.trim(),

        // Save destinationId when linked.
        // Do not change legacy unlinked packages.
        ...(
          form.destinationId
            ? {
                destinationId:
                  form.destinationId,
              }
            : {}
        ),

        duration:
          form.duration.trim(),

        price,

        category:
          form.category.trim(),

        description:
          form.description.trim(),

        included:
          form.included,

        addOns,

        images,

        availability:
          form.availability,

        isSpecialOffer:
          form.isSpecialOffer,

        originalPrice:
          form.isSpecialOffer
            ? originalPrice
            : 0,

        discountPercentage:
          form.isSpecialOffer
            ? discountPercentage
            : 0,
      };

      const url = editingPackage
        ? `${API_URL}/packages/${editingPackage._id}`
        : `${API_URL}/packages`;

      const response = await fetch(
        url,
        {
          method:
            editingPackage
              ? 'PATCH'
              : 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${token}`,
          },

          body:
            JSON.stringify(body),
        },
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        clearSession();
        router.replace('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message ||
                'Unable to save package.',
        );
      }

      closeForm();

      await loadPackages(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save package.',
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     AVAILABILITY
  ========================= */

  const toggleAvailability = async (
    item: TravelPackage,
  ) => {
    const token = getToken();

    if (!token) {
      return;
    }

    setActionLoading(item._id);
    setError('');

    try {
      const nextValue =
        !item.availability;

      const response = await fetch(
        `${API_URL}/packages/${item._id}`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${token}`,
          },

          body:
            JSON.stringify({
              availability:
                nextValue,
            }),
        },
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message ||
                'Unable to update availability.',
        );
      }

      setPackages((current) =>
        current.map((pkg) =>
          pkg._id === item._id
            ? {
                ...pkg,
                availability:
                  nextValue,
              }
            : pkg,
        ),
      );

      setSelectedPackage((current) =>
        current?._id === item._id
          ? {
              ...current,
              availability:
                nextValue,
            }
          : current,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update availability.',
      );
    } finally {
      setActionLoading(null);
    }
  };

  /* =========================
     DELETE PACKAGE
  ========================= */

  const deletePackage = async (
    item: TravelPackage,
  ) => {
    const confirmed = window.confirm(
      `Delete "${item.title || 'this package'}" permanently?`,
    );

    if (!confirmed) {
      return;
    }

    const token = getToken();

    if (!token) {
      return;
    }

    setActionLoading(item._id);
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/packages/${item._id}`,
        {
          method: 'DELETE',

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message ||
                'Unable to delete package.',
        );
      }

      setPackages((current) =>
        current.filter(
          (pkg) =>
            pkg._id !== item._id,
        ),
      );

      setSelectedPackage(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete package.',
      );
    } finally {
      setActionLoading(null);
    }
  };

  /* =========================
     FILTERS
  ========================= */

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        packages
          .map(
            (item) => item.category,
          )
          .filter(
            (item): item is string =>
              Boolean(item),
          ),
      ),
    ).sort();
  }, [packages]);

  const filteredPackages = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return packages.filter((item) => {
      const matchesSearch =
        !query ||
        [
          item.title,
          item.destination,
          item.country,
          item.category,
          item.description,
        ].some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(query),
        );

      const matchesCategory =
        categoryFilter === 'ALL' ||
        item.category === categoryFilter;

      const matchesAvailability =
        availabilityFilter === 'ALL' ||
        (
          availabilityFilter ===
          'AVAILABLE'
        ) === Boolean(
          item.availability,
        );

      return (
        matchesSearch &&
        matchesCategory &&
        matchesAvailability
      );
    });
  }, [
    packages,
    search,
    categoryFilter,
    availabilityFilter,
  ]);

  /* =========================
     SUMMARY
  ========================= */

  const availableCount =
    packages.filter(
      (item) => item.availability,
    ).length;

  const unavailableCount =
    packages.length -
    availableCount;

  const countriesCount = new Set(
    packages
      .map((item) => item.country)
      .filter(Boolean),
  ).size;

  const averagePrice =
    packages.length
      ? packages.reduce(
          (total, item) =>
            total +
            Number(item.price || 0),
          0,
        ) / packages.length
      : 0;

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <main className={styles.loadingPage}>
        <div className={styles.loader} />

        <span>
          Loading packages...
        </span>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        {/* HEADER */}

        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              type="button"
              className={styles.backButton}
              onClick={() =>
                router.push('/admin')
              }
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <span>
                TRAVEL INVENTORY
              </span>

              <h1>
                Packages Management
              </h1>

              <p>
                Create, edit and manage
                GlobalVista travel packages.
              </p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.refreshButton}
              onClick={() =>
                loadPackages(true)
              }
              disabled={refreshing}
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

            <button
              type="button"
              className={styles.addButton}
              onClick={openCreate}
            >
              <Plus size={16} />
              Add Package
            </button>
          </div>
        </header>

        {/* SUMMARY */}

        <section className={styles.summaryGrid}>
          <SummaryCard
            icon={Package}
            title="Total Packages"
            value={packages.length}
            color="purple"
          />

          <SummaryCard
            icon={Check}
            title="Available"
            value={availableCount}
            color="green"
          />

          <SummaryCard
            icon={XCircle}
            title="Unavailable"
            value={unavailableCount}
            color="red"
          />

          <SummaryCard
            icon={Globe2}
            title="Countries"
            value={countriesCount}
            color="blue"
          />

          <SummaryCard
            icon={CircleDollarSign}
            title="Avg. Price"
            value={`$${formatMoney(
              averagePrice,
            )}`}
            color="cyan"
          />
        </section>

        {/* TOOLBAR */}

        <section className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={16} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search package, destination, country..."
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch('')
                }
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            className={styles.filterSelect}
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(
                event.target.value,
              )
            }
          >
            <option value="ALL">
              All Categories
            </option>

            {categories.map(
              (category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ),
            )}
          </select>

          <select
            className={styles.filterSelect}
            value={availabilityFilter}
            onChange={(event) =>
              setAvailabilityFilter(
                event.target.value,
              )
            }
          >
            <option value="ALL">
              All Availability
            </option>

            <option value="AVAILABLE">
              Available
            </option>

            <option value="UNAVAILABLE">
              Unavailable
            </option>
          </select>

          <span className={styles.resultCount}>
            {filteredPackages.length}{' '}
            packages
          </span>
        </section>

        {/* ERROR */}

        {error && (
          <div className={styles.errorBox}>
            <XCircle size={16} />

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError('')
              }
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* PACKAGE GRID */}

        {filteredPackages.length > 0 ? (
          <section className={styles.packageGrid}>
            {filteredPackages.map(
              (item) => {
                const image =
                  getPackageImage(item);

                const reviewRating =
                  Number(
                    item.reviewInfo
                      ?.averageRating || 0,
                  );

                const reviewCount =
                  Number(
                    item.reviewInfo
                      ?.totalReviews || 0,
                  );

                return (
                  <article
                    key={item._id}
                    className={
                      styles.packageCard
                    }
                  >
                    <div className={styles.imageWrap}>
                      {image ? (
                        <img
                          src={image}
                          alt={
                            item.title ||
                            'Travel package'
                          }
                        />
                      ) : (
                        <div className={styles.imageFallback}>
                          <ImageIcon size={28} />
                        </div>
                      )}

                      <span
                        className={
                          item.availability
                            ? styles.availableBadge
                            : styles.unavailableBadge
                        }
                      >
                        {item.availability
                          ? 'Available'
                          : 'Unavailable'}
                      </span>

                      {item.isSpecialOffer && (
                        <span
                          className={
                            styles.specialOfferBadge
                          }
                        >
                          SPECIAL
                          {Number(
                            item.discountPercentage ||
                              0,
                          ) > 0
                            ? ` ${Math.round(
                                Number(
                                  item.discountPercentage,
                                ),
                              )}% OFF`
                            : ''}
                        </span>
                      )}

                      <span
                        className={
                          styles.categoryBadge
                        }
                      >
                        {item.category || 'Travel'}
                      </span>
                    </div>

                    <div className={styles.cardContent}>
                      <div className={styles.cardTop}>
                        <div>
                          <h2>
                            {item.title ||
                              'Travel Package'}
                          </h2>

                          <span
                            className={
                              styles.location
                            }
                          >
                            <MapPin size={12} />
                            {item.destination ||
                              item.country ||
                              'Destination'}
                          </span>
                        </div>

                        <strong
                          className={
                            styles.price
                          }
                        >
                          $
                          {formatMoney(
                            item.price || 0,
                          )}
                        </strong>
                      </div>

                      <div className={styles.metaRow}>
                        <span>
                          <CalendarDays size={12} />

                          {item.duration || '—'}
                        </span>

                        <span>
                          <Star size={12} />

                          {reviewRating > 0
                            ? `${reviewRating.toFixed(1)} (${reviewCount})`
                            : 'New'}
                        </span>

                        <span>
                          <Globe2 size={12} />

                          {item.country || '—'}
                        </span>
                      </div>

                      <p
                        className={
                          styles.description
                        }
                      >
                        {item.description ||
                          'No description provided.'}
                      </p>

                      <div className={styles.cardActions}>
                        <button
                          type="button"
                          className={
                            styles.viewButton
                          }
                          onClick={() =>
                            setSelectedPackage(item)
                          }
                        >
                          <Eye size={14} />
                          View
                        </button>

                        <button
                          type="button"
                          className={
                            styles.editButton
                          }
                          onClick={() =>
                            openEdit(item)
                          }
                        >
                          <Edit3 size={14} />
                          Edit
                        </button>

                        <button
                          type="button"
                          className={
                            styles.availabilityButton
                          }
                          disabled={
                            actionLoading ===
                            item._id
                          }
                          onClick={() =>
                            toggleAvailability(item)
                          }
                        >
                          {item.availability
                            ? 'Disable'
                            : 'Enable'}
                        </button>

                        <button
                          type="button"
                          className={
                            styles.deleteButton
                          }
                          disabled={
                            actionLoading ===
                            item._id
                          }
                          onClick={() =>
                            deletePackage(item)
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              },
            )}
          </section>
        ) : (
          <section className={styles.emptyState}>
            <Package size={36} />

            <h2>
              No packages found
            </h2>

            <p>
              Add a new travel package
              or change your filters.
            </p>
          </section>
        )}
      </section>

      {/* =========================
          DETAILS MODAL
      ========================= */}

      {selectedPackage && (
        <div
          className={styles.modalOverlay}
          onMouseDown={() =>
            setSelectedPackage(null)
          }
        >
          <section
            className={styles.detailsModal}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className={styles.modalHeader}>
              <div>
                <span>
                  PACKAGE DETAILS
                </span>

                <h2>
                  {selectedPackage.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedPackage(null)
                }
              >
                <X size={18} />
              </button>
            </div>

            {getPackageImage(
              selectedPackage,
            ) && (
              <img
                className={styles.detailImage}
                src={getPackageImage(
                  selectedPackage,
                )}
                alt={
                  selectedPackage.title ||
                  'Package'
                }
              />
            )}

            <div className={styles.detailGrid}>
              <InfoItem
                label="Destination"
                value={
                  selectedPackage.destination ||
                  '—'
                }
              />

              <InfoItem
                label="Country"
                value={
                  selectedPackage.country ||
                  '—'
                }
              />

              <InfoItem
                label="Duration"
                value={
                  selectedPackage.duration ||
                  '—'
                }
              />

              <InfoItem
                label="Category"
                value={
                  selectedPackage.category ||
                  '—'
                }
              />

              <InfoItem
                label="Price"
                value={`$${formatMoney(
                  selectedPackage.price ||
                    0,
                )}`}
              />

              <InfoItem
                label="Special Offer"
                value={
                  selectedPackage.isSpecialOffer
                    ? `Yes${
                        Number(
                          selectedPackage.discountPercentage ||
                            0,
                        ) > 0
                          ? ` (${Math.round(
                              Number(
                                selectedPackage.discountPercentage,
                              ),
                            )}% OFF)`
                          : ''
                      }`
                    : 'No'
                }
              />

              {selectedPackage.isSpecialOffer && (
                <InfoItem
                  label="Original Price"
                  value={`$${formatMoney(
                    selectedPackage.originalPrice ||
                      0,
                  )}`}
                />
              )}

              <InfoItem
                label="Availability"
                value={
                  selectedPackage.availability
                    ? 'Available'
                    : 'Unavailable'
                }
              />
            </div>

            <div className={styles.detailSection}>
              <span>
                DESCRIPTION
              </span>

              <p>
                {selectedPackage.description ||
                  'No description.'}
              </p>
            </div>

            <div className={styles.detailSection}>
              <span>
                INCLUDED
              </span>

              <div className={styles.includedList}>
                {(
                  selectedPackage.included ||
                  []
                ).map(
                  (
                    includedItem,
                    index,
                  ) => (
                    <div
                      key={`${includedItem}-${index}`}
                    >
                      <Check size={13} />
                      {includedItem}
                    </div>
                  ),
                )}

                {!selectedPackage
                  .included?.length && (
                  <p>
                    No inclusions provided.
                  </p>
                )}
              </div>
            </div>

            <div className={styles.detailSection}>
              <span>
                OPTIONAL ADD-ONS
              </span>

              <div className={styles.addOnDetailList}>
                {(
                  selectedPackage.addOns ||
                  []
                ).map(
                  (addOn, index) => (
                    <div
                      key={
                        addOn._id ||
                        `${addOn.name}-${index}`
                      }
                    >
                      <div>
                        <strong>
                          {addOn.name}
                        </strong>

                        <small>
                          {addOn.pricingType ===
                          'PER_PERSON'
                            ? 'Per person'
                            : 'Per booking'}
                        </small>
                      </div>

                      <b>
                        ${formatMoney(
                          addOn.price,
                        )}
                      </b>
                    </div>
                  ),
                )}

                {!selectedPackage
                  .addOns?.length && (
                  <p>
                    No optional paid
                    add-ons configured.
                  </p>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={
                  styles.closeButton
                }
                onClick={() =>
                  setSelectedPackage(null)
                }
              >
                Close
              </button>

              <button
                type="button"
                className={
                  styles.editMainButton
                }
                onClick={() => {
                  const item =
                    selectedPackage;

                  setSelectedPackage(null);
                  openEdit(item);
                }}
              >
                <Edit3 size={15} />
                Edit Package
              </button>
            </div>
          </section>
        </div>
      )}

      {/* =========================
          CREATE / EDIT MODAL
      ========================= */}

      {formOpen && (
        <div className={styles.modalOverlay}>
          <section className={styles.formModal}>
            <div className={styles.modalHeader}>
              <div>
                <span>
                  {editingPackage
                    ? 'EDIT PACKAGE'
                    : 'NEW PACKAGE'}
                </span>

                <h2>
                  {editingPackage
                    ? 'Update Travel Package'
                    : 'Create Travel Package'}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeForm}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.formGrid}>
              <Field
                label="Package Title"
                value={form.title}
                onChange={(value) =>
                  updateForm(
                    'title',
                    value,
                  )
                }
              />

              {/* =========================
                  DESTINATION DROPDOWN
              ========================= */}

              <div className={styles.field}>
                <label>
                  Select Destination
                </label>

                <select
                  className={styles.filterSelect}
                  style={{ width: '100%' }}
                  value={form.destinationId}
                  onChange={(event) =>
                    selectDestination(
                      event.target.value,
                    )
                  }
                  disabled={destinationsLoading}
                  required={!editingPackage}
                >
                  <option
                    value=""
                    disabled={Boolean(
                      form.destinationId,
                    )}
                  >
                    {destinationsLoading
                      ? 'Loading destinations...'
                      : editingPackage &&
                          !form.destinationId
                        ? 'Existing package - select to link'
                        : 'Choose a destination'}
                  </option>

                  {form.destinationId &&
                    !destinations.some(
                      (destination) =>
                        destination._id ===
                        form.destinationId,
                    ) && (
                      <option
                        value={form.destinationId}
                      >
                        {form.destination ||
                          'Current destination'}{' '}
                        (currently linked)
                      </option>
                    )}

                  {destinations
                    .filter(
                      (destination) =>
                        destination.isActive !==
                          false ||
                        destination._id ===
                          form.destinationId,
                    )
                    .map(
                      (destination) => (
                        <option
                          key={
                            destination._id
                          }
                          value={
                            destination._id
                          }
                        >
                          {destination.name}
                          {' - '}
                          {destination.country}
                        </option>
                      ),
                    )}
                </select>

                {destinationsError && (
                  <small>
                    {destinationsError}{' '}

                    <button
                      type="button"
                      onClick={() =>
                        void loadDestinations()
                      }
                    >
                      Retry
                    </button>
                  </small>
                )}
              </div>

              <Field
                label="Destination"
                value={form.destination}
                onChange={(value) =>
                  updateForm(
                    'destination',
                    value,
                  )
                }
                readOnly={
                  Boolean(
                    form.destinationId,
                  ) ||
                  !editingPackage
                }
              />

              <Field
                label="Country"
                value={form.country}
                onChange={(value) =>
                  updateForm(
                    'country',
                    value,
                  )
                }
                readOnly={
                  Boolean(
                    form.destinationId,
                  ) ||
                  !editingPackage
                }
              />

              <Field
                label="Duration"
                value={form.duration}
                placeholder="e.g. 5 Days / 4 Nights"
                onChange={(value) =>
                  updateForm(
                    'duration',
                    value,
                  )
                }
              />

              <Field
                label="Price"
                type="number"
                value={form.price}
                placeholder="e.g. 1200"
                onChange={(value) =>
                  updateForm(
                    'price',
                    value,
                  )
                }
              />

              <Field
                label="Category"
                value={form.category}
                placeholder="Adventure, Beach, Cultural..."
                onChange={(value) =>
                  updateForm(
                    'category',
                    value,
                  )
                }
              />

              <div className={styles.switchField}>
                <span>
                  Availability
                </span>

                <button
                  type="button"
                  className={
                    form.availability
                      ? styles.switchOn
                      : styles.switchOff
                  }
                  onClick={() =>
                    setForm(
                      (current) => ({
                        ...current,
                        availability:
                          !current.availability,
                      }),
                    )
                  }
                >
                  <i />

                  {form.availability
                    ? 'Available'
                    : 'Unavailable'}
                </button>
              </div>

              <div className={styles.switchField}>
                <span>
                  Special Offer
                </span>

                <button
                  type="button"
                  className={
                    form.isSpecialOffer
                      ? styles.specialSwitchOn
                      : styles.specialSwitchOff
                  }
                  onClick={() =>
                    setForm(
                      (current) =>
                        current.isSpecialOffer
                          ? {
                              ...current,
                              isSpecialOffer:
                                false,
                              originalPrice:
                                '',
                            }
                          : {
                              ...current,
                              isSpecialOffer:
                                true,
                            },
                    )
                  }
                >
                  <i />

                  {form.isSpecialOffer
                    ? 'Special Offer ON'
                    : 'Special Offer OFF'}
                </button>
              </div>

              {form.isSpecialOffer && (
                <>
                  <Field
                    label="Original Price"
                    type="number"
                    value={
                      form.originalPrice
                    }
                    placeholder="e.g. 1499"
                    onChange={(value) =>
                      updateForm(
                        'originalPrice',
                        value,
                      )
                    }
                  />

                  <div className={styles.offerPreview}>
                    <span>
                      DISCOUNT PREVIEW
                    </span>

                    <strong>
                      {Number(
                        form.originalPrice,
                      ) >
                        Number(
                          form.price,
                        ) &&
                      Number(
                        form.originalPrice,
                      ) > 0
                        ? `${Math.round(
                            (
                              (
                                Number(
                                  form.originalPrice,
                                ) -
                                Number(
                                  form.price,
                                )
                              ) /
                              Number(
                                form.originalPrice,
                              )
                            ) * 100,
                          )}% OFF`
                        : '—'}
                    </strong>

                    <small>
                      Original price must
                      be higher than the
                      current package price.
                    </small>
                  </div>
                </>
              )}

              <div className={styles.fullField}>
                <label>
                  Description
                </label>

                <textarea
                  rows={4}
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    updateForm(
                      'description',
                      event.target.value,
                    )
                  }
                  placeholder="Package description..."
                />
              </div>

              <div className={styles.fullField}>
                <div className={styles.fieldTitleRow}>
                  <label>
                    Included Items
                  </label>

                  <span className={styles.freeCounter}>
                    {form.included.length}
                    /6 FREE
                  </span>
                </div>

                <div className={styles.multiSelect}>
                  <button
                    type="button"
                    className={
                      styles.multiSelectButton
                    }
                    onClick={() =>
                      setIncludedOpen(
                        (current) =>
                          !current,
                      )
                    }
                  >
                    <span>
                      {form.included.length > 0
                        ? `${form.included.length} free items selected`
                        : 'Select up to 6 free items'}
                    </span>

                    <ChevronDown
                      size={16}
                      className={
                        includedOpen
                          ? styles.chevronOpen
                          : ''
                      }
                    />
                  </button>

                  {includedOpen && (
                    <div className={styles.multiSelectMenu}>
                      {Array.from(
                        new Set([
                          ...INCLUDED_OPTIONS,
                          ...form.included,
                        ]),
                      ).map(
                        (item) => {
                          const selected =
                            form.included.includes(
                              item,
                            );

                          const disabled =
                            !selected &&
                            form.included.length >= 6;

                          return (
                            <button
                              type="button"
                              key={item}
                              disabled={
                                disabled
                              }
                              className={`${styles.multiOption} ${
                                selected
                                  ? styles.multiOptionSelected
                                  : ''
                              }`}
                              onClick={() =>
                                toggleIncludedItem(
                                  item,
                                )
                              }
                            >
                              <span className={styles.checkBox}>
                                {selected && (
                                  <Check size={12} />
                                )}
                              </span>

                              {item}

                              {disabled && (
                                <small>
                                  Free limit reached
                                </small>
                              )}
                            </button>
                          );
                        },
                      )}
                    </div>
                  )}
                </div>

                {form.included.length > 0 && (
                  <div className={styles.selectedItems}>
                    {form.included.map(
                      (item) => (
                        <span key={item}>
                          <Check size={10} />

                          {item}

                          <button
                            type="button"
                            onClick={() =>
                              toggleIncludedItem(
                                item,
                              )
                            }
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ),
                    )}
                  </div>
                )}

                <small>
                  The first 6 selected
                  services are included
                  free in the package.
                </small>
              </div>

              <div className={styles.fullField}>
                <div className={styles.addOnHeader}>
                  <div>
                    <label>
                      Optional Paid Add-ons
                    </label>

                    <small>
                      These extras increase
                      the traveller&apos;s
                      booking total when
                      selected.
                    </small>
                  </div>

                  <button
                    type="button"
                    className={
                      styles.addAddOnButton
                    }
                    onClick={addAddOn}
                  >
                    <Plus size={13} />
                    Add Extra
                  </button>
                </div>

                {form.addOns.length === 0 ? (
                  <div className={styles.noAddOns}>
                    No paid add-ons yet.
                    Click Add Extra to
                    create one.
                  </div>
                ) : (
                  <div className={styles.addOnList}>
                    {form.addOns.map(
                      (addOn, index) => (
                        <div
                          key={index}
                          className={
                            styles.addOnRow
                          }
                        >
                          <div className={styles.addOnNumber}>
                            {index + 1}
                          </div>

                          <div className={styles.addOnField}>
                            <label>
                              Add-on Name
                            </label>

                            <input
                              type="text"
                              value={
                                addOn.name
                              }
                              placeholder="e.g. Dinner"
                              onChange={(event) =>
                                updateAddOn(
                                  index,
                                  'name',
                                  event.target.value,
                                )
                              }
                            />
                          </div>

                          <div className={styles.addOnPriceField}>
                            <label>
                              Price ($)
                            </label>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                addOn.price
                              }
                              placeholder="0"
                              onChange={(event) =>
                                updateAddOn(
                                  index,
                                  'price',
                                  event.target.value,
                                )
                              }
                            />
                          </div>

                          <div className={styles.addOnTypeField}>
                            <label>
                              Charge
                            </label>

                            <select
                              value={
                                addOn.pricingType
                              }
                              onChange={(event) =>
                                updateAddOn(
                                  index,
                                  'pricingType',
                                  event.target.value,
                                )
                              }
                            >
                              <option value="PER_PERSON">
                                Per Person
                              </option>

                              <option value="PER_BOOKING">
                                Per Booking
                              </option>
                            </select>
                          </div>

                          <button
                            type="button"
                            className={
                              styles.removeAddOnButton
                            }
                            title="Remove add-on"
                            onClick={() =>
                              removeAddOn(
                                index,
                              )
                            }
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>

              {/* IMAGE UPLOAD */}

              <div className={styles.fullField}>
                <label>
                  Package Images
                </label>

                <label className={styles.imageUploadBox}>
                  <Upload size={26} />

                  <strong>
                    Choose Package Images
                  </strong>

                  <span>
                    JPG, PNG or WEBP
                    · Maximum 5 images
                    · 5MB each
                  </span>

                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    onChange={
                      handleImageSelect
                    }
                  />
                </label>

                {editingPackage &&
                  selectedImages.length === 0 &&
                  imagePreviews.length > 0 && (
                    <small className={styles.existingImageText}>
                      Current package images.
                      Select new images only
                      if you want to replace
                      them.
                    </small>
                  )}

                {imagePreviews.length > 0 && (
                  <div className={styles.imagePreviewGrid}>
                    {imagePreviews.map(
                      (preview, index) => (
                        <div
                          key={`${preview}-${index}`}
                          className={
                            styles.imagePreview
                          }
                        >
                          <img
                            src={preview}
                            alt={`Package preview ${
                              index + 1
                            }`}
                          />

                          {selectedImages.length > 0 && (
                            <button
                              type="button"
                              title="Remove image"
                              onClick={() =>
                                removeSelectedImage(
                                  index,
                                )
                              }
                            >
                              <X size={13} />
                            </button>
                          )}

                          {index === 0 && (
                            <span>
                              Cover
                            </span>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={
                  styles.closeButton
                }
                onClick={closeForm}
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  styles.saveButton
                }
                disabled={saving}
                onClick={savePackage}
              >
                {saving
                  ? 'Uploading & Saving...'
                  : editingPackage
                    ? 'Update Package'
                    : 'Create Package'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );

  function updateForm(
    key:
      | 'title'
      | 'destination'
      | 'country'
      | 'duration'
      | 'price'
      | 'category'
      | 'description'
      | 'originalPrice',
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }
}

/* =========================
   SUMMARY CARD
========================= */

function SummaryCard({
  icon: Icon,
  title,
  value,
  color,
}: {
  icon: LucideIcon;
  title: string;
  value: string | number;
  color:
    | 'purple'
    | 'green'
    | 'red'
    | 'blue'
    | 'cyan';
}) {
  return (
    <article
      className={`${styles.summaryCard} ${styles[color]}`}
    >
      <div className={styles.summaryIcon}>
        <Icon size={20} />
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

/* =========================
   FIELD
========================= */

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <div className={styles.field}>
      <label>
        {label}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
      />
    </div>
  );
}

/* =========================
   INFO ITEM
========================= */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={styles.infoItem}>
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

/* =========================
   HELPERS
========================= */

function formatMoney(
  value: number,
) {
  return new Intl.NumberFormat(
    'en-US',
    {
      maximumFractionDigits: 2,
    },
  ).format(value);
}

function getImageUrl(
  image?: string,
) {
  if (!image) {
    return '';
  }

  if (
    image.startsWith('http://') ||
    image.startsWith('https://') ||
    image.startsWith('blob:')
  ) {
    return image;
  }

  if (
    image.startsWith('/images/')
  ) {
    return image;
  }

  if (
    image.startsWith('/uploads/')
  ) {
    return `${API_URL}${image}`;
  }

  return `/images/${image}`;
}

function getPackageImage(
  item: TravelPackage,
) {
  return getImageUrl(
    item.images?.[0],
  );
}

'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Compass,
  Gift,
  Headphones,
  Heart,
  LogOut,
  MapPin,
  Minus,
  Plane,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  UserRound,
  X,
} from 'lucide-react';
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaWhatsapp,
} from 'react-icons/fa';
import { SiGmail } from 'react-icons/si';

import PackageItineraryModal from '../../components/PackageItineraryModal';
import CurrencySelector from '../../components/CurrencySelector';
import { useCurrency } from '../../context/CurrencyContext';
import styles from './page.module.css';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://globalvista-d7uz.onrender.com');

type PackageAddOn = {
  _id: string;
  name: string;
  price: number;
  pricingType: 'PER_PERSON' | 'PER_BOOKING';
};

type ApiPackage = {
  _id: string;
  destinationId?: string | { _id: string; name?: string; country?: string } | null;
  title: string;
  destination: string;
  country: string;
  duration: string;
  price: number;
  category: string;
  description: string;
  included: string[];
  addOns?: PackageAddOn[];
  images: string[];
  availability: boolean;
  isSpecialOffer?: boolean;
  originalPrice?: number;
  discountPercentage?: number;
  reviewInfo?: { averageRating: number; totalReviews: number };
};

type BookingResponse = {
  _id?: string;
  totalPrice?: number;
  message?: string | string[];
};

type TravelPlan = {
  _id: string;
  name: string;
  price: number;
  priceSuffix: string;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
};

type StoredUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
};

const fallbackImages: Record<string, string> = {
  Maldives: '/images/maldives-package-1.jpg',
  'Sri Lanka': '/images/sri-lanka-tour-1.jpg',
  Japan: '/images/japan-tour-1.jpg',
  Switzerland: '/images/switzerland-tour-1.jpg',
  Bali: '/images/bali-honeymoon-1.jpg',
  Phuket: '/images/thailand-tour.jpg',
};
const defaultFallbackImage = '/images/default-travel.jpg';

const HERO_VIDEOS = [
  '/videos/globalvista-hero-2.mp4',
  '/videos/globalvista-hero-3.mp4',
  '/videos/globalvista-hero-4.mp4',
  '/videos/globalvista-hero-5.mp4',
] as const;

function getPackageImage(pkg: ApiPackage) {
  const image = pkg.images?.[0];
  if (!image) return fallbackImages[pkg.destination] || defaultFallbackImage;
  if (image.startsWith('http://localhost:3001')) {
    return image.replace('http://localhost:3001', API_URL);
  }
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  if (image.startsWith('/uploads/')) return `${API_URL}${image}`;
  if (image.startsWith('/images/')) return image;
  return `/images/${image}`;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
}

function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function PackagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedDestinationId = searchParams.get('destinationId') || '';
  const selectedDestinationName = searchParams.get('destinationName') || '';

  const { formatPrice } = useCurrency();

  // Package and Travel Plan state
  const [packages, setPackages] = useState<ApiPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState('');
  const [travelPlans, setTravelPlans] = useState<TravelPlan[]>([]);
  const [travelPlansLoading, setTravelPlansLoading] = useState(true);
  const [travelPlansError, setTravelPlansError] = useState('');
  const [selectedTravelPlanId, setSelectedTravelPlanId] = useState('');

  // Video cycle state (matches home hero videos 2, 3, 4, 5)
  const [activeHeroVideo, setActiveHeroVideo] = useState(0);
  const heroVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const handleHeroVideoEnded = (finishedIndex: number) => {
    const nextIndex = (finishedIndex + 1) % HERO_VIDEOS.length;
    const nextElement = heroVideoRefs.current[nextIndex];
    if (nextElement) {
      nextElement.currentTime = 0;
      nextElement.play().catch(() => {});
    }
    setActiveHeroVideo(nextIndex);
  };

  // Modals state
  const [selectedPackage, setSelectedPackage] = useState<ApiPackage | null>(null);
  const [itineraryModalPackage, setItineraryModalPackage] = useState<ApiPackage | null>(null);
  const [isItineraryModalOpen, setIsItineraryModalOpen] = useState(false);

  // Booking form state
  const [travelDate, setTravelDate] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [createdBookingId, setCreatedBookingId] = useState<string>('');

  // Filtering & Sorting state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showDealsOnly, setShowDealsOnly] = useState<boolean>(searchParams.get('deals') === 'true');
  const [sortBy, setSortBy] = useState<string>('FEATURED');

  // User and Saved Wishlist state
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [savedPackageIds, setSavedPackageIds] = useState<string[]>([]);

  // Sync search param when updated externally
  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null && q !== undefined) {
      setSearch(q);
    }
    if (searchParams.get('deals') === 'true') {
      setShowDealsOnly(true);
    }
  }, [searchParams]);

  // Load user and wishlist from localStorage on mount
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('globalvista_user') || localStorage.getItem('user');
      if (rawUser) {
        setCurrentUser(JSON.parse(rawUser));
      }
      const rawSaved = localStorage.getItem('globalvista_saved_packages');
      if (rawSaved) {
        setSavedPackageIds(JSON.parse(rawSaved));
      }
      const storedPlanId = localStorage.getItem('globalvista_selected_travel_plan');
      if (storedPlanId) {
        setSelectedTravelPlanId(storedPlanId);
      }
    } catch (e) {
      console.warn('LocalStorage initialization warning:', e);
    }
  }, []);

  // Fetch Packages (Accessible for Toolbar Refresh Button)
  const loadPackages = async () => {
    try {
      setPackagesLoading(true);
      setPackagesError('');
      const response = await fetch(`${API_URL}/packages`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Failed to load packages: ${response.status}`);
      }
      const data: ApiPackage[] = await response.json();
      setPackages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Package API error:', error);
      setPackagesError('Unable to load packages from server. Please refresh or try again later.');
    } finally {
      setPackagesLoading(false);
    }
  };

  useEffect(() => {
    void loadPackages();
  }, []);

  // Fetch Travel Plans
  useEffect(() => {
    const loadTravelPlans = async () => {
      try {
        setTravelPlansLoading(true);
        setTravelPlansError('');
        const response = await fetch(`${API_URL}/travel-plans/active`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to load travel plans: ${response.status}`);
        }
        const data: TravelPlan[] = await response.json();
        setTravelPlans(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Travel plans API error:', error);
        setTravelPlans([]);
        setTravelPlansError('Unable to load travel plans. Default pricing applies.');
      } finally {
        setTravelPlansLoading(false);
      }
    };
    void loadTravelPlans();
  }, []);

  // Persist travel plan selection
  const persistTravelPlanSelection = (planId: string) => {
    setSelectedTravelPlanId(planId);
    if (planId) {
      localStorage.setItem('globalvista_selected_travel_plan', planId);
    } else {
      localStorage.removeItem('globalvista_selected_travel_plan');
    }
    setBookingError('');
    setBookingSuccess('');
    setCreatedBookingId('');
  };

  // Wishlist toggle
  const toggleSavePackage = (pkgId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSavedPackageIds((prev) => {
      const isSaved = prev.includes(pkgId);
      const updated = isSaved ? prev.filter((id) => id !== pkgId) : [...prev, pkgId];
      try {
        localStorage.setItem('globalvista_saved_packages', JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save package to wishlist', err);
      }
      return updated;
    });
  };

  // Itinerary modal actions
  const openItinerary = (pkg: ApiPackage) => {
    setItineraryModalPackage(pkg);
    setIsItineraryModalOpen(true);
  };
  const closeItinerary = () => {
    setIsItineraryModalOpen(false);
  };

  // Booking modal actions
  const openBooking = async (pkg: ApiPackage) => {
    if (!pkg.availability) return;
    setSelectedPackage(pkg);
    setTravelDate('');
    setNumberOfPeople(1);
    setSelectedAddOnIds([]);
    setBookingError('');
    setBookingSuccess('');

    try {
      const response = await fetch(`${API_URL}/packages/${pkg._id}`, { cache: 'no-store' });
      if (response.ok) {
        const latestPackage: ApiPackage = await response.json();
        setSelectedPackage(latestPackage);
        setPackages((current) =>
          current.map((item) => (item._id === latestPackage._id ? latestPackage : item)),
        );
      }
    } catch (error) {
      console.warn('Package refresh error, using loaded details:', error);
    }
  };

  const closeBooking = () => {
    if (bookingSubmitting) return;
    setSelectedPackage(null);
    setTravelDate('');
    setNumberOfPeople(1);
    setSelectedAddOnIds([]);
    setBookingError('');
    setBookingSuccess('');
  };

  const toggleAddOn = (addOnId: string) => {
    setBookingError('');
    setBookingSuccess('');
    setSelectedAddOnIds((current) =>
      current.includes(addOnId)
        ? current.filter((id) => id !== addOnId)
        : [...current, addOnId],
    );
  };

  // Booking calculations
  const selectedTravelPlan = travelPlans.find((plan) => plan._id === selectedTravelPlanId) ?? null;
  const travelPlanTotal = selectedTravelPlan ? selectedTravelPlan.price * numberOfPeople : 0;
  const baseTotal = selectedPackage ? selectedPackage.price * numberOfPeople : 0;
  const addOnsTotal = selectedPackage
    ? (selectedPackage.addOns ?? [])
        .filter((addOn) => selectedAddOnIds.includes(addOn._id))
        .reduce((total, addOn) => {
          const quantity = addOn.pricingType === 'PER_PERSON' ? numberOfPeople : 1;
          return total + addOn.price * quantity;
        }, 0)
    : 0;
  const estimatedTotal = baseTotal + travelPlanTotal + addOnsTotal;

  // Booking submission
  const createBooking = async () => {
    if (!selectedPackage) return;
    setBookingError('');
    setBookingSuccess('');

    if (!selectedTravelPlan) {
      setBookingError('Please select a travel service plan before confirming your booking.');
      return;
    }
    if (!travelDate) {
      setBookingError('Please select your travel date.');
      return;
    }
    if (travelDate < getTodayDate()) {
      setBookingError('Travel date cannot be in the past.');
      return;
    }

    const token = localStorage.getItem('globalvista_token') || localStorage.getItem('token');
    const rawUser = localStorage.getItem('globalvista_user') || localStorage.getItem('user');

    if (!token || !rawUser) {
      router.push('/login');
      return;
    }

    try {
      setBookingSubmitting(true);
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          packageId: selectedPackage._id,
          travelPlanId: selectedTravelPlan._id,
          travelDate,
          numberOfPeople,
          selectedAddOnIds,
        }),
      });

      const data: BookingResponse = await response.json().catch(() => ({}));

      if (response.status === 401) {
        localStorage.removeItem('globalvista_token');
        localStorage.removeItem('globalvista_user');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const message = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message || 'Unable to create booking.';
        throw new Error(message);
      }

      const confirmedTotal = typeof data.totalPrice === 'number' ? data.totalPrice : estimatedTotal;
      setBookingSuccess(`Booking created successfully! Total: $${formatMoney(confirmedTotal)}`);
      if (data._id) {
        setCreatedBookingId(data._id);
      }
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Unable to create booking.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  // Dynamic filter values extracted from packages
  const countriesList = useMemo(() => {
    const set = new Set<string>();
    packages.forEach((pkg) => {
      if (pkg.country && pkg.country.trim()) {
        set.add(pkg.country.trim());
      }
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [packages]);

  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    packages.forEach((pkg) => {
      if (pkg.category && pkg.category.trim()) {
        set.add(pkg.category.trim());
      }
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [packages]);

  // Normalized search query and filtered list
  const normalizedSearch = search.trim().toLowerCase();

  const filteredPackages = useMemo(() => {
    let result = [...packages];

    // Filter by destination ID from URL
    if (selectedDestinationId) {
      result = result.filter((pkg) => {
        const dId = typeof pkg.destinationId === 'string'
          ? pkg.destinationId
          : pkg.destinationId?._id;
        return dId === selectedDestinationId;
      });
    }

    // Filter by Country pill
    if (selectedCountry !== 'ALL') {
      result = result.filter(
        (pkg) => (pkg.country || '').trim().toLowerCase() === selectedCountry.toLowerCase(),
      );
    }

    // Filter by Category pill
    if (selectedCategory !== 'ALL') {
      result = result.filter(
        (pkg) => (pkg.category || '').trim().toLowerCase() === selectedCategory.toLowerCase(),
      );
    }

    // Filter by Special Offers only
    if (showDealsOnly) {
      result = result.filter(
        (pkg) =>
          Boolean(pkg.isSpecialOffer) ||
          Boolean(pkg.discountPercentage && pkg.discountPercentage > 0) ||
          Boolean(pkg.originalPrice && pkg.originalPrice > pkg.price),
      );
    }

    // Filter by Search text (title, destination, country, category, description)
    if (normalizedSearch) {
      result = result.filter((pkg) =>
        [pkg.title, pkg.destination, pkg.country, pkg.category, pkg.description].some((field) =>
          (field || '').toLowerCase().includes(normalizedSearch),
        ),
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'PRICE_LOW') {
        return a.price - b.price;
      }
      if (sortBy === 'PRICE_HIGH') {
        return b.price - a.price;
      }
      if (sortBy === 'RATING_HIGH') {
        const ratingA = Number(a.reviewInfo?.averageRating || 0);
        const ratingB = Number(b.reviewInfo?.averageRating || 0);
        return ratingB - ratingA;
      }
      if (sortBy === 'DURATION_SHORT') {
        const dA = parseInt(a.duration, 10) || 99;
        const dB = parseInt(b.duration, 10) || 99;
        return dA - dB;
      }
      // FEATURED: Prioritize special offers, then availability
      if (a.isSpecialOffer && !b.isSpecialOffer) return -1;
      if (!a.isSpecialOffer && b.isSpecialOffer) return 1;
      return 0;
    });

    return result;
  }, [
    packages,
    selectedDestinationId,
    selectedCountry,
    selectedCategory,
    showDealsOnly,
    normalizedSearch,
    sortBy,
  ]);

  const hasActiveFilters = Boolean(
    normalizedSearch ||
      selectedCountry !== 'ALL' ||
      selectedCategory !== 'ALL' ||
      showDealsOnly ||
      sortBy !== 'FEATURED' ||
      selectedDestinationId,
  );

  const resetAllFilters = () => {
    setSearch('');
    setSelectedCountry('ALL');
    setSelectedCategory('ALL');
    setShowDealsOnly(false);
    setSortBy('FEATURED');
    if (selectedDestinationId) {
      router.push('/packages');
    }
  };

  return (
    <main className={styles.page}>
      {/* =====================================================================
          CINEMATIC HERO VIDEO BANNER (VIDEOS 2, 3, 4, 5)
          ===================================================================== */}
      <section className={styles.hero}>
        <div className={styles.heroMediaBg} aria-hidden="true">
          {HERO_VIDEOS.map((video, index) => (
            <video
              key={video}
              ref={(element) => {
                heroVideoRefs.current[index] = element;
              }}
              className={styles.heroVideo}
              autoPlay={index === 0}
              muted
              playsInline
              preload="auto"
              onEnded={() => handleHeroVideoEnded(index)}
              style={{
                opacity: activeHeroVideo === index ? 1 : 0,
                transition: 'opacity 1.2s ease-in-out',
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: activeHeroVideo === index ? 1 : 0,
                pointerEvents: 'none',
              }}
            >
              <source src={video} type="video/mp4" />
            </video>
          ))}
          <div className={styles.heroOverlay} />
        </div>
      </section>

      {/* =====================================================================
          MAIN CONTENT WITH CLEAN TOOLBAR (MATCHING DESTINATIONS DESIGN)
          ===================================================================== */}
      <section className={styles.content}>
        <div className={styles.container}>
          {/* Header Block matching Destinations */}
          <div className={styles.heading}>
            <div>
              <span>CURATED EXPEDITIONS</span>
              <h2>
                {selectedDestinationName
                  ? `${selectedDestinationName} Packages`
                  : 'Popular Packages'}
              </h2>
              <p>Explore all handpicked luxury expeditions and tour itineraries available through GlobalVista.</p>
            </div>
            <button
              type="button"
              className={styles.refreshButton}
              onClick={() => void loadPackages()}
              disabled={packagesLoading}
            >
              <RefreshCw
                size={16}
                className={packagesLoading ? styles.spin : ''}
              />
              Refresh
            </button>
          </div>

          {/* Clean Unified Toolbar matching Destinations */}
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <Search size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search destination, country or package..."
              />
              {search && (
                <button
                  type="button"
                  className={styles.clearSearchBtn}
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <select
              className={styles.countrySelect}
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              <option value="ALL">All Countries</option>
              {countriesList
                .filter((c) => c !== 'ALL')
                .map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
            </select>

            {categoriesList.length > 2 && (
              <select
                className={styles.categorySelect}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                {categoriesList
                  .filter((c) => c !== 'ALL')
                  .map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
              </select>
            )}

            <select
              className={styles.sortSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="FEATURED">Featured &amp; Recommended</option>
              <option value="PRICE_LOW">Price: Low to High</option>
              <option value="PRICE_HIGH">Price: High to Low</option>
              <option value="RATING_HIGH">Guest Rating (Highest)</option>
              <option value="DURATION_SHORT">Duration (Shortest)</option>
            </select>

            <button
              type="button"
              className={`${styles.dealsToggleBtn} ${showDealsOnly ? styles.dealsToggleBtnActive : ''}`}
              onClick={() => setShowDealsOnly(!showDealsOnly)}
              title="Toggle Special Offers Only"
            >
              <Tag size={14} />
              <span>Special Offers</span>
            </button>
          </div>

          {/* Result Count & Reset Bar matching Destinations */}
          {!packagesLoading && !packagesError && (
            <div className={styles.resultBar}>
              <div>
                Showing <strong>{filteredPackages.length}</strong> package{filteredPackages.length !== 1 ? 's' : ''}
                {packages.length > 0 && ` (out of ${packages.length} total)`}
                {selectedDestinationName && ` for ${selectedDestinationName}`}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  className={styles.resetFiltersBtn}
                  onClick={resetAllFilters}
                >
                  <RotateCcw size={12} />
                  <span>Reset filters</span>
                </button>
              )}
            </div>
          )}

          {/* Loading & Error States */}
          {packagesLoading && (
            <div className={styles.emptyStateCard}>
              <div style={{ display: 'inline-block', width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <h3 className={styles.emptyStateTitle} style={{ marginTop: '16px' }}>Loading Luxury Expeditions...</h3>
              <p className={styles.emptyStateDesc}>Fetching real-time availability and handpicked sanctuaries from GlobalVista.</p>
            </div>
          )}

          {!packagesLoading && packagesError && (
            <div className={styles.emptyStateCard}>
              <h3 className={styles.emptyStateTitle}>Notice</h3>
              <p className={styles.emptyStateDesc}>{packagesError}</p>
              <button
                type="button"
                className={styles.clearFiltersPrimaryBtn}
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </button>
            </div>
          )}

          {/* Empty Filter State */}
          {!packagesLoading && !packagesError && filteredPackages.length === 0 && (
            <div className={styles.emptyStateCard}>
              <h3 className={styles.emptyStateTitle}>No Journeys Found</h3>
              <p className={styles.emptyStateDesc}>
                We couldn't find any packages matching your active filters. Try broadening your search or resetting all filters to see our full collection.
              </p>
              <button
                type="button"
                className={styles.clearFiltersPrimaryBtn}
                onClick={resetAllFilters}
              >
                <RotateCcw size={15} />
                <span>Reset All Filters</span>
              </button>
            </div>
          )}

          {/* Packages Cards Grid */}
          {!packagesLoading && !packagesError && filteredPackages.length > 0 && (
            <div className="destinationGrid">
              {filteredPackages.map((pkg) => {
                const rating = Number(pkg.reviewInfo?.averageRating || 0);
                const reviewCount = Number(pkg.reviewInfo?.totalReviews || 0);
                const isSaved = savedPackageIds.includes(pkg._id);
                const hasDiscount =
                  Boolean(pkg.isSpecialOffer) ||
                  Boolean(pkg.discountPercentage && pkg.discountPercentage > 0) ||
                  Boolean(pkg.originalPrice && pkg.originalPrice > pkg.price);

                const discountPercent =
                  pkg.discountPercentage ||
                  (pkg.originalPrice && pkg.originalPrice > pkg.price
                    ? Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100)
                    : 15);

                return (
                  <article className="destinationCard" key={pkg._id}>
                    {/* Discount Badge */}
                    {hasDiscount && (
                      <span className={styles.cardDiscountBadge}>
                        <Tag size={11} />
                        {discountPercent > 0 ? `-${discountPercent}% OFF` : 'SPECIAL OFFER'}
                      </span>
                    )}

                    {/* Wishlist Heart Button */}
                    <button
                      type="button"
                      className={`${styles.cardWishlistBtn} ${isSaved ? styles.cardWishlistBtnActive : ''}`}
                      onClick={(e) => toggleSavePackage(pkg._id, e)}
                      aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
                      title={isSaved ? 'Saved in wishlist' : 'Save to wishlist'}
                    >
                      <Heart size={16} fill={isSaved ? '#ef4444' : 'none'} />
                    </button>

                    {/* Package Cover Image */}
                    <img
                      src={getPackageImage(pkg)}
                      alt={pkg.title}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = fallbackImages[pkg.destination] || defaultFallbackImage;
                      }}
                    />

                    {/* Gradient Shade Overlay */}
                    <div className="destinationShade" />

                    {/* Category pill on image */}
                    {pkg.category && (
                      <span className={styles.cardCategoryBadge}>
                        {pkg.category}
                      </span>
                    )}

                    {/* Card Content Overlay */}
                    <div className="destinationContent">
                      <h3>{pkg.title}</h3>

                      <div className="destinationMeta">
                        <span>
                          <MapPin size={13} />
                          {pkg.destination}, {pkg.country}
                        </span>
                        <span>
                          <Clock3 size={13} />
                          {pkg.duration}
                        </span>
                        <span>
                          <Star size={13} fill="currentColor" />
                          {rating > 0 ? `${rating.toFixed(1)} (${reviewCount})` : '5.0 (New)'}
                        </span>
                      </div>

                      <div className="gvCardButtonsRow">
                        <button
                          type="button"
                          className="gvCardItineraryBtn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openItinerary(pkg);
                          }}
                        >
                          <CalendarDays size={13} />
                          <span>Itinerary</span>
                        </button>

                        <button
                          type="button"
                          className="destinationBookButton"
                          disabled={!pkg.availability}
                          onClick={() => void openBooking(pkg)}
                        >
                          {pkg.availability ? 'View & Book' : 'Unavailable'}
                          {pkg.availability && <ArrowRight size={13} />}
                        </button>
                      </div>

                      <div className="destinationPrice">
                        <small>From</small>
                        {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                          <span className={styles.originalPriceStrike}>
                            {formatPrice(pkg.originalPrice)}
                          </span>
                        )}
                        <strong>{formatPrice(pkg.price)}</strong>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          LUXURY FOOTER
          ===================================================================== */}
      <footer className="gvFooter">
        <div className="container gvFooterMain">
          <div className="gvFooterBrand">
            <Link href="/" className="gvFooterLogo">
              Global<span>Vista</span>
            </Link>
            <h3>
              Travel Further.
              <br />
              Live More.
            </h3>
            <p>
              Discover unforgettable destinations, handpicked 5-star sanctuaries, and tailor-made expeditions designed around your wanderlust.
            </p>
            <div className="gvFooterSocials">
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="gvSocialIcon gvFacebook"
              >
                <FaFacebookF size={18} />
              </a>
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="gvSocialIcon gvInstagram"
              >
                <FaInstagram size={19} />
              </a>
              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="gvSocialIcon gvLinkedin"
              >
                <FaLinkedinIn size={18} />
              </a>
              <a
                href="mailto:concierge@globalvista.com"
                aria-label="Email"
                className="gvSocialIcon gvEmail"
              >
                <SiGmail size={19} />
              </a>
            </div>
          </div>

          <div className="gvFooterLinks">
            <div className="gvFooterColumn">
              <h4>EXPLORE</h4>
              <Link href="/#destinations">Destinations</Link>
              <Link href="/#experiences">Curated Experiences</Link>
              <Link href="/packages?deals=true">Special Offers</Link>
              <Link href="/#reviews">Traveller Reviews</Link>
            </div>

            <div className="gvFooterColumn">
              <h4>COLLECTIONS</h4>
              <button
                type="button"
                onClick={() => {
                  setSelectedCountry('Switzerland');
                  window.scrollTo({ top: 380, behavior: 'smooth' });
                }}
                style={{ background: 'none', border: 'none', color: 'inherit', padding: 0, font: 'inherit', cursor: 'pointer', textAlign: 'left' }}
              >
                Swiss Alps &amp; Lakes
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCountry('Japan');
                  window.scrollTo({ top: 380, behavior: 'smooth' });
                }}
                style={{ background: 'none', border: 'none', color: 'inherit', padding: 0, font: 'inherit', cursor: 'pointer', textAlign: 'left' }}
              >
                Japan Heritage &amp; Kyoto
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCountry('Maldives');
                  window.scrollTo({ top: 380, behavior: 'smooth' });
                }}
                style={{ background: 'none', border: 'none', color: 'inherit', padding: 0, font: 'inherit', cursor: 'pointer', textAlign: 'left' }}
              >
                Maldives Private Atolls
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCountry('Sri Lanka');
                  window.scrollTo({ top: 380, behavior: 'smooth' });
                }}
                style={{ background: 'none', border: 'none', color: 'inherit', padding: 0, font: 'inherit', cursor: 'pointer', textAlign: 'left' }}
              >
                Sri Lanka Serendipity
              </button>
            </div>

            <div className="gvFooterColumn">
              <h4>VIP CONCIERGE</h4>
              <a href="https://wa.me/94771234567" target="_blank" rel="noopener noreferrer">
                WhatsApp Support
              </a>
              <Link href="/#planner">Tailored Itinerary Planner</Link>
              <Link href="/traveller">My Booking Portal</Link>
              <a href="tel:+94771234567">Chauffeur Assistance</a>
            </div>
          </div>
        </div>

        <div className="gvFooterBottom">
          <div className="container gvFooterBottomInner">
            <p>© {new Date().getFullYear()} GlobalVista Luxury Travel Ltd. All rights reserved.</p>
            <div className="gvFooterLegal">
              <a href="#">Privacy Policy</a>
              <span>·</span>
              <a href="#">Terms &amp; Conditions</a>
              <span>·</span>
              <a href="#">VIP Assurance</a>
            </div>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          FLOATING WHATSAPP VIP CONCIERGE BUTTON
          ===================================================================== */}
      <motion.a
        href="https://wa.me/94771234567?text=Hello%20GlobalVista%20Concierge,%20I%20am%20browsing%20your%20luxury%20packages%20and%20would%20like%20to%20inquire%20about%20availability%20and%20itineraries."
        target="_blank"
        rel="noopener noreferrer"
        className="floatingWhatsAppBtn"
        aria-label="Chat with GlobalVista Concierge on WhatsApp"
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="whatsappIconWrap">
          <FaWhatsapp className="whatsappIcon" />
          <span className="whatsappOnlineDot" />
        </div>
        <div className="whatsappTextWrap">
          <span className="whatsappSubtitle">24/7 VIP Concierge Online</span>
          <strong className="whatsappTitle">Chat on WhatsApp</strong>
        </div>
      </motion.a>

      {/* =====================================================================
          BOOKING MODAL
          ===================================================================== */}
      {selectedPackage && (
        <div className="bookingModalOverlay" onMouseDown={closeBooking}>
          <section className="bookingModal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="bookingModalHeader">
              <div>
                <span>BOOK YOUR TRIP</span>
                <h2>{selectedPackage.title}</h2>
                <p>
                  {selectedPackage.destination}, {selectedPackage.country} · {selectedPackage.duration}
                </p>
                <button
                  type="button"
                  className="bookingModalItineraryLink"
                  onClick={() => openItinerary(selectedPackage)}
                >
                  <Compass size={13} />
                  <span>Inspect Day-by-Day Itinerary</span>
                </button>
              </div>

              <button
                type="button"
                aria-label="Close booking"
                onClick={closeBooking}
                disabled={bookingSubmitting}
              >
                <X size={18} />
              </button>
            </div>

            <div className="bookingModalBody">
              <div className="bookingPackageSummary">
                <img
                  src={getPackageImage(selectedPackage)}
                  alt={selectedPackage.title}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = fallbackImages[selectedPackage.destination] || defaultFallbackImage;
                  }}
                />
                <div>
                  <span>PACKAGE PRICE</span>
                  <strong>
                    {formatPrice(selectedPackage.price)} <small>/ person</small>
                  </strong>
                </div>
              </div>

              {/* Package Inclusions */}
              <div className="bookingIncluded">
                <div className="bookingSectionTitle">
                  <div>
                    <span>INCLUDED FREE</span>
                    <h3>Package Inclusions</h3>
                  </div>
                  <strong>{selectedPackage.included?.length ?? 0} Inclusions</strong>
                </div>

                <div className="bookingIncludedGrid">
                  {(selectedPackage.included ?? []).map((item, index) => (
                    <div key={`${item}-${index}`}>
                      <Check size={14} />
                      <span>{item}</span>
                    </div>
                  ))}
                  {!selectedPackage.included?.length && (
                    <div>All standard 5-star resort and chauffeur inclusions.</div>
                  )}
                </div>
              </div>

              {/* Travel Service Plan Selection */}
              <div className="bookingIncluded">
                <div className="bookingSectionTitle">
                  <div>
                    <span>TRAVEL PLAN</span>
                    <h3>Choose Your Service Level</h3>
                  </div>
                  {selectedTravelPlan && <strong>{selectedTravelPlan.name}</strong>}
                </div>

                <label style={{ display: 'grid', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#24343c' }}>
                    Selected Plan
                  </span>
                  <select
                    disabled={travelPlansLoading}
                    value={selectedTravelPlanId}
                    onChange={(e) => persistTravelPlanSelection(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '46px',
                      border: '1.5px solid #dfe7eb',
                      borderRadius: '10px',
                      padding: '0 14px',
                      background: '#ffffff',
                      color: '#17272f',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  >
                    <option value="">
                      {travelPlansLoading ? 'Loading travel plans...' : 'Select a travel service tier'}
                    </option>
                    {travelPlans.map((plan) => (
                      <option key={plan._id} value={plan._id}>
                        {plan.name} — ${formatMoney(plan.price)} {plan.priceSuffix}
                      </option>
                    ))}
                  </select>
                </label>

                {travelPlansError && (
                  <p className="bookingMessage bookingError">{travelPlansError}</p>
                )}

                {selectedTravelPlan && (
                  <div
                    style={{
                      marginTop: '14px',
                      padding: '14px',
                      borderRadius: '12px',
                      background: '#f5f9fc',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '12px',
                        alignItems: 'center',
                      }}
                    >
                      <strong>{selectedTravelPlan.name}</strong>
                      <strong>${formatMoney(travelPlanTotal)}</strong>
                    </div>
                    <small style={{ display: 'block', marginTop: '4px', color: '#6d7c84' }}>
                      ${formatMoney(selectedTravelPlan.price)} {selectedTravelPlan.priceSuffix} × {numberOfPeople}
                    </small>

                    {selectedTravelPlan.features.length > 0 && (
                      <div
                        style={{
                          display: 'grid',
                          gap: '6px',
                          marginTop: '12px',
                        }}
                      >
                        {selectedTravelPlan.features.map((feature, index) => (
                          <div
                            key={`${selectedTravelPlan._id}-modal-${index}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '12px',
                              color: '#4e6069',
                            }}
                          >
                            <Check size={14} />
                            {feature}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Form Grid: Date & People Stepper */}
              <div className="bookingFormGrid">
                <label>
                  <span>Travel Date</span>
                  <input
                    type="date"
                    min={getTodayDate()}
                    value={travelDate}
                    onChange={(e) => {
                      setTravelDate(e.target.value);
                      setBookingError('');
                      setBookingSuccess('');
                    }}
                  />
                </label>

                <div className="travellerField">
                  <span>Travellers</span>
                  <div className="travellerStepper">
                    <button
                      type="button"
                      aria-label="Remove traveller"
                      disabled={numberOfPeople <= 1}
                      onClick={() => {
                        setNumberOfPeople((c) => Math.max(1, c - 1));
                        setBookingSuccess('');
                      }}
                    >
                      <Minus size={15} />
                    </button>
                    <strong>{numberOfPeople}</strong>
                    <button
                      type="button"
                      aria-label="Add traveller"
                      onClick={() => {
                        setNumberOfPeople((c) => c + 1);
                        setBookingSuccess('');
                      }}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Optional Add-Ons */}
              <div className="bookingAddOns">
                <div className="bookingSectionTitle">
                  <div>
                    <span>OPTIONAL EXTRAS</span>
                    <h3>Add to Your Expedition</h3>
                  </div>
                  <small>{selectedAddOnIds.length} selected</small>
                </div>

                <div className="bookingAddOnList">
                  {(selectedPackage.addOns ?? []).map((addOn) => {
                    const selected = selectedAddOnIds.includes(addOn._id);
                    const amount =
                      addOn.pricingType === 'PER_PERSON'
                        ? addOn.price * numberOfPeople
                        : addOn.price;

                    return (
                      <button
                        type="button"
                        key={addOn._id}
                        className={`bookingAddOn${selected ? ' selected' : ''}`}
                        onClick={() => toggleAddOn(addOn._id)}
                      >
                        <span className="bookingAddOnCheck">
                          {selected && <Check size={14} />}
                        </span>
                        <span className="bookingAddOnInfo">
                          <strong>{addOn.name}</strong>
                          <small>
                            {addOn.pricingType === 'PER_PERSON'
                              ? `$${formatMoney(addOn.price)} per person`
                              : `$${formatMoney(addOn.price)} per booking`}
                          </small>
                        </span>
                        <strong className="bookingAddOnAmount">
                          +{formatPrice(amount)}
                        </strong>
                      </button>
                    );
                  })}

                  {!selectedPackage.addOns?.length && (
                    <p>All essential luxury services are already included in this package.</p>
                  )}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bookingPriceSummary">
                <div>
                  <span>
                    Package ({formatPrice(selectedPackage.price)} × {numberOfPeople})
                  </span>
                  <strong>{formatPrice(baseTotal)}</strong>
                </div>

                <div>
                  <span>
                    Travel Plan{' '}
                    {selectedTravelPlan
                      ? `(${selectedTravelPlan.name} · $${formatMoney(selectedTravelPlan.price)} × ${numberOfPeople})`
                      : '(Not selected)'}
                  </span>
                  <strong>{selectedTravelPlan ? `$${formatMoney(travelPlanTotal)}` : '—'}</strong>
                </div>

                <div>
                  <span>Optional Add-ons</span>
                  <strong>{formatPrice(addOnsTotal)}</strong>
                </div>

                <div className="bookingGrandTotal">
                  <span>Estimated Total</span>
                  <strong>{formatPrice(estimatedTotal)}</strong>
                </div>
              </div>

              {bookingError && <div className="bookingMessage bookingError">{bookingError}</div>}
              {bookingSuccess && <div className="bookingMessage bookingSuccess">{bookingSuccess}</div>}
            </div>

            <div className="bookingModalFooter">
              <button
                type="button"
                className="bookingCancelButton"
                onClick={closeBooking}
                disabled={bookingSubmitting}
              >
                Cancel
              </button>

              {bookingSuccess ? (
                <button
                  type="button"
                  className="bookingConfirmButton"
                  onClick={() => {
                    closeBooking();
                    router.push('/traveller');
                  }}
                  style={{
                    background: '#059669',
                    borderColor: '#059669',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Go to My Trips →
                </button>
              ) : (
                <button
                  type="button"
                  className="bookingConfirmButton"
                  onClick={() => void createBooking()}
                  disabled={bookingSubmitting || !selectedTravelPlan}
                >
                  {bookingSubmitting ? 'Securing Booking...' : 'Confirm Booking'}
                </button>
              )}
            </div>
          </section>
        </div>
      )}

      {/* =====================================================================
          PACKAGE ITINERARY MODAL
          ===================================================================== */}
      <PackageItineraryModal
        packageData={itineraryModalPackage}
        isOpen={isItineraryModalOpen}
        onClose={closeItinerary}
        onBookNow={(pkg) => {
          void openBooking(pkg);
        }}
      />
    </main>
  );
}

export default function PackagesPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <div style={{ padding: '80px 20px', textAlign: 'center' }}>
            <p className={styles.message}>Loading GlobalVista Packages...</p>
          </div>
        </main>
      }
    >
      <PackagesContent />
    </Suspense>
  );
}

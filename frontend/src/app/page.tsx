'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useSpring } from 'framer-motion';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  CheckCircle2,
  CreditCard,
  Eye,
  Gift,
  Home as HomeIcon,
  Loader2,
  Menu,
  UserRound,
  Clock3,
  Globe2,
  Headphones,
  Heart,
  LogOut,
  MapPin,
  Minus,
  Mountain,
  Palmtree,
  Plane,
  Play,
  Pause,
  Plus,
  Search,
  Send,
  Sparkles,
  Compass,
  ShieldCheck,
  Ship,
  Star,
  Users,
  WalletCards,
  X,
} from 'lucide-react';

import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaWhatsapp,
} from 'react-icons/fa';

import {
  SiGmail,
} from 'react-icons/si';

import PackageItineraryModal from '../components/PackageItineraryModal';
import CurrencySelector from '../components/CurrencySelector';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage, AVAILABLE_LANGUAGES, type LanguageCode } from '../context/LanguageContext';

const DestinationWorldMap = dynamic(
  () =>
    import(
      '../components/DestinationWorldMap'
    ),
  {
    ssr: false,

    loading: () => (
      <div className="realWorldMapState">
        <div className="realWorldMapLoader" />

        <span>
          Loading real destinations...
        </span>
      </div>
    ),
  },
);

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL || 'https://globalvista-d7uz.onrender.com');

const HERO_SCENES = [
  {
    location: 'Zermatt, Switzerland',
    title: 'Matterhorn & Alpine Summits',
    country: 'Switzerland',
    flag: '🇨🇭',
    video: '/videos/globalvista-hero-1.mp4',
  },
  {
    location: 'Sigiriya, Sri Lanka',
    title: 'Royal Fortress & Emerald Hills',
    country: 'Sri Lanka',
    flag: '🇱🇰',
    video: '/videos/globalvista-hero-2.mp4',
  },
  {
    location: 'South Ari Atoll, Maldives',
    title: 'Overwater Lagoon Sanctuary',
    country: 'Maldives',
    flag: '🇲🇻',
    video: '/videos/globalvista-hero-3.mp4',
  },
  {
    location: 'Kyoto & Tokyo, Japan',
    title: 'Imperial Temples & Cherry Blossoms',
    country: 'Japan',
    flag: '🇯🇵',
    video: '/videos/globalvista-hero-4.mp4',
  },
  {
    location: 'Phang Nga Bay, Thailand',
    title: 'Emerald Islets & Catamaran Voyages',
    country: 'Thailand',
    flag: '🇹🇭',
    video: '/videos/globalvista-hero-5.mp4',
  },
];

const HERO_VIDEOS = HERO_SCENES.map((scene) => scene.video);

type AddOnPricingType =
  | 'PER_PERSON'
  | 'PER_BOOKING';

type PackageAddOn = {
  _id: string;
  name: string;
  price: number;
  pricingType:
    AddOnPricingType;
};

type ApiPackage = {
  _id: string;
  destinationId?: string | { _id: string } | null;
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

  reviewInfo?: {
    averageRating: number;
    totalReviews: number;
  };
};

type ApiDestination = {
  _id: string;
  name: string;
  country: string;
  images?: string[];
  rating?: number;
  bestTimeToVisit?: string;
  isActive?: boolean;
};

function getDestinationImage(destination: ApiDestination) {
  const image = destination.images?.find(
    (item) => typeof item === 'string' && item.trim() !== '',
  );

  if (!image) return '/images/globalvista-bg.png';
  if (image.includes('localhost:3001')) {
    return image.replace(/http:\/\/localhost:3001/g, API_URL);
  }
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }
  if (image.startsWith('/uploads/')) return `${API_URL}${image}`;
  if (image.startsWith('/')) return image;
  return `/images/${image}`;
}

type BookingResponse = {
  _id?: string;
  totalPrice?: number;

  message?:
    | string
    | string[];
};

type CurrentUser = {
  _id?: string;
  id?: string;
  publicId?: string;
  name?: string;
  email?: string;
  mobile?: string;
  country?: string;
  role?: string;
};

type PublicReview = {
  _id: string;

  userId?: {
    _id?: string;
    name?: string;
    country?: string;
  };

  packageId?: {
    _id?: string;
    title?: string;
    destination?: string;
    country?: string;
  };

  rating: number;
  comment: string;
  createdAt?: string;
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

const FAQ_ITEMS = [
  {
    question:
      'Can I cancel my booking?',
    answer:
      'Yes. Please contact GlobalVista support to review the cancellation options available for your booking.',
  },
  {
    question:
      'Do prices include flights?',
    answer:
      'Flight inclusion depends on the selected package. Please check the package inclusions before confirming your booking.',
  },
  {
    question:
      'Can I pay in instalments?',
    answer:
      'Instalment availability depends on the payment options offered for your booking. Our support team can confirm the available options.',
  },
  {
    question:
      'Is travel insurance included?',
    answer:
      'Travel insurance is included only when it is specifically listed in the selected package inclusions.',
  },
];

const exclusiveExperiences = [
  {
    id: 'maldives',
    tag: 'PRIVATE ISLAND SANCTUARY',
    badgeIcon: Palmtree,
    title: 'Overwater Villa & Lagoon Retreats',
    destination: 'Maldives · South Ari Atoll',
    duration: '5–7 Days',
    price: '$3,400',
    description:
      'Awaken above crystal turquoise lagoons with dedicated butler service, private infinity plunge pools, and sunset dolphin champagne cruises.',
    image: '/images/maldives-package-1.jpg',
    features: ['Overwater Bungalow', 'Private Seaplane', 'Reef Safari'],
    searchQuery: 'Maldives',
  },
  {
    id: 'switzerland',
    tag: 'ALPINE SUMMIT EXPEDITIONS',
    badgeIcon: Mountain,
    title: 'Swiss Alps & Helicopter Chalets',
    destination: 'Switzerland · Zermatt & Interlaken',
    duration: '6–8 Days',
    price: '$2,890',
    description:
      'Soar past the iconic Matterhorn via private helicopter, savor fireside alpine dining, and relax in world-renowned thermal wellness spas.',
    image: '/images/switzerland-tour-1.jpg',
    features: ['Glacier Express 1st Class', 'Scenic Heli-Tour', 'Thermal Spa'],
    searchQuery: 'Switzerland',
  },
  {
    id: 'japan',
    tag: 'IMPERIAL HERITAGE ODYSSEY',
    badgeIcon: Compass,
    title: 'Kyoto Shrines & Onsen Sanctuary',
    destination: 'Japan · Kyoto, Tokyo & Mt. Fuji',
    duration: '7–10 Days',
    price: '$2,450',
    description:
      'After-hours private access to ancient Zen temples, master tea ceremonies in Gion, Michelin kaiseki dining, and historic ryokan retreats.',
    image: '/images/japan-tour-1.jpg',
    features: ['Private Tea Ceremony', 'Shinkansen Gran Class', 'Luxury Ryokan'],
    searchQuery: 'Japan',
  },
  {
    id: 'srilanka',
    tag: 'ROYAL HERITAGE & WILDLIFE',
    badgeIcon: Globe2,
    title: 'Sigiriya Citadel & Safari Pavilions',
    destination: 'Sri Lanka · Cultural Triangle & Yala',
    duration: '6–9 Days',
    price: '$1,200',
    description:
      'Ascend the fifth-century royal rock fortress in the sky, encounter free-roaming leopards in Yala, and unwind in colonial tea estate bungalows.',
    image: '/images/sri-lanka-tour-1.jpg',
    features: ['Naturalist Guide', 'Luxury Tented Safari', 'Heritage Tea Estate'],
    searchQuery: 'Sri Lanka',
  },
];

const fallbackImages:
  Record<
    string,
    string
  > = {
    Maldives:
      '/images/maldives-package-1.jpg',

    'Sri Lanka':
      '/images/sri-lanka-tour-1.jpg',

    Japan:
      '/images/japan-tour-1.jpg',

    Switzerland:
      '/images/switzerland-tour-1.jpg',

    Bali:
      '/images/bali-honeymoon-1.jpg',

    Phuket:
      '/images/thailand-tour.jpg',
  };

const defaultFallbackImage =
  '/images/default-travel.jpg';

function getPackageImage(
  pkg: ApiPackage,
) {
  const image =
    pkg.images?.[0];

  if (!image) {
    return (
      fallbackImages[
        pkg.destination
      ] ||
      defaultFallbackImage
    );
  }

  if (
    image.startsWith(
      'http://',
    ) ||
    image.startsWith(
      'https://',
    )
  ) {
    return image;
  }

  if (
    image.startsWith(
      '/uploads/',
    )
  ) {
    return `${API_URL}${image}`;
  }

  if (
    image.startsWith(
      '/images/',
    )
  ) {
    return image;
  }

  return `/images/${image}`;
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
  ).format(
    value,
  );
}

function getTodayDate() {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() +
        1,
    ).padStart(
      2,
      '0',
    );

  const day =
    String(
      now.getDate(),
    ).padStart(
      2,
      '0',
    );

  return `${year}-${month}-${day}`;
}


const defaultReviews = [
  {
    _id: 'rev-1',
    name: 'Elena Rostova',
    country: 'Geneva, Switzerland',
    packageTitle: 'Maldives Luxury Escape',
    rating: 5,
    comment:
      'Our private overwater villa in the Maldives arranged through GlobalVista was sheer perfection. From the private seaplane escort to the bespoke coral reef safari, every detail was executed with white-glove precision. Truly an unforgettable luxury holiday!',
  },
  {
    _id: 'rev-2',
    name: 'Alexander Wright',
    country: 'London, United Kingdom',
    packageTitle: 'Switzerland Alpine Experience',
    rating: 5,
    comment:
      'The scenic helicopter tour over the Matterhorn and our stay in Interlaken exceeded every expectation. The first-class Glacier Express tickets and luxury heated chalet made our 10th anniversary vacation breathtaking. GlobalVista is our definitive choice for world travel.',
  },
  {
    _id: 'rev-3',
    name: 'Dr. Sarah Jenkins',
    country: 'Boston, United States',
    packageTitle: 'Japan Culture Experience',
    rating: 5,
    comment:
      'Experiencing an after-hours Zen garden tour in Kyoto and staying at a 300-year-old hot spring ryokan was pure magic. The Michelin-starred Kaiseki dining arrangements and private chauffeur made navigating Japan completely seamless and stress-free.',
  },
  {
    _id: 'rev-4',
    name: 'Tharindu Jayasundara',
    country: 'Colombo, Sri Lanka',
    packageTitle: 'Bali Romantic Honeymoon',
    rating: 5,
    comment:
      'Our romantic honeymoon in Ubud and Uluwatu was deeply restorative. The private cliffside infinity villa, floating champagne breakfast, and flower-bath spa treatments were sublime. The concierge team kept in touch throughout our stay to ensure everything went smoothly.',
  },
  {
    _id: 'rev-5',
    name: 'Lord Arthur Sterling',
    country: 'Edinburgh, Scotland',
    packageTitle: 'Sri Lanka Adventure Tour',
    rating: 5,
    comment:
      'Climbing Sigiriya rock fortress at sunrise with an expert private naturalist and encountering wild leopard prides in Yala national park was extraordinary. GlobalVista gave us access to royal historic estates that ordinary tourists never get to see.',
  },
  {
    _id: 'rev-6',
    name: 'Amélie & Julien Laurent',
    country: 'Paris, France',
    packageTitle: 'Thailand Paradise Tour',
    rating: 5,
    comment:
      'Private catamaran charter across Phang Nga bay, sunset beachside dining, and 5-star pool villas made our Thailand holiday top tier. The digital itinerary voucher and invoice system made check-ins effortless at every hotel.',
  },
];

export default function Home() {
  const router = useRouter();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  const { formatPrice, currentCurrency, currency } = useCurrency();
  const { language, setLanguage, t } = useLanguage();

  const [plannerDestination, setPlannerDestination] = useState('');
  const [plannerSeason, setPlannerSeason] = useState('');
  const [plannerStyle, setPlannerStyle] = useState('');

  const handlePlannerSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = plannerDestination || plannerStyle || '';
    if (query) {
      router.push(`/packages?search=${encodeURIComponent(query)}`);
    } else {
      router.push('/packages');
    }
  };

  // Navigation styling and responsive mobile menu only.
  const [activeNavSection, setActiveNavSection] = useState('destinations');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [
    packages,
    setPackages,
  ] =
    useState<
      ApiPackage[]
    >([]);

  const [destinations, setDestinations] = useState<ApiDestination[]>([]);
  const [destinationsLoading, setDestinationsLoading] = useState(true);
  const [destinationsError, setDestinationsError] = useState('');

  const [selectedGalleryDestination, setSelectedGalleryDestination] = useState<ApiDestination | null>(null);
  const [activeGalleryCountry, setActiveGalleryCountry] = useState<string>('ALL');

  const galleryDestinations = useMemo(() => {
    if (activeGalleryCountry === 'ALL') return destinations;
    return destinations.filter((d) => d.country?.toLowerCase() === activeGalleryCountry.toLowerCase());
  }, [destinations, activeGalleryCountry]);

  const galleryCountries = useMemo(() => {
    const list = Array.from(new Set(destinations.map((d) => d.country).filter(Boolean)));
    if (!list.some((c) => c.toLowerCase() === 'croatia')) {
      list.unshift('Croatia');
    }
    return list;
  }, [destinations]);

  const collageSlots = useMemo(() => {
    const matching = galleryDestinations;
    const list = [...matching];
    if (list.length < 6) {
      for (const d of destinations) {
        if (!list.some((item) => item._id === d._id)) {
          list.push(d);
        }
        if (list.length >= 6) break;
      }
    }
    // If still under 6, create fallback slot objects from known destinations
    if (list.length < 6 && destinations.length > 0) {
      while (list.length < 6) {
        const fallbackItem = destinations[list.length % destinations.length];
        list.push({
          ...fallbackItem,
          _id: `${fallbackItem._id}-slot-${list.length}`,
        });
      }
    }
    return list.slice(0, 6);
  }, [galleryDestinations, destinations]);

  const handleGalleryNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!selectedGalleryDestination || galleryDestinations.length === 0) return;
    const currentIndex = galleryDestinations.findIndex((d) => d._id === selectedGalleryDestination._id);
    const nextIndex = (currentIndex + 1) % galleryDestinations.length;
    setSelectedGalleryDestination(galleryDestinations[nextIndex]);
  };

  const handleGalleryPrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!selectedGalleryDestination || galleryDestinations.length === 0) return;
    const currentIndex = galleryDestinations.findIndex((d) => d._id === selectedGalleryDestination._id);
    const prevIndex = (currentIndex - 1 + galleryDestinations.length) % galleryDestinations.length;
    setSelectedGalleryDestination(galleryDestinations[prevIndex]);
  };

  const [
    packagesLoading,
    setPackagesLoading,
  ] =
    useState(
      true,
    );

  const [
    packagesError,
    setPackagesError,
  ] =
    useState(
      '',
    );

  const [
    activeHeroVideo,
    setActiveHeroVideo,
  ] =
    useState(
      0,
    );

  const heroVideoRefs =
    useRef<
      Array<
        HTMLVideoElement | null
      >
    >([]);

  // Hero Video Control & Cinematic Lightbox
  const [heroVideoPlaying, setHeroVideoPlaying] = useState(true);
  const [isCinematicModalOpen, setIsCinematicModalOpen] = useState(false);
  const cinematicVideoRef = useRef<HTMLVideoElement | null>(null);

  // Navbar Quick Search Modal
  const [isQuickSearchModalOpen, setIsQuickSearchModalOpen] = useState(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Navbar Language Selector
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement | null>(null);

  // Close language dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        languageMenuRef.current &&
        !languageMenuRef.current.contains(e.target as Node)
      ) {
        setIsLanguageDropdownOpen(false);
      }
    };
    if (isLanguageDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isLanguageDropdownOpen]);

  // Modal keyboard listeners (Esc key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCinematicModalOpen(false);
        setIsQuickSearchModalOpen(false);
        setIsLanguageDropdownOpen(false);
        setSelectedGalleryDestination(null);
      } else if (e.key === 'ArrowRight' && selectedGalleryDestination) {
        handleGalleryNext();
      } else if (e.key === 'ArrowLeft' && selectedGalleryDestination) {
        handleGalleryPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGalleryDestination, galleryDestinations]);

  // Autofocus quick search input on open
  useEffect(() => {
    if (isQuickSearchModalOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 70);
      return () => clearTimeout(timer);
    }
  }, [isQuickSearchModalOpen]);

  const toggleHeroVideoPlayback = () => {
    const currentVideo = heroVideoRefs.current[activeHeroVideo];
    if (!currentVideo) return;
    if (heroVideoPlaying) {
      currentVideo.pause();
      setHeroVideoPlaying(false);
    } else {
      currentVideo.play().catch(() => {});
      setHeroVideoPlaying(true);
    }
  };

  const selectHeroScene = (idx: number) => {
    if (idx === activeHeroVideo) return;
    const currentVid = heroVideoRefs.current[activeHeroVideo];
    if (currentVid) {
      currentVid.pause();
    }
    const targetVid = heroVideoRefs.current[idx];
    if (targetVid) {
      targetVid.currentTime = 0;
      if (heroVideoPlaying) {
        targetVid.play().catch(() => {});
      }
    }
    setActiveHeroVideo(idx);
  };

  const [
    currentUser,
    setCurrentUser,
  ] =
    useState<
      CurrentUser | null
    >(
      null,
    );

  const [savedPackageIds, setSavedPackageIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('globalvista_wishlist');
      if (stored) setSavedPackageIds(JSON.parse(stored));
    } catch {}
  }, []);

  const toggleSavePackage = (id: string) => {
    setSavedPackageIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem('globalvista_wishlist', JSON.stringify(next));
      return next;
    });
  };

  const [
    publicReviews,
    setPublicReviews,
  ] =
    useState<
      PublicReview[]
    >([]);
  // Reviews Slider & Modal State (Lansakara Furniture Style)
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);
  const [isReviewHovered, setIsReviewHovered] = useState(false);
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [formReviewerName, setFormReviewerName] = useState('');
  const [formReviewerEmail, setFormReviewerEmail] = useState('');
  const [formReviewerCountry, setFormReviewerCountry] = useState('');
  const [formReviewerDestination, setFormReviewerDestination] = useState('');
  const [formReviewerComment, setFormReviewerComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewAlert, setReviewAlert] = useState<{ type: string; text: string }>({ type: '', text: '' });
  const [localCustomReviews, setLocalCustomReviews] = useState<any[]>([]);

  useEffect(() => {
    try {
      if (localStorage.getItem('globalvista_has_reviewed')) {
        setHasSubmittedReview(true);
      }
    } catch {}
  }, []);

  const displayReviews = [
    ...localCustomReviews,
    ...(publicReviews.length > 0
      ? publicReviews.map((r) => ({
          _id: r._id,
          name: r.userId?.name || 'Explorer',
          country: r.userId?.country || r.packageId?.country || 'Global Traveller',
          packageTitle: r.packageId?.title || r.packageId?.destination || 'GlobalVista Expedition',
          rating: Number(r.rating || 5),
          comment: r.comment || '',
        }))
      : defaultReviews),
  ];

  // Auto-slide every 5.5s unless hovered or modal open
  useEffect(() => {
    if (isReviewHovered || isReviewModalOpen) return;
    const count = displayReviews.length;
    if (count <= 1) return;
    const timer = setInterval(() => {
      setActiveReviewIdx((prev) => (prev + 1) % count);
    }, 5500);
    return () => clearInterval(timer);
  }, [displayReviews.length, isReviewHovered, isReviewModalOpen]);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formReviewerName.trim() || !formReviewerComment.trim()) return;

    setSubmittingReview(true);
    setTimeout(() => {
      const newReview = {
        _id: 'user-rev-' + Date.now(),
        name: formReviewerName.trim(),
        country: formReviewerCountry.trim() || 'Verified Explorer',
        packageTitle: formReviewerDestination.trim() || 'Custom Luxury Expedition',
        rating: reviewRating,
        comment: formReviewerComment.trim(),
      };

      setLocalCustomReviews((prev) => [newReview, ...prev]);
      setActiveReviewIdx(0);
      setSubmittingReview(false);
      setHasSubmittedReview(true);
      setReviewAlert({
        type: 'success',
        text: 'Thank you! Your travel reflection has been published and featured.',
      });

      try {
        localStorage.setItem('globalvista_has_reviewed', 'true');
      } catch {}

      setTimeout(() => {
        setIsReviewModalOpen(false);
        setReviewAlert({ type: '', text: '' });
        setFormReviewerComment('');
      }, 1600);
    }, 600);
  };

  // Footer Interactive Contact Form State & Handler
  const [footerName, setFooterName] = useState('');
  const [footerEmail, setFooterEmail] = useState('');
  const [footerMessage, setFooterMessage] = useState('');
  const [footerSubmitting, setFooterSubmitting] = useState(false);
  const [footerSuccessData, setFooterSuccessData] = useState<{
    name: string;
    email: string;
    referenceId: string;
  } | null>(null);
  const [footerError, setFooterError] = useState('');

  // Prefill contact form if user is logged in
  useEffect(() => {
    if (currentUser?.name && !footerName) {
      setFooterName(currentUser.name);
    }
    if (currentUser?.email && !footerEmail) {
      setFooterEmail(currentUser.email);
    }
  }, [currentUser]);

  const handleFooterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFooterError('');

    const trimmedName = footerName.trim();
    const trimmedEmail = footerEmail.trim();
    const trimmedMessage = footerMessage.trim();

    if (!trimmedName) {
      setFooterError('Please enter your full name so our concierge can assist you.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setFooterError('Please provide a valid email address to receive your luxury itinerary.');
      return;
    }

    if (!trimmedMessage) {
      setFooterError('Please tell us a few details about your desired travel destination or dates.');
      return;
    }

    setFooterSubmitting(true);

    try {
      // Simulate luxury concierge processing
      await new Promise((resolve) => setTimeout(resolve, 750));

      const refId = `GV-EXP-${Math.floor(100000 + Math.random() * 900000)}`;

      // Save inquiry to localStorage
      try {
        const existingInquiries = JSON.parse(
          localStorage.getItem('globalvista_inquiries') || '[]'
        );
        existingInquiries.unshift({
          id: refId,
          name: trimmedName,
          email: trimmedEmail,
          message: trimmedMessage,
          submittedAt: new Date().toISOString(),
          status: 'PENDING_CONCIERGE_CONTACT',
        });
        localStorage.setItem(
          'globalvista_inquiries',
          JSON.stringify(existingInquiries.slice(0, 30))
        );
      } catch (err) {
        console.error('Failed to save inquiry to storage', err);
      }

      setFooterSuccessData({
        name: trimmedName,
        email: trimmedEmail,
        referenceId: refId,
      });
      setFooterName('');
      setFooterEmail('');
      setFooterMessage('');
    } catch {
      setFooterError('Something went wrong while sending your message. Please try again or reach us via WhatsApp.');
    } finally {
      setFooterSubmitting(false);
    }
  };

  const handleResetFooterForm = () => {
    setFooterSuccessData(null);
    setFooterError('');
  };


  const [
    travelPlans,
    setTravelPlans,
  ] =
    useState<
      TravelPlan[]
    >([]);

  const [
    travelPlansLoading,
    setTravelPlansLoading,
  ] =
    useState(
      true,
    );

  const [
    travelPlansError,
    setTravelPlansError,
  ] =
    useState(
      '',
    );

  const [
    selectedTravelPlanId,
    setSelectedTravelPlanId,
  ] =
    useState(
      '',
    );

  const [
    openFaqIndex,
    setOpenFaqIndex,
  ] =
    useState<
      number | null
    >(
      null,
    );

  const [
    selectedPackage,
    setSelectedPackage,
  ] =
    useState<
      ApiPackage | null
    >(
      null,
    );

  const [
    itineraryModalPackage,
    setItineraryModalPackage,
  ] = useState<ApiPackage | null>(null);

  const [
    isItineraryModalOpen,
    setIsItineraryModalOpen,
  ] = useState(false);

  const openItinerary = (pkg: ApiPackage) => {
    setItineraryModalPackage(pkg);
    setIsItineraryModalOpen(true);
  };

  const closeItinerary = () => {
    setIsItineraryModalOpen(false);
  };

  const [
    travelDate,
    setTravelDate,
  ] =
    useState(
      '',
    );

  const [
    numberOfPeople,
    setNumberOfPeople,
  ] =
    useState(
      1,
    );

  const [
    selectedAddOnIds,
    setSelectedAddOnIds,
  ] =
    useState<
      string[]
    >([]);

  const [
    bookingSubmitting,
    setBookingSubmitting,
  ] =
    useState(
      false,
    );

  const [
    bookingError,
    setBookingError,
  ] =
    useState(
      '',
    );

  const [
    bookingSuccess,
    setBookingSuccess,
  ] =
    useState(
      '',
    );

  const [
    createdBookingId,
    setCreatedBookingId,
  ] =
    useState<string>('');

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          const token =
            localStorage.getItem(
              'globalvista_token',
            ) ||
            localStorage.getItem(
              'token',
            );

          const rawUser =
            localStorage.getItem(
              'globalvista_user',
            ) ||
            localStorage.getItem(
              'user',
            );

          if (
            !token ||
            !rawUser
          ) {
            setCurrentUser(
              null,
            );

            return;
          }

          try {
            const storedUser =
              JSON.parse(
                rawUser,
              ) as CurrentUser;

            setCurrentUser(
              storedUser,
            );
          } catch {
            localStorage.removeItem(
              'globalvista_user',
            );

            localStorage.removeItem(
              'user',
            );

            setCurrentUser(
              null,
            );
          }
        },
        0,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, []);

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          const storedPlanId =
            localStorage.getItem(
              'globalvista_selected_travel_plan',
            );

          if (
            storedPlanId
          ) {
            setSelectedTravelPlanId(
              storedPlanId,
            );
          }
        },
        0,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadDestinations = async () => {
      try {
        const response = await fetch(`${API_URL}/destinations`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(`Failed to load destinations: ${response.status}`);
        }

        const data: ApiDestination[] = await response.json();
        if (!cancelled) {
          setDestinations(
            Array.isArray(data)
              ? data.filter((item) => item.isActive !== false)
              : [],
          );
          setDestinationsError('');
        }
      } catch (error) {
        console.error('Destination API error:', error);
        if (!cancelled) {
          setDestinationsError('Unable to load destinations. Please try again.');
        }
      } finally {
        if (!cancelled) setDestinationsLoading(false);
      }
    };

    void loadDestinations();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const loadPackages =
      async () => {
        try {
          setPackagesLoading(
            true,
          );

          setPackagesError(
            '',
          );

          const response =
            await fetch(
              `${API_URL}/packages`,
              {
                cache:
                  'no-store',
              },
            );

          if (
            !response.ok
          ) {
            throw new Error(
              `Failed to load packages: ${response.status}`,
            );
          }

          const data:
            ApiPackage[] =
            await response.json();

          setPackages(
            Array.isArray(
              data,
            )
              ? data
              : [],
          );
        } catch (
          error
        ) {
          console.error(
            'Package API error:',
            error,
          );

          setPackagesError(
            'Unable to load packages. Please try again.',
          );
        } finally {
          setPackagesLoading(
            false,
          );
        }
      };

    void loadPackages();
  }, []);

  useEffect(() => {
    const loadPublicReviews =
      async () => {
        try {
          const response =
            await fetch(
              `${API_URL}/reviews/recent`,
              {
                cache:
                  'no-store',
              },
            );

          if (
            !response.ok
          ) {
            setPublicReviews(
              [],
            );

            return;
          }

          const data =
            await response.json();

          setPublicReviews(
            Array.isArray(
              data,
            )
              ? data
              : [],
          );
        } catch (
          error
        ) {
          console.error(
            'Review API error:',
            error,
          );

          setPublicReviews(
            [],
          );
        }
      };

    void loadPublicReviews();
  }, []);

  useEffect(() => {
    const loadTravelPlans =
      async () => {
        try {
          setTravelPlansLoading(
            true,
          );

          setTravelPlansError(
            '',
          );

          const response =
            await fetch(
              `${API_URL}/travel-plans/active`,
              {
                cache:
                  'no-store',
              },
            );

          if (
            !response.ok
          ) {
            throw new Error(
              `Failed to load travel plans: ${response.status}`,
            );
          }

          const data:
            TravelPlan[] =
            await response.json();

          setTravelPlans(
            Array.isArray(
              data,
            )
              ? data
              : [],
          );
        } catch (
          error
        ) {
          console.error(
            'Travel plans API error:',
            error,
          );

          setTravelPlans(
            [],
          );

          setTravelPlansError(
            'Unable to load travel plans. Please try again.',
          );
        } finally {
          setTravelPlansLoading(
            false,
          );
        }
      };

    void loadTravelPlans();
  }, []);

  useEffect(() => {
    const firstVideo =
      heroVideoRefs
        .current[0];

    if (
      !firstVideo
    ) {
      return;
    }

    firstVideo.currentTime =
      0;

    firstVideo
      .play()
      .catch(
        () => {},
      );
  }, []);

  const handleLogout =
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

      setCurrentUser(
        null,
      );

      router.push(
        '/login',
      );
    };

  const persistTravelPlanSelection =
    (
      planId:
        string,
    ) => {
      setSelectedTravelPlanId(
        planId,
      );

      if (
        planId
      ) {
        localStorage.setItem(
          'globalvista_selected_travel_plan',
          planId,
        );
      } else {
        localStorage.removeItem(
          'globalvista_selected_travel_plan',
        );
      }

      setBookingError(
        '',
      );

      setBookingSuccess(
        '',
      );
      setCreatedBookingId('');
    };

  const handleSelectTravelPlan =
    (
      plan:
        TravelPlan,
    ) => {
      persistTravelPlanSelection(
        plan._id,
      );

      window.setTimeout(
        () => {
          document
            .getElementById(
              'destinations',
            )
            ?.scrollIntoView({
              behavior:
                'smooth',
              block:
                'start',
            });
        },
        120,
      );
    };

  const toggleFaq =
    (
      index:
        number,
    ) => {
      setOpenFaqIndex(
        (
          current,
        ) =>
          current ===
          index
            ? null
            : index,
      );
    };

  const handleHeroVideoEnded =
    (
      finishedVideo:
        number,
    ) => {
      const nextVideo =
        (
          finishedVideo +
          1
        ) %
        HERO_VIDEOS.length;

      const nextVideoElement =
        heroVideoRefs
          .current[
          nextVideo
        ];

      if (
        nextVideoElement
      ) {
        nextVideoElement.currentTime =
          0;

        if (heroVideoPlaying) {
          nextVideoElement
            .play()
            .catch(
              () => {},
            );
        }
      }

      setActiveHeroVideo(
        nextVideo,
      );
    };

  const openBooking =
    async (
      pkg: ApiPackage,
    ) => {
      if (
        !pkg.availability
      ) {
        return;
      }

      setSelectedPackage(
        pkg,
      );

      setTravelDate(
        '',
      );

      setNumberOfPeople(
        1,
      );

      setSelectedAddOnIds(
        [],
      );

      setBookingError(
        '',
      );

      setBookingSuccess(
        '',
      );

      try {
        const response =
          await fetch(
            `${API_URL}/packages/${pkg._id}`,
            {
              cache:
                'no-store',
            },
          );

        if (
          !response.ok
        ) {
          throw new Error(
            `Failed to refresh package: ${response.status}`,
          );
        }

        const latestPackage:
          ApiPackage =
          await response.json();

        setSelectedPackage(
          latestPackage,
        );

        setPackages(
          (
            current,
          ) =>
            current.map(
              (
                item,
              ) =>
                item._id ===
                latestPackage._id
                  ? latestPackage
                  : item,
            ),
        );
      } catch (
        error
      ) {
        console.error(
          'Package refresh error:',
          error,
        );

        setBookingError(
          'Could not refresh the latest package details. Please close and try again.',
        );
      }
    };

  const closeBooking =
    () => {
      if (
        bookingSubmitting
      ) {
        return;
      }

      setSelectedPackage(
        null,
      );

      setTravelDate(
        '',
      );

      setNumberOfPeople(
        1,
      );

      setSelectedAddOnIds(
        [],
      );

      setBookingError(
        '',
      );

      setBookingSuccess(
        '',
      );
    };

  const toggleAddOn =
    (
      addOnId:
        string,
    ) => {
      setBookingError(
        '',
      );

      setBookingSuccess(
        '',
      );

      setSelectedAddOnIds(
        (
          current,
        ) =>
          current.includes(
            addOnId,
          )
            ? current.filter(
                (
                  id,
                ) =>
                  id !==
                  addOnId,
              )
            : [
                ...current,
                addOnId,
              ],
      );
    };

  const selectedTravelPlan =
    travelPlans.find(
      (
        plan,
      ) =>
        plan._id ===
        selectedTravelPlanId,
    ) ??
    null;

  const travelPlanTotal =
    selectedTravelPlan
      ? selectedTravelPlan
          .price *
        numberOfPeople
      : 0;

  const baseTotal =
    selectedPackage
      ? selectedPackage
          .price *
        numberOfPeople
      : 0;

  const addOnsTotal =
    selectedPackage
      ? (
          selectedPackage
            .addOns ??
          []
        )
          .filter(
            (
              addOn,
            ) =>
              selectedAddOnIds.includes(
                addOn._id,
              ),
          )
          .reduce(
            (
              total,
              addOn,
            ) => {
              const quantity =
                addOn.pricingType ===
                'PER_PERSON'
                  ? numberOfPeople
                  : 1;

              return (
                total +
                addOn.price *
                  quantity
              );
            },
            0,
          )
      : 0;

  const estimatedTotal =
    baseTotal +
    travelPlanTotal +
    addOnsTotal;

  const createBooking =
    async () => {
      if (
        !selectedPackage
      ) {
        return;
      }

      setBookingError(
        '',
      );

      setBookingSuccess(
        '',
      );

      if (
        !selectedTravelPlan
      ) {
        setBookingError(
          'Please select a travel plan before confirming your booking.',
        );

        return;
      }

      if (
        !travelDate
      ) {
        setBookingError(
          'Please select your travel date.',
        );

        return;
      }

      if (
        travelDate <
        getTodayDate()
      ) {
        setBookingError(
          'Travel date cannot be in the past.',
        );

        return;
      }

      const token =
        localStorage.getItem(
          'globalvista_token',
        ) ||
        localStorage.getItem(
          'token',
        );

      const rawUser =
        localStorage.getItem(
          'globalvista_user',
        ) ||
        localStorage.getItem(
          'user',
        );

      if (
        !token ||
        !rawUser
      ) {
        router.push(
          '/login',
        );

        return;
      }

      let storedUser:
        {
          role?: string;
        } | null =
        null;

      try {
        storedUser =
          JSON.parse(
            rawUser,
          );
      } catch {
        storedUser =
          null;
      }

      if (storedUser?.role !== 'USER' && storedUser?.role !== 'ADMIN') {
        setBookingError('Please sign in as a traveller or administrator to book.');
        return;
      }

      try {
        setBookingSubmitting(
          true,
        );

        const response =
          await fetch(
            `${API_URL}/bookings`,
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify(
                  {
                    packageId:
                      selectedPackage._id,

                    travelPlanId:
                      selectedTravelPlan._id,

                    travelDate,

                    numberOfPeople,

                    selectedAddOnIds,
                  },
                ),
            },
          );

        const data:
          BookingResponse =
          await response
            .json()
            .catch(
              () =>
                ({}),
            );

        if (
          response.status ===
          401
        ) {
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

          router.push(
            '/login',
          );

          return;
        }

        if (
          !response.ok
        ) {
          const message =
            Array.isArray(
              data.message,
            )
              ? data.message.join(
                  ', ',
                )
              : data.message ||
                'Unable to create booking.';

          throw new Error(
            message,
          );
        }

        const confirmedTotal =
          typeof data
            .totalPrice ===
          'number'
            ? data.totalPrice
            : estimatedTotal;

        setBookingSuccess(
          `Booking created successfully. Total: $${formatMoney(
            confirmedTotal,
          )}`,
        );
      } catch (
        error
      ) {
        setBookingError(
          error instanceof
            Error
            ? error.message
            : 'Unable to create booking.',
        );
      } finally {
        setBookingSubmitting(
          false,
        );
      }
    };

  // Homepage preview limits only; /packages shows the full package collection.
  const homeDestinations = destinations.slice(0, 6);
  const homePackages = packages.slice(0, 9);

  const specialOffers =
    packages
      .filter(
        (
          pkg,
        ) =>
          pkg.isSpecialOffer ===
          true,
      )
      .slice(
        0,
        4,
      );

  const heroDealPackage =
    packages.find(
      (pkg) =>
        pkg.availability &&
        (pkg.destination?.toLowerCase().includes('maldives') ||
          pkg.country?.toLowerCase().includes('maldives') ||
          pkg.isSpecialOffer),
    ) || packages[0];

  const dealPackageToDisplay = heroDealPackage || {
    _id: 'featured-deal',
    title: 'Maldives Overwater Lagoon Sanctuary',
    destination: 'South Ari Atoll',
    country: 'Maldives',
    duration: '7 Days / 6 Nights',
    price: 3400,
    category: 'Private Island Sanctuary',
    description:
      'Awaken above crystal turquoise lagoons with dedicated butler service, infinity plunge pool, and reef safari.',
    images: ['/images/maldives-package-1.jpg'],
    availability: true,
  };

  return (
    <main>
      <motion.div
        className="scrollProgressBar"
        style={{
          scaleX,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #0284c7, #38bdf8, #0ea5e9, #38bdf8)',
          transformOrigin: '0%',
          zIndex: 9999,
          boxShadow: '0 0 10px rgba(56, 189, 248, 0.7)',
        }}
      />
      <section
        className="hero"
      >
        <div className="heroMediaBg" aria-hidden="true">
          {HERO_VIDEOS.map(
            (
              video,
              index,
            ) => (
              <video
                key={
                  video
                }
                ref={(
                  element,
                ) => {
                  heroVideoRefs.current[
                    index
                  ] =
                    element;
                }}
                className="heroVideo"
                autoPlay={index === 0}
                muted
                playsInline
                preload="auto"
                poster={
                  index ===
                  0
                    ? '/images/globalvista-bg.png'
                    : undefined
                }
                onEnded={() =>
                  handleHeroVideoEnded(
                    index,
                  )
                }
                style={{
                  opacity:
                    activeHeroVideo ===
                    index
                      ? 1
                      : 0,

                  transition:
                    'opacity 1.2s ease-in-out',

                  zIndex:
                    activeHeroVideo ===
                    index
                      ? 1
                      : 0,

                  pointerEvents:
                    'none',
                }}
              >
                <source
                  src={
                    video
                  }
                  type="video/mp4"
                />
              </video>
            ),
          )}

          <div
            className="heroOverlay"
          />
        </div>

        <header className="navbar container">
          <Link className="logo" href="/" aria-label="GlobalVista home">
            Global<span>Vista</span>
          </Link>

          <nav className={`navLinks${mobileNavOpen ? ' navLinksOpen' : ''}`} aria-label="Main navigation">
            <a
              href="#destinations"
              className={`navItem${activeNavSection === 'destinations' ? ' navItemActive' : ''}`}
              aria-current={activeNavSection === 'destinations' ? 'location' : undefined}
              onClick={() => { setActiveNavSection('destinations'); setMobileNavOpen(false); }}
            >
              <HomeIcon size={19} strokeWidth={2.1} aria-hidden="true" />
              <span>{t.nav.destinations}</span>
            </a>
            <a
              href="#experiences"
              className={`navItem${activeNavSection === 'experiences' ? ' navItemActive' : ''}`}
              aria-current={activeNavSection === 'experiences' ? 'location' : undefined}
              onClick={() => { setActiveNavSection('experiences'); setMobileNavOpen(false); }}
            >
              <Plane size={20} strokeWidth={1.95} aria-hidden="true" />
              <span>{t.nav.experiences}</span>
            </a>
            <a
              href="#offers"
              className={`navItem${activeNavSection === 'offers' ? ' navItemActive' : ''}`}
              aria-current={activeNavSection === 'offers' ? 'location' : undefined}
              onClick={() => { setActiveNavSection('offers'); setMobileNavOpen(false); }}
            >
              <Gift size={19} strokeWidth={1.95} aria-hidden="true" />
              <span>{t.nav.specialOffers}</span>
            </a>
            <a
              href="#reviews"
              className={`navItem${activeNavSection === 'reviews' ? ' navItemActive' : ''}`}
              aria-current={activeNavSection === 'reviews' ? 'location' : undefined}
              onClick={() => { setActiveNavSection('reviews'); setMobileNavOpen(false); }}
            >
              <Star size={19} strokeWidth={1.95} aria-hidden="true" />
              <span>{t.nav.reflections}</span>
            </a>
            <a
              href="#plans"
              className={`navItem${activeNavSection === 'plans' ? ' navItemActive' : ''}`}
              aria-current={activeNavSection === 'plans' ? 'location' : undefined}
              onClick={() => { setActiveNavSection('plans'); setMobileNavOpen(false); }}
            >
              <CreditCard size={19} strokeWidth={1.95} aria-hidden="true" />
              <span>{t.nav.plans}</span>
            </a>
            {mobileNavOpen && (
              <div className="mobileNavDrawerExtras">
                <button
                  type="button"
                  className="mobileDrawerSearchBtn"
                  onClick={() => {
                    setMobileNavOpen(false);
                    setIsQuickSearchModalOpen(true);
                    setQuickSearchQuery('');
                  }}
                >
                  <Search size={16} />
                  <span>{t.nav.searchPlaceholder}</span>
                </button>
                <div className="mobileDrawerCurrencyWrap">
                  <CurrencySelector />
                </div>
              </div>
            )}
          </nav>

          <div className="navActions">
            <span className="navDivider" aria-hidden="true" />
            <button
              type="button"
              className="navIcon searchNavButton"
              aria-label="Search destinations and packages"
              title="Search destinations and packages"
              onClick={() => {
                setIsQuickSearchModalOpen(true);
                setQuickSearchQuery('');
              }}
            >
              <Search size={21} strokeWidth={2} />
            </button>

            <CurrencySelector />

            <div className="languageSelectorWrapper" ref={languageMenuRef}>
              <button
                type="button"
                className={`language${isLanguageDropdownOpen ? ' languageActive' : ''}`}
                aria-label="Language selection"
                aria-expanded={isLanguageDropdownOpen}
                onClick={() => setIsLanguageDropdownOpen((prev) => !prev)}
              >
                <Globe2 size={19} strokeWidth={2} />
                <span>{language}</span>
                <ChevronDown
                  size={14}
                  strokeWidth={2.2}
                  className={`langChevron${isLanguageDropdownOpen ? ' langChevronOpen' : ''}`}
                />
              </button>

              {isLanguageDropdownOpen && (
                <div className="navbarLanguageDropdown">
                  <div className="languageDropdownHeader">
                    <span>Select Language & Region</span>
                  </div>
                  <div className="languageList">
                    {AVAILABLE_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        className={`languageItem${language === lang.code ? ' languageItemActive' : ''}`}
                        onClick={() => {
                          setLanguage(lang.code);
                          setIsLanguageDropdownOpen(false);
                        }}
                      >
                        <div className="languageItemLeft">
                          <strong>{lang.flag} {lang.label}</strong>
                          <small>{lang.region}</small>
                        </div>
                        {language === lang.code ? (
                          <Check size={16} className="languageCheckIcon" />
                        ) : (
                          <span className="languageCodeBadge">{lang.code}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {currentUser?.role === 'USER' ? (
              <>
                <button
                  type="button"
                  className="profileNav"
                  aria-label="Open traveller profile"
                  onClick={() => router.push('/traveller')}
                >
                  <span className="profileAvatar" aria-hidden="true">
                    {(currentUser.name?.trim().charAt(0) || 'T').toUpperCase()}
                  </span>
                  <span className="profileGreeting">
                    Hi, <strong>{currentUser.name?.trim().split(/\s+/)[0] || 'Traveller'}</strong>
                  </span>
                </button>

                <Link className="navCta" href="/traveller">
                  {t.nav.myAccount} <ArrowRight size={18} />
                </Link>

                <button
                  type="button"
                  className="navIcon logoutButton"
                  aria-label={t.nav.signOut}
                  title={t.nav.signOut}
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : currentUser?.role === 'ADMIN' ? (
              <>
                <Link
                  className="navCta"
                  href="/admin"
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                >
                  <ShieldCheck size={18} strokeWidth={2} aria-hidden="true" />
                  Admin Dashboard <ArrowRight size={17} />
                </Link>
                <button
                  type="button"
                  className="navIcon logoutButton"
                  aria-label={t.nav.signOut}
                  title={t.nav.signOut}
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : currentUser?.role === 'GUIDE' ? (
              <>
                <Link
                  className="navCta"
                  href="/guide/dashboard"
                  style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
                >
                  <Plane size={18} strokeWidth={2} aria-hidden="true" />
                  Guide Portal <ArrowRight size={17} />
                </Link>
                <button
                  type="button"
                  className="navIcon logoutButton"
                  aria-label={t.nav.signOut}
                  title={t.nav.signOut}
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <Link className="navCta" href="/login">
                <UserRound size={20} strokeWidth={1.9} aria-hidden="true" />
                {t.nav.signIn} <ArrowRight size={19} />
              </Link>
            )}

            <button
              type="button"
              className="navMobileToggle"
              aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </header>

        <div
          className="heroInner container"
        >
          <motion.div
            className="heroText"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div
              className="eyebrow"
            >
              <span />

              {t.hero.tag}
            </div>

            <h1>
              {t.hero.title}
            </h1>

            <p>
              {t.hero.subtitle}
            </p>

            <div
              className="heroButtons"
            >
              <a
                className="primaryBtn"
                href="#destinations"
              >
                {t.hero.exploreBtn}

                <ArrowRight
                  size={
                    18
                  }
                />
              </a>

              <button
                type="button"
                className="watchBtn"
                onClick={() => setIsCinematicModalOpen(true)}
                aria-label={t.hero.watchVideo}
              >
                <span>
                  <Play
                    size={
                      16
                    }
                    fill="currentColor"
                  />
                </span>

                {t.hero.watchVideo}
              </button>
            </div>

            <div
              className="travellerProof"
            >
              <div
                className="avatars"
              >
                <span>
                  JM
                </span>

                <span>
                  AK
                </span>

                <span>
                  LS
                </span>

                <span>
                  NP
                </span>
              </div>

              <div>
                <div
                  className="proofStars"
                >
                  <Star
                    size={
                      14
                    }
                    fill="currentColor"
                  />

                  <Star
                    size={
                      14
                    }
                    fill="currentColor"
                  />

                  <Star
                    size={
                      14
                    }
                    fill="currentColor"
                  />

                  <Star
                    size={
                      14
                    }
                    fill="currentColor"
                  />

                  <Star
                    size={
                      14
                    }
                    fill="currentColor"
                  />
                </div>

                <small>
                  4.9/5 · 25,000+ Happy Travellers
                </small>
              </div>
            </div>
          </motion.div>

          <motion.aside
            className="heroDealCard"
            aria-label="Featured luxury escape deal"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            whileHover={{ y: -6, transition: { duration: 0.25 } }}
          >
            <div className="dealCardTop">
              <div
                className="dealLabel"
              >
                <Sparkles
                  size={
                    14
                  }
                  className="dealSparkleIcon"
                />

                <span>{t.hero.featuredEscape}</span>
              </div>
              <span className="dealBadgePill">Limited Offer</span>
            </div>

            <div className="dealThumbWrap">
              <img
                src={getPackageImage(dealPackageToDisplay as ApiPackage)}
                alt={dealPackageToDisplay.title}
                className="dealThumbImg"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/images/maldives-package-1.jpg';
                }}
              />
              <div className="dealThumbOverlay" />
              <span className="dealThumbLocation">
                <MapPin size={12} />
                {dealPackageToDisplay.destination}, {dealPackageToDisplay.country}
              </span>
            </div>

            <div className="dealCardContent">
              <h3>
                {dealPackageToDisplay.title}
              </h3>

              <p className="dealDuration">
                <Clock3 size={13} />
                {dealPackageToDisplay.duration} · All Inclusive
              </p>

              <div className="dealPriceRow">
                <div
                  className="dealPrice"
                >
                  <span>
                    {t.hero.startingFrom}
                  </span>

                  <strong>
                    {formatPrice(dealPackageToDisplay.price)}
                  </strong>

                  <small>
                    {t.hero.perPerson}
                  </small>
                </div>

                <div className="dealRatingBadge">
                  <div className="dealRatingStars">
                    <Star size={12} fill="#ffd153" stroke="#ffd153" />
                    <Star size={12} fill="#ffd153" stroke="#ffd153" />
                    <Star size={12} fill="#ffd153" stroke="#ffd153" />
                    <Star size={12} fill="#ffd153" stroke="#ffd153" />
                    <Star size={12} fill="#ffd153" stroke="#ffd153" />
                  </div>
                  <span>{t.hero.topRated}</span>
                </div>
              </div>

              <div className="heroDealButtonsRow">
                <button
                  type="button"
                  className="dealItineraryBtn"
                  onClick={() => {
                    const targetPkg = heroDealPackage || packages[0];
                    if (targetPkg) openItinerary(targetPkg);
                  }}
                >
                  <Compass size={14} />
                  <span>{t.hero.viewItinerary}</span>
                </button>

                <button
                  type="button"
                  className="dealBookBtn"
                  onClick={() => {
                    if (heroDealPackage && heroDealPackage.availability) {
                      void openBooking(heroDealPackage);
                    } else if (packages.length > 0) {
                      void openBooking(packages[0]);
                    } else {
                      router.push('/packages');
                    }
                  }}
                >
                  {t.hero.reserveTrip}
                  <ArrowRight
                    size={
                      17
                    }
                  />
                </button>
              </div>
            </div>
          </motion.aside>
        </div>

        {/* Live Hero Background Scene Controller */}
        <div className="heroSceneBar container">
          <div className="heroSceneLocation">
            <span className="heroScenePulseDot" />
            <span className="heroSceneCountryPill">
              <MapPin size={12} className="heroScenePin" />
              {HERO_SCENES[activeHeroVideo]?.country || 'Switzerland'}
            </span>
            <div className="heroSceneInfo">
              <span className="heroSceneLocationName">
                {HERO_SCENES[activeHeroVideo]?.location || 'Zermatt, Switzerland'}
              </span>
              <span className="heroSceneSeparator">·</span>
              <span className="heroSceneTitle">
                {HERO_SCENES[activeHeroVideo]?.title || 'Matterhorn & Alpine Summits'}
              </span>
            </div>
          </div>

          <div className="heroSceneControls">
            <button
              type="button"
              className="heroScenePlayBtn"
              onClick={toggleHeroVideoPlayback}
              aria-label={heroVideoPlaying ? t.hero.pauseTour : t.hero.playTour}
              title={heroVideoPlaying ? t.hero.pauseTour : t.hero.playTour}
            >
              {heroVideoPlaying ? (
                <Pause size={14} />
              ) : (
                <Play size={14} fill="currentColor" />
              )}
            </button>

            <div className="heroSceneDots" role="tablist" aria-label="Select background destination scene">
              {HERO_SCENES.map((scene, idx) => {
                const isActive = activeHeroVideo === idx;
                return (
                  <button
                    key={scene.location}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`heroSceneDot${isActive ? ' heroSceneDotActive' : ''}`}
                    onClick={() => selectHeroScene(idx)}
                    title={`${scene.country} · ${scene.title}`}
                  >
                    <span className="heroSceneDotIndex">0{idx + 1}</span>
                    {isActive && (
                      <span className="heroSceneDotCountry">{scene.country}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <motion.div
          className="heroStats container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
        >
          <div
            className="stat"
          >
            <Users />

            <div>
              <strong>
                25,000+
              </strong>

              <span>
                {t.stats.curated}
              </span>
            </div>
          </div>

          <div
            className="stat"
          >
            <Star />

            <div>
              <strong>
                98%
              </strong>

              <span>
                {t.stats.satisfaction}
              </span>
            </div>
          </div>

          <div
            className="stat"
          >
            <Globe2 />

            <div>
              <strong>
                150+
              </strong>

              <span>
                {t.stats.protected}
              </span>
            </div>
          </div>

          <div
            className="stat"
          >
            <Headphones />

            <div>
              <strong>
                24/7
              </strong>

              <span>
                {t.stats.concierge}
              </span>
            </div>
          </div>
        </motion.div>
      </section>

      <section
        className="section destinationsSection"
        id="destinations"
      >
        <div className="container">
          <motion.div
            className="sectionHeading"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <span>{t.destinations.eyebrow}</span>
            <h2>{t.destinations.title}</h2>
            <p>{t.destinations.subtitle}</p>
          </motion.div>

          <div className="destinationGrid">
            {destinationsLoading && <p>Loading destinations...</p>}
            {!destinationsLoading && destinationsError && (
              <p>{destinationsError}</p>
            )}
            {!destinationsLoading && !destinationsError && homeDestinations.length === 0 && (
              <p>No destinations available.</p>
            )}
            {!destinationsLoading && !destinationsError &&
              homeDestinations.map((destination, destIdx) => (
                <motion.article
                  className="destinationCard"
                  key={destination._id}
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.5, delay: (destIdx % 4) * 0.08, ease: 'easeOut' }}
                  whileHover={{ y: -8, transition: { duration: 0.25 } }}
                >
                  <img
                    src={getDestinationImage(destination)}
                    alt={destination.name}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = '/images/globalvista-bg.png';
                    }}
                  />
                  <div className="destinationShade" />
                  <div className="destinationContent">
                    <h3>{destination.name}</h3>
                    <div className="destinationMeta">
                      <span><MapPin size={13} />{destination.country}</span>
                      <span>
                        <Star size={13} fill="currentColor" />
                        {typeof destination.rating === 'number'
                          ? destination.rating.toFixed(1)
                          : 'New'}
                      </span>
                    </div>
                    <Link
                      className="destinationBookButton"
                      href={`/packages?destinationId=${encodeURIComponent(destination._id)}&destinationName=${encodeURIComponent(destination.name)}`}
                    >
                      {t.destinations.viewBook} <ArrowRight size={13} />
                    </Link>
                  </div>
                </motion.article>
              ))}
          </div>

          <div className="centerButton">
            <Link className="outlineBtn" href="/destinations">
              {t.destinations.viewBook} <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section
        className="section destinationsSection"
        id="packages"
        style={{ paddingTop: '75px', background: '#f6f9fc' }}
      >
        <div className="container">
          <motion.div
            className="sectionHeading"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <span>EXPLORE TRAVEL PACKAGES</span>
            <h2>Discover your perfect journey</h2>
            <p>Explore premium packages carefully prepared for your next adventure.</p>
          </motion.div>

          <div className="destinationGrid">
            {packagesLoading && <p>Loading packages...</p>}
            {!packagesLoading && packagesError && <p>{packagesError}</p>}
            {!packagesLoading && !packagesError && homePackages.length === 0 && (
              <p>No packages available.</p>
            )}
            {!packagesLoading && !packagesError &&
              homePackages.map((pkg, pkgIdx) => {
                const rating = Number(pkg.reviewInfo?.averageRating || 0);
                const reviewCount = Number(pkg.reviewInfo?.totalReviews || 0);
                return (
                      <motion.article
                        className="destinationCard"
                        key={
                          pkg._id
                        }
                        initial={{ opacity: 0, y: 35 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-30px' }}
                        transition={{ duration: 0.5, delay: (pkgIdx % 4) * 0.08, ease: 'easeOut' }}
                        whileHover={{ y: -8, transition: { duration: 0.25 } }}
                      >
                        <img
                          src={getPackageImage(
                            pkg,
                          )}
                          alt={
                            pkg.title
                          }
                          onError={(
                            event,
                          ) => {
                            event.currentTarget.onerror =
                              null;

                            event.currentTarget.src =
                              fallbackImages[
                                pkg.destination
                              ] ||
                              defaultFallbackImage;
                          }}
                        />

                        <button
                          type="button"
                          className={`heartButton${savedPackageIds.includes(pkg._id) ? ' heartButtonActive' : ''}`}
                          aria-label={`Save ${pkg.title}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSavePackage(pkg._id);
                          }}
                        >
                          <Heart
                            size={17}
                            fill={savedPackageIds.includes(pkg._id) ? '#ff4d6d' : 'none'}
                            color={savedPackageIds.includes(pkg._id) ? '#ff4d6d' : 'currentColor'}
                          />
                        </button>

                        <div
                          className="destinationShade"
                        />

                        <div
                          className="destinationContent"
                        >
                          <h3>
                            {
                              pkg.title
                            }
                          </h3>

                          <div
                            className="destinationMeta"
                          >
                            <span>
                              {pkg.destination} · {pkg.duration}
                            </span>

                            <span>
                              <Star
                                size={
                                  13
                                }
                                fill="currentColor"
                              />

                              {rating >
                              0
                                ? `${rating.toFixed(
                                    1,
                                  )} (${reviewCount})`
                                : 'New'}
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
                              <span>{t.destinations.itinerary}</span>
                            </button>

                            <button
                              type="button"
                              className="destinationBookButton"
                              disabled={
                                !pkg.availability
                              }
                              onClick={() =>
                                void openBooking(
                                  pkg,
                                )
                              }
                            >
                              {pkg.availability
                                ? t.destinations.viewBook
                                : t.destinations.unavailable}

                              {pkg.availability && (
                                <ArrowRight
                                  size={
                                    13
                                  }
                                />
                              )}
                            </button>
                          </div>

                          <div
                            className="destinationPrice"
                          >
                            <small>
                              {t.destinations.from}
                            </small>

                            <strong>
                              {formatPrice(
                                pkg.price,
                              )}
                            </strong>
                          </div>
                        </div>
                      </motion.article>
                );
              })}
          </div>

          <div className="centerButton">
            <Link className="outlineBtn" href="/packages">
              View All Packages <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section
        className="experienceSection"
        id="experiences"
      >
        <div className="container">
          <motion.div
            className="sectionHeading lightHeading"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <span>
              <Sparkles size={14} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 6 }} />
              CURATED WORLD-CLASS EXPEDITIONS
            </span>

            <h2>
              Extraordinary Journeys Crafted for the Discerning Explorer
            </h2>

            <p>
              From private overwater atolls to high-altitude helicopter traverses, explore handcrafted escapes designed with white-glove concierge precision.
            </p>
          </motion.div>

          <div className="experienceGrid">
            {exclusiveExperiences.map((exp, expIdx) => {
              const BadgeIcon = exp.badgeIcon;
              return (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.5, delay: (expIdx % 3) * 0.1, ease: 'easeOut' }}
                  whileHover={{ y: -8, scale: 1.015, transition: { duration: 0.25 } }}
                  style={{ display: 'flex' }}
                >
                  <Link
                    href={`/packages?search=${encodeURIComponent(exp.searchQuery)}`}
                    className="experienceCard"
                    style={{ width: '100%' }}
                  >
                  <img
                    src={exp.image}
                    alt={exp.title}
                    className="experienceBgImage"
                  />
                  <div className="experienceGradientOverlay" />

                  <div className="experienceTopBar">
                    <span className="experienceTag">
                      <BadgeIcon size={12} />
                      {exp.tag}
                    </span>
                    <span className="experienceDuration">
                      {exp.duration}
                    </span>
                  </div>

                  <div className="experienceCardBody">
                    <span className="experienceDestination">
                      <MapPin size={12} />
                      {exp.destination}
                    </span>

                    <h3>{exp.title}</h3>

                    <p>{exp.description}</p>

                    <div className="experienceFeaturesRow">
                      {exp.features.map((feat, i) => (
                        <span key={i} className="experienceFeaturePill">
                          {feat}
                        </span>
                      ))}
                    </div>

                    <div className="experienceFooter">
                      <div className="experiencePrice">
                        <small>Starting From</small>
                        <strong>
                          {exp.price} <span>/ person</span>
                        </strong>
                      </div>

                      <span className="experienceExploreBtn">
                        Explore <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
          </div>

          <motion.div
            className="tripPlanner"
            id="planner"
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <div className="plannerTitle">
              <span className="plannerEyebrow">
                <Sparkles size={14} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 6 }} />
                INTELLIGENT EXPEDITION CURATOR
              </span>

              <h2>Where would you like your next escape to begin?</h2>

              <p className="plannerSubtitle">
                Select your preferred destination, travel season, and style. Our concierge algorithms match verified 5-star itineraries in seconds.
              </p>
            </div>

            <form onSubmit={handlePlannerSearch} className="plannerForm">
              <div className="plannerFields">
                <div className="plannerFieldGroup">
                  <div className="plannerFieldIcon">
                    <MapPin size={22} />
                  </div>
                  <div className="plannerFieldContent">
                    <label htmlFor="planner-destination-select">{t.search.selectDestination}</label>
                    <select
                      id="planner-destination-select"
                      value={plannerDestination}
                      onChange={(e) => setPlannerDestination(e.target.value)}
                      className="plannerSelect"
                    >
                      <option value="">{t.search.whereTo}</option>
                      <option value="Maldives">Maldives · Turquoise Atolls</option>
                      <option value="Switzerland">Switzerland · Alpine Summits</option>
                      <option value="Japan">Japan · Kyoto, Tokyo & Fuji</option>
                      <option value="Sri Lanka">Sri Lanka · Sigiriya & Safari</option>
                      <option value="Bali">Bali · Island Sanctuaries</option>
                      <option value="Phuket">Phuket · Private Charters</option>
                    </select>
                  </div>
                </div>

                <div className="plannerFieldGroup">
                  <div className="plannerFieldIcon">
                    <CalendarDays size={22} />
                  </div>
                  <div className="plannerFieldContent">
                    <label htmlFor="planner-season-select">{t.search.season}</label>
                    <select
                      id="planner-season-select"
                      value={plannerSeason}
                      onChange={(e) => setPlannerSeason(e.target.value)}
                      className="plannerSelect"
                    >
                      <option value="">{t.search.allSeasons}</option>
                      <option value="Spring">{t.search.spring}</option>
                      <option value="Summer">{t.search.summer}</option>
                      <option value="Autumn">{t.search.autumn}</option>
                      <option value="Winter">{t.search.winter}</option>
                    </select>
                  </div>
                </div>

                <div className="plannerFieldGroup">
                  <div className="plannerFieldIcon">
                    <Compass size={22} />
                  </div>
                  <div className="plannerFieldContent">
                    <label htmlFor="planner-style-select">{t.search.style}</label>
                    <select
                      id="planner-style-select"
                      value={plannerStyle}
                      onChange={(e) => setPlannerStyle(e.target.value)}
                      className="plannerSelect"
                    >
                      <option value="">{t.search.allStyles}</option>
                      <option value="Luxury">{t.search.luxury}</option>
                      <option value="Adventure">{t.search.adventure}</option>
                      <option value="Culture">{t.search.culture}</option>
                      <option value="Honeymoon">{t.search.honeymoon}</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="searchTripBtn">
                  <Search size={20} />
                  <span>{t.search.findBtn}</span>
                </button>
              </div>
            </form>

            <div className="plannerGuarantees">
              <div className="guaranteeItem">
                <ShieldCheck size={20} className="guaranteeIcon" />
                <div>
                  <strong>100% Verified Five-Star</strong>
                  <span>Every boutique resort & villa personally inspected</span>
                </div>
              </div>

              <div className="guaranteeItem">
                <Headphones size={20} className="guaranteeIcon" />
                <div>
                  <strong>24/7 Dedicated Concierge</strong>
                  <span>Direct WhatsApp & phone assistance anywhere</span>
                </div>
              </div>

              <div className="guaranteeItem">
                <Gift size={20} className="guaranteeIcon" />
                <div>
                  <strong>Tailor-Made Itineraries</strong>
                  <span>Fully bespoke to your dates & party size</span>
                </div>
              </div>

              <div className="guaranteeItem">
                <CreditCard size={20} className="guaranteeIcon" />
                <div>
                  <strong>Instant Travel Invoicing</strong>
                  <span>Official PDF vouchers & secure checkout</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section
        className="section offersSection"
        id="offers"
      >
        <div
          className="container"
        >
          <motion.div
            className="sectionHeading"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <span>
              {t.offers.eyebrow}
            </span>

            <h2>
              {t.offers.title}
            </h2>

            <p>
              {t.offers.subtitle}
            </p>
          </motion.div>

          <div
            className="destinationGrid"
          >
            {packagesLoading && (
              <p
                style={{
                  gridColumn:
                    '1 / -1',

                  textAlign:
                    'center',
                }}
              >
                Loading special offers...
              </p>
            )}

            {!packagesLoading &&
              packagesError && (
                <p
                  style={{
                    gridColumn:
                      '1 / -1',

                    textAlign:
                      'center',
                  }}
                >
                  {
                    packagesError
                  }
                </p>
              )}

            {!packagesLoading &&
              !packagesError &&
              specialOffers.length ===
                0 && (
                <p
                  style={{
                    gridColumn:
                      '1 / -1',

                    textAlign:
                      'center',
                  }}
                >
                  No special offers available right now.
                </p>
              )}

            {!packagesLoading &&
              !packagesError &&
              specialOffers.map(
                (
                  pkg,
                  offerIdx,
                ) => {
                  const rating =
                    Number(
                      pkg.reviewInfo
                        ?.averageRating ||
                        0,
                    );

                  const reviewCount =
                    Number(
                      pkg.reviewInfo
                        ?.totalReviews ||
                        0,
                    );

                  const originalPrice =
                    Number(
                      pkg.originalPrice ||
                        0,
                    );

                  const calculatedDiscount =
                    originalPrice >
                    pkg.price
                      ? Math.round(
                          (
                            (
                              originalPrice -
                              pkg.price
                            ) /
                            originalPrice
                          ) *
                            100,
                        )
                      : 0;

                  const discount =
                    Number(
                      pkg.discountPercentage ||
                        calculatedDiscount,
                    );

                  return (
                    <motion.article
                      className="destinationCard specialOfferDestinationCard"
                      key={
                        pkg._id
                      }
                      initial={{ opacity: 0, y: 35 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-30px' }}
                      transition={{ duration: 0.5, delay: (offerIdx % 4) * 0.08, ease: 'easeOut' }}
                      whileHover={{ y: -8, transition: { duration: 0.25 } }}
                    >
                      <img
                        src={getPackageImage(
                          pkg,
                        )}
                        alt={
                          pkg.title
                        }
                        onError={(
                          event,
                        ) => {
                          event.currentTarget.onerror =
                            null;

                          event.currentTarget.src =
                            fallbackImages[
                              pkg.destination
                            ] ||
                            defaultFallbackImage;
                        }}
                      />

                      <button
                        type="button"
                        className={`heartButton${savedPackageIds.includes(pkg._id) ? ' heartButtonActive' : ''}`}
                        aria-label={`Save ${pkg.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSavePackage(pkg._id);
                        }}
                      >
                        <Heart
                          size={17}
                          fill={savedPackageIds.includes(pkg._id) ? '#ff4d6d' : 'none'}
                          color={savedPackageIds.includes(pkg._id) ? '#ff4d6d' : 'currentColor'}
                        />
                      </button>

                      {discount >
                        0 && (
                        <span
                          className="specialOfferBadge"
                        >
                          {
                            discount
                          }
                          % OFF
                        </span>
                      )}

                      <div
                        className="destinationShade"
                      />

                      <div
                        className="destinationContent specialOfferContent"
                      >
                        <h3>
                          {
                            pkg.title
                          }
                        </h3>

                        <div
                          className="destinationMeta"
                        >
                          <span>
                            <Clock3
                              size={
                                13
                              }
                            />

                            {pkg.duration ||
                              'Duration not set'}
                          </span>

                          <span>
                            <Star
                              size={
                                13
                              }
                              fill="currentColor"
                            />

                            {rating >
                            0
                              ? `${rating.toFixed(
                                  1,
                                )} (${reviewCount})`
                              : 'New'}
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
                            <span>{t.destinations.itinerary}</span>
                          </button>

                          <button
                            type="button"
                            className="destinationBookButton"
                            disabled={
                              !pkg.availability
                            }
                            onClick={() =>
                              void openBooking(
                                pkg,
                              )
                            }
                          >
                            {pkg.availability
                              ? t.offers.bookNow
                              : t.destinations.unavailable}

                            {pkg.availability && (
                              <ArrowRight
                                size={
                                  13
                                }
                              />
                            )}
                          </button>
                        </div>

                        <div
                          className="destinationPrice specialOfferPrice"
                        >
                          {originalPrice >
                            pkg.price && (
                            <del>
                              {formatPrice(
                                originalPrice,
                              )}
                            </del>
                          )}

                          <strong>
                            {formatPrice(
                              pkg.price,
                            )}
                          </strong>
                        </div>
                      </div>
                    </motion.article>
                  );
                },
              )}
          </div>
        </div>
      </section>

      <motion.section
        className="videoBanner container"
        initial={{ opacity: 0, scale: 0.96, y: 30 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <video
          className="videoBannerVideo"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          <source
            src="/videos/globalvista-adventure-banner.mp4"
            type="video/mp4"
          />
        </video>

        <div
          className="videoBannerOverlay"
        />

        <div
          className="videoBannerText"
        >
          <span>
            Your next adventure
          </span>

          <h2>
            starts right here.
          </h2>
        </div>

        <div
          className="videoBannerRight"
        >
          Discover incredible destinations

          <br />

          and unforgettable experiences.
        </div>
      </motion.section>

      <section
        className="section reviewsSection"
        id="reviews"
      >
        <div className="container">
          <motion.div
            className="sectionHeading reviewsSectionHeading"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <span className="reviewsEyebrow">
              <Sparkles size={14} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 6 }} />
              {t.reflections.eyebrow}
            </span>
            <h2>{t.reflections.title}</h2>
            <p className="reviewsSubheading">
              {t.reflections.subtitle}
            </p>

            {/* Lansakara-style Summary Bar */}
            <div className="reviewsSummaryBar">
              <div className="reviewsScorePill">
                <span className="goldStars">★★★★★</span>
                <span className="scoreText">4.9 / 5.0 Rating</span>
                <span className="scoreCount">· 1,420+ Verified Explorers</span>
              </div>

              <button
                type="button"
                className={`btnWriteReview ${hasSubmittedReview ? 'submitted' : ''}`}
                onClick={() => {
                  if (currentUser?.name) {
                    setFormReviewerName(currentUser.name);
                  }
                  if (currentUser?.email) {
                    setFormReviewerEmail(currentUser.email);
                  }
                  setIsReviewModalOpen(true);
                }}
              >
                <Sparkles size={15} />
                {hasSubmittedReview ? '✓ Review Shared' : t.reflections.shareExperience}
              </button>
            </div>
          </motion.div>

          {/* Lansakara-style Testimonials Slider Controls & Track */}
          <motion.div
            className="sliderControlsWrap"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
            onMouseEnter={() => setIsReviewHovered(true)}
            onMouseLeave={() => setIsReviewHovered(false)}
          >
            <button
              type="button"
              className="sliderArrowBtn sliderArrowPrev"
              onClick={() =>
                setActiveReviewIdx((prev) => (prev - 1 + displayReviews.length) % displayReviews.length)
              }
              aria-label="Previous Review"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              className="sliderArrowBtn sliderArrowNext"
              onClick={() =>
                setActiveReviewIdx((prev) => (prev + 1) % displayReviews.length)
              }
              aria-label="Next Review"
            >
              <ChevronRight size={20} />
            </button>

            <div className="testimonialsSlider">
              <div
                className="testimonialsTrack"
                style={{ transform: `translateX(-${activeReviewIdx * 100}%)` }}
              >
                {displayReviews.map((r, i) => (
                  <div key={r._id || i} className="testimonialItem">
                    <div className="testimonialCardInner">
                      <div className="testimonialStars">
                        {'★'.repeat(r.rating || 5)}{'☆'.repeat(5 - (r.rating || 5))}
                      </div>

                      <div className="testimonialQuoteIcon">“</div>

                      <p className="testimonialQuote">{r.comment}</p>

                      <div className="testimonialAuthorMeta">
                        <div className="testimonialAvatar">
                          {r.name?.charAt(0).toUpperCase() || 'E'}
                        </div>

                        <div className="testimonialAuthorDetails">
                          <div className="testimonialAuthorName">
                            {r.name}
                            <span className="verifiedBadge">
                              <CheckCircle2 size={12} /> {t.reflections.verifiedTraveller}
                            </span>
                          </div>

                          <div className="testimonialLocation">
                            {r.country || 'Global Traveller'}
                            {r.packageTitle && (
                              <span className="testimonialPackageTag">
                                {' · '}{r.packageTitle}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Slider Dots */}
            <div className="testimonialsDots">
              {displayReviews.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`testDot ${i === activeReviewIdx ? 'active' : ''}`}
                  onClick={() => setActiveReviewIdx(i)}
                  aria-label={`Go to review ${i + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Lansakara-style Interactive Review Modal */}
        {isReviewModalOpen && (
          <div className="reviewModalOverlay" onClick={() => setIsReviewModalOpen(false)}>
            <div className="reviewModal" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="reviewModalClose"
                onClick={() => setIsReviewModalOpen(false)}
                aria-label="Close review modal"
              >
                <X size={20} />
              </button>

              <div className="reviewModalHeader">
                <span className="reviewModalEyebrow">
                  <Sparkles size={13} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4 }} />
                  DISCERNING TRAVEL REFLECTIONS
                </span>
                <h3 className="reviewModalTitle">Share Your Expedition Experience</h3>
                <p className="reviewModalSub">
                  Your impressions inspire fellow travellers seeking world-class luxury journeys.
                </p>
              </div>

              {reviewAlert.text && (
                <div className={`reviewModalAlert ${reviewAlert.type === 'success' ? 'alertSuccess' : 'alertError'}`}>
                  {reviewAlert.text}
                </div>
              )}

              <form onSubmit={handleReviewSubmit}>
                {/* Star Selector */}
                <div className="reviewFormGroup">
                  <label>Overall Experience Rating *</label>
                  <div className="reviewStarSelector">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`modalStar ${star <= (hoverRating || reviewRating) ? 'active' : ''}`}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setReviewRating(star)}
                      >
                        ★
                      </span>
                    ))}
                    <span className="starLabelDesc">
                      {reviewRating === 5 && '5 Stars · Flawless Luxury'}
                      {reviewRating === 4 && '4 Stars · Wonderful Journey'}
                      {reviewRating === 3 && '3 Stars · Good Expedition'}
                      {reviewRating === 2 && '2 Stars · Fair Experience'}
                      {reviewRating === 1 && '1 Star · Needs Improvement'}
                    </span>
                  </div>
                </div>

                <div className="reviewFormRow">
                  <div className="reviewFormGroup">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      className="reviewFormInput"
                      placeholder="e.g. Elena Rostova"
                      value={formReviewerName}
                      onChange={(e) => setFormReviewerName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="reviewFormGroup">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      className="reviewFormInput"
                      placeholder="name@example.com"
                      value={formReviewerEmail}
                      onChange={(e) => setFormReviewerEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="reviewFormRow">
                  <div className="reviewFormGroup">
                    <label>Country / Residence</label>
                    <input
                      type="text"
                      className="reviewFormInput"
                      placeholder="e.g. London, United Kingdom"
                      value={formReviewerCountry}
                      onChange={(e) => setFormReviewerCountry(e.target.value)}
                    />
                  </div>

                  <div className="reviewFormGroup">
                    <label>Expedition / Destination *</label>
                    <input
                      type="text"
                      className="reviewFormInput"
                      placeholder="e.g. Maldives Luxury Escape"
                      value={formReviewerDestination}
                      onChange={(e) => setFormReviewerDestination(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="reviewFormGroup">
                  <label>Your Impressions & Travel Reflection *</label>
                  <textarea
                    className="reviewFormTextarea"
                    rows={4}
                    placeholder="Describe your itinerary highlights, boutique accommodations, concierge support, and unforgettable moments..."
                    value={formReviewerComment}
                    onChange={(e) => setFormReviewerComment(e.target.value)}
                    required
                  />
                </div>

                <div className="reviewModalActions">
                  <button
                    type="button"
                    className="btnReviewCancel"
                    onClick={() => setIsReviewModalOpen(false)}
                    disabled={submittingReview}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btnReviewSubmit"
                    disabled={submittingReview}
                  >
                    {submittingReview ? (
                      'Publishing Review...'
                    ) : (
                      <>
                        <Send size={15} /> Publish Review
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>

      <section
        className="section plansSection"
        id="plans"
      >
        <div
          className="container"
        >
          <motion.div
            className="sectionHeading"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <span>
              {t.plans.eyebrow}
            </span>

            <h2>
              {t.plans.title}
            </h2>
          </motion.div>

          <motion.div
            className="plansLayout"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
          >
            <div
              className="plansGrid"
            >
              {travelPlansLoading && (
                <p
                  style={{
                    gridColumn:
                      '1 / -1',
                    textAlign:
                      'center',
                  }}
                >
                  Loading travel plans...
                </p>
              )}

              {!travelPlansLoading &&
                travelPlansError && (
                  <p
                    style={{
                      gridColumn:
                        '1 / -1',
                      textAlign:
                        'center',
                    }}
                  >
                    {
                      travelPlansError
                    }
                  </p>
                )}

              {!travelPlansLoading &&
                !travelPlansError &&
                travelPlans.length ===
                  0 && (
                  <p
                    style={{
                      gridColumn:
                        '1 / -1',
                      textAlign:
                        'center',
                    }}
                  >
                    No travel plans available.
                  </p>
                )}

              {!travelPlansLoading &&
                !travelPlansError &&
                travelPlans.map(
                  (
                    plan,
                  ) => (
                    <article
                      key={
                        plan._id
                      }
                      className={`planCard${
                        plan.isPopular
                          ? ' featuredPlan'
                          : ''
                      }`}
                    >
                      {plan.isPopular && (
                        <div
                          className="popularBadge"
                        >
                          {t.plans.popular}
                        </div>
                      )}

                      <span>
                        {
                          plan.name
                        }
                      </span>

                      <h3>
                        $
                        {formatMoney(
                          plan.price,
                        )}{' '}

                        <small>
                          {
                            plan.priceSuffix
                          }
                        </small>
                      </h3>

                      <ul>
                        {plan.features.map(
                          (
                            feature,
                            index,
                          ) => (
                            <li
                              key={`${plan._id}-${index}`}
                            >
                              <Check
                                size={
                                  16
                                }
                              />

                              {
                                feature
                              }
                            </li>
                          ),
                        )}
                      </ul>

                      <button
                        type="button"
                        aria-pressed={
                          selectedTravelPlanId ===
                          plan._id
                        }
                        onClick={() =>
                          handleSelectTravelPlan(
                            plan,
                          )
                        }
                        style={
                          selectedTravelPlanId ===
                          plan._id
                            ? {
                                borderColor:
                                  '#268ef3',
                                background:
                                  '#268ef3',
                                color:
                                  '#ffffff',
                              }
                            : undefined
                        }
                      >
                        {selectedTravelPlanId ===
                        plan._id
                          ? 'Selected'
                          : t.plans.selectPlan}
                      </button>
                    </article>
                  ),
                )}
            </div>

            <div
              className="faqBox"
            >
              <span>
                FREQUENTLY ASKED
              </span>

              {FAQ_ITEMS.map(
                (
                  item,
                  index,
                ) => {
                  const isOpen =
                    openFaqIndex ===
                    index;

                  return (
                    <div
                      key={
                        item.question
                      }
                    >
                      <button
                        type="button"
                        aria-expanded={
                          isOpen
                        }
                        onClick={() =>
                          toggleFaq(
                            index,
                          )
                        }
                      >
                        {
                          item.question
                        }

                        <ChevronRight
                          size={
                            17
                          }
                          style={{
                            transition:
                              'transform 0.2s ease',
                            transform:
                              isOpen
                                ? 'rotate(90deg)'
                                : 'rotate(0deg)',
                          }}
                        />
                      </button>

                      {isOpen && (
                        <p
                          style={{
                            margin:
                              '0',
                            padding:
                              '10px 0 16px',
                            color:
                              '#63767e',
                            fontSize:
                              '12px',
                            lineHeight:
                              1.65,
                            borderBottom:
                              '1px solid #edf2f4',
                          }}
                        >
                          {
                            item.answer
                          }
                        </p>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          </motion.div>

          <motion.div
            className="worldExplore"
            id="global-map"
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <div
              className="worldExploreCopy"
            >
              <span>
                EXPLORE THE WORLD
              </span>

              <h2>
                Your dream destination is waiting.
              </h2>

              <p>
                Explore real GlobalVista destinations on the map.
                Every marker is loaded from destination data saved
                by the admin.
              </p>

              <a
                href="#destinations"
              >
                Explore Destinations

                <ArrowRight
                  size={
                    17
                  }
                />
              </a>
            </div>

            <div
              className="worldVisual worldVisualRealMap"
            >
              <DestinationWorldMap />
            </div>
          </motion.div>
        </div>
      </section>

      {/* AESTHETIC DESTINATION SCRAPBOOK GALLERY & MOODBOARD */}
      <section className="section gallerySection" id="gallery">
        <div className="container">
          <motion.div
            className="sectionHeading gallerySectionHeading"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <span className="galleryEyebrow">
              <Compass size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
              CURATED VISUAL SCRAPBOOK · AROUND THE WORLD
            </span>
            <h2>Moments Captured in Paradise</h2>
            <p>
              A live aesthetic moodboard of unforgettable horizons. Every snapshot is dynamically curated from our verified destination sanctuaries.
            </p>
          </motion.div>

          {/* Aesthetic Scrapbook Banner (Inspired by User's Reference Collage) */}
          <motion.div
            className="galleryMoodboardBanner"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <div className="scrapbookBadge leftBadge">
              <span className="badgeTicketNum">№ 146017</span>
              <strong>TICKET TO ANYWHERE</strong>
              <small>Worldwide Boarding Pass</small>
            </div>
            <div className="scrapbookPoster">
              <span className="posterQuote">“Travel is the only thing you buy that makes you richer.”</span>
              <h3 className="posterJustGo">JUST GO.</h3>
              <span className="posterSub">GLOBALVISTA EXPLORER JOURNAL</span>
            </div>
            <div className="scrapbookBadge rightBadge">
              <span className="badgeTicketNum">№ 0045672</span>
              <strong>AROUND THE WORLD</strong>
              <small>Official Passport Stamped</small>
            </div>
          </motion.div>

          {/* Dynamic Country Filter Pills */}
          <div className="galleryFilterBar">
            <button
              type="button"
              className={`galleryFilterPill ${activeGalleryCountry === 'ALL' ? 'galleryFilterPillActive' : ''}`}
              onClick={() => setActiveGalleryCountry('ALL')}
            >
              All Snapshots ({destinations.length})
            </button>
            {galleryCountries.map((c) => (
              <button
                key={c}
                type="button"
                className={`galleryFilterPill ${activeGalleryCountry.toLowerCase() === c.toLowerCase() ? 'galleryFilterPillActive' : ''}`}
                onClick={() => setActiveGalleryCountry(c)}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Polaroid & Torn Paper Moodboard Display */}
          {destinationsLoading && (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>
              Curating destination moodboard...
            </p>
          )}

          {!destinationsLoading && (
            <div className="tornScrapbookContainer">
              <motion.div
                className="tornScrapbookBoard"
                initial={{ opacity: 0, scale: 0.96, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.65, ease: 'easeOut' }}
              >
                {/* Background Watercolor Washes */}
                <div className="scrapbookWatercolorWash" />

                {/* Top Right "Travel Guide" handwritten script */}
                <div className="scrapbookTravelGuideHeading">
                  <span className="travelGuideScript">Travel</span>
                  <span className="travelGuideScriptSub">Guide</span>
                  <svg className="travelGuideSwash" viewBox="0 0 160 24" fill="none">
                    <path
                      d="M4 14C35 4 85 4 156 16M45 18C75 12 110 12 145 20"
                      stroke="#0f172a"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {/* Slot 1: Top-Left Cove/Azure Bay */}
                {collageSlots[0] && (
                  <div
                    className="tornSlot tornSlot1"
                    onClick={() => setSelectedGalleryDestination(collageSlots[0])}
                    title={`View ${collageSlots[0].name}`}
                  >
                    <div className="tornSlotInner">
                      <img
                        src={getDestinationImage(collageSlots[0])}
                        alt={collageSlots[0].name}
                        className="tornSlotImg"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/images/default-travel.jpg';
                        }}
                      />
                      <div className="tornSlotHoverOverlay">
                        <span className="tornSlotHoverTitle">{collageSlots[0].name}</span>
                        <span className="tornSlotHoverMeta">
                          <MapPin size={10} /> {collageSlots[0].country}
                        </span>
                        <span className="tornSlotHoverBtn">
                          <Eye size={11} /> Inspect
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Slot 2: Upper-Middle Coastal Town & Bay */}
                {collageSlots[1] && (
                  <div
                    className="tornSlot tornSlot2"
                    onClick={() => setSelectedGalleryDestination(collageSlots[1])}
                    title={`View ${collageSlots[1].name}`}
                  >
                    <div className="tornSlotInner">
                      <img
                        src={getDestinationImage(collageSlots[1])}
                        alt={collageSlots[1].name}
                        className="tornSlotImg"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/images/default-travel.jpg';
                        }}
                      />
                      <div className="tornSlotHoverOverlay">
                        <span className="tornSlotHoverTitle">{collageSlots[1].name}</span>
                        <span className="tornSlotHoverMeta">
                          <MapPin size={10} /> {collageSlots[1].country}
                        </span>
                        <span className="tornSlotHoverBtn">
                          <Eye size={11} /> Inspect
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sticker 1: Airplane taking off with palm & sunburst */}
                <div className="scrapbookSticker stickerPlane">
                  <svg viewBox="0 0 120 120" className="stickerSvg">
                    <defs>
                      <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#ea580c" stopOpacity="0.95" />
                      </radialGradient>
                    </defs>
                    <circle cx="48" cy="76" r="32" fill="url(#sunGrad)" />
                    <path
                      d="M48 38 L48 44 M48 108 L48 114 M16 76 L22 76 M74 76 L80 76 M25 53 L29 57 M67 95 L71 99 M25 99 L29 95 M67 57 L71 53"
                      stroke="#fed7aa"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M22 92 C24 78 35 68 46 64 C38 66 30 72 26 82 C28 72 38 64 50 62 C40 62 32 68 28 76"
                      stroke="#047857"
                      strokeWidth="3.2"
                      fill="none"
                      strokeLinecap="round"
                      opacity="0.75"
                    />
                    <g transform="translate(32, 22) rotate(-35 30 30)">
                      <path
                        d="M30 4 L34 26 L52 38 L52 44 L34 38 L34 52 L42 58 L42 62 L30 59 L18 62 L18 58 L26 52 L26 38 L8 44 L8 38 L26 26 Z"
                        fill="rgba(0,0,0,0.22)"
                        transform="translate(3, 4)"
                      />
                      <path
                        d="M30 4 L34 26 L52 38 L52 44 L34 38 L34 52 L42 58 L42 62 L30 59 L18 62 L18 58 L26 52 L26 38 L8 44 L8 38 L26 26 Z"
                        fill="#ffffff"
                        stroke="#cbd5e1"
                        strokeWidth="1"
                      />
                      <path d="M30 6 L30 58" stroke="#0284c7" strokeWidth="1.2" opacity="0.6" />
                      <circle cx="30" cy="12" r="1.5" fill="#0284c7" />
                    </g>
                  </svg>
                </div>

                {/* Sticker 2: Red 4x4 Overland Camper Jeep */}
                <div className="scrapbookSticker stickerJeep">
                  <svg viewBox="0 0 140 100" className="stickerSvg">
                    <path
                      d="M12 28 Q45 8 80 20 T132 40"
                      stroke="#f97316"
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                      fill="none"
                    />
                    <circle cx="14" cy="28" r="4" fill="#ea580c" stroke="#ffffff" strokeWidth="1.5" />
                    <circle cx="132" cy="40" r="4" fill="#ea580c" stroke="#ffffff" strokeWidth="1.5" />
                    <circle cx="75" cy="58" r="34" fill="#065f46" opacity="0.88" />
                    <g transform="translate(35, 34)">
                      <rect x="18" y="2" width="40" height="8" rx="2" fill="#d97706" />
                      <rect x="22" y="6" width="32" height="4" rx="1" fill="#78350f" />
                      <path d="M14 10 L58 10 L68 24 L72 28 L72 38 L6 38 L6 26 Z" fill="#dc2626" />
                      <path d="M18 14 L36 14 L36 24 L16 24 Z" fill="#93c5fd" opacity="0.9" />
                      <path d="M40 14 L56 14 L64 24 L40 24 Z" fill="#93c5fd" opacity="0.9" />
                      <rect x="4" y="36" width="70" height="7" rx="2" fill="#1e293b" />
                      <circle cx="72" cy="32" r="2.5" fill="#fef08a" />
                      <circle cx="20" cy="44" r="9" fill="#0f172a" />
                      <circle cx="20" cy="44" r="4" fill="#94a3b8" />
                      <circle cx="58" cy="44" r="9" fill="#0f172a" />
                      <circle cx="58" cy="44" r="4" fill="#94a3b8" />
                    </g>
                  </svg>
                </div>

                {/* Slot 3: Middle-Left Fortified Coastal Town */}
                {collageSlots[2] && (
                  <div
                    className="tornSlot tornSlot3"
                    onClick={() => setSelectedGalleryDestination(collageSlots[2])}
                    title={`View ${collageSlots[2].name}`}
                  >
                    <div className="tornSlotInner">
                      <img
                        src={getDestinationImage(collageSlots[2])}
                        alt={collageSlots[2].name}
                        className="tornSlotImg"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/images/default-travel.jpg';
                        }}
                      />
                      <div className="tornSlotHoverOverlay">
                        <span className="tornSlotHoverTitle">{collageSlots[2].name}</span>
                        <span className="tornSlotHoverMeta">
                          <MapPin size={10} /> {collageSlots[2].country}
                        </span>
                        <span className="tornSlotHoverBtn">
                          <Eye size={11} /> Inspect
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sticker 3: Retro Camera with Starburst and "explore" */}
                <div className="scrapbookSticker stickerCamera">
                  <svg viewBox="0 0 120 100" className="stickerSvg">
                    <path d="M25 80 Q60 55 95 80" stroke="#f59e0b" strokeWidth="5" fill="none" opacity="0.8" />
                    <path d="M32 86 Q60 65 88 86" stroke="#fbbf24" strokeWidth="3" fill="none" opacity="0.8" />
                    <g transform="translate(25, 20)">
                      <rect x="0" y="10" width="70" height="46" rx="8" fill="#334155" />
                      <rect x="4" y="14" width="62" height="38" rx="5" fill="#475569" />
                      <rect x="10" y="4" width="16" height="8" rx="2" fill="#64748b" />
                      <circle cx="56" cy="18" r="4" fill="#f87171" />
                      <circle cx="35" cy="33" r="16" fill="#1e293b" stroke="#cbd5e1" strokeWidth="2.5" />
                      <circle cx="35" cy="33" r="10" fill="#0284c7" />
                      <circle cx="32" cy="30" r="3" fill="#ffffff" opacity="0.8" />
                      <g transform="translate(46, 26)">
                        <rect
                          x="0"
                          y="0"
                          width="46"
                          height="18"
                          rx="3"
                          fill="#f8fafc"
                          stroke="#cbd5e1"
                          strokeWidth="1"
                        />
                        <text
                          x="23"
                          y="13"
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="800"
                          fontStyle="italic"
                          fill="#0f172a"
                          letterSpacing="0.5"
                        >
                          explore
                        </text>
                      </g>
                    </g>
                  </svg>
                </div>

                {/* Slot 4: Middle-Right Vertical Emerald Canyon / Adventure */}
                {collageSlots[3] && (
                  <div
                    className="tornSlot tornSlot4"
                    onClick={() => setSelectedGalleryDestination(collageSlots[3])}
                    title={`View ${collageSlots[3].name}`}
                  >
                    <div className="tornSlotInner">
                      <img
                        src={getDestinationImage(collageSlots[3])}
                        alt={collageSlots[3].name}
                        className="tornSlotImg"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/images/default-travel.jpg';
                        }}
                      />
                      <div className="tornSlotHoverOverlay">
                        <span className="tornSlotHoverTitle">{collageSlots[3].name}</span>
                        <span className="tornSlotHoverMeta">
                          <MapPin size={10} /> {collageSlots[3].country}
                        </span>
                        <span className="tornSlotHoverBtn">
                          <Eye size={11} /> Inspect
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Slot 5: Lower-Center Cascading Waterfalls */}
                {collageSlots[4] && (
                  <div
                    className="tornSlot tornSlot5"
                    onClick={() => setSelectedGalleryDestination(collageSlots[4])}
                    title={`View ${collageSlots[4].name}`}
                  >
                    <div className="tornSlotInner">
                      <img
                        src={getDestinationImage(collageSlots[4])}
                        alt={collageSlots[4].name}
                        className="tornSlotImg"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/images/default-travel.jpg';
                        }}
                      />
                      <div className="tornSlotHoverOverlay">
                        <span className="tornSlotHoverTitle">{collageSlots[4].name}</span>
                        <span className="tornSlotHoverMeta">
                          <MapPin size={10} /> {collageSlots[4].country}
                        </span>
                        <span className="tornSlotHoverBtn">
                          <Eye size={11} /> Inspect
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sticker 4: Origami Boat & Nautical Compass Stamp */}
                <div className="scrapbookSticker stickerBoat">
                  <svg viewBox="0 0 140 100" className="stickerSvg">
                    <path
                      d="M30 76 Q45 70 60 76 T90 76 T120 76"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d="M40 83 Q55 77 70 83 T100 83 T130 83"
                      stroke="#0284c7"
                      strokeWidth="1.8"
                      fill="none"
                      strokeLinecap="round"
                      opacity="0.7"
                    />
                    <g transform="translate(74, 20) rotate(8)">
                      <rect
                        x="0"
                        y="0"
                        width="42"
                        height="42"
                        fill="#fffbeb"
                        stroke="#d97706"
                        strokeWidth="1.2"
                        strokeDasharray="3 2"
                      />
                      <circle cx="21" cy="21" r="14" fill="none" stroke="#1d4ed8" strokeWidth="1.2" />
                      <path d="M21 9 L24 21 L21 33 L18 21 Z" fill="#1d4ed8" />
                      <path d="M9 21 L21 24 L33 21 L21 18 Z" fill="#93c5fd" />
                      <text x="21" y="6" textAnchor="middle" fontSize="6" fontWeight="900" fill="#1d4ed8">
                        N
                      </text>
                    </g>
                    <g transform="translate(18, 28) rotate(-4)">
                      <polygon points="10,42 22,54 58,54 70,42" fill="#334155" />
                      <polygon points="10,42 40,46 70,42" fill="#1e293b" />
                      <polygon points="40,12 40,46 62,42" fill="#475569" />
                      <polygon points="40,12 18,42 40,46" fill="#64748b" />
                    </g>
                  </svg>
                </div>

                {/* Bottom-Left Big Country Title & Website (Matching Reference) */}
                <div className="scrapbookHeroTitleBlock">
                  <motion.h3
                    key={activeGalleryCountry}
                    className="scrapbookCountryTitle"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {activeGalleryCountry === 'ALL' ? 'Croatia' : activeGalleryCountry}
                  </motion.h3>
                  <span className="scrapbookCountryUrl">
                    {activeGalleryCountry === 'ALL'
                      ? 'www.explore-croatia.net'
                      : `www.explore-${activeGalleryCountry.toLowerCase().replace(/[^a-z0-9]/g, '')}.net`}
                  </span>
                </div>

                {/* Slot 6: Bottom-Right Hilltop Terracotta Village */}
                {collageSlots[5] && (
                  <div
                    className="tornSlot tornSlot6"
                    onClick={() => setSelectedGalleryDestination(collageSlots[5])}
                    title={`View ${collageSlots[5].name}`}
                  >
                    <div className="tornSlotInner">
                      <img
                        src={getDestinationImage(collageSlots[5])}
                        alt={collageSlots[5].name}
                        className="tornSlotImg"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/images/default-travel.jpg';
                        }}
                      />
                      <div className="tornSlotHoverOverlay">
                        <span className="tornSlotHoverTitle">{collageSlots[5].name}</span>
                        <span className="tornSlotHoverMeta">
                          <MapPin size={10} /> {collageSlots[5].country}
                        </span>
                        <span className="tornSlotHoverBtn">
                          <Eye size={11} /> Inspect
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </div>
      </section>

      <motion.section
        className="finalCta"
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <div
          className="finalCtaOverlay"
        />

        <div
          className="container finalCtaContent"
        >
          <div>
            <span>
              YOUR NEXT PARADISE
            </span>

            <h2>
              is waiting for you.
            </h2>

            <p>
              Book today and unlock extraordinary travel
              experiences.
            </p>
          </div>

          <div
            className="finalButtons"
          >
            <a
              href="#planner"
            >
              Plan Your Trip

              <ArrowRight
                size={
                  17
                }
              />
            </a>

            <button
              type="button"
            >
              <Headphones
                size={
                  17
                }
              />

              Talk to an Expert
            </button>
          </div>
        </div>
      </motion.section>

      <footer
        className="gvFooter"
      >
        <div
          className="container gvFooterMain"
        >
          <div
            className="gvFooterBrand"
          >
            <a
              href="#"
              className="gvFooterLogo"
            >
              Global

              <span>
                Vista
              </span>
            </a>

            <h3>
              Travel Further.

              <br />

              Live More.
            </h3>

            <p>
              Discover unforgettable destinations,
              premium travel experiences and
              journeys designed around you.
            </p>

            <div className="gvFooterSocials">
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                title="Facebook"
                className="gvSocialIcon gvFacebook"
              >
                <FaFacebookF size={19} />
              </a>

              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                title="Instagram"
                className="gvSocialIcon gvInstagram"
              >
                <FaInstagram size={21} />
              </a>

              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                title="LinkedIn"
                className="gvSocialIcon gvLinkedin"
              >
                <FaLinkedinIn size={19} />
              </a>

              <a
                href="mailto:info@globalvista.com"
                aria-label="Email"
                title="Email"
                className="gvSocialIcon gvEmail"
              >
                <SiGmail size={20} />
              </a>
            </div>
          </div>

          <div
            className="gvFooterLinks"
          >
            <div
              className="gvFooterColumn"
            >
              <h4>
                EXPLORE
              </h4>

              <a
                href="#destinations"
              >
                Destinations
              </a>

              <a
                href="#experiences"
              >
                Experiences
              </a>

              <a
                href="#offers"
              >
                Special Offers
              </a>

              <a
                href="#reviews"
              >
                Reviews
              </a>
            </div>

            <div
              className="gvFooterColumn"
            >
              <h4>
                COMPANY
              </h4>

              <a
                href="#"
              >
                About Us
              </a>

              <a
                href="#plans"
              >
                Travel Plans
              </a>

              <a
                href="#"
              >
                Careers
              </a>

              <a
                href="#contact"
              >
                Contact
              </a>
            </div>

            <div
              className="gvFooterColumn"
            >
              <h4>
                SUPPORT
              </h4>

              <a
                href="#"
              >
                Help Center
              </a>

              <a
                href="#"
              >
                Booking Support
              </a>

              <a
                href="#"
              >
                Cancellation
              </a>

              <a
                href="#"
              >
                Travel Guide
              </a>
            </div>

          </div>

          <div
            className="gvFooterContact"
            id="contact"
          >
            <div
              className="gvFooterContactHeading"
            >
              <span>
                {t.footer.contactUs}
              </span>

              <h3>
                {t.footer.heading}
              </h3>
            </div>

            {footerSuccessData ? (
              <div className="gvFooterSuccessCard">
                <div className="gvFooterSuccessBadge">
                  <CheckCircle2 size={20} className="gvSuccessIcon" />
                  <span>{t.footer.inquiryReceived}</span>
                </div>
                <h4>{t.footer.thankYou}, {footerSuccessData.name}!</h4>
                <p>
                  Your VIP expedition inquiry has been received. Our concierge team will reach out to <strong>{footerSuccessData.email}</strong> within 2 hours.
                </p>
                <div className="gvFooterRefPill">
                  <span>Reference ID:</span>
                  <strong>{footerSuccessData.referenceId}</strong>
                </div>
                <div className="gvFooterSuccessActions">
                  <button
                    type="button"
                    className="gvFooterResetBtn"
                    onClick={handleResetFooterForm}
                  >
                    {t.footer.sendAnother}
                  </button>
                  <a
                    href="https://wa.me/94770000000?text=Hi%20GlobalVista%20Concierge,%20I%20have%20an%20inquiry%20regarding%20my%20trip"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gvFooterWhatsappQuick"
                  >
                    <FaWhatsapp size={14} />
                    <span>{t.footer.whatsappDesk}</span>
                  </a>
                </div>
              </div>
            ) : (
              <form
                className="gvFooterForm"
                onSubmit={handleFooterSubmit}
                noValidate
              >
                {footerError && (
                  <div className="gvFooterErrorBanner">
                    <AlertCircle size={15} />
                    <span>{footerError}</span>
                  </div>
                )}

                <div className="gvFooterInputRow">
                  <label>
                    <span>{t.footer.name} *</span>
                    <input
                      type="text"
                      placeholder={t.footer.placeholderName}
                      value={footerName}
                      onChange={(e) => {
                        setFooterName(e.target.value);
                        if (footerError) setFooterError('');
                      }}
                      disabled={footerSubmitting}
                      required
                    />
                  </label>

                  <label>
                    <span>{t.footer.email} *</span>
                    <input
                      type="email"
                      placeholder={t.footer.placeholderEmail}
                      value={footerEmail}
                      onChange={(e) => {
                        setFooterEmail(e.target.value);
                        if (footerError) setFooterError('');
                      }}
                      disabled={footerSubmitting}
                      required
                    />
                  </label>
                </div>

                <label className="gvFooterMessage">
                  <span>{t.footer.message} *</span>
                  <textarea
                    rows={4}
                    placeholder={t.footer.placeholderMessage}
                    value={footerMessage}
                    onChange={(e) => {
                      setFooterMessage(e.target.value);
                      if (footerError) setFooterError('');
                    }}
                    disabled={footerSubmitting}
                    required
                  />
                </label>

                <div className="gvFooterSubmitBar">
                  <button
                    type="submit"
                    className={`gvFooterSend ${footerSubmitting ? 'isSubmitting' : ''}`}
                    disabled={footerSubmitting}
                  >
                    {footerSubmitting ? (
                      <>
                        <Loader2 size={15} className="gvFooterSpinner" />
                        <span>{t.footer.sending}</span>
                      </>
                    ) : (
                      <>
                        <span>{t.footer.sendMessage}</span>
                        <Send size={14} />
                      </>
                    )}
                  </button>

                  <div className="gvFooterSecurityNotice">
                    <ShieldCheck size={14} />
                    <span>{t.footer.conciergeResponse}</span>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

        <div
          className="container gvFooterTrust"
        >
          <div>
            <span>
              {t.footer.secureBooking}
            </span>

            <span>
              {t.footer.premiumExperiences}
            </span>

            <span>
              {t.stats.concierge}
            </span>
          </div>

          <div
            className="gvFooterStatus"
          >
            <span
              className="gvStatusDot"
            />

            Travel services operational
          </div>
        </div>

        <div
          className="gvFooterBottom"
        >
          <div
            className="container gvFooterBottomInner"
          >
            <span>
              {t.footer.copyright}
            </span>

            <div>
              <a
                href="#"
              >
                Privacy Policy
              </a>

              <a
                href="#"
              >
                Terms of Service
              </a>

              <a
                href="#"
              >
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>

      {selectedPackage && (
        <div
          className="bookingModalOverlay"
          onMouseDown={
            closeBooking
          }
        >
          <section
            className="bookingModal"
            onMouseDown={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            <div
              className="bookingModalHeader"
            >
              <div>
                <span>
                  BOOK YOUR TRIP
                </span>

                <h2>
                  {
                    selectedPackage.title
                  }
                </h2>

                <p>
                  {
                    selectedPackage.destination
                  }

                  {' · '}

                  {
                    selectedPackage.duration
                  }
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
                onClick={
                  closeBooking
                }
                disabled={
                  bookingSubmitting
                }
              >
                <X
                  size={
                    18
                  }
                />
              </button>
            </div>

            <div
              className="bookingModalBody"
            >
              <div
                className="bookingPackageSummary"
              >
                <img
                  src={getPackageImage(
                    selectedPackage,
                  )}
                  alt={
                    selectedPackage.title
                  }
                  onError={(
                    event,
                  ) => {
                    event.currentTarget.onerror =
                      null;

                    event.currentTarget.src =
                      fallbackImages[
                        selectedPackage
                          .destination
                      ] ||
                      defaultFallbackImage;
                  }}
                />

                <div>
                  <span>
                    PACKAGE PRICE
                  </span>

                  <strong>
                    {formatPrice(
                      selectedPackage.price,
                    )}

                    {' '}

                    <small>
                      / person
                    </small>
                  </strong>
                </div>
              </div>

              <div
                className="bookingIncluded"
              >
                <div
                  className="bookingSectionTitle"
                >
                  <div>
                    <span>
                      INCLUDED FREE
                    </span>

                    <h3>
                      Package inclusions
                    </h3>
                  </div>

                  <strong>
                    {
                      selectedPackage
                        .included
                        ?.length ??
                      0
                    }

                    /6 FREE
                  </strong>
                </div>

                <div
                  className="bookingIncludedGrid"
                >
                  {(selectedPackage
                    .included ??
                    []).map(
                    (
                      item,
                      index,
                    ) => (
                      <div
                        key={`${item}-${index}`}
                      >
                        <Check
                          size={
                            14
                          }
                        />

                        <span>
                          {
                            item
                          }
                        </span>
                      </div>
                    ),
                  )}

                  {!selectedPackage
                    .included
                    ?.length && (
                    <div>
                      No free included items listed.
                    </div>
                  )}
                </div>
              </div>

              <div
                className="bookingIncluded"
              >
                <div
                  className="bookingSectionTitle"
                >
                  <div>
                    <span>
                      TRAVEL PLAN
                    </span>

                    <h3>
                      Choose your service level
                    </h3>
                  </div>

                  {selectedTravelPlan && (
                    <strong>
                      {
                        selectedTravelPlan.name
                      }
                    </strong>
                  )}
                </div>

                <label
                  style={{
                    display:
                      'grid',
                    gap:
                      '8px',
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        '12px',
                      fontWeight:
                        700,
                      color:
                        '#24343c',
                    }}
                  >
                    Selected Plan
                  </span>

                  <select
                    value={
                      selectedTravelPlanId
                    }
                    onChange={(
                      event,
                    ) =>
                      persistTravelPlanSelection(
                        event.target.value,
                      )
                    }
                    style={{
                      width:
                        '100%',
                      minHeight:
                        '46px',
                      border:
                        '1px solid #dfe7eb',
                      borderRadius:
                        '10px',
                      padding:
                        '0 14px',
                      background:
                        '#ffffff',
                      color:
                        '#17272f',
                      fontSize:
                        '14px',
                      outline:
                        'none',
                    }}
                  >
                    <option
                      value=""
                    >
                      Select a travel plan
                    </option>

                    {travelPlans.map(
                      (
                        plan,
                      ) => (
                        <option
                          key={
                            plan._id
                          }
                          value={
                            plan._id
                          }
                        >
                          {plan.name} — {formatPrice(
                            plan.price,
                          )} {plan.priceSuffix}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                {selectedTravelPlan && (
                  <div
                    style={{
                      marginTop:
                        '14px',
                      padding:
                        '14px',
                      borderRadius:
                        '12px',
                      background:
                        '#f5f9fc',
                    }}
                  >
                    <div
                      style={{
                        display:
                          'flex',
                        justifyContent:
                          'space-between',
                        gap:
                          '12px',
                        alignItems:
                          'center',
                      }}
                    >
                      <strong>
                        {
                          selectedTravelPlan.name
                        }
                      </strong>

                      <strong>
                        {formatPrice(
                          travelPlanTotal,
                        )}
                      </strong>
                    </div>

                    <small
                      style={{
                        display:
                          'block',
                        marginTop:
                          '4px',
                        color:
                          '#6d7c84',
                      }}
                    >
                      {formatPrice(
                        selectedTravelPlan.price,
                      )}{' '}
                      {
                        selectedTravelPlan.priceSuffix
                      } ×{' '}
                      {
                        numberOfPeople
                      }
                    </small>

                    {selectedTravelPlan
                      .features
                      .length >
                      0 && (
                      <div
                        style={{
                          display:
                            'grid',
                          gap:
                            '6px',
                          marginTop:
                            '12px',
                        }}
                      >
                        {selectedTravelPlan.features.map(
                          (
                            feature,
                            index,
                          ) => (
                            <div
                              key={`${selectedTravelPlan._id}-modal-${index}`}
                              style={{
                                display:
                                  'flex',
                                alignItems:
                                  'center',
                                gap:
                                  '8px',
                                fontSize:
                                  '12px',
                                color:
                                  '#4e6069',
                              }}
                            >
                              <Check
                                size={
                                  14
                                }
                              />

                              {
                                feature
                              }
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div
                className="bookingFormGrid"
              >
                <label>
                  <span>
                    Travel Date
                  </span>

                  <input
                    type="date"
                    min={
                      getTodayDate()
                    }
                    value={
                      travelDate
                    }
                    onChange={(
                      event,
                    ) => {
                      setTravelDate(
                        event
                          .target
                          .value,
                      );

                      setBookingError(
                        '',
                      );

                      setBookingSuccess(
                        '',
                      );
                    }}
                  />
                </label>

                <div
                  className="travellerField"
                >
                  <span>
                    Travellers
                  </span>

                  <div
                    className="travellerStepper"
                  >
                    <button
                      type="button"
                      aria-label="Remove traveller"
                      disabled={
                        numberOfPeople <=
                        1
                      }
                      onClick={() => {
                        setNumberOfPeople(
                          (
                            current,
                          ) =>
                            Math.max(
                              1,
                              current -
                                1,
                            ),
                        );

                        setBookingSuccess(
                          '',
                        );
                      }}
                    >
                      <Minus
                        size={
                          15
                        }
                      />
                    </button>

                    <strong>
                      {
                        numberOfPeople
                      }
                    </strong>

                    <button
                      type="button"
                      aria-label="Add traveller"
                      onClick={() => {
                        setNumberOfPeople(
                          (
                            current,
                          ) =>
                            current +
                            1,
                        );

                        setBookingSuccess(
                          '',
                        );
                      }}
                    >
                      <Plus
                        size={
                          15
                        }
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div
                className="bookingAddOns"
              >
                <div
                  className="bookingSectionTitle"
                >
                  <div>
                    <span>
                      OPTIONAL EXTRAS
                    </span>

                    <h3>
                      Add to your trip
                    </h3>
                  </div>

                  <small>
                    {
                      selectedAddOnIds.length
                    }{' '}

                    selected
                  </small>
                </div>

                <div
                  className="bookingAddOnList"
                >
                  {(selectedPackage
                    .addOns ??
                    []).map(
                    (
                      addOn,
                    ) => {
                      const selected =
                        selectedAddOnIds.includes(
                          addOn._id,
                        );

                      const amount =
                        addOn.pricingType ===
                        'PER_PERSON'
                          ? addOn.price *
                            numberOfPeople
                          : addOn.price;

                      return (
                        <button
                          type="button"
                          key={
                            addOn._id
                          }
                          className={`bookingAddOn${
                            selected
                              ? ' selected'
                              : ''
                          }`}
                          onClick={() =>
                            toggleAddOn(
                              addOn._id,
                            )
                          }
                        >
                          <span
                            className="bookingAddOnCheck"
                          >
                            {selected && (
                              <Check
                                size={
                                  14
                                }
                              />
                            )}
                          </span>

                          <span
                            className="bookingAddOnInfo"
                          >
                            <strong>
                              {
                                addOn.name
                              }
                            </strong>

                            <small>
                              {addOn.pricingType ===
                              'PER_PERSON'
                                ? `${formatPrice(
                                    addOn.price,
                                  )} per person`
                                : `${formatPrice(
                                    addOn.price,
                                  )} per booking`}
                            </small>
                          </span>

                          <strong
                            className="bookingAddOnAmount"
                          >
                            +{formatPrice(
                              amount,
                            )}
                          </strong>
                        </button>
                      );
                    },
                  )}

                  {!selectedPackage
                    .addOns
                    ?.length && (
                    <p>
                      No optional add-ons available for this package.
                    </p>
                  )}
                </div>
              </div>

              <div
                className="bookingPriceSummary"
              >
                <div>
                  <span>
                    Package{' '}

                    ({formatPrice(
                      selectedPackage.price,
                    )}

                    {' × '}

                    {
                      numberOfPeople
                    }

                    )
                  </span>

                  <strong>
                    {formatPrice(
                      baseTotal,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Travel Plan{' '}

                    {selectedTravelPlan
                      ? `(${selectedTravelPlan.name} · ${formatPrice(
                          selectedTravelPlan.price,
                        )} × ${numberOfPeople})`
                      : '(Not selected)'}
                  </span>

                  <strong>
                    {selectedTravelPlan
                      ? formatPrice(
                          travelPlanTotal,
                        )
                      : '—'}
                  </strong>
                </div>

                <div>
                  <span>
                    Optional Add-ons
                  </span>

                  <strong>
                    {formatPrice(
                      addOnsTotal,
                    )}
                  </strong>
                </div>

                <div
                  className="bookingGrandTotal"
                >
                  <span>
                    Estimated Total
                  </span>

                  <strong>
                    {formatPrice(
                      estimatedTotal,
                    )}
                  </strong>
                </div>
              </div>

              {bookingError && (
                <div
                  className="bookingMessage bookingError"
                >
                  {
                    bookingError
                  }
                </div>
              )}

              {bookingSuccess && (
                <div
                  className="bookingMessage bookingSuccess"
                >
                  {
                    bookingSuccess
                  }
                </div>
              )}
            </div>

            <div
              className="bookingModalFooter"
            >
              <button
                type="button"
                className="bookingCancelButton"
                onClick={
                  closeBooking
                }
                disabled={
                  bookingSubmitting
                }
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
                  style={{ background: '#059669', borderColor: '#059669', color: '#fff', cursor: 'pointer' }}
                >
                  Go to My Trips →
                </button>
              ) : (
                <button
                  type="button"
                  className="bookingConfirmButton"
                  onClick={() =>
                    void createBooking()
                  }
                  disabled={
                    bookingSubmitting ||
                    !selectedTravelPlan
                  }
                >
                  {bookingSubmitting
                    ? 'Creating Booking...'
                    : 'Confirm Booking'}
                </button>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Cinematic HD Video Lightbox Popup */}
      {isCinematicModalOpen && (
        <div
          className="cinematicModalOverlay"
          onClick={() => setIsCinematicModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="GlobalVista Cinematic Preview"
        >
          <div
            className="cinematicModalDialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cinematicModalHeader">
              <div className="cinematicModalTitleWrap">
                <span className="cinematicModalBadge">
                  <Sparkles size={13} />
                  CINEMATIC PREVIEW
                </span>
                <h3>GlobalVista Signature Expeditions</h3>
                <p>Immerse in the world&apos;s most breathtaking natural wonders and luxury sanctuaries.</p>
              </div>
              <button
                type="button"
                className="cinematicModalClose"
                onClick={() => setIsCinematicModalOpen(false)}
                aria-label="Close cinematic preview"
              >
                <X size={20} />
              </button>
            </div>

            <div className="cinematicVideoContainer">
              <video
                ref={cinematicVideoRef}
                src="/videos/globalvista-adventure-banner.mp4"
                autoPlay
                controls
                playsInline
                className="cinematicVideoPlayer"
              />
            </div>

            <div className="cinematicModalFooter">
              <div className="cinematicModalDestinations">
                <span>Featured:</span>
                <span className="cinematicTag">🇨🇭 Swiss Alps</span>
                <span className="cinematicTag">🇲🇻 Maldives Atolls</span>
                <span className="cinematicTag">🇯🇵 Kyoto Temples</span>
                <span className="cinematicTag">🇱🇰 Sigiriya Citadel</span>
              </div>
              <div className="cinematicModalActions">
                <a
                  href="#destinations"
                  className="cinematicExploreBtn"
                  onClick={() => setIsCinematicModalOpen(false)}
                >
                  Explore All Destinations
                  <ArrowRight size={15} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navbar Quick Search Modal */}
      {isQuickSearchModalOpen && (
        <div
          className="quickSearchModalOverlay"
          onClick={() => setIsQuickSearchModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Quick Search Destinations and Packages"
        >
          <div
            className="quickSearchModalDialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="quickSearchBar">
              <Search size={22} className="quickSearchIcon" />
              <input
                ref={searchInputRef}
                type="text"
                value={quickSearchQuery}
                onChange={(e) => setQuickSearchQuery(e.target.value)}
                placeholder="Search destinations, packages (e.g. Maldives, Switzerland, Safari, Luxury)..."
                className="quickSearchInput"
              />
              {quickSearchQuery && (
                <button
                  type="button"
                  className="quickSearchClear"
                  onClick={() => setQuickSearchQuery('')}
                  aria-label="Clear search query"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="button"
                className="quickSearchCloseBtn"
                onClick={() => setIsQuickSearchModalOpen(false)}
                aria-label="Close search modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="quickSearchSuggestions">
              <span className="quickSearchSuggestLabel">Trending Escapes:</span>
              {['Maldives', 'Switzerland', 'Japan', 'Sri Lanka', 'Bali', 'Thailand'].map((dest) => (
                <button
                  key={dest}
                  type="button"
                  className={`quickSearchTag${quickSearchQuery.toLowerCase() === dest.toLowerCase() ? ' quickSearchTagActive' : ''}`}
                  onClick={() => setQuickSearchQuery(dest)}
                >
                  {dest}
                </button>
              ))}
            </div>

            <div className="quickSearchResults">
              {(() => {
                const q = quickSearchQuery.trim().toLowerCase();
                const filtered = q
                  ? packages.filter(
                      (p) =>
                        p.title.toLowerCase().includes(q) ||
                        p.destination.toLowerCase().includes(q) ||
                        p.country.toLowerCase().includes(q) ||
                        p.category.toLowerCase().includes(q) ||
                        p.description.toLowerCase().includes(q),
                    )
                  : packages.slice(0, 5);

                if (filtered.length === 0) {
                  return (
                    <div className="quickSearchEmpty">
                      <Compass size={40} className="quickSearchEmptyIcon" />
                      <h4>No packages matched &ldquo;{quickSearchQuery}&rdquo;</h4>
                      <p>Try searching for popular destinations like Maldives, Switzerland, or Japan.</p>
                      <button
                        type="button"
                        className="quickSearchResetBtn"
                        onClick={() => setQuickSearchQuery('')}
                      >
                        View All Featured Packages
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="quickSearchGrid">
                    {filtered.map((pkg) => (
                      <div key={pkg._id} className="quickSearchItem">
                        <img
                          src={getPackageImage(pkg)}
                          alt={pkg.title}
                          className="quickSearchItemImg"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/images/default-travel.jpg';
                          }}
                        />
                        <div className="quickSearchItemBody">
                          <div className="quickSearchItemMeta">
                            <span className="quickSearchItemLocation">
                              <MapPin size={11} /> {pkg.destination}, {pkg.country}
                            </span>
                            <span className="quickSearchItemDuration">
                              <Clock3 size={11} /> {pkg.duration}
                            </span>
                          </div>
                          <h4>{pkg.title}</h4>
                          <p>{pkg.description.slice(0, 85)}...</p>
                        </div>
                        <div className="quickSearchItemRight">
                          <div className="quickSearchItemPrice">
                            <small>From</small>
                            <strong>{formatPrice(pkg.price)}</strong>
                          </div>
                          <button
                            type="button"
                            className="quickSearchBookBtn"
                            onClick={() => {
                              setIsQuickSearchModalOpen(false);
                              void openBooking(pkg);
                            }}
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="quickSearchFooter">
              <span>Press <kbd>Esc</kbd> to close</span>
              <Link
                href={`/packages${quickSearchQuery ? `?search=${encodeURIComponent(quickSearchQuery)}` : ''}`}
                className="quickSearchViewAll"
                onClick={() => setIsQuickSearchModalOpen(false)}
              >
                View full collection in Packages Explorer <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Package Itinerary & Day-by-Day Breakdown Modal */}
      <PackageItineraryModal
        packageData={itineraryModalPackage}
        isOpen={isItineraryModalOpen}
        onClose={closeItinerary}
        onBookNow={(pkg) => {
          void openBooking(pkg);
        }}
      />

      {/* Fullscreen Lightbox Modal for Gallery */}
      {selectedGalleryDestination && (
        <div className="galleryLightboxOverlay" onClick={() => setSelectedGalleryDestination(null)}>
          <div className="galleryLightboxModal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="lightboxCloseBtn"
              onClick={() => setSelectedGalleryDestination(null)}
              aria-label="Close photo preview"
            >
              <X size={20} />
            </button>

            <div className="lightboxImageWrap">
              {galleryDestinations.length > 1 && (
                <>
                  <button
                    type="button"
                    className="lightboxNavBtn lightboxNavPrev"
                    onClick={handleGalleryPrev}
                    aria-label="Previous photo"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    className="lightboxNavBtn lightboxNavNext"
                    onClick={handleGalleryNext}
                    aria-label="Next photo"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
              <img
                src={getDestinationImage(selectedGalleryDestination)}
                alt={selectedGalleryDestination.name}
                className="lightboxImg"
              />
            </div>

            <div className="lightboxBody">
              <div>
                <div className="lightboxHeader">
                  <span className="lightboxCountryTag">
                    <MapPin size={13} />
                    {selectedGalleryDestination.country}
                  </span>
                  <h3 className="lightboxTitle">{selectedGalleryDestination.name}</h3>
                  <div className="lightboxRatingRow">
                    <span className="lightboxRatingPill">
                      <Star size={12} fill="currentColor" />
                      {typeof selectedGalleryDestination.rating === 'number'
                        ? selectedGalleryDestination.rating.toFixed(1)
                        : '5.0'} / 5.0
                    </span>
                    {selectedGalleryDestination.bestTimeToVisit && (
                      <span className="lightboxBestTime">
                        Best Season: <strong>{selectedGalleryDestination.bestTimeToVisit}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <p className="lightboxDescription">
                  Experience the pristine wonders of {selectedGalleryDestination.name}, {selectedGalleryDestination.country}. Curated private expeditions, 5-star handpicked sanctuaries, and white-glove chauffeur transfers.
                </p>
              </div>

              <div className="lightboxActions">
                <Link
                  className="lightboxPrimaryBtn"
                  href={`/packages?destinationId=${encodeURIComponent(selectedGalleryDestination._id)}&destinationName=${encodeURIComponent(selectedGalleryDestination.name)}`}
                  onClick={() => setSelectedGalleryDestination(null)}
                >
                  Explore Packages for {selectedGalleryDestination.name} <ArrowRight size={16} />
                </Link>
                <a
                  className="lightboxSecondaryBtn"
                  href="#planner"
                  onClick={() => {
                    setPlannerDestination(selectedGalleryDestination.name);
                    setSelectedGalleryDestination(null);
                  }}
                >
                  Customize Itinerary
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating WhatsApp VIP Concierge Button (Lansakara Style) */}
      <motion.a
        href="https://wa.me/94771234567?text=Hello%20GlobalVista%20Concierge,%20I%20would%20like%20to%20inquire%20about%20your%20luxury%20travel%20packages%20and%20tailored%20itineraries."
        target="_blank"
        rel="noopener noreferrer"
        className="floatingWhatsAppBtn"
        aria-label="Chat with GlobalVista Concierge on WhatsApp"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5, type: 'spring' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="whatsappIconWrap">
          <FaWhatsapp className="whatsappIcon" />
          <span className="whatsappOnlineDot" />
        </div>
        <div className="whatsappTextWrap">
          <span className="whatsappSubtitle">{t.whatsapp.conciergeOnline}</span>
          <strong className="whatsappTitle">{t.whatsapp.chatWhatsApp}</strong>
        </div>
      </motion.a>
    </main>
  );
}
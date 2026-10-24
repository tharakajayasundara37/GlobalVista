import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Dimensions,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeVideoPlayer } from '../components/SafeVideoPlayer';
import {
  Search,
  Sparkles,
  MapPin,
  Clock,
  Star,
  Compass,
  ArrowRight,
  Globe2,
  Heart,
  MessageCircle,
  Plane,
  Menu,
  X,
  UserRound,
  Check,
  CircleCheck,
  ChevronLeft,
  ChevronRight,
  Send,
  Play,
  Gift,
  CreditCard,
  ShieldCheck,
  Home as HomeIcon,
  Users,
  Award,
  Phone,
  Volume2,
  VolumeX,
  Briefcase,
  Camera,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SHADOWS } from '../constants/theme';
import { ApiPackage, ApiDestination, ApiTravelPlan, api, getPackageImage, getDestinationImage } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, WEB_BASE_URL, WHATSAPP_NUMBER, WHATSAPP_DEFAULT_MSG } from '../constants/config';
import { SafeImage } from '../components/SafeImage';
import { MobileItineraryModal } from '../components/MobileItineraryModal';
import { MobileBookingModal } from '../components/MobileBookingModal';
import { WhatsAppIcon } from '../components/WhatsAppIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getHeroScenes = (baseUrl: string) => [
  {
    id: 'swiss',
    country: 'Switzerland',
    flag: '🇨🇭',
    location: 'Zermatt, Switzerland',
    title: 'Matterhorn & Alpine Summits',
    subtitle: 'Private chalets, glacier helicopter charters & 5-star Zermatt retreats.',
    videoUrl: `${baseUrl}/videos/globalvista-hero-1.mp4`,
    image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=1200&q=80',
    tag: 'ALPINE PRIVILEGE',
    highlights: [
      'Matterhorn Private Glacier Helicopter Flight',
      'Luxury 5-Star Zermatt Chalet & Alpine Spa',
      'Private Michelin-Starred Mountain Dining',
      'Exclusive Glacier Express Concierge Service',
    ],
  },
  {
    id: 'sl',
    country: 'Sri Lanka',
    flag: '🇱🇰',
    location: 'Sigiriya, Sri Lanka',
    title: 'Royal Citadel & Emerald Hills',
    subtitle: 'Chauffeur-guided heritage expeditions, Ceylon tea bungalows & Mirissa coasts.',
    videoUrl: `${baseUrl}/videos/globalvista-hero-2.mp4`,
    image: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?w=1200&q=80',
    tag: 'CULTURAL ATELIER',
    highlights: [
      'Sunrise Hot Air Balloon Flight over Sigiriya',
      'Heritage Bungalows in Ceylon Tea Highlands',
      'Private Yala Leopard & Wildlife Safari Jeep',
      'Mirissa Private Whale Watching Luxury Yacht',
    ],
  },
  {
    id: 'maldives',
    country: 'Maldives',
    flag: '🇲🇻',
    location: 'South Ari Atoll, Maldives',
    title: 'Overwater Lagoon Sanctuary',
    subtitle: 'Private marine villas, turquoise reefs and seaplane champagne arrivals.',
    videoUrl: `${baseUrl}/videos/globalvista-hero-3.mp4`,
    image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&q=80',
    tag: 'ISLAND SERENITY',
    highlights: [
      'Private Seaplane Direct Island Transfer',
      'Overwater Sunset Villa with Infinity Pool',
      'Private Coral Reef Snorkeling with Marine Biologist',
      'Candlelit Sandbank Dining under the Stars',
    ],
  },
  {
    id: 'japan',
    country: 'Japan',
    flag: '🇯🇵',
    location: 'Kyoto & Tokyo, Japan',
    title: 'Imperial Temples & Mt. Fuji',
    subtitle: 'Kyoto shrines, private bullet-train concierges & Tokyo luxury horizons.',
    videoUrl: `${baseUrl}/videos/globalvista-hero-4.mp4`,
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80',
    tag: 'IMPERIAL VISTA',
    highlights: [
      'Private Shinkansen First-Class Bullet Train Concierge',
      'Exclusive Tea Ceremony with Kyoto Master',
      'Lake Kawaguchiko Mt. Fuji Luxury Onsen',
      'Tokyo Private Helicopter Skyline Twilight Tour',
    ],
  },
  {
    id: 'france',
    country: 'France',
    flag: '🇫🇷',
    location: 'Paris & French Riviera',
    title: 'Haute Horology & Azure Coasts',
    subtitle: 'Private Eiffel penthouse salons, Champagne cellars & Cannes superyacht charters.',
    videoUrl: `${baseUrl}/videos/globalvista-hero-5.mp4`,
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80',
    tag: 'RIVIERA PRESTIGE',
    highlights: [
      'Private Champagne Cellar Tasting in Reims',
      'VIP Sunset Seine Cruise on Classic Riva Yacht',
      'Michelin 3-Star Parisian Dining Experience',
      'Helicopter Transfer to Monaco & Cote d’Azur',
    ],
  },
];

export interface GuestReview {
  _id: string;
  name: string;
  country: string;
  packageTitle: string;
  rating: number;
  comment: string;
}

const DEFAULT_REVIEWS: GuestReview[] = [
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

const defaultTravelPlans: ApiTravelPlan[] = [
  {
    _id: '6ac9cbd09a0ec138e6e680de',
    name: 'Basic',
    price: 555,
    priceSuffix: '/ person',
    features: ['3-star hotels', 'Airport transfers', 'Guided city tour', 'Breakfast included'],
    isPopular: false,
    isActive: true,
  },
  {
    _id: '6ac9cbea9a0ec138e6e680df',
    name: 'Premium',
    price: 999,
    priceSuffix: '/ person',
    features: ['5-star hotels', 'Premium transfers', 'Private guided tours', '24/7 travel support'],
    isPopular: true,
    isActive: true,
  },
  {
    _id: '6ac9cc1e9a0ec138e6e680e0',
    name: 'Luxury',
    price: 1999,
    priceSuffix: '/ person',
    features: ['Luxury resorts', 'Business-class transfer', 'Private experiences'],
    isPopular: false,
    isActive: true,
  },
];

interface Props {
  navigation: any;
}

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { formatPrice, currency, setCurrency, currentCurrency } = useCurrency();
  const { language, setLanguage, t } = useLanguage();
  const { user, token } = useAuth();

  const scrollRef = useRef<ScrollView>(null);

  const [packages, setPackages] = useState<ApiPackage[]>([]);
  const [destinations, setDestinations] = useState<ApiDestination[]>([]);
  const [travelPlans, setTravelPlans] = useState<ApiTravelPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [packagesSectionY, setPackagesSectionY] = useState<number>(1000);
  const [plansSectionY, setPlansSectionY] = useState<number>(1600);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'DESTINATIONS' | 'OFFERS' | 'REVIEWS' | 'PLANS'>('ALL');

  // Navbar and Hero State
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchBarVisible, setSearchBarVisible] = useState(false);
  const [selectedSceneIdx, setSelectedSceneIdx] = useState(0);
  const [isHeroMuted, setIsHeroMuted] = useState(true);

  // Filter States for Country Pills
  const [destCountryFilter, setDestCountryFilter] = useState<string>('ALL');
  const [pkgCountryFilter, setPkgCountryFilter] = useState<string>('ALL');
  const [galleryCountryFilter, setGalleryCountryFilter] = useState<string>('ALL');
  const [selectedGalleryDest, setSelectedGalleryDest] = useState<ApiDestination | null>(null);

  // Cinematic Modal State (Served directly from high-speed Vercel CDN)
  const heroScenes = getHeroScenes(WEB_BASE_URL);
  const currentScene = heroScenes[selectedSceneIdx] || heroScenes[0];
  const [cinematicModalScene, setCinematicModalScene] = useState<typeof heroScenes[0] | null>(null);

  // Modals
  const [itineraryPkg, setItineraryPkg] = useState<ApiPackage | null>(null);
  const [bookingPkg, setBookingPkg] = useState<ApiPackage | null>(null);
  const [savedPackageIds, setSavedPackageIds] = useState<string[]>([]);

  // Guest Reflections State (Matching Web / Lansakara Interactive Review System)
  const [localCustomReviews, setLocalCustomReviews] = useState<GuestReview[]>([]);
  const [hasSubmittedReview, setHasSubmittedReview] = useState<boolean>(false);
  const [activeReviewIdx, setActiveReviewIdx] = useState<number>(0);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [formReviewerName, setFormReviewerName] = useState<string>('');
  const [formReviewerEmail, setFormReviewerEmail] = useState<string>('');
  const [formReviewerCountry, setFormReviewerCountry] = useState<string>('');
  const [formReviewerDestination, setFormReviewerDestination] = useState<string>('');
  const [formReviewerComment, setFormReviewerComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewAlert, setReviewAlert] = useState<{ type: string; text: string }>({ type: '', text: '' });
  const [reviewsSectionY, setReviewsSectionY] = useState<number>(1400);

  // Load custom reviews and submission status from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const hasRev = await AsyncStorage.getItem('globalvista_has_reviewed');
        if (hasRev === 'true') {
          setHasSubmittedReview(true);
        }
        const storedReviews = await AsyncStorage.getItem('globalvista_custom_reviews');
        if (storedReviews) {
          const parsed = JSON.parse(storedReviews);
          if (Array.isArray(parsed)) {
            setLocalCustomReviews(parsed);
          }
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const displayReviews: GuestReview[] = useMemo(() => {
    return [...localCustomReviews, ...DEFAULT_REVIEWS];
  }, [localCustomReviews]);

  // Auto-slide reviews every 5.5s unless modal is open
  useEffect(() => {
    if (isReviewModalOpen || displayReviews.length <= 1) return;
    const timer = setInterval(() => {
      setActiveReviewIdx((prev) => (prev + 1) % displayReviews.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [displayReviews.length, isReviewModalOpen]);

  const openReviewModal = () => {
    if (user?.name) {
      setFormReviewerName(user.name);
    }
    if (user?.email) {
      setFormReviewerEmail(user.email);
    }
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!formReviewerName.trim() || !formReviewerComment.trim()) {
      setReviewAlert({ type: 'error', text: 'Please fill in your name and review impressions.' });
      return;
    }

    setSubmittingReview(true);
    setReviewAlert({ type: '', text: '' });

    setTimeout(async () => {
      const newRev: GuestReview = {
        _id: 'user-rev-' + Date.now(),
        name: formReviewerName.trim(),
        country: formReviewerCountry.trim() || 'Verified Explorer',
        packageTitle: formReviewerDestination.trim() || 'Custom Luxury Expedition',
        rating: reviewRating,
        comment: formReviewerComment.trim(),
      };

      const updated = [newRev, ...localCustomReviews];
      setLocalCustomReviews(updated);
      setActiveReviewIdx(0);
      setSubmittingReview(false);
      setHasSubmittedReview(true);
      setReviewAlert({
        type: 'success',
        text: 'Thank you! Your travel reflection has been published and featured.',
      });

      try {
        await AsyncStorage.setItem('globalvista_custom_reviews', JSON.stringify(updated));
        await AsyncStorage.setItem('globalvista_has_reviewed', 'true');
      } catch {}

      setTimeout(() => {
        setIsReviewModalOpen(false);
        setReviewAlert({ type: '', text: '' });
        setFormReviewerComment('');
        setFormReviewerDestination('');
      }, 1500);
    }, 600);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pkgs, dests, plans] = await Promise.all([
        api.getPackages(),
        api.getDestinations(),
        api.getTravelPlans(),
      ]);
      setPackages(pkgs);
      setDestinations(dests);
      if (plans && plans.length > 0) {
        setTravelPlans(plans);
        const stored = await AsyncStorage.getItem('globalvista_selected_travel_plan');
        if (stored && plans.some((p) => p._id === stored)) {
          setSelectedPlanId(stored);
        } else {
          const popular = plans.find((p) => p.isPopular) || plans[0];
          setSelectedPlanId((prev) => (plans.some((p) => p._id === prev) ? prev : popular._id));
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlanId(planId);
    try {
      await AsyncStorage.setItem('globalvista_selected_travel_plan', planId);
    } catch (e) {
      // ignore
    }
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, packagesSectionY - 20),
        animated: true,
      });
    }, 100);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const toggleSave = (id: string) => {
    setSavedPackageIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const openWhatsApp = (customMsg?: string) => {
    const text = customMsg || WHATSAPP_DEFAULT_MSG;
    const url = `whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(text)}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`);
      }
    });
  };

  const COUNTRY_OPTIONS = ['ALL', 'Maldives', 'Switzerland', 'Japan', 'Sri Lanka', 'Bali', 'Thailand'];

  // Auto-rotating Featured Packages Carousel for Mobile (5-second interval)
  const heroPackagesList: ApiPackage[] = useMemo(() => {
    const active = packages.filter((pkg) => pkg && pkg.availability !== false);
    if (active.length > 0) return active;
    return [
      {
        _id: 'featured-deal-1',
        title: 'Maldives Overwater Lagoon Sanctuary',
        destination: 'South Ari Atoll',
        country: 'Maldives',
        duration: '7 Days / 6 Nights',
        price: 3400,
        category: 'Private Island Sanctuary',
        description: 'Awaken above crystal turquoise lagoons with dedicated butler service, infinity plunge pool, and reef safari.',
        images: ['/images/maldives-package-1.jpg'],
        availability: true,
      },
      {
        _id: 'featured-deal-2',
        title: 'Swiss Alpine Glacier & Chalet Odyssey',
        destination: 'Zermatt & St. Moritz',
        country: 'Switzerland',
        duration: '8 Days / 7 Nights',
        price: 4200,
        category: 'Alpine Luxury',
        description: 'Panoramic glacier express journeys, private ski chalets, and Michelin-star alpine dining.',
        images: ['/images/switzerland-tour-1.jpg'],
        availability: true,
      },
      {
        _id: 'featured-deal-3',
        title: 'Sigiriya Citadel & Safari Pavilions',
        destination: 'Cultural Triangle & Yala',
        country: 'Sri Lanka',
        duration: '6 Days / 5 Nights',
        price: 1850,
        category: 'Royal Heritage & Wildlife',
        description: 'Ascend the fifth-century royal rock fortress in the sky, encounter free-roaming leopards, and unwind in colonial tea bungalows.',
        images: ['/images/sri-lanka-tour-1.jpg'],
        availability: true,
      },
      {
        _id: 'featured-deal-4',
        title: 'Kyoto Zen Heritage & Bamboo Groves',
        destination: 'Kyoto & Arashiyama',
        country: 'Japan',
        duration: '7 Days / 6 Nights',
        price: 3100,
        category: 'Cultural Immersion',
        description: 'Ancient tea ceremonies, golden pavilions, and private ryokan retreats nestled amidst bamboo forests.',
        images: ['/images/japan-tour-1.jpg'],
        availability: true,
      },
      {
        _id: 'featured-deal-5',
        title: 'Thailand Paradise & Phi Phi Odyssey',
        destination: 'Phuket & Krabi',
        country: 'Thailand',
        duration: '6 Days / 5 Nights',
        price: 2800,
        category: 'Tropical Sanctuary',
        description: 'Private longtail boat expeditions, limestone cliffs, and vibrant Andaman sunsets.',
        images: ['/images/thailand-tour.jpg'],
        availability: true,
      },
    ] as ApiPackage[];
  }, [packages]);

  const [heroPackageIndex, setHeroPackageIndex] = useState(0);
  const [isHeroCardPaused, setIsHeroCardPaused] = useState(false);
  const heroProgressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (heroPackagesList.length <= 1) return;

    heroProgressAnim.setValue(0);
    if (isHeroCardPaused) return;

    const progressAnimation = Animated.timing(heroProgressAnim, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    });
    progressAnimation.start();

    const timer = setInterval(() => {
      setHeroPackageIndex((prev) => (prev + 1) % heroPackagesList.length);
    }, 5000);

    return () => {
      clearInterval(timer);
      progressAnimation.stop();
    };
  }, [heroPackagesList.length, heroPackageIndex, isHeroCardPaused]);

  const featuredEscape = heroPackagesList[heroPackageIndex % heroPackagesList.length] || heroPackagesList[0];

  // Filter destinations based on destCountryFilter
  const filteredDestinations = destinations.filter((dest) => {
    if (destCountryFilter === 'ALL') return true;
    const combined = `${dest.name} ${dest.country}`.toLowerCase();
    return combined.includes(destCountryFilter.toLowerCase());
  });

  // Filter packages based on activeCategory, country filter, or search
  const filteredPackages = packages.filter((pkg) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        pkg.title.toLowerCase().includes(q) ||
        pkg.destination.toLowerCase().includes(q) ||
        pkg.country.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (activeCategory === 'OFFERS' && !pkg.isSpecialOffer) return false;
    if (pkgCountryFilter !== 'ALL') {
      const combined = `${pkg.title} ${pkg.destination} ${pkg.country}`.toLowerCase();
      if (!combined.includes(pkgCountryFilter.toLowerCase())) return false;
    }
    return true;
  });

  // Filter destinations for aesthetic moodboard
  const filteredGalleryDestinations = destinations.filter((dest) => {
    if (galleryCountryFilter === 'ALL') return true;
    const combined = `${dest.name} ${dest.country}`.toLowerCase();
    return combined.includes(galleryCountryFilter.toLowerCase());
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ========================================================
          GLOBALVISTA MOBILE NAVBAR (Screenshot Alignment + Original Colors)
          ======================================================== */}
      <View style={styles.topNavbar}>
        {/* Left Brand Area (Original GlobalVista Brand) */}
        <TouchableOpacity
          style={styles.logoWrap}
          onPress={() => {
            setActiveCategory('ALL');
            scrollRef.current?.scrollTo({ y: 0, animated: true });
          }}
          activeOpacity={0.8}
        >
          <View style={styles.logoIcon}>
            <Plane size={15} color="#38bdf8" />
          </View>
          <Text style={styles.logoGlobal}>Global<Text style={styles.logoVista}>Vista</Text></Text>
          <View style={styles.logoAtelierTag}>
            <Text style={styles.logoAtelierText}>ATELIER</Text>
          </View>
        </TouchableOpacity>

        {/* Right Actions: Exactly 4 Circular Icon Buttons (Design & Alignment from Screenshot) */}
        <View style={styles.circleButtonsRow}>
          {/* Button 1: Location Pin / Search Toggle */}
          <TouchableOpacity
            style={[styles.circleNavBtn, searchBarVisible && styles.circleNavBtnActive]}
            onPress={() => setSearchBarVisible(!searchBarVisible)}
            activeOpacity={0.75}
          >
            <MapPin size={17} color={searchBarVisible ? '#ffffff' : COLORS.primary} />
          </TouchableOpacity>

          {/* Button 2: Trips / Bookings */}
          <TouchableOpacity
            style={styles.circleNavBtn}
            onPress={() => navigation.navigate('My Trips')}
            activeOpacity={0.75}
          >
            <Briefcase size={17} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Button 3: User Account / Profile */}
          <TouchableOpacity
            style={[styles.circleNavBtn, token && user && styles.circleNavBtnUser]}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.75}
          >
            {token && user ? (
              <Text style={styles.circleAvatarInitial}>
                {(user.name?.trim().charAt(0) || 'T').toUpperCase()}
              </Text>
            ) : (
              <UserRound size={17} color={COLORS.primary} />
            )}
            {token && (
              <View
                style={[
                  styles.circleRoleDot,
                  {
                    backgroundColor:
                      user?.role === 'ADMIN'
                        ? '#e11d48'
                        : user?.role === 'GUIDE'
                        ? '#f59e0b'
                        : '#10b981',
                  },
                ]}
              />
            )}
          </TouchableOpacity>

          {/* Button 4: Hamburger Menu / Drawer Toggle */}
          <TouchableOpacity
            style={[styles.circleNavBtn, mobileNavOpen && styles.circleNavBtnActive]}
            onPress={() => setMobileNavOpen(!mobileNavOpen)}
            activeOpacity={0.75}
          >
            {mobileNavOpen ? (
              <X size={18} color="#ffffff" />
            ) : (
              <Menu size={18} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ========================================================
          COLLAPSIBLE LUXURY MOBILE NAVIGATION DRAWER
          ======================================================== */}
      {mobileNavOpen && (
        <View style={styles.navDrawer}>
          {/* Top Luxury Preferences: Currency & Language Switchers */}
          <View style={styles.drawerPrefsBox}>
            <View style={styles.drawerPrefRow}>
              <Text style={styles.drawerPrefLabel}>CURRENCY</Text>
              <View style={styles.drawerPillsRow}>
                {(['USD', 'LKR', 'EUR', 'GBP'] as const).map((currCode) => {
                  const flags: Record<string, string> = { USD: '🇺🇸', LKR: '🇱🇰', EUR: '🇪🇺', GBP: '🇬🇧' };
                  const isActive = currency === currCode;
                  return (
                    <TouchableOpacity
                      key={currCode}
                      style={[styles.drawerPill, isActive && styles.drawerPillActive]}
                      onPress={() => setCurrency(currCode)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.drawerPillText, isActive && styles.drawerPillTextActive]}>
                        {flags[currCode]} {currCode}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.drawerPrefRow}>
              <Text style={styles.drawerPrefLabel}>LANGUAGE</Text>
              <View style={styles.drawerPillsRow}>
                <TouchableOpacity
                  style={[styles.drawerPill, language === 'EN' && styles.drawerPillActive]}
                  onPress={() => setLanguage('EN')}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.drawerPillText, language === 'EN' && styles.drawerPillTextActive]}>
                    🇺🇸 English
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.drawerPill, language === 'SI' && styles.drawerPillActive]}
                  onPress={() => setLanguage('SI')}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.drawerPillText, language === 'SI' && styles.drawerPillTextActive]}>
                    🇱🇰 සිංහල
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Text style={styles.navDrawerTitle}>GLOBAL ATELIER NAVIGATION</Text>
          <View style={styles.navDrawerLinks}>
            {/* 1. Destinations */}
            <TouchableOpacity
              style={[styles.navDrawerItem, activeCategory === 'DESTINATIONS' && styles.navDrawerItemActive]}
              onPress={() => {
                setActiveCategory('DESTINATIONS');
                setMobileNavOpen(false);
                scrollRef.current?.scrollTo({ y: 440, animated: true });
              }}
              activeOpacity={0.75}
            >
              <View style={styles.navDrawerItemLeft}>
                <HomeIcon size={16} color={activeCategory === 'DESTINATIONS' ? '#ffffff' : COLORS.accent} />
                <Text style={[styles.navDrawerItemText, activeCategory === 'DESTINATIONS' && styles.navDrawerItemTextActive]}>
                  {t.popularDestinations || 'Destinations'}
                </Text>
              </View>
              <ChevronRight size={14} color={activeCategory === 'DESTINATIONS' ? '#ffffff' : COLORS.textMuted} />
            </TouchableOpacity>

            {/* 2. Experiences */}
            <TouchableOpacity
              style={[styles.navDrawerItem, activeCategory === 'ALL' && styles.navDrawerItemActive]}
              onPress={() => {
                setActiveCategory('ALL');
                setMobileNavOpen(false);
                scrollRef.current?.scrollTo({ y: 640, animated: true });
              }}
              activeOpacity={0.75}
            >
              <View style={styles.navDrawerItemLeft}>
                <Plane size={16} color={activeCategory === 'ALL' ? '#ffffff' : COLORS.accent} />
                <Text style={[styles.navDrawerItemText, activeCategory === 'ALL' && styles.navDrawerItemTextActive]}>
                  {t.explorePackages || 'Experiences & Tours'}
                </Text>
              </View>
              <ChevronRight size={14} color={activeCategory === 'ALL' ? '#ffffff' : COLORS.textMuted} />
            </TouchableOpacity>

            {/* 3. Special Offers */}
            <TouchableOpacity
              style={[styles.navDrawerItem, activeCategory === 'OFFERS' && styles.navDrawerItemActive]}
              onPress={() => {
                setActiveCategory('OFFERS');
                setMobileNavOpen(false);
                scrollRef.current?.scrollTo({ y: 640, animated: true });
              }}
              activeOpacity={0.75}
            >
              <View style={styles.navDrawerItemLeft}>
                <Gift size={16} color={activeCategory === 'OFFERS' ? '#ffffff' : '#f59e0b'} />
                <Text style={[styles.navDrawerItemText, activeCategory === 'OFFERS' && styles.navDrawerItemTextActive]}>
                  Special Offers & Limited Deals
                </Text>
              </View>
              <View style={styles.offerBadge}>
                <Text style={styles.offerBadgeText}>OFFERS</Text>
              </View>
            </TouchableOpacity>

            {/* 4. Guest Reflections & Reviews */}
            <TouchableOpacity
              style={[styles.navDrawerItem, activeCategory === 'REVIEWS' && styles.navDrawerItemActive]}
              onPress={() => {
                setActiveCategory('REVIEWS');
                setMobileNavOpen(false);
                scrollRef.current?.scrollTo({ y: Math.max(0, reviewsSectionY - 20), animated: true });
              }}
              activeOpacity={0.75}
            >
              <View style={styles.navDrawerItemLeft}>
                <Star size={16} color={activeCategory === 'REVIEWS' ? '#ffffff' : COLORS.gold} />
                <Text style={[styles.navDrawerItemText, activeCategory === 'REVIEWS' && styles.navDrawerItemTextActive]}>
                  Guest Reflections (4.9/5)
                </Text>
              </View>
              <ChevronRight size={14} color={activeCategory === 'REVIEWS' ? '#ffffff' : COLORS.textMuted} />
            </TouchableOpacity>

            {/* 5. Travel Plans & Pricing */}
            <TouchableOpacity
              style={[styles.navDrawerItem, activeCategory === 'PLANS' && styles.navDrawerItemActive]}
              onPress={() => {
                setActiveCategory('PLANS');
                setMobileNavOpen(false);
                scrollRef.current?.scrollTo({ y: Math.max(0, plansSectionY - 20), animated: true });
              }}
              activeOpacity={0.75}
            >
              <View style={styles.navDrawerItemLeft}>
                <CreditCard size={16} color={activeCategory === 'PLANS' ? '#ffffff' : '#10b981'} />
                <Text style={[styles.navDrawerItemText, activeCategory === 'PLANS' && styles.navDrawerItemTextActive]}>
                  Bespoke Travel Plans & Tiers
                </Text>
              </View>
              <ChevronRight size={14} color={activeCategory === 'PLANS' ? '#ffffff' : COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Quick Concierge Row inside Drawer */}
          <TouchableOpacity
            style={styles.navDrawerConciergeBtn}
            onPress={() => {
              setMobileNavOpen(false);
              openWhatsApp();
            }}
            activeOpacity={0.8}
          >
            <WhatsAppIcon size={17} color="#ffffff" />
            <Text style={styles.navDrawerConciergeText}>Direct 24/7 WhatsApp VIP Concierge</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ========================================================
          QUICK HORIZONTAL NAVIGATION STRIP (Under Top Bar)
          ======================================================== */}
      <View style={styles.categoryNavStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryNavScroll}>
          <TouchableOpacity
            style={[styles.categoryPill, activeCategory === 'ALL' && styles.categoryPillActive]}
            onPress={() => setActiveCategory('ALL')}
            activeOpacity={0.75}
          >
            <Compass size={13} color={activeCategory === 'ALL' ? '#ffffff' : COLORS.textSecondary} />
            <Text style={[styles.categoryPillText, activeCategory === 'ALL' && styles.categoryPillTextActive]}>
              All Escapes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryPill, activeCategory === 'DESTINATIONS' && styles.categoryPillActive]}
            onPress={() => {
              setActiveCategory('DESTINATIONS');
              scrollRef.current?.scrollTo({ y: 440, animated: true });
            }}
            activeOpacity={0.75}
          >
            <MapPin size={13} color={activeCategory === 'DESTINATIONS' ? '#ffffff' : COLORS.textSecondary} />
            <Text style={[styles.categoryPillText, activeCategory === 'DESTINATIONS' && styles.categoryPillTextActive]}>
              Destinations
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryPill, activeCategory === 'OFFERS' && styles.categoryPillActive]}
            onPress={() => setActiveCategory('OFFERS')}
            activeOpacity={0.75}
          >
            <Gift size={13} color={activeCategory === 'OFFERS' ? '#ffffff' : '#f59e0b'} />
            <Text style={[styles.categoryPillText, activeCategory === 'OFFERS' && styles.categoryPillTextActive]}>
              Limited Offers %
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryPill, activeCategory === 'REVIEWS' && styles.categoryPillActive]}
            onPress={() => {
              setActiveCategory('REVIEWS');
              scrollRef.current?.scrollTo({ y: Math.max(0, reviewsSectionY - 20), animated: true });
            }}
            activeOpacity={0.75}
          >
            <Star size={13} color={activeCategory === 'REVIEWS' ? '#ffffff' : COLORS.gold} />
            <Text style={[styles.categoryPillText, activeCategory === 'REVIEWS' && styles.categoryPillTextActive]}>
              Guest Reviews
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryPill, activeCategory === 'PLANS' && styles.categoryPillActive]}
            onPress={() => {
              setActiveCategory('PLANS');
              scrollRef.current?.scrollTo({ y: Math.max(0, plansSectionY - 20), animated: true });
            }}
            activeOpacity={0.75}
          >
            <CreditCard size={13} color={activeCategory === 'PLANS' ? '#ffffff' : '#10b981'} />
            <Text style={[styles.categoryPillText, activeCategory === 'PLANS' && styles.categoryPillTextActive]}>
              Travel Plans
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Optional Search Bar Input Dropdown */}
      {searchBarVisible && (
        <View style={styles.searchDropdownWrap}>
          <View style={styles.searchBar}>
            <Search size={18} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder={t.searchPlaceholder || 'Search destinations, packages, durations...'}
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                <X size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* ========================================================
          MAIN SCROLLABLE CONTENT
          ======================================================== */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: '#f8fafc' }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#d4af37" />}
      >
        {/* ========================================================
            INTERACTIVE MULTI-SCENE WEB HERO SECTION (WITH HD VIDEOS)
            ======================================================== */}
        <View style={styles.heroSection}>
          <View style={styles.heroCard}>
            {/* Live Looping Video Backdrop from Web */}
            <SafeVideoPlayer
              sourceUrl={currentScene.videoUrl}
              posterUrl={currentScene.image}
              style={styles.heroVideo}
              isMuted={isHeroMuted}
              autoPlay={true}
              nativeControls={false}
            />
            <View style={styles.heroOverlayGradient} />

            {/* Top Control Bar: Scene Selector Tabs & Audio Sound Toggle */}
            <View style={styles.heroControlsRow}>
              <View style={styles.sceneTabsWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sceneTabsRow}>
                  {heroScenes.map((scene, idx) => {
                    const isSelected = selectedSceneIdx === idx;
                    return (
                      <TouchableOpacity
                        key={scene.id}
                        style={[styles.sceneTabPill, isSelected && styles.sceneTabPillActive]}
                        onPress={() => setSelectedSceneIdx(idx)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.sceneTabFlag}>{scene.flag}</Text>
                        <Text style={[styles.sceneTabText, isSelected && styles.sceneTabTextActive]}>
                          {scene.country}
                        </Text>
                        {isSelected && <View style={styles.sceneTabIndicator} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Sound On / Mute Toggle Pill */}
              <TouchableOpacity
                style={styles.heroAudioToggleBtn}
                onPress={() => setIsHeroMuted(!isHeroMuted)}
                activeOpacity={0.8}
              >
                {isHeroMuted ? (
                  <VolumeX size={13} color="#ffffff" />
                ) : (
                  <Volume2 size={13} color="#38bdf8" />
                )}
                <Text style={styles.heroAudioToggleText}>{isHeroMuted ? 'Muted' : 'Sound On'}</Text>
              </TouchableOpacity>
            </View>

            {/* Hero Main Content (Clean Minimalist Luxury) */}
            <View style={styles.heroContentWrap}>
              {/* Location Tag & Eyebrow */}
              <View style={styles.heroEyebrowRow}>
                <View style={styles.heroEyebrowLine} />
                <Text style={styles.heroEyebrowText}>{currentScene.tag}</Text>
                <Text style={styles.heroEyebrowDot}>·</Text>
                <MapPin size={10} color="#38bdf8" />
                <Text style={styles.heroLocationText}>{currentScene.location}</Text>
              </View>

              {/* Refined Headline */}
              <Text style={styles.heroMainTitle}>
                Travel Further.{' '}
                <Text style={styles.heroMainTitleItalic}>Live More.</Text>
              </Text>

              {/* Action Buttons: Explore & Watch Film */}
              <View style={styles.heroActionBtnsRow}>
                <TouchableOpacity
                  style={styles.heroPrimaryBtn}
                  onPress={() => scrollRef.current?.scrollTo({ y: 560, animated: true })}
                  activeOpacity={0.85}
                >
                  <Text style={styles.heroPrimaryBtnText}>Explore Escapes</Text>
                  <ArrowRight size={15} color="#ffffff" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.heroWatchBtn}
                  onPress={() => setCinematicModalScene(currentScene)}
                  activeOpacity={0.8}
                >
                  <View style={styles.heroWatchPlayCircle}>
                    <Play size={10} color="#ffffff" fill="#ffffff" />
                  </View>
                  <Text style={styles.heroWatchBtnText}>Film</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* ========================================================
            SLEEK SOCIAL PROOF & TRUST STRIP (Cleanly Below Hero Card)
            ======================================================== */}
        <View style={styles.heroTrustBanner}>
          <View style={styles.heroAvatarStack}>
            <View style={[styles.heroAvatarCircle, { backgroundColor: '#0284c7' }]}>
              <Text style={styles.heroAvatarInitial}>JM</Text>
            </View>
            <View style={[styles.heroAvatarCircle, { backgroundColor: '#0f766e', marginLeft: -8 }]}>
              <Text style={styles.heroAvatarInitial}>AK</Text>
            </View>
            <View style={[styles.heroAvatarCircle, { backgroundColor: '#7c3aed', marginLeft: -8 }]}>
              <Text style={styles.heroAvatarInitial}>LS</Text>
            </View>
            <View style={[styles.heroAvatarCircle, { backgroundColor: '#d97706', marginLeft: -8 }]}>
              <Text style={styles.heroAvatarInitial}>NP</Text>
            </View>
          </View>

          <View style={styles.heroTrustRatingWrap}>
            <View style={styles.heroStarsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={11} color="#fbbf24" fill="#fbbf24" />
              ))}
            </View>
            <Text style={styles.heroTrustRatingText}>4.9/5 · 25,000+ Travellers</Text>
          </View>

          <View style={styles.heroTrustBadge}>
            <ShieldCheck size={13} color="#10b981" />
            <Text style={styles.heroTrustBadgeText}>Verified</Text>
          </View>
        </View>

        {/* ========================================================
            FEATURED ESCAPE DEAL CARD (Matching Web heroDealCard)
            ======================================================== */}
        {featuredEscape && (
          <View style={styles.featuredDealContainer}>
            <View
              style={styles.featuredDealCard}
              onTouchStart={() => setIsHeroCardPaused(true)}
              onTouchEnd={() => setIsHeroCardPaused(false)}
            >
              <View style={styles.dealTopBar}>
                <View style={styles.dealBadge}>
                  <Sparkles size={12} color="#ffffff" />
                  <Text style={styles.dealBadgeText}>{t.featuredEscape || 'FEATURED ESCAPE'}</Text>
                </View>

                <View style={styles.dealTopControls}>
                  <View style={styles.dealCounterBadge}>
                    <Text style={styles.dealCounterText}>
                      {String((heroPackageIndex % heroPackagesList.length) + 1).padStart(2, '0')} / {String(heroPackagesList.length).padStart(2, '0')}
                    </Text>
                  </View>

                  <View style={styles.dealNavArrows}>
                    <TouchableOpacity
                      style={styles.dealNavArrowBtn}
                      activeOpacity={0.7}
                      onPress={() => {
                        setHeroPackageIndex((prev) => (prev - 1 + heroPackagesList.length) % heroPackagesList.length);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <ChevronLeft size={13} color="#0f172a" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.dealNavArrowBtn}
                      activeOpacity={0.7}
                      onPress={() => {
                        setHeroPackageIndex((prev) => (prev + 1) % heroPackagesList.length);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <ChevronRight size={13} color="#0f172a" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* 5-second animated progress bar */}
              <View style={styles.dealProgressTrack}>
                <Animated.View
                  style={[
                    styles.dealProgressBar,
                    {
                      width: heroProgressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>

              <View style={styles.dealMediaWrap}>
                <SafeImage
                  uri={getPackageImage(featuredEscape)}
                  keywords={`${featuredEscape.title} ${featuredEscape.destination} ${featuredEscape.country}`}
                  style={styles.dealImg}
                />
                <View style={styles.dealImgOverlay} />
                <View style={styles.dealLocationBadge}>
                  <MapPin size={11} color="#ffffff" />
                  <Text style={styles.dealLocationText}>
                    {featuredEscape.destination}, {featuredEscape.country}
                  </Text>
                  <Text style={styles.dealDot}>·</Text>
                  <Clock size={11} color="#ffffff" />
                  <Text style={styles.dealLocationText}>{featuredEscape.duration}</Text>
                </View>

                {featuredEscape.isSpecialOffer && (
                  <View style={styles.dealSpecialTag}>
                    <Text style={styles.dealSpecialText}>Limited Offer</Text>
                  </View>
                )}
              </View>

              <View style={styles.dealBody}>
                <Text style={styles.dealTitle} numberOfLines={2}>{featuredEscape.title}</Text>

                <View style={styles.dealBottomRow}>
                  <View style={styles.dealPriceCol}>
                    <Text style={styles.dealFromLabel}>{t.startingFrom || 'Starting from'}</Text>
                    <Text style={styles.dealPriceVal}>{formatPrice(featuredEscape.price)}</Text>
                  </View>

                  <View style={styles.dealActionBtns}>
                    <TouchableOpacity
                      style={styles.dealItineraryBtn}
                      onPress={() => setItineraryPkg(featuredEscape)}
                      activeOpacity={0.8}
                    >
                      <Compass size={13} color={COLORS.primary} />
                      <Text style={styles.dealItineraryBtnText}>{t.viewItinerary || 'Itinerary'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.dealBookBtn}
                      onPress={() => setBookingPkg(featuredEscape)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.dealBookBtnText}>{t.bookNow || 'Book Now'}</Text>
                      <ArrowRight size={13} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ========================================================
            CURATED SANCTUARIES - SIGNATURE LUXURY EXPEDITIONS
            ======================================================== */}
        <View style={styles.luxurySectionHeader}>
          <View style={styles.luxuryEyebrowRow}>
            <View style={styles.luxuryBadgePill}>
              <Compass size={12} color="#d97706" />
              <Text style={styles.luxuryBadgeText}>CURATED SANCTUARIES</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
              <Text style={styles.viewAllText}>{t.viewAll || 'View All'} ({destinations.length})</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.luxurySectionTitle}>Signature Luxury Expeditions</Text>
          <Text style={styles.luxurySectionSubtitle}>
            Handpicked ultra-luxury retreats and bespoke private escapes across the globe.
          </Text>
        </View>

        {/* Dynamic Country Filter Pills for Destinations */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsScroll}>
          {COUNTRY_OPTIONS.map((c) => {
            const isActive = destCountryFilter === c;
            return (
              <TouchableOpacity
                key={c}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setDestCountryFilter(c)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {c === 'ALL' ? 'All Havens' : c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.destList}>
          {filteredDestinations.slice(0, 10).map((dest) => (
            <TouchableOpacity
              key={dest._id}
              style={styles.destCard}
              onPress={() => navigation.navigate('Explore', { query: dest.name })}
              activeOpacity={0.85}
            >
              <SafeImage
                uri={getDestinationImage(dest)}
                keywords={`${dest.name} ${dest.country}`}
                style={styles.destImage}
              />
              <View style={styles.destGradient} />
              <View style={styles.destInfo}>
                <Text style={styles.destName}>{dest.name}</Text>
                <View style={styles.destMeta}>
                  <MapPin size={10} color="#ffffff" />
                  <Text style={styles.destCountry}>{dest.country}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ========================================================
            EXPLORE TRAVEL PACKAGES - DISCOVER YOUR PERFECT JOURNEY
            ======================================================== */}
        <View 
          style={[styles.luxurySectionHeader, { marginTop: 28 }]}
          onLayout={(e) => setPackagesSectionY(e.nativeEvent.layout.y)}
        >
          <View style={styles.luxuryEyebrowRow}>
            <View style={styles.luxuryBadgePill}>
              <Sparkles size={12} color="#d97706" />
              <Text style={styles.luxuryBadgeText}>EXPLORE TRAVEL PACKAGES</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
              <Text style={styles.viewAllText}>{t.viewAll || 'View All'} ({packages.length})</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.luxurySectionTitle}>Discover your perfect journey</Text>
          <Text style={styles.luxurySectionSubtitle}>
            Immersive private itineraries crafted with five-star hospitality and seamless chauffeured discovery.
          </Text>
        </View>

        {/* Dynamic Country Filter Pills for Packages */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsScroll}>
          {COUNTRY_OPTIONS.map((c) => {
            const isActive = pkgCountryFilter === c;
            return (
              <TouchableOpacity
                key={c}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setPkgCountryFilter(c)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {c === 'ALL' ? 'All Packages' : c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.accent} style={{ marginVertical: 30 }} />
        ) : (
          <View style={styles.packagesGrid}>
            {filteredPackages.map((pkg) => {
              const isSaved = savedPackageIds.includes(pkg._id);
              const rating = pkg.reviewInfo?.averageRating || 5.0;
              return (
                <View key={pkg._id} style={styles.pkgCard}>
                  <View style={styles.pkgImgWrap}>
                    <SafeImage
                      uri={getPackageImage(pkg)}
                      keywords={`${pkg.title} ${pkg.destination} ${pkg.country}`}
                      style={styles.pkgImg}
                    />
                    <TouchableOpacity
                      style={styles.pkgHeart}
                      onPress={() => toggleSave(pkg._id)}
                      activeOpacity={0.8}
                    >
                      <Heart
                        size={15}
                        color={isSaved ? '#ff4d6d' : '#ffffff'}
                        fill={isSaved ? '#ff4d6d' : 'transparent'}
                      />
                    </TouchableOpacity>
                    <View style={styles.pkgRatingBadge}>
                      <Star size={11} color={COLORS.gold} fill={COLORS.gold} />
                      <Text style={styles.pkgRatingText}>{rating.toFixed(1)}</Text>
                    </View>
                    {pkg.isSpecialOffer && (
                      <View style={styles.pkgOfferBadge}>
                        <Text style={styles.pkgOfferBadgeText}>SPECIAL OFFER</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.pkgBody}>
                    <View style={styles.pkgLocationRow}>
                      <MapPin size={11} color={COLORS.accent} />
                      <Text style={styles.pkgLocationText} numberOfLines={1}>
                        {pkg.destination} · {pkg.duration}
                      </Text>
                    </View>

                    <Text style={styles.pkgTitle} numberOfLines={1}>{pkg.title}</Text>

                    <View style={styles.pkgFooterRow}>
                      <View>
                        <Text style={styles.pkgFromLabel}>{t.startingFrom || 'Starting from'}</Text>
                        <Text style={styles.pkgPrice}>{formatPrice(pkg.price)}</Text>
                      </View>

                      <View style={styles.pkgActionRow}>
                        <TouchableOpacity
                          style={styles.pkgItinBtn}
                          onPress={() => setItineraryPkg(pkg)}
                          activeOpacity={0.8}
                        >
                          <Compass size={12} color={COLORS.primary} />
                          <Text style={styles.pkgItinBtnText}>{t.viewItinerary || 'Itinerary'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.pkgBookBtn}
                          onPress={() => setBookingPkg(pkg)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.pkgBookBtnText}>{t.bookNow || 'Book Now'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ========================================================
            AESTHETIC DESTINATION SCRAPBOOK MOODBOARD (User Reference Collage)
            ======================================================== */}
        <View style={styles.scrapbookContainer}>
          {/* Top Scrapbook Header */}
          <View style={styles.scrapbookHeaderRow}>
            <View style={styles.scrapbookTicket}>
              <Text style={styles.scrapbookTicketNo}>№ 146017</Text>
              <Text style={styles.scrapbookTicketSub}>BOARDING PASS</Text>
            </View>
            <View style={styles.scrapbookTravelGuide}>
              <Text style={styles.scrapbookTravelText}>Travel</Text>
              <Text style={styles.scrapbookGuideText}>GUIDE</Text>
            </View>
          </View>

          <Text style={styles.scrapbookQuote}>
            “Travel is the only thing you buy that makes you richer.”
          </Text>

          {/* Dynamic Country Filter Pills for Moodboard */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsScrollInScrapbook}>
            {COUNTRY_OPTIONS.map((c) => {
              const isActive = galleryCountryFilter === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.scrapbookFilterPill, isActive && styles.scrapbookFilterPillActive]}
                  onPress={() => setGalleryCountryFilter(c)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.scrapbookFilterPillText, isActive && styles.scrapbookFilterPillTextActive]}>
                    {c === 'ALL' ? 'All Snapshots' : c}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Collage Slots Grid */}
          <View style={styles.scrapbookGrid}>
            {filteredGalleryDestinations.slice(0, 6).map((dest, idx) => {
              const rotations = ['-2deg', '2deg', '-1.5deg', '2.5deg', '-2deg', '1deg'];
              const rot = rotations[idx % rotations.length];
              return (
                <TouchableOpacity
                  key={dest._id || idx}
                  style={[styles.scrapbookItem, { transform: [{ rotate: rot }] }]}
                  onPress={() => navigation.navigate('Explore', { query: dest.name })}
                  activeOpacity={0.85}
                >
                  <View style={styles.scrapbookTape} />
                  <SafeImage
                    uri={getDestinationImage(dest)}
                    keywords={`${dest.name} ${dest.country}`}
                    style={styles.scrapbookItemImg}
                  />
                  <View style={styles.scrapbookItemMeta}>
                    <Text style={styles.scrapbookItemTitle} numberOfLines={1}>{dest.name}</Text>
                    <View style={styles.scrapbookItemLocationRow}>
                      <MapPin size={9} color="#d97706" />
                      <Text style={styles.scrapbookItemCountry}>{dest.country}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ========================================================
            VERIFIED GUEST REFLECTIONS (Lansakara Interactive Section)
            ======================================================== */}
        <View
          style={styles.reflectionsSection}
          onLayout={(e) => setReviewsSectionY(e.nativeEvent.layout.y)}
        >
          {/* Header */}
          <View style={styles.reflectionsHeaderWrap}>
            <View style={styles.luxuryBadgePill}>
              <Sparkles size={12} color="#d97706" />
              <Text style={styles.luxuryBadgeText}>DISCERNING GUESTS</Text>
            </View>
            <Text style={styles.reflectionsMainTitle}>Guest Reflections</Text>
            <Text style={styles.reflectionsMainSub}>
              Read authentic impressions and heartfelt reviews from global travellers experiencing our private expeditions.
            </Text>

            {/* Lansakara Summary Bar */}
            <View style={styles.reviewsSummaryBar}>
              <View style={styles.reviewsScorePill}>
                <Text style={styles.goldStarsText}>★★★★★</Text>
                <Text style={styles.scoreText}>4.9 / 5.0 Rating</Text>
                <Text style={styles.scoreCount}>· 1,420+ Explorers</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.btnWriteReview,
                  hasSubmittedReview && styles.btnWriteReviewSubmitted,
                ]}
                onPress={openReviewModal}
                activeOpacity={0.8}
              >
                <Sparkles size={14} color={hasSubmittedReview ? '#059669' : '#ffffff'} />
                <Text
                  style={[
                    styles.btnWriteReviewText,
                    hasSubmittedReview && styles.btnWriteReviewTextSubmitted,
                  ]}
                >
                  {hasSubmittedReview ? '✓ Review Shared' : 'Share Experience'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Testimonial Active Card Slider */}
          <View style={styles.testimonialSliderContainer}>
            {/* Prev Arrow */}
            <TouchableOpacity
              style={styles.sliderArrowBtn}
              onPress={() =>
                setActiveReviewIdx(
                  (prev) => (prev - 1 + displayReviews.length) % displayReviews.length
                )
              }
              activeOpacity={0.7}
            >
              <ChevronLeft size={18} color="#0c2738" />
            </TouchableOpacity>

            {/* Testimonial Card */}
            {displayReviews[activeReviewIdx] && (
              <View style={styles.testimonialCard}>
                <View style={styles.testimonialCardTop}>
                  <Text style={styles.goldStarsLarge}>
                    {'★'.repeat(displayReviews[activeReviewIdx].rating || 5)}
                    {'☆'.repeat(5 - (displayReviews[activeReviewIdx].rating || 5))}
                  </Text>
                  <Text style={styles.quoteIcon}>“</Text>
                </View>

                <Text style={styles.testimonialQuoteText} numberOfLines={5}>
                  {displayReviews[activeReviewIdx].comment}
                </Text>

                <View style={styles.testimonialAuthorWrap}>
                  <View style={styles.testimonialAvatar}>
                    <Text style={styles.testimonialAvatarText}>
                      {(displayReviews[activeReviewIdx].name?.charAt(0) || 'E').toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.testimonialNameRow}>
                      <Text style={styles.testimonialAuthorName}>
                        {displayReviews[activeReviewIdx].name}
                      </Text>
                      <View style={styles.verifiedBadge}>
                        <CircleCheck size={11} color="#0284c7" />
                        <Text style={styles.verifiedBadgeText}>Verified</Text>
                      </View>
                    </View>
                    <Text style={styles.testimonialMetaLocation}>
                      {displayReviews[activeReviewIdx].country}
                      {displayReviews[activeReviewIdx].packageTitle
                        ? ` · ${displayReviews[activeReviewIdx].packageTitle}`
                        : ''}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Next Arrow */}
            <TouchableOpacity
              style={styles.sliderArrowBtn}
              onPress={() =>
                setActiveReviewIdx((prev) => (prev + 1) % displayReviews.length)
              }
              activeOpacity={0.7}
            >
              <ChevronRight size={18} color="#0c2738" />
            </TouchableOpacity>
          </View>

          {/* Slider Dots */}
          <View style={styles.testimonialsDotsRow}>
            {displayReviews.slice(0, 8).map((_, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.testDot,
                  i === activeReviewIdx && styles.testDotActive,
                ]}
                onPress={() => setActiveReviewIdx(i)}
                activeOpacity={0.8}
              />
            ))}
          </View>
        </View>

        {/* ========================================================
            BESPOKE TRAVEL PLANS & TIERS (Web Plans Section)
            ======================================================== */}
        <View 
          style={styles.plansSection}
          onLayout={(e) => setPlansSectionY(e.nativeEvent.layout.y)}
        >
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionBadge}>BESPOKE SERVICE TIERS</Text>
              <Text style={styles.sectionTitle}>Tiered Travel Memberships</Text>
            </View>
          </View>

          <View style={styles.plansContainer}>
            {(travelPlans.length > 0 ? travelPlans : defaultTravelPlans).map((plan) => {
              const isSelected = selectedPlanId === plan._id;
              return (
                <View
                  key={plan._id}
                  style={[
                    styles.planCard,
                    plan.isPopular && styles.planCardPopular,
                    isSelected && styles.planCardSelected,
                  ]}
                >
                  {plan.isPopular && (
                    <View style={styles.planPopularBadge}>
                      <Text style={styles.planPopularText}>MOST POPULAR</Text>
                    </View>
                  )}
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planTag}>{plan.isPopular ? 'RECOMMENDED MEMBERSHIP' : 'BESPOKE CONCIERGE'}</Text>
                  <View style={styles.planPriceRow}>
                    <Text style={styles.planCurrency}>$</Text>
                    <Text style={styles.planPriceVal}>{plan.price}</Text>
                    <Text style={styles.planPeriod}>{plan.priceSuffix || '/ person'}</Text>
                  </View>

                  <View style={styles.planFeaturesList}>
                    {plan.features.map((feat, fIdx) => (
                      <View key={fIdx} style={styles.planFeatureItem}>
                        <Check size={14} color={isSelected ? '#2563eb' : '#10b981'} />
                        <Text style={styles.planFeatureText}>{feat}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.planSelectBtn,
                      plan.isPopular && styles.planSelectBtnPopular,
                      isSelected && styles.planSelectBtnActive,
                    ]}
                    onPress={() => handleSelectPlan(plan._id)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.planSelectBtnText,
                        plan.isPopular && styles.planSelectBtnTextPopular,
                        isSelected && styles.planSelectBtnTextActive,
                      ]}
                    >
                      {isSelected ? 'Selected ✓' : 'Select Plan'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* Web-Style Footer */}
        <View style={styles.homeFooter}>
          <View style={styles.homeFooterTop}>
            <Plane size={16} color="#38bdf8" />
            <Text style={styles.homeFooterBrand}>GLOBALVISTA ATELIER</Text>
          </View>
          <Text style={styles.homeFooterLocations}>Zurich · Interlaken · Colombo · Tokyo · Male</Text>
          <Text style={styles.homeFooterCopy}>Official Mobile Companion · Verified Expeditions</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ========================================================
          FLOATING WHATSAPP VIP CONCIERGE BUTTON
          ======================================================== */}
      <TouchableOpacity style={styles.floatingWhatsApp} onPress={() => openWhatsApp()} activeOpacity={0.85}>
        <WhatsAppIcon size={24} color="#ffffff" />
        <View>
          <Text style={styles.whatsAppSub}>{t.conciergeOnline || 'CONCIERGE ONLINE'}</Text>
          <Text style={styles.whatsAppTitle}>WhatsApp VIP</Text>
        </View>
      </TouchableOpacity>

      {/* ========================================================
          CINEMATIC DESTINATION PREVIEW MODAL (Watch Film with Video)
          ======================================================== */}
      <Modal visible={!!cinematicModalScene} animationType="slide" transparent>
        {cinematicModalScene && (
          <View style={styles.modalBackdrop}>
            <View style={styles.cinematicCard}>
              {/* Live High-Definition Video Player in Cinematic Modal */}
              <SafeVideoPlayer
                sourceUrl={cinematicModalScene.videoUrl}
                posterUrl={cinematicModalScene.image}
                style={styles.cinematicVideo}
                isMuted={false}
                autoPlay={true}
                nativeControls={true}
              />

              <TouchableOpacity
                style={styles.cinematicCloseBtn}
                onPress={() => setCinematicModalScene(null)}
                activeOpacity={0.8}
              >
                <X size={18} color="#ffffff" />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.cinematicContent}>
                <View style={styles.cinematicBadge}>
                  <Text style={styles.cinematicBadgeText}>{cinematicModalScene.flag} {cinematicModalScene.tag}</Text>
                </View>

                <Text style={styles.cinematicTitle}>{cinematicModalScene.title}</Text>
                <Text style={styles.cinematicSub}>{cinematicModalScene.subtitle}</Text>

                <View style={styles.cinematicHighlightsCard}>
                  <Text style={styles.cinematicHighlightsHeading}>EXCLUSIVE EXPEDITION HIGHLIGHTS:</Text>
                  {cinematicModalScene.highlights.map((h, i) => (
                    <View key={i} style={styles.cinematicHighlightRow}>
                      <ShieldCheck size={14} color="#38bdf8" />
                      <Text style={styles.cinematicHighlightText}>{h}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.cinematicInquireBtn}
                  onPress={() => {
                    const msg = `Hello GlobalVista, I am inquiring about the ${cinematicModalScene.title} (${cinematicModalScene.country}) expedition.`;
                    setCinematicModalScene(null);
                    openWhatsApp(msg);
                  }}
                  activeOpacity={0.85}
                >
                  <MessageCircle size={16} color="#ffffff" />
                  <Text style={styles.cinematicInquireText}>Inquire with Concierge</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>

      {/* Itinerary & Breakdown Modal */}
      <MobileItineraryModal
        visible={!!itineraryPkg}
        pkg={itineraryPkg}
        onClose={() => setItineraryPkg(null)}
        onBookNow={(p) => setBookingPkg(p)}
      />

      {/* Booking Modal */}
      <MobileBookingModal
        visible={!!bookingPkg}
        pkg={bookingPkg}
        preSelectedPlanId={selectedPlanId}
        onClose={() => setBookingPkg(null)}
        onSuccess={() => navigation.navigate('My Trips')}
        onNavigateToAuth={() => navigation.navigate('Profile')}
      />

      {/* ========================================================
          LANSAKARA-STYLE INTERACTIVE REVIEW SUBMISSION MODAL
          ======================================================== */}
      <Modal
        visible={isReviewModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsReviewModalOpen(false)}
      >
        <View style={styles.reviewModalOverlay}>
          <View style={styles.reviewModalBox}>
            <TouchableOpacity
              style={styles.reviewModalCloseBtn}
              onPress={() => setIsReviewModalOpen(false)}
              activeOpacity={0.75}
            >
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.reviewModalHeader}>
                <View style={styles.reviewModalEyebrowRow}>
                  <Sparkles size={12} color="#6fe0ff" />
                  <Text style={styles.reviewModalEyebrow}>DISCERNING TRAVEL REFLECTIONS</Text>
                </View>
                <Text style={styles.reviewModalTitle}>Share Your Expedition Experience</Text>
                <Text style={styles.reviewModalSubtitle}>
                  Your impressions inspire fellow travellers seeking world-class luxury journeys.
                </Text>
              </View>

              {reviewAlert.text ? (
                <View
                  style={[
                    styles.reviewAlertBox,
                    reviewAlert.type === 'success' ? styles.alertBoxSuccess : styles.alertBoxError,
                  ]}
                >
                  <Text
                    style={[
                      styles.reviewAlertText,
                      reviewAlert.type === 'success' ? styles.alertTextSuccess : styles.alertTextError,
                    ]}
                  >
                    {reviewAlert.text}
                  </Text>
                </View>
              ) : null}

              {/* Star Rating Selector */}
              <View style={styles.reviewFormGroup}>
                <Text style={styles.reviewFormLabel}>Overall Experience Rating *</Text>
                <View style={styles.starPickerRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setReviewRating(star)}
                      activeOpacity={0.7}
                      style={{ padding: 4 }}
                    >
                      <Star
                        size={28}
                        color={star <= reviewRating ? '#fbbf24' : '#475569'}
                        fill={star <= reviewRating ? '#fbbf24' : 'transparent'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.starRatingDesc}>
                  {reviewRating === 5 && '5 Stars · Flawless Luxury'}
                  {reviewRating === 4 && '4 Stars · Wonderful Journey'}
                  {reviewRating === 3 && '3 Stars · Good Expedition'}
                  {reviewRating === 2 && '2 Stars · Fair Experience'}
                  {reviewRating === 1 && '1 Star · Needs Improvement'}
                </Text>
              </View>

              {/* Full Name */}
              <View style={styles.reviewFormGroup}>
                <Text style={styles.reviewFormLabel}>Full Name *</Text>
                <TextInput
                  style={styles.reviewModalInput}
                  placeholder="e.g. Elena Rostova"
                  placeholderTextColor="#64748b"
                  value={formReviewerName}
                  onChangeText={setFormReviewerName}
                />
              </View>

              {/* Email Address */}
              <View style={styles.reviewFormGroup}>
                <Text style={styles.reviewFormLabel}>Email Address *</Text>
                <TextInput
                  style={styles.reviewModalInput}
                  placeholder="name@example.com"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formReviewerEmail}
                  onChangeText={setFormReviewerEmail}
                />
              </View>

              {/* Country / Residence */}
              <View style={styles.reviewFormGroup}>
                <Text style={styles.reviewFormLabel}>Country / Residence</Text>
                <TextInput
                  style={styles.reviewModalInput}
                  placeholder="e.g. Geneva, Switzerland"
                  placeholderTextColor="#64748b"
                  value={formReviewerCountry}
                  onChangeText={setFormReviewerCountry}
                />
              </View>

              {/* Expedition / Destination */}
              <View style={styles.reviewFormGroup}>
                <Text style={styles.reviewFormLabel}>Expedition / Destination *</Text>
                <TextInput
                  style={styles.reviewModalInput}
                  placeholder="e.g. Maldives Luxury Escape"
                  placeholderTextColor="#64748b"
                  value={formReviewerDestination}
                  onChangeText={setFormReviewerDestination}
                />
              </View>

              {/* Travel Impressions / Comment */}
              <View style={styles.reviewFormGroup}>
                <Text style={styles.reviewFormLabel}>Your Impressions & Travel Reflection *</Text>
                <TextInput
                  style={[styles.reviewModalInput, styles.reviewModalTextarea]}
                  placeholder="Describe your itinerary highlights, boutique accommodations, concierge support, and unforgettable moments..."
                  placeholderTextColor="#64748b"
                  multiline
                  numberOfLines={4}
                  value={formReviewerComment}
                  onChangeText={setFormReviewerComment}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.reviewModalActions}>
                <TouchableOpacity
                  style={styles.reviewCancelBtn}
                  onPress={() => setIsReviewModalOpen(false)}
                  disabled={submittingReview}
                  activeOpacity={0.7}
                >
                  <Text style={styles.reviewCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.reviewSubmitBtn, submittingReview && { opacity: 0.7 }]}
                  onPress={handleReviewSubmit}
                  disabled={submittingReview}
                  activeOpacity={0.85}
                >
                  <Send size={15} color="#ffffff" />
                  <Text style={styles.reviewSubmitBtnText}>
                    {submittingReview ? 'Publishing Review...' : 'Publish Review'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  /* Top Navbar (Original Clean White) */
  topNavbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    zIndex: 20,
    ...SHADOWS.small,
  },
  /* Left Brand Area (Original GlobalVista Style) */
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#0a192f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlobal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0a192f',
    letterSpacing: -0.4,
  },
  logoVista: {
    color: '#0284c7',
  },
  logoAtelierTag: {
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.2)',
  },
  logoAtelierText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#0284c7',
    letterSpacing: 0.6,
  },
  /* Right 4 Circular Action Buttons (Design & Alignment from Screenshot) */
  circleButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circleNavBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  circleNavBtnUser: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  circleAvatarInitial: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  circleRoleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 1,
    right: 1,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  /* Navigation Drawer (Original Clean White Style) */
  navDrawer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 16,
    zIndex: 19,
    ...SHADOWS.medium,
  },
  drawerPrefsBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  drawerPrefRow: {
    gap: 6,
  },
  drawerPrefLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  drawerPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  drawerPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  drawerPillActive: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0284c7',
  },
  drawerPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  drawerPillTextActive: {
    color: '#0284c7',
    fontWeight: '800',
  },
  navDrawerTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  navDrawerLinks: {
    gap: 6,
  },
  navDrawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  navDrawerItemActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  navDrawerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navDrawerItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  navDrawerItemTextActive: {
    color: '#ffffff',
  },
  offerBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  offerBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#b45309',
  },
  navDrawerConciergeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    borderRadius: 10,
  },
  navDrawerConciergeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  /* Category Nav Strip */
  categoryNavStrip: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  categoryNavScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  categoryPillTextActive: {
    color: '#ffffff',
  },
  /* Search Dropdown */
  searchDropdownWrap: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  /* Hero Section */
  heroSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0a192f',
    ...SHADOWS.large,
  },
  heroVideo: {
    width: '100%',
    height: 290,
    position: 'absolute',
  },
  heroImage: {
    width: '100%',
    height: 290,
    position: 'absolute',
  },
  heroOverlayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  heroControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingHorizontal: 12,
    zIndex: 10,
  },
  sceneTabsWrapper: {
    flex: 1,
    marginRight: 8,
  },
  sceneTabsRow: {
    gap: 6,
  },
  sceneTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  sceneTabPillActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.85)',
    borderColor: '#38bdf8',
  },
  sceneTabFlag: {
    fontSize: 12,
  },
  sceneTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  sceneTabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  sceneTabIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
    marginLeft: 2,
  },
  heroAudioToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroAudioToggleText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
  heroContentWrap: {
    padding: 16,
    paddingTop: 14,
  },
  heroEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  heroEyebrowLine: {
    width: 12,
    height: 2,
    backgroundColor: '#f59e0b',
  },
  heroEyebrowText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#f59e0b',
    letterSpacing: 1.1,
  },
  heroEyebrowDot: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
  },
  heroLocationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  heroMainTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  heroMainTitleItalic: {
    fontStyle: 'italic',
    color: '#38bdf8',
  },
  heroActionBtnsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  heroPrimaryBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    ...SHADOWS.small,
  },
  heroPrimaryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  heroWatchBtn: {
    flex: 0.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  heroWatchPlayCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWatchBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  /* Sleek Social Proof Banner */
  heroTrustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...SHADOWS.small,
  },
  heroAvatarStack: {
    flexDirection: 'row',
  },
  heroAvatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarInitial: {
    fontSize: 8,
    fontWeight: '800',
    color: '#ffffff',
  },
  heroTrustRatingWrap: {
    gap: 2,
  },
  heroStarsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  heroTrustRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  heroTrustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  heroTrustBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16a34a',
  },
  /* Featured Deal Card */
  featuredDealContainer: {
    paddingHorizontal: 16,
    marginTop: 14,
  },
  featuredDealCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...SHADOWS.medium,
  },
  dealTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  dealBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.6,
  },
  dealTopControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dealCounterBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  dealCounterText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#334155',
  },
  dealNavArrows: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dealNavArrowBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealProgressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  dealProgressBar: {
    height: '100%',
    backgroundColor: '#0284c7',
  },
  dealSpecialTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  dealSpecialText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#b45309',
  },
  dealPriceCol: {
    justifyContent: 'center',
  },
  dealMediaWrap: {
    height: 160,
    width: '100%',
    position: 'relative',
  },
  dealImg: {
    width: '100%',
    height: '100%',
  },
  dealImgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  dealLocationBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dealLocationText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  dealDot: {
    color: '#ffffff',
    fontSize: 10,
  },
  dealBody: {
    padding: 14,
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  dealBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  dealFromLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  dealPriceVal: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  dealActionBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  dealItineraryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dealItineraryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  dealBookBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dealBookBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  /* Luxury Section Header */
  luxurySectionHeader: {
    paddingHorizontal: 16,
    marginTop: 26,
    marginBottom: 6,
  },
  luxuryEyebrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  luxuryBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
    gap: 5,
  },
  luxuryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#d97706',
    letterSpacing: 1.1,
  },
  luxurySectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  luxurySectionSubtitle: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginTop: 4,
  },
  /* Country Filter Pills */
  filterPillsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  /* Aesthetic Scrapbook Moodboard Section */
  scrapbookContainer: {
    marginHorizontal: 16,
    marginTop: 32,
    marginBottom: 16,
    backgroundColor: '#fcfbf8',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#ede7df',
    padding: 16,
    ...SHADOWS.medium,
  },
  scrapbookHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scrapbookTicket: {
    borderWidth: 1,
    borderColor: '#b45309',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
  },
  scrapbookTicketNo: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#b45309',
    letterSpacing: 1.2,
  },
  scrapbookTicketSub: {
    fontSize: 9,
    fontWeight: '800',
    color: '#78350f',
  },
  scrapbookTravelGuide: {
    alignItems: 'flex-end',
  },
  scrapbookTravelText: {
    fontSize: 22,
    fontStyle: 'italic',
    fontWeight: '900',
    color: '#0f172a',
  },
  scrapbookGuideText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.5,
    color: '#d97706',
    marginTop: -4,
  },
  scrapbookQuote: {
    fontSize: 11.5,
    fontStyle: 'italic',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 10,
  },
  filterPillsScrollInScrapbook: {
    paddingVertical: 8,
    gap: 7,
    marginBottom: 12,
  },
  scrapbookFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  scrapbookFilterPillActive: {
    backgroundColor: '#b45309',
    borderColor: '#b45309',
  },
  scrapbookFilterPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748b',
  },
  scrapbookFilterPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  scrapbookGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  scrapbookItem: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...SHADOWS.small,
  },
  scrapbookTape: {
    position: 'absolute',
    top: -6,
    alignSelf: 'center',
    width: 42,
    height: 12,
    backgroundColor: 'rgba(254, 240, 138, 0.85)',
    transform: [{ rotate: '-3deg' }],
    borderRadius: 2,
    zIndex: 10,
  },
  scrapbookItemImg: {
    width: '100%',
    height: 120,
    borderRadius: 10,
  },
  scrapbookItemMeta: {
    paddingTop: 6,
    paddingHorizontal: 2,
  },
  scrapbookItemTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  scrapbookItemLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  scrapbookItemCountry: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  /* Section Header */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  /* Destinations List */
  destList: {
    paddingLeft: 16,
    paddingRight: 8,
    gap: 10,
  },
  destCard: {
    width: 135,
    height: 175,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.small,
  },
  destImage: {
    width: '100%',
    height: '100%',
  },
  destGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
  },
  destInfo: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  destName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  destMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  destCountry: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  /* Packages Grid */
  packagesGrid: {
    paddingHorizontal: 16,
    gap: 14,
  },
  pkgCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...SHADOWS.small,
  },
  pkgImgWrap: {
    height: 155,
    width: '100%',
    position: 'relative',
  },
  pkgImg: {
    width: '100%',
    height: '100%',
  },
  pkgHeart: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pkgRatingBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pkgRatingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  pkgOfferBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pkgOfferBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  pkgBody: {
    padding: 14,
  },
  pkgLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  pkgLocationText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  pkgTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  pkgFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  pkgFromLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  pkgPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  pkgActionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pkgItinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pkgItinBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  pkgBookBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pkgBookBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  /* Reflections / Reviews (Lansakara Interactive Design matching Web) */
  reflectionsSection: {
    marginTop: 28,
    marginBottom: 8,
  },
  reflectionsHeaderWrap: {
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  reflectionsMainTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0c2738',
    marginTop: 8,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  reflectionsMainSub: {
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    maxWidth: 320,
  },
  reviewsSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  reviewsScorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    borderRadius: 999,
    ...SHADOWS.small,
  },
  goldStarsText: {
    color: '#d4af37',
    fontSize: 12,
    letterSpacing: 1.5,
  },
  scoreText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0c2738',
  },
  scoreCount: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '600',
  },
  btnWriteReview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: '#0c2738',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    ...SHADOWS.small,
  },
  btnWriteReviewSubmitted: {
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    borderColor: 'rgba(5, 150, 105, 0.4)',
  },
  btnWriteReviewText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  btnWriteReviewTextSubmitted: {
    color: '#059669',
  },

  /* Testimonial Active Slider */
  testimonialSliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  sliderArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  testimonialCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...SHADOWS.medium,
  },
  testimonialCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  goldStarsLarge: {
    color: '#d4af37',
    fontSize: 15,
    letterSpacing: 2,
  },
  quoteIcon: {
    fontSize: 28,
    lineHeight: 28,
    fontWeight: '900',
    color: '#cbd5e1',
    fontFamily: 'serif',
  },
  testimonialQuoteText: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 19,
    fontStyle: 'italic',
    marginBottom: 14,
  },
  testimonialAuthorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  testimonialAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0c2738',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testimonialAvatarText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  testimonialNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  testimonialAuthorName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0c2738',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0284c7',
  },
  testimonialMetaLocation: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 2,
  },
  testimonialsDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
  },
  testDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#cbd5e1',
  },
  testDotActive: {
    width: 20,
    backgroundColor: '#0c2738',
  },

  /* Review Submission Modal Styles */
  reviewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 23, 38, 0.85)',
    justifyContent: 'center',
    padding: 16,
  },
  reviewModalBox: {
    backgroundColor: '#091e30',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    padding: 20,
    maxHeight: '85%',
    position: 'relative',
    ...SHADOWS.large,
  },
  reviewModalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  reviewModalHeader: {
    marginBottom: 16,
    paddingRight: 30,
  },
  reviewModalEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  reviewModalEyebrow: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#6fe0ff',
    letterSpacing: 1.4,
  },
  reviewModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 24,
  },
  reviewModalSubtitle: {
    fontSize: 11.5,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 16,
  },
  reviewAlertBox: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  alertBoxSuccess: {
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.5)',
  },
  alertBoxError: {
    backgroundColor: 'rgba(225, 29, 72, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.5)',
  },
  reviewAlertText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  alertTextSuccess: {
    color: '#34d399',
  },
  alertTextError: {
    color: '#fb7185',
  },
  reviewFormGroup: {
    marginBottom: 12,
  },
  reviewFormLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  starPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starRatingDesc: {
    fontSize: 11,
    color: '#d4af37',
    fontWeight: '700',
    marginTop: 4,
  },
  reviewModalInput: {
    backgroundColor: '#0f2942',
    borderWidth: 1,
    borderColor: '#1e3a5f',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
  },
  reviewModalTextarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  reviewModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
    paddingBottom: 4,
  },
  reviewCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  reviewCancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  reviewSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284c7',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  reviewSubmitBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  /* Plans Section */
  plansSection: {
    marginTop: 24,
  },
  plansContainer: {
    paddingHorizontal: 16,
    gap: 14,
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
    ...SHADOWS.small,
  },
  planCardPopular: {
    borderColor: '#0284c7',
    borderWidth: 2,
    backgroundColor: '#f0f9ff',
  },
  planPopularBadge: {
    position: 'absolute',
    top: -10,
    right: 18,
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  planPopularText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  planTag: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 0.8,
    marginTop: 2,
    marginBottom: 8,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  planCurrency: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  planPriceVal: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.primary,
  },
  planPeriod: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  planFeaturesList: {
    gap: 6,
    marginBottom: 14,
  },
  planFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planFeatureText: {
    fontSize: 11,
    color: '#475569',
  },
  planCardSelected: {
    borderColor: '#2563eb',
    borderWidth: 2,
    backgroundColor: '#eff6ff',
  },
  planSelectBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  planSelectBtnPopular: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  planSelectBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  planSelectBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  planSelectBtnTextPopular: {
    color: '#ffffff',
  },
  planSelectBtnTextActive: {
    color: '#ffffff',
  },
  /* Footer */
  homeFooter: {
    alignItems: 'center',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 24,
  },
  homeFooterTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  homeFooterBrand: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  homeFooterLocations: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  homeFooterCopy: {
    fontSize: 9,
    color: '#94a3b8',
  },
  /* Floating WhatsApp */
  floatingWhatsApp: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 25,
    zIndex: 30,
    ...SHADOWS.large,
  },
  whatsAppSub: {
    fontSize: 8,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  whatsAppTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  /* Cinematic Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    padding: 16,
  },
  cinematicCard: {
    backgroundColor: '#0a192f',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    maxHeight: '90%',
    ...SHADOWS.large,
  },
  cinematicVideo: {
    width: '100%',
    height: 230,
    backgroundColor: '#000000',
  },
  cinematicCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cinematicContent: {
    padding: 18,
  },
  cinematicBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  cinematicBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.8,
  },
  cinematicTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
  },
  cinematicSub: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 17,
    marginBottom: 14,
  },
  cinematicHighlightsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 6,
  },
  cinematicHighlightsHeading: {
    fontSize: 9,
    fontWeight: '900',
    color: '#f59e0b',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  cinematicHighlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cinematicHighlightText: {
    fontSize: 11,
    color: '#e2e8f0',
  },
  cinematicInquireBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 12,
  },
  cinematicInquireText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});

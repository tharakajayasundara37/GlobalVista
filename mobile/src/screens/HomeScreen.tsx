import React, { useState, useEffect, useRef } from 'react';
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
  ChevronRight,
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
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { ApiPackage, ApiDestination, api, getPackageImage, getDestinationImage } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, WHATSAPP_NUMBER, WHATSAPP_DEFAULT_MSG } from '../constants/config';
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
];

const GUEST_REFLECTIONS = [
  {
    id: '1',
    author: 'Dr. Julian Mercier',
    origin: 'Zurich, Switzerland',
    quote: 'The private Swiss chalet in Zermatt and helicopter flight over the Matterhorn was beyond perfection. Pure bespoke luxury.',
    rating: 5.0,
    tour: 'Matterhorn & Alpine Summits',
  },
  {
    id: '2',
    author: 'Elena & Marcus Vance',
    origin: 'London, United Kingdom',
    quote: 'From our Sigiriya private chauffeur to the tea plantation bungalow, GlobalVista delivered flawless concierge service.',
    rating: 5.0,
    tour: 'Sri Lanka Royal Citadel Tour',
  },
  {
    id: '3',
    author: 'Kenji & Aoi Takahashi',
    origin: 'Tokyo, Japan',
    quote: 'Our private overwater villa in Maldives exceeded all expectations. The seamless flight transfers and marine safari were unforgettable.',
    rating: 5.0,
    tour: 'Maldives Luxury Sanctuary',
  },
];

const TRAVEL_PLANS = [
  {
    name: 'Explorer Tier',
    tag: 'ESSENTIAL CONCIERGE',
    price: '99',
    period: 'per journey',
    features: ['Curated 4-Star & 5-Star Itineraries', '24/7 Digital Concierge Support', 'Airport & Hotel Private Transfers', 'Certified Multilingual Guide'],
  },
  {
    name: 'Atelier Signature',
    tag: 'MOST POPULAR · BESPOKE',
    price: '249',
    period: 'per journey',
    isPopular: true,
    features: ['Fully Handcrafted Bespoke Itineraries', 'Dedicated Personal Chauffeur & Luxury Vehicle', 'VIP Fast-Track Clearance & Lounge Access', 'Complimentary Luxury Welcome Hamper'],
  },
  {
    name: 'Imperial Presidential',
    tag: 'ULTRA LUXURY',
    price: '599',
    period: 'per journey',
    features: ['Helicopter & Seaplane Private Charters', 'Private Villa & Presidential Suite Bookings', '24/7 Personal Butler & Private Chef Access', 'All-Inclusive Michelin Dining Reservations'],
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
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'DESTINATIONS' | 'OFFERS' | 'REVIEWS' | 'PLANS'>('ALL');

  // Navbar and Hero State
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchBarVisible, setSearchBarVisible] = useState(false);
  const [selectedSceneIdx, setSelectedSceneIdx] = useState(0);
  const [isHeroMuted, setIsHeroMuted] = useState(true);

  // Cinematic Modal State
  const heroScenes = getHeroScenes(API_BASE_URL);
  const currentScene = heroScenes[selectedSceneIdx] || heroScenes[0];
  const [cinematicModalScene, setCinematicModalScene] = useState<typeof heroScenes[0] | null>(null);

  // Modals
  const [itineraryPkg, setItineraryPkg] = useState<ApiPackage | null>(null);
  const [bookingPkg, setBookingPkg] = useState<ApiPackage | null>(null);
  const [savedPackageIds, setSavedPackageIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pkgs, dests] = await Promise.all([
        api.getPackages(),
        api.getDestinations(),
      ]);
      setPackages(pkgs);
      setDestinations(dests);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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

  const featuredEscape = packages.find((p) => p.isSpecialOffer) || packages[0];

  // Filter packages based on activeCategory or search
  const filteredPackages = packages.filter((pkg) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        pkg.title.toLowerCase().includes(q) ||
        pkg.destination.toLowerCase().includes(q) ||
        pkg.country.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (activeCategory === 'OFFERS') return Boolean(pkg.isSpecialOffer);
    return true;
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
                scrollRef.current?.scrollTo({ y: 1200, animated: true });
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
                scrollRef.current?.scrollTo({ y: 1550, animated: true });
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
              scrollRef.current?.scrollTo({ y: 1200, animated: true });
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
              scrollRef.current?.scrollTo({ y: 1550, animated: true });
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
            <View style={styles.featuredDealCard}>
              <View style={styles.dealTopBar}>
                <View style={styles.dealBadge}>
                  <Sparkles size={12} color="#ffffff" />
                  <Text style={styles.dealBadgeText}>{t.featuredEscape || 'FEATURED ESCAPE'}</Text>
                </View>
                <View style={styles.dealLimitedTag}>
                  <Text style={styles.dealLimitedText}>Limited Offer</Text>
                </View>
              </View>

              <View style={styles.dealMediaWrap}>
                <Image source={{ uri: getPackageImage(featuredEscape) }} style={styles.dealImg} />
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
              </View>

              <View style={styles.dealBody}>
                <Text style={styles.dealTitle} numberOfLines={2}>{featuredEscape.title}</Text>

                <View style={styles.dealBottomRow}>
                  <View>
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
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ========================================================
            POPULAR DESTINATIONS SHOWCASE (Web Destinations)
            ======================================================== */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionBadge}>EXPLORE THE GLOBE</Text>
            <Text style={styles.sectionTitle}>{t.popularDestinations || 'Popular Destinations'}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
            <Text style={styles.viewAllText}>{t.viewAll || 'View All'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.destList}>
          {destinations.slice(0, 8).map((dest) => (
            <TouchableOpacity
              key={dest._id}
              style={styles.destCard}
              onPress={() => navigation.navigate('Explore', { query: dest.name })}
              activeOpacity={0.85}
            >
              <Image source={{ uri: getDestinationImage(dest) }} style={styles.destImage} />
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
            HANDCRAFTED PACKAGES & EXPERIENCES (Web Experiences)
            ======================================================== */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <View>
            <Text style={styles.sectionBadge}>CURATED ITINERARIES</Text>
            <Text style={styles.sectionTitle}>
              {activeCategory === 'OFFERS' ? 'Special Offers & Packages' : t.explorePackages || 'Handcrafted Packages'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
            <Text style={styles.viewAllText}>{t.viewAll || 'View All'}</Text>
          </TouchableOpacity>
        </View>

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
                    <Image source={{ uri: getPackageImage(pkg) }} style={styles.pkgImg} />
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
            VERIFIED GUEST REFLECTIONS (Web Reflections Section)
            ======================================================== */}
        <View style={styles.reflectionsSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionBadge}>VERIFIED TRAVELLERS</Text>
              <Text style={styles.sectionTitle}>Guest Reflections</Text>
            </View>
            <View style={styles.reflectionsRatingTag}>
              <Star size={12} color="#fbbf24" fill="#fbbf24" />
              <Text style={styles.reflectionsRatingVal}>4.9 / 5.0</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reflectionsScroll}>
            {GUEST_REFLECTIONS.map((ref) => (
              <View key={ref.id} style={styles.reflectionCard}>
                <View style={styles.reflectionStars}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={13} color="#fbbf24" fill="#fbbf24" />
                  ))}
                </View>
                <Text style={styles.reflectionQuote}>"{ref.quote}"</Text>
                <View style={styles.reflectionAuthorRow}>
                  <View style={styles.reflectionAvatar}>
                    <Text style={styles.reflectionAvatarText}>
                      {ref.author.split(' ').map((n) => n[0]).join('')}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.reflectionAuthorName}>{ref.author}</Text>
                    <Text style={styles.reflectionOrigin}>{ref.origin} · {ref.tour}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ========================================================
            BESPOKE TRAVEL PLANS & TIERS (Web Plans Section)
            ======================================================== */}
        <View style={styles.plansSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionBadge}>BESPOKE SERVICE TIERS</Text>
              <Text style={styles.sectionTitle}>Travel Plans & Concierge</Text>
            </View>
          </View>

          <View style={styles.plansContainer}>
            {TRAVEL_PLANS.map((plan, idx) => (
              <View key={idx} style={[styles.planCard, plan.isPopular && styles.planCardPopular]}>
                {plan.isPopular && (
                  <View style={styles.planPopularBadge}>
                    <Text style={styles.planPopularText}>MOST POPULAR</Text>
                  </View>
                )}
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planTag}>{plan.tag}</Text>
                <View style={styles.planPriceRow}>
                  <Text style={styles.planCurrency}>$</Text>
                  <Text style={styles.planPriceVal}>{plan.price}</Text>
                  <Text style={styles.planPeriod}>/{plan.period}</Text>
                </View>

                <View style={styles.planFeaturesList}>
                  {plan.features.map((feat, fIdx) => (
                    <View key={fIdx} style={styles.planFeatureItem}>
                      <Check size={14} color="#10b981" />
                      <Text style={styles.planFeatureText}>{feat}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.planSelectBtn, plan.isPopular && styles.planSelectBtnPopular]}
                  onPress={() => openWhatsApp(`Hello GlobalVista, I am interested in inquiring about the ${plan.name} Tier.`)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.planSelectBtnText, plan.isPopular && styles.planSelectBtnTextPopular]}>
                    Inquire Tier Details
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
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
        onClose={() => setBookingPkg(null)}
        onSuccess={() => navigation.navigate('My Trips')}
        onNavigateToAuth={() => navigation.navigate('Profile')}
      />
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
    backgroundColor: 'rgba(10, 25, 47, 0.60)',
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
  dealLimitedTag: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  dealLimitedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#b45309',
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
    backgroundColor: 'rgba(10, 25, 47, 0.35)',
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
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  dealBookBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
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
    backgroundColor: 'rgba(10, 25, 47, 0.38)',
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
  /* Reflections / Reviews */
  reflectionsSection: {
    marginTop: 24,
  },
  reflectionsRatingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  reflectionsRatingVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b45309',
  },
  reflectionsScroll: {
    paddingLeft: 16,
    paddingRight: 8,
    gap: 12,
  },
  reflectionCard: {
    width: SCREEN_WIDTH * 0.78,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...SHADOWS.small,
  },
  reflectionStars: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 8,
  },
  reflectionQuote: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  reflectionAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  reflectionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0a192f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reflectionAvatarText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  reflectionAuthorName: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  reflectionOrigin: {
    fontSize: 10,
    color: COLORS.textMuted,
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
  planSelectBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  planSelectBtnTextPopular: {
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

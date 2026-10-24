import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  MapPin,
  Clock,
  Star,
  Compass,
  Heart,
  X,
  RefreshCw,
  RotateCcw,
  ChevronDown,
  Check,
  Tag,
  ArrowUpDown,
  Globe,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { ApiPackage, api, getPackageImage } from '../services/api';
import { SafeImage } from '../components/SafeImage';
import { SafeVideoPlayer } from '../components/SafeVideoPlayer';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { WEB_BASE_URL } from '../constants/config';
import { MobileItineraryModal } from '../components/MobileItineraryModal';
import { MobileBookingModal } from '../components/MobileBookingModal';
import { MobilePaymentModal } from '../components/MobilePaymentModal';

const HERO_VIDEOS = [
  `${WEB_BASE_URL}/videos/globalvista-hero-2.mp4`,
  `${WEB_BASE_URL}/videos/globalvista-hero-3.mp4`,
  `${WEB_BASE_URL}/videos/globalvista-hero-4.mp4`,
  `${WEB_BASE_URL}/videos/globalvista-hero-5.mp4`,
];

const HERO_POSTERS = [
  'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?w=1200&q=80',
  'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&q=80',
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80',
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80',
];

type SortOption = 'FEATURED' | 'PRICE_LOW' | 'PRICE_HIGH' | 'RATING_HIGH' | 'DURATION_SHORT';

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'FEATURED', label: 'Featured & Recommended' },
  { id: 'PRICE_LOW', label: 'Price: Low to High' },
  { id: 'PRICE_HIGH', label: 'Price: High to Low' },
  { id: 'RATING_HIGH', label: 'Guest Rating (Highest)' },
  { id: 'DURATION_SHORT', label: 'Duration (Shortest)' },
];

interface Props {
  route: any;
  navigation: any;
}

export const ExploreScreen: React.FC<Props> = ({ route, navigation }) => {
  const initialQuery = route?.params?.query || '';
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();

  const [packages, setPackages] = useState<ApiPackage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Search & Filter States (Matching Destinations/Packages design)
  const [search, setSearch] = useState<string>(initialQuery);
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('FEATURED');
  const [showDealsOnly, setShowDealsOnly] = useState<boolean>(false);

  // Modal Dropdown Pickers
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);

  // Video Background Index Cycling
  const [videoIndex, setVideoIndex] = useState(0);

  // Spin animation for refresh button
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Modals
  const [itineraryPkg, setItineraryPkg] = useState<ApiPackage | null>(null);
  const [bookingPkg, setBookingPkg] = useState<ApiPackage | null>(null);
  const [paymentBooking, setPaymentBooking] = useState<any>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  // Cycle hero videos every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setVideoIndex((prev) => (prev + 1) % HERO_VIDEOS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadPackages();
  }, []);

  useEffect(() => {
    if (route?.params?.query !== undefined) {
      setSearch(route.params.query);
    }
  }, [route?.params?.query]);

  // Handle spin animation
  useEffect(() => {
    if (loading || refreshing) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
  }, [loading, refreshing, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await api.getPackages();
      setPackages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load packages in ExploreScreen:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPackages();
  };

  const toggleSave = (id: string) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Derive unique countries from packages
  const countriesList = useMemo(() => {
    const set = new Set<string>();
    packages.forEach((p) => {
      if (p.country && p.country.trim()) {
        set.add(p.country.trim());
      }
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [packages]);

  // Derive unique categories from packages
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    packages.forEach((p) => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    // Add default fallbacks if not populated
    ['Luxury', 'Adventure', 'Culture', 'Honeymoon'].forEach((c) => set.add(c));
    return ['ALL', ...Array.from(set).sort()];
  }, [packages]);

  // Reset all filters
  const resetAllFilters = () => {
    setSearch('');
    setSelectedCountry('ALL');
    setSelectedCategory('ALL');
    setSortBy('FEATURED');
    setShowDealsOnly(false);
  };

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedCountry !== 'ALL' ||
    selectedCategory !== 'ALL' ||
    sortBy !== 'FEATURED' ||
    showDealsOnly;

  // Filter & Sort packages (matching Web logic exactly)
  const filteredPackages = useMemo(() => {
    let result = [...packages];
    const q = search.trim().toLowerCase();

    if (q) {
      result = result.filter(
        (pkg) =>
          pkg.title?.toLowerCase().includes(q) ||
          pkg.destination?.toLowerCase().includes(q) ||
          pkg.country?.toLowerCase().includes(q) ||
          pkg.description?.toLowerCase().includes(q)
      );
    }

    if (selectedCountry !== 'ALL') {
      result = result.filter(
        (pkg) =>
          pkg.country?.toLowerCase() === selectedCountry.toLowerCase() ||
          pkg.destination?.toLowerCase().includes(selectedCountry.toLowerCase())
      );
    }

    if (selectedCategory !== 'ALL') {
      result = result.filter(
        (pkg) => pkg.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (showDealsOnly) {
      result = result.filter(
        (pkg) => pkg.isSpecialOffer || (pkg.discountPercentage && pkg.discountPercentage > 0)
      );
    }

    // Sort
    if (sortBy === 'PRICE_LOW') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'PRICE_HIGH') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'RATING_HIGH') {
      result.sort(
        (a, b) => (b.reviewInfo?.averageRating || 5) - (a.reviewInfo?.averageRating || 5)
      );
    } else if (sortBy === 'DURATION_SHORT') {
      const getDays = (d?: string) => parseInt(d || '0', 10) || 0;
      result.sort((a, b) => getDays(a.duration) - getDays(b.duration));
    }

    return result;
  }, [packages, search, selectedCountry, selectedCategory, showDealsOnly, sortBy]);

  const currentSortLabel =
    SORT_OPTIONS.find((s) => s.id === sortBy)?.label || 'Sort';

  // Render Header Component inside FlatList
  const renderListHeader = () => (
    <View style={styles.headerContainer}>
      {/* 1. Hero Video Backdrop (Clean, Loop, Zero Blue Color, Zero Text Overlay) */}
      <View style={styles.heroWrap}>
        <SafeVideoPlayer
          sourceUrl={HERO_VIDEOS[videoIndex]}
          posterUrl={HERO_POSTERS[videoIndex]}
          style={styles.heroVideo}
          isMuted={true}
          autoPlay={true}
          nativeControls={false}
        />
        <View style={styles.heroOverlay} />
      </View>

      {/* 2. Heading Section matching Destinations / Packages */}
      <View style={styles.headingBlock}>
        <View style={styles.headingTextWrap}>
          <Text style={styles.eyebrow}>CURATED EXPEDITIONS</Text>
          <Text style={styles.headingTitle}>
            {route?.params?.query || search.trim()
              ? `${route?.params?.query || search.trim()} Packages`
              : 'Popular Packages'}
          </Text>
          <Text style={styles.headingSubtitle}>
            Explore all handpicked luxury expeditions and tour itineraries available through GlobalVista.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={handleRefresh}
          disabled={loading || refreshing}
          activeOpacity={0.75}
        >
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <RefreshCw size={14} color="#445365" />
          </Animated.View>
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Unified Clean Toolbar matching Destinations */}
      <View style={styles.toolbarCard}>
        {/* Live Search Input Box */}
        <View style={styles.searchBox}>
          <Search size={17} color="#8391a0" />
          <TextInput
            style={styles.searchInput}
            placeholder={t.searchPlaceholder || 'Search destination, country or package...'}
            placeholderTextColor="#9aa6b2"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              style={styles.clearSearchBtn}
              activeOpacity={0.7}
            >
              <X size={15} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Dropdowns & Controls */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterControlsRow}
        >
          {/* Country Dropdown Pill */}
          <TouchableOpacity
            style={[styles.dropdownPill, selectedCountry !== 'ALL' && styles.dropdownPillActive]}
            onPress={() => setCountryModalVisible(true)}
            activeOpacity={0.75}
          >
            <Globe size={13} color={selectedCountry !== 'ALL' ? '#0284c7' : '#475467'} />
            <Text
              style={[styles.dropdownPillText, selectedCountry !== 'ALL' && styles.dropdownPillTextActive]}
              numberOfLines={1}
            >
              {selectedCountry === 'ALL' ? 'All Countries' : selectedCountry}
            </Text>
            <ChevronDown size={13} color={selectedCountry !== 'ALL' ? '#0284c7' : '#64748b'} />
          </TouchableOpacity>

          {/* Category Dropdown Pill */}
          <TouchableOpacity
            style={[styles.dropdownPill, selectedCategory !== 'ALL' && styles.dropdownPillActive]}
            onPress={() => setCategoryModalVisible(true)}
            activeOpacity={0.75}
          >
            <Compass size={13} color={selectedCategory !== 'ALL' ? '#0284c7' : '#475467'} />
            <Text
              style={[styles.dropdownPillText, selectedCategory !== 'ALL' && styles.dropdownPillTextActive]}
              numberOfLines={1}
            >
              {selectedCategory === 'ALL' ? 'All Categories' : selectedCategory}
            </Text>
            <ChevronDown size={13} color={selectedCategory !== 'ALL' ? '#0284c7' : '#64748b'} />
          </TouchableOpacity>

          {/* Sort Dropdown Pill */}
          <TouchableOpacity
            style={[styles.dropdownPill, sortBy !== 'FEATURED' && styles.dropdownPillActive]}
            onPress={() => setSortModalVisible(true)}
            activeOpacity={0.75}
          >
            <ArrowUpDown size={13} color={sortBy !== 'FEATURED' ? '#0284c7' : '#475467'} />
            <Text
              style={[styles.dropdownPillText, sortBy !== 'FEATURED' && styles.dropdownPillTextActive]}
              numberOfLines={1}
            >
              {currentSortLabel}
            </Text>
            <ChevronDown size={13} color={sortBy !== 'FEATURED' ? '#0284c7' : '#64748b'} />
          </TouchableOpacity>

          {/* Special Offers Toggle Pill */}
          <TouchableOpacity
            style={[styles.dealsToggleBtn, showDealsOnly && styles.dealsToggleBtnActive]}
            onPress={() => setShowDealsOnly(!showDealsOnly)}
            activeOpacity={0.75}
          >
            <Tag size={13} color={showDealsOnly ? '#ffffff' : '#c2410c'} />
            <Text style={[styles.dealsToggleText, showDealsOnly && styles.dealsToggleTextActive]}>
              Special Offers
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 4. Result Count & Reset Filters Bar */}
      <View style={styles.resultBar}>
        <Text style={styles.resultBarText}>
          Showing <Text style={styles.resultBarBold}>{filteredPackages.length}</Text> package
          {filteredPackages.length !== 1 ? 's' : ''}
          {packages.length > 0 ? ` (out of ${packages.length} total)` : ''}
          {route?.params?.query ? ` for ${route.params.query}` : ''}
        </Text>

        {hasActiveFilters && (
          <TouchableOpacity
            style={styles.resetFiltersBtn}
            onPress={resetAllFilters}
            activeOpacity={0.75}
          >
            <RotateCcw size={12} color="#0284c7" />
            <Text style={styles.resetFiltersBtnText}>Reset filters</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {loading && packages.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading curated expeditions...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPackages}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={renderListHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Compass size={44} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No expeditions found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search query, country, or category filters.
              </Text>
              {hasActiveFilters && (
                <TouchableOpacity
                  style={styles.emptyResetBtn}
                  onPress={resetAllFilters}
                  activeOpacity={0.8}
                >
                  <RotateCcw size={13} color="#ffffff" />
                  <Text style={styles.emptyResetBtnText}>Reset all filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const isSaved = savedIds.includes(item._id);
            const rating = item.reviewInfo?.averageRating || 5.0;
            const hasDiscount = item.isSpecialOffer || (item.discountPercentage && item.discountPercentage > 0);

            return (
              <View style={styles.card}>
                <View style={styles.imgWrap}>
                  <SafeImage
                    uri={getPackageImage(item)}
                    keywords={`${item.title} ${item.destination} ${item.country}`}
                    style={styles.image}
                  />

                  {/* Special Offer Discount Tag */}
                  {hasDiscount && (
                    <View style={styles.discountBadge}>
                      <Tag size={10} color="#ffffff" />
                      <Text style={styles.discountBadgeText}>
                        {item.discountPercentage ? `${item.discountPercentage}% OFF` : 'SPECIAL OFFER'}
                      </Text>
                    </View>
                  )}

                  {/* Heart / Favorite Button */}
                  <TouchableOpacity
                    style={styles.heartBtn}
                    onPress={() => toggleSave(item._id)}
                    activeOpacity={0.8}
                  >
                    <Heart
                      size={15}
                      color={isSaved ? '#ff4d6d' : '#ffffff'}
                      fill={isSaved ? '#ff4d6d' : 'transparent'}
                    />
                  </TouchableOpacity>

                  {/* Rating Badge */}
                  <View style={styles.ratingBadge}>
                    <Star size={11} color={COLORS.gold} fill={COLORS.gold} />
                    <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                  </View>
                </View>

                <View style={styles.body}>
                  <View style={styles.metaRow}>
                    <MapPin size={11} color={COLORS.accent} />
                    <Text style={styles.metaText}>
                      {item.destination}, {item.country}
                    </Text>
                    <Text style={styles.metaDot}>·</Text>
                    <Clock size={11} color={COLORS.textMuted} />
                    <Text style={styles.metaText}>{item.duration}</Text>
                  </View>

                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.desc} numberOfLines={2}>
                    {item.description}
                  </Text>

                  <View style={styles.footerRow}>
                    <View>
                      <Text style={styles.priceLabel}>{t.startingFrom}</Text>
                      <Text style={styles.priceVal}>{formatPrice(item.price)}</Text>
                    </View>

                    <View style={styles.btnRow}>
                      <TouchableOpacity
                        style={styles.itinBtn}
                        onPress={() => setItineraryPkg(item)}
                        activeOpacity={0.8}
                      >
                        <Compass size={13} color={COLORS.primary} />
                        <Text style={styles.itinBtnText}>{t.viewItinerary}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.bookBtn}
                        onPress={() => setBookingPkg(item)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.bookBtnText}>{t.bookNow}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* ========================================================
          MODAL SELECTOR: COUNTRY
          ======================================================== */}
      <Modal
        visible={countryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setCountryModalVisible(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Globe size={18} color="#0284c7" />
                <Text style={styles.modalTitle}>Select Country</Text>
              </View>
              <TouchableOpacity
                onPress={() => setCountryModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {countriesList.map((country) => {
                const isSelected = selectedCountry === country;
                return (
                  <TouchableOpacity
                    key={country}
                    style={[styles.modalItem, isSelected && styles.modalItemActive]}
                    onPress={() => {
                      setSelectedCountry(country);
                      setCountryModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextActive]}>
                      {country === 'ALL' ? 'All Countries' : country}
                    </Text>
                    {isSelected && <Check size={16} color="#0284c7" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ========================================================
          MODAL SELECTOR: CATEGORY
          ======================================================== */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setCategoryModalVisible(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Compass size={18} color="#0284c7" />
                <Text style={styles.modalTitle}>Select Category</Text>
              </View>
              <TouchableOpacity
                onPress={() => setCategoryModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {categoriesList.map((category) => {
                const isSelected = selectedCategory === category;
                return (
                  <TouchableOpacity
                    key={category}
                    style={[styles.modalItem, isSelected && styles.modalItemActive]}
                    onPress={() => {
                      setSelectedCategory(category);
                      setCategoryModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextActive]}>
                      {category === 'ALL' ? 'All Categories' : category}
                    </Text>
                    {isSelected && <Check size={16} color="#0284c7" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ========================================================
          MODAL SELECTOR: SORT
          ======================================================== */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setSortModalVisible(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <ArrowUpDown size={18} color="#0284c7" />
                <Text style={styles.modalTitle}>Sort Packages</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSortModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {SORT_OPTIONS.map((opt) => {
                const isSelected = sortBy === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.modalItem, isSelected && styles.modalItemActive]}
                    onPress={() => {
                      setSortBy(opt.id);
                      setSortModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextActive]}>
                      {opt.label}
                    </Text>
                    {isSelected && <Check size={16} color="#0284c7" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Itinerary Modal */}
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
        onPayNow={(created) => setPaymentBooking(created)}
      />

      {/* Payment Gateway Modal */}
      <MobilePaymentModal
        visible={!!paymentBooking}
        booking={paymentBooking}
        onClose={() => setPaymentBooking(null)}
        onPaymentSuccess={() => {
          setPaymentBooking(null);
          navigation.navigate('My Trips');
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 40,
  },
  headerContainer: {
    paddingBottom: 6,
  },

  /* 1. Hero Video Backdrop */
  heroWrap: {
    height: 180,
    width: '100%',
    position: 'relative',
    backgroundColor: '#070b14',
    overflow: 'hidden',
  },
  heroVideo: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.40)',
  },

  /* 2. Heading Section matching Destinations */
  headingBlock: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headingTextWrap: {
    flex: 1,
  },
  eyebrow: {
    color: '#1785f2',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#142033',
    lineHeight: 28,
  },
  headingSubtitle: {
    fontSize: 12,
    color: '#74818d',
    lineHeight: 18,
    marginTop: 4,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbe4ec',
    borderRadius: 10,
    ...SHADOWS.small,
  },
  refreshBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#445365',
  },

  /* 3. Toolbar matching Destinations */
  toolbarCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8ef',
    ...SHADOWS.small,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fbfd',
    borderWidth: 1,
    borderColor: '#dce5ed',
    borderRadius: 11,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#334155',
  },
  clearSearchBtn: {
    padding: 4,
  },
  filterControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
  },
  dropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dce5ed',
  },
  dropdownPillActive: {
    borderColor: '#70b9ef',
    backgroundColor: '#f0f9ff',
  },
  dropdownPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475467',
    maxWidth: 120,
  },
  dropdownPillTextActive: {
    color: '#0284c7',
  },
  dealsToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  dealsToggleBtnActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  dealsToggleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#c2410c',
  },
  dealsToggleTextActive: {
    color: '#ffffff',
  },

  /* 4. Result Bar */
  resultBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 8,
  },
  resultBarText: {
    fontSize: 11.5,
    color: '#8793a0',
    flex: 1,
  },
  resultBarBold: {
    fontWeight: '800',
    color: '#1785f2',
  },
  resetFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dce5ed',
  },
  resetFiltersBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
  },

  /* Card Styles */
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginHorizontal: 16,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  imgWrap: {
    height: 160,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ea580c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  heartBtn: {
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
  ratingBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  body: {
    padding: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  metaDot: {
    color: COLORS.textMuted,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  desc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 10,
  },
  priceLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  priceVal: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.primary,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  itinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itinBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  bookBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  bookBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },

  /* Empty Wrap */
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyResetBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  emptyResetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },

  /* Modal Styles */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginVertical: 2,
  },
  modalItemActive: {
    backgroundColor: '#f0f9ff',
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  modalItemTextActive: {
    color: '#0284c7',
    fontWeight: '800',
  },
});

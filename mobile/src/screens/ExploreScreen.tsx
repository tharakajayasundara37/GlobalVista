import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Clock, Star, Compass, Heart, X } from 'lucide-react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { ApiPackage, api, getPackageImage } from '../services/api';
import { SafeImage } from '../components/SafeImage';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { MobileItineraryModal } from '../components/MobileItineraryModal';
import { MobileBookingModal } from '../components/MobileBookingModal';

const CATEGORIES = ['All', 'Luxury', 'Adventure', 'Culture', 'Honeymoon'];

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
  const [search, setSearch] = useState<string>(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modals
  const [itineraryPkg, setItineraryPkg] = useState<ApiPackage | null>(null);
  const [bookingPkg, setBookingPkg] = useState<ApiPackage | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    loadPackages();
  }, []);

  useEffect(() => {
    if (route?.params?.query !== undefined) {
      setSearch(route.params.query);
    }
  }, [route?.params?.query]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await api.getPackages();
      setPackages(data);
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

  const filteredPackages = packages.filter((pkg) => {
    const q = search.trim().toLowerCase();
    const matchQuery =
      !q ||
      pkg.title.toLowerCase().includes(q) ||
      pkg.destination.toLowerCase().includes(q) ||
      pkg.country.toLowerCase().includes(q) ||
      pkg.description.toLowerCase().includes(q);

    const matchCat =
      selectedCategory === 'All' ||
      pkg.category?.toLowerCase() === selectedCategory.toLowerCase();

    return matchQuery && matchCat;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t.searchPlaceholder}
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Pills */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.catList}
          renderItem={({ item }) => {
            const isActive = selectedCategory === item;
            return (
              <TouchableOpacity
                style={[styles.catPill, isActive && styles.catPillActive]}
                onPress={() => setSelectedCategory(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.catText, isActive && styles.catTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Package List */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredPackages}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Compass size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No expeditions found</Text>
              <Text style={styles.emptySubtitle}>Try searching for Maldives, Switzerland, Japan, or Sri Lanka</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isSaved = savedIds.includes(item._id);
            const rating = item.reviewInfo?.averageRating || 5.0;
            return (
              <View style={styles.card}>
                <View style={styles.imgWrap}>
                  <SafeImage
                    uri={getPackageImage(item)}
                    keywords={`${item.title} ${item.destination} ${item.country}`}
                    style={styles.image}
                  />
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
                  <View style={styles.ratingBadge}>
                    <Star size={11} color={COLORS.gold} fill={COLORS.gold} />
                    <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                  </View>
                </View>

                <View style={styles.body}>
                  <View style={styles.metaRow}>
                    <MapPin size={11} color={COLORS.accent} />
                    <Text style={styles.metaText}>{item.destination}, {item.country}</Text>
                    <Text style={styles.metaDot}>·</Text>
                    <Clock size={11} color={COLORS.textMuted} />
                    <Text style={styles.metaText}>{item.duration}</Text>
                  </View>

                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>

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
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  catList: {
    paddingTop: 12,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  catTextActive: {
    color: '#ffffff',
  },
  list: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
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
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  },
});

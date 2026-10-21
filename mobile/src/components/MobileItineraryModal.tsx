import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { X, Calendar, Compass, Clock, MapPin, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { ApiPackage } from '../services/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ItineraryDay {
  day: number;
  title: string;
  theme: string;
  highlights: string[];
  meals: string;
  stay: string;
}

const ITINERARIES_BY_DESTINATION: Record<string, ItineraryDay[]> = {
  Maldives: [
    {
      day: 1,
      title: 'Arrival & Scenic Seaplane Transfer',
      theme: 'Overwater Luxury Check-in',
      highlights: ['VIP lounge reception at Velana Airport', '35-minute scenic twin-otter seaplane flight', 'Private butler orientation and champagne sunset welcome'],
      meals: 'Dinner at Lagoon Pavilion',
      stay: 'Overwater Sunset Pool Villa',
    },
    {
      day: 2,
      title: 'Manta Ray & Coral Reef Safari',
      theme: 'Marine Wilderness Discovery',
      highlights: ['Morning private catamaran excursion with resident marine biologist', 'Snorkel alongside gentle manta rays and sea turtles', 'Afternoon therapeutic signature spa on the water'],
      meals: 'Floating Breakfast · Seafood Grill Dinner',
      stay: 'Overwater Sunset Pool Villa',
    },
    {
      day: 3,
      title: 'Castaway Sandbank & Stargazing Cruise',
      theme: 'Exclusive Island Privacy',
      highlights: ['Private chef picnic on an uninhabited powder-white sandbank', 'Paddleboarding & clear-bottom kayaking in azure lagoon', 'Evening champagne sunset dolphin cruise'],
      meals: 'Breakfast · Sandbank Lunch · 5-Course Dinner',
      stay: 'Overwater Sunset Pool Villa',
    },
    {
      day: 4,
      title: 'Underwater Dining & Departure Farewell',
      theme: 'Culinary Magic & Departure',
      highlights: ['Six meters undersea multi-course wine pairing lunch', 'Final afternoon lagoon swim and bespoke souvenir gift', 'Scenic return seaplane to Malé for international flight'],
      meals: 'Undersea Lunch · Departure Refreshments',
      stay: 'Late checkout arranged',
    },
  ],
  Switzerland: [
    {
      day: 1,
      title: 'Arrival in Zurich & First-Class Glacier Rail',
      theme: 'Alpine Crossing to Zermatt',
      highlights: ['First-class Swiss Travel Pass panoramic rail journey through Rhine Valley', 'Arrival in car-free Zermatt with horse-drawn electro-carriage escort', 'Fireside welcome fondue dinner overlooking Matterhorn'],
      meals: 'Welcome Alpine Dinner',
      stay: 'Grand Hotel Zermatterhof',
    },
    {
      day: 2,
      title: 'Matterhorn Glacier Paradise & Heli-Tour',
      theme: 'Highest Cableway in Europe',
      highlights: ['Ascent to Matterhorn Glacier Paradise (3,883m)', 'Private scenic helicopter flight circling iconic peak summits', 'Thermal mineral bath recovery session in historic spa'],
      meals: 'Breakfast · Mountain Peak Chalet Lunch',
      stay: 'Grand Hotel Zermatterhof',
    },
    {
      day: 3,
      title: 'Interlaken & Lake Brienz Cruise',
      theme: 'Turquoise Waters & Waterfalls',
      highlights: ['Private lake steamer charter across crystal Lake Brienz', 'Visit to historic Giessbach waterfalls and Grandhotel terrace', 'Swiss chocolate masterclass with artisanal chocolatier'],
      meals: 'Breakfast · Lake Terrace Dinner',
      stay: 'Victoria-Jungfrau Grand Hotel & Spa',
    },
  ],
  Japan: [
    {
      day: 1,
      title: 'Tokyo Arrival & Neon Skyline Welcome',
      theme: 'Modern Metropolis & Fine Dining',
      highlights: ['Private executive chauffeur transfer to luxury high-rise hotel', 'Michelin-starred Omakase sushi dinner in Ginza', 'Private evening access to Roppongi Hills panoramic observation deck'],
      meals: 'Omakase Dinner',
      stay: 'Aman Tokyo',
    },
    {
      day: 2,
      title: 'Shinkansen Gran Class & Kyoto Shrines',
      theme: 'Imperial Kyoto & Ancient Zen',
      highlights: ['Bullet train Gran Class crossing Mt. Fuji panorama to Kyoto', 'Exclusive after-hours private tour of Fushimi Inari torii gates', 'Authentic master tea ceremony in historic Gion tea house'],
      meals: 'Breakfast · Kaiseki Multi-Course Feast',
      stay: 'The Ritz-Carlton Kyoto',
    },
    {
      day: 3,
      title: 'Bamboo Groves & Onsen Hot Springs Retreat',
      theme: 'Arashiyama & Thermal Rejuvenation',
      highlights: ['Private rickshaw traversal through Arashiyama bamboo forest', 'Zen meditation session with head monk at Tenryu-ji', 'Outdoor natural volcanic onsen mineral bath under cedar pines'],
      meals: 'Breakfast · Ryokan Traditional Dinner',
      stay: 'Hoshinoya Kyoto',
    },
  ],
  'Sri Lanka': [
    {
      day: 1,
      title: 'Colombo Arrival & Colonial Heritage Drive',
      theme: 'Tropical Emerald Welcome',
      highlights: ['VIP expedited airport immigration & luxury chauffeur escort', 'Scenic flight to Cultural Triangle over misty emerald paddy fields', 'Sunset cocktails at historic water pavilion'],
      meals: 'Welcome Dinner',
      stay: 'Water Garden Sigiriya',
    },
    {
      day: 2,
      title: 'Sigiriya Lion Rock Citadel & Safari',
      theme: '5th-Century Wonder & Wildlife',
      highlights: ['Sunrise climb of royal rock citadel before public entry', 'Private naturalist 4x4 safari tracking Asian wild elephant herds in Minneriya', 'Traditional Ayurvedic herbal massage therapy'],
      meals: 'Breakfast · Village Heritage Lunch · Pavilion Dinner',
      stay: 'Water Garden Sigiriya',
    },
    {
      day: 3,
      title: 'Misty Tea Country & Nuwara Eliya',
      theme: 'Highland Estates & Waterfalls',
      highlights: ['Scenic colonial train ride through Nine Arches bridge and misty ravines', 'Private plucking and single-origin tea tasting with senior planter', 'High tea at Grand Hotel British colonial ballroom'],
      meals: 'Breakfast · High Tea · Fireplace Dinner',
      stay: 'Ceylon Tea Trails Bungalow',
    },
  ],
};

interface Props {
  visible: boolean;
  onClose: () => void;
  pkg: ApiPackage | null;
  onBookNow: (pkg: ApiPackage) => void;
}

export const MobileItineraryModal: React.FC<Props> = ({ visible, onClose, pkg, onBookNow }) => {
  const [expandedDay, setExpandedDay] = useState<number>(1);

  if (!pkg) return null;

  const destKey = Object.keys(ITINERARIES_BY_DESTINATION).find(
    (k) =>
      pkg.destination?.toLowerCase().includes(k.toLowerCase()) ||
      pkg.country?.toLowerCase().includes(k.toLowerCase())
  );

  const days: ItineraryDay[] = destKey
    ? ITINERARIES_BY_DESTINATION[destKey]
    : [
        {
          day: 1,
          title: `Arrival in ${pkg.destination}`,
          theme: 'Private Welcome & Orientation',
          highlights: ['Chauffeur VIP arrival transfer to luxury hotel', 'Concierge itinerary walk-through & welcome gifts', 'Evening sunset welcome dinner'],
          meals: 'Welcome Dinner',
          stay: 'Boutique 5-Star Resort',
        },
        {
          day: 2,
          title: `Iconic Highlights of ${pkg.country || pkg.destination}`,
          theme: 'Guided Explorer Expedition',
          highlights: ['Private expert guide & executive transport', 'Skip-the-line entrance to top architectural & cultural landmarks', 'Scenic lunch overlooking top vistas'],
          meals: 'Breakfast · Gourmet Lunch',
          stay: 'Boutique 5-Star Resort',
        },
        {
          day: 3,
          title: 'Leisure Day & Departure Elegance',
          theme: 'Relaxation & Farewell',
          highlights: ['Morning private wellness treatment or shopping concierge', 'Farewell afternoon refreshments', 'Luxury airport escort for international flight'],
          meals: 'Breakfast · Farewell Refreshment',
          stay: 'Late check-out arranged',
        },
      ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.tagWrap}>
                <Compass size={13} color={COLORS.accent} />
                <Text style={styles.tagText}>{pkg.destination} · {pkg.duration}</Text>
              </View>
              <Text style={styles.modalTitle} numberOfLines={1}>{pkg.title}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Subtitle Bar */}
          <View style={styles.subBar}>
            <View style={styles.subBarItem}>
              <Calendar size={14} color={COLORS.accent} />
              <Text style={styles.subBarText}>{days.length} Curated Days</Text>
            </View>
            <View style={styles.subBarItem}>
              <CheckCircle size={14} color={COLORS.success} />
              <Text style={styles.subBarText}>VIP Concierge Inspected</Text>
            </View>
          </View>

          {/* Scrollable Day List */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {days.map((item) => {
              const isExpanded = expandedDay === item.day;
              return (
                <View key={item.day} style={[styles.dayCard, isExpanded && styles.dayCardExpanded]}>
                  <TouchableOpacity
                    style={styles.dayCardHeader}
                    onPress={() => setExpandedDay(isExpanded ? 0 : item.day)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.dayBadge}>
                      <Text style={styles.dayBadgeText}>Day {item.day}</Text>
                    </View>
                    <View style={styles.dayTitleWrap}>
                      <Text style={styles.dayTheme}>{item.theme}</Text>
                      <Text style={styles.dayMainTitle}>{item.title}</Text>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={18} color={COLORS.accent} />
                    ) : (
                      <ChevronDown size={18} color={COLORS.textMuted} />
                    )}
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.dayExpandedBody}>
                      <Text style={styles.sectionLabel}>HIGHLIGHTS & EXPERIENCES</Text>
                      {item.highlights.map((h, i) => (
                        <View key={i} style={styles.bulletRow}>
                          <View style={styles.bulletDot} />
                          <Text style={styles.bulletText}>{h}</Text>
                        </View>
                      ))}

                      <View style={styles.metaRow}>
                        <View style={styles.metaCol}>
                          <Clock size={12} color={COLORS.accent} />
                          <Text style={styles.metaTitle}>Meals: </Text>
                          <Text style={styles.metaValue}>{item.meals}</Text>
                        </View>
                        <View style={styles.metaCol}>
                          <MapPin size={12} color={COLORS.accent} />
                          <Text style={styles.metaTitle}>Stay: </Text>
                          <Text style={styles.metaValue}>{item.stay}</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer Action */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.bookNowBtn}
              onPress={() => {
                onClose();
                onBookNow(pkg);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.bookNowText}>Reserve This Itinerary</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 25, 47, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.88,
    paddingTop: 16,
    ...SHADOWS.large,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  tagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.primary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  subBarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subBarText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  dayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    overflow: 'hidden',
  },
  dayCardExpanded: {
    borderColor: COLORS.accent,
    backgroundColor: '#fcfeff',
  },
  dayCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  dayBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 12,
  },
  dayBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  dayTitleWrap: {
    flex: 1,
  },
  dayTheme: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  dayMainTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dayExpandedBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accentDark,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    marginTop: 6,
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
  metaRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: 6,
  },
  metaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  metaValue: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: '#ffffff',
  },
  bookNowBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  bookNowText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
});

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X, Calendar, Users, Check, ShieldCheck, Sparkles, Crown, Car, Globe, ChevronDown, CheckCircle } from 'lucide-react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { ApiPackage, ApiTravelPlan, api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  pkg: ApiPackage | null;
  onSuccess: () => void;
  onNavigateToAuth?: () => void;
  preSelectedPlanId?: string;
}

export const MobileBookingModal: React.FC<Props> = ({
  visible,
  onClose,
  pkg,
  onSuccess,
  onNavigateToAuth,
  preSelectedPlanId,
}) => {
  const { user, token } = useAuth();
  const { formatPrice } = useCurrency();

  const [travelDate, setTravelDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [guests, setGuests] = useState<number>(2);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [plans, setPlans] = useState<ApiTravelPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(preSelectedPlanId || '');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [vehicleType, setVehicleType] = useState<'CAR' | 'VAN' | 'BUS' | 'NONE'>('CAR');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ALL');
  const [availableGuides, setAvailableGuides] = useState<any[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<string>('');
  const [guideDropdownOpen, setGuideDropdownOpen] = useState<boolean>(false);
  const [vehiclePricing, setVehiclePricing] = useState<{ pricePerKm: number; carRatePerKm: number; vanRatePerKm: number; busRatePerKm: number }>({ pricePerKm: 100, carRatePerKm: 100, vanRatePerKm: 150, busRatePerKm: 250 });

  useEffect(() => {
    if (visible) {
      AsyncStorage.getItem('globalvista_selected_travel_plan').then((stored) => {
        const targetId = preSelectedPlanId || stored;
        api.getTravelPlans().then((res) => {
          if (res && res.length > 0) {
            setPlans(res);
            const chosen = targetId && res.find((p) => p._id === targetId);
            if (chosen) {
              setSelectedPlanId(chosen._id);
            } else {
              const popular = res.find((p) => p.isPopular) || res[0];
              setSelectedPlanId((prev) => (res.some((p) => p._id === prev) ? prev : popular._id));
            }
          }
        });
      });
      api.getApprovedGuides().then((guides) => {
        if (Array.isArray(guides)) {
          setAvailableGuides(guides);
        }
      }).catch(() => {});
      api.getVehiclePricing().then((p) => {
        if (p) setVehiclePricing(p);
      }).catch(() => {});
    }
  }, [visible, preSelectedPlanId]);

  const availableLanguages = React.useMemo(() => {
    const set = new Set<string>();
    availableGuides.forEach((g) => {
      const langs = Array.isArray(g.languages) ? g.languages : (g.languages ? [g.languages] : []);
      langs.forEach((l: string) => {
        if (l && l.trim()) set.add(l.trim());
      });
    });
    ['English', 'Sinhala', 'Tamil', 'French', 'German', 'Russian', 'Chinese', 'Italian', 'Spanish'].forEach((l) => set.add(l));
    return Array.from(set).sort();
  }, [availableGuides]);

  const filteredGuides = React.useMemo(() => {
    return availableGuides.filter((g) => {
      if (selectedLanguage !== 'ALL') {
        const langs = Array.isArray(g.languages) ? g.languages : (g.languages ? [g.languages] : []);
        const matchesLang = langs.some((l: string) => l.toLowerCase().includes(selectedLanguage.toLowerCase()));
        if (!matchesLang) return false;
      }
      if (vehicleType !== 'NONE') {
        if (g.vehicleType && g.vehicleType.toUpperCase() !== vehicleType.toUpperCase()) {
          return false;
        }
      }
      return true;
    });
  }, [availableGuides, selectedLanguage, vehicleType]);

  const activeSelectedGuide = React.useMemo(() => {
    if (selectedGuideId) {
      return availableGuides.find((g) => (g._id || g.id) === selectedGuideId) || filteredGuides[0];
    }
    return filteredGuides[0];
  }, [availableGuides, filteredGuides, selectedGuideId]);

  if (!pkg) return null;

  const toggleAddOn = (id: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Calculate total
  const selectedPlan = plans.find((p) => p._id === selectedPlanId);
  const planPrice = selectedPlan ? selectedPlan.price : 0;
  const baseCost = pkg.price * guests;
  const planCost = planPrice * guests;
  const addOnsCost = (pkg.addOns || [])
    .filter((a) => selectedAddOns.includes(a._id))
    .reduce((sum, a) => sum + (a.pricingType === 'PER_PERSON' ? a.price * guests : a.price), 0);
  const tripDistance = (pkg as any).distanceKm || 150;
  const ratePerKm = vehicleType === 'BUS' ? vehiclePricing.busRatePerKm : vehicleType === 'VAN' ? vehiclePricing.vanRatePerKm : vehiclePricing.carRatePerKm;
  const vehicleFare = vehicleType !== 'NONE' ? Math.round(tripDistance * ratePerKm) : 0;
  const assignedPlate = activeSelectedGuide?.vehicleNumber || 'WP CAC-1234';
  const effectiveGuideId = selectedGuideId || (activeSelectedGuide ? (activeSelectedGuide._id || activeSelectedGuide.id) : undefined);
  const totalCost = baseCost + planCost + addOnsCost + vehicleFare;

  const handleSubmit = async () => {
    if (!token) {
      Alert.alert(
        'Please Register and Apply',
        'Please register or sign in as a verified traveller before applying for this booking. (Booking එක apply කිරීමට කරුණාකර පළමුව Register හෝ Sign In වන්න).',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign In / Register',
            onPress: () => {
              onClose();
              if (onNavigateToAuth) onNavigateToAuth();
            },
          },
        ]
      );
      return;
    }

    if (!travelDate.trim()) {
      Alert.alert('Required', 'Please enter a valid travel date.');
      return;
    }

    const planIdToSubmit = selectedPlanId || plans[0]?._id || '';

    try {
      setSubmitting(true);
      await api.createBooking(
        {
          packageId: pkg._id,
          travelPlanId: planIdToSubmit,
          travelDate,
          numberOfPeople: guests,
          selectedAddOnIds: selectedAddOns,
          vehicleType: vehicleType !== 'NONE' ? vehicleType : undefined,
          vehicleNumber: vehicleType !== 'NONE' ? assignedPlate : undefined,
          assignedGuideId: vehicleType !== 'NONE' ? effectiveGuideId : undefined,
          distanceKm: tripDistance,
        },
        token
      );
      Alert.alert(
        'Expedition Confirmed! 🎉',
        `Your reservation for ${pkg.title} has been received. Our VIP concierge team will reach out to you shortly.`,
        [
          {
            text: 'View My Trips',
            onPress: () => {
              onClose();
              onSuccess();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Booking Error', err.message || 'Could not complete booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>RESERVE YOUR EXPEDITION</Text>
              <Text style={styles.title} numberOfLines={1}>{pkg.title}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Travel Date */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                <Calendar size={13} color={COLORS.accent} /> TRAVEL DATE (YYYY-MM-DD)
              </Text>
              <TextInput
                style={styles.input}
                value={travelDate}
                onChangeText={setTravelDate}
                placeholder="2026-11-20"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            {/* Guests */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                <Users size={13} color={COLORS.accent} /> NUMBER OF TRAVELLERS
              </Text>
              <View style={styles.counterRow}>
                <TouchableOpacity
                  style={[styles.counterBtn, guests <= 1 && styles.counterBtnDisabled]}
                  onPress={() => setGuests(Math.max(1, guests - 1))}
                  disabled={guests <= 1}
                >
                  <Text style={styles.counterBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterVal}>{guests} {guests === 1 ? 'Guest' : 'Guests'}</Text>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => setGuests(guests + 1)}
                >
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Travel Service Tier */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                <Crown size={13} color={COLORS.accent} /> SERVICE TIER (EXPERIENCE LEVEL)
              </Text>
              {plans.map((p) => {
                const isSelected = p._id === selectedPlanId;
                return (
                  <TouchableOpacity
                    key={p._id}
                    style={[styles.planCard, isSelected && styles.planCardActive]}
                    onPress={() => {
                      setSelectedPlanId(p._id);
                      AsyncStorage.setItem('globalvista_selected_travel_plan', p._id).catch(() => {});
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.planTop}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={[styles.planRadio, isSelected && styles.planRadioActive]}>
                          {isSelected && <View style={styles.planRadioInner} />}
                        </View>
                        <Text style={[styles.planName, isSelected && styles.planNameActive]}>
                          {p.name}
                        </Text>
                        {p.isPopular && (
                          <View style={styles.popularBadge}>
                            <Text style={styles.popularText}>RECOMMENDED</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.planPrice, isSelected && styles.planPriceActive]}>
                        +{formatPrice(p.price)}/p
                      </Text>
                    </View>
                    <Text style={styles.planFeatures}>
                      {p.features?.slice(0, 3).join(' · ')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Add-on Extras */}
            {pkg.addOns && pkg.addOns.length > 0 && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  <Sparkles size={13} color={COLORS.accent} /> BESPOKE ADD-ONS & UPGRADES
                </Text>
                {pkg.addOns.map((add) => {
                  const isChecked = selectedAddOns.includes(add._id);
                  return (
                    <TouchableOpacity
                      key={add._id}
                      style={[styles.addOnCard, isChecked && styles.addOnCardChecked]}
                      onPress={() => toggleAddOn(add._id)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.checkBox, isChecked && styles.checkBoxChecked]}>
                        {isChecked && <Check size={13} color="#ffffff" strokeWidth={3} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.addOnName}>{add.name}</Text>
                        <Text style={styles.addOnType}>
                          {add.pricingType === 'PER_PERSON' ? 'Per Person' : 'Per Booking'}
                        </Text>
                      </View>
                      <Text style={styles.addOnPrice}>+{formatPrice(add.price)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Vehicle & Multilingual Tour Guide Section */}
            <View style={styles.fieldGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.fieldLabel}>
                  <Car size={13} color={COLORS.accent} /> TRANSPORT &amp; CERTIFIED TOUR GUIDE
                </Text>
                {vehicleType !== 'NONE' && (
                  <View style={styles.ratePill}>
                    <Text style={styles.ratePillText}>{tripDistance} km · {formatPrice(ratePerKm)}/km</Text>
                  </View>
                )}
              </View>

              {/* Priority 1: Tourist Spoken Language */}
              <View style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={styles.subFieldLabel}>1. Tourist Preferred Spoken Language</Text>
                  <View style={styles.priorityBadge}>
                    <Text style={styles.priorityBadgeText}>PRIORITY #1</Text>
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
                  <TouchableOpacity
                    style={[styles.langChip, selectedLanguage === 'ALL' && styles.langChipActive]}
                    onPress={() => setSelectedLanguage('ALL')}
                    activeOpacity={0.8}
                  >
                    <Globe size={11} color={selectedLanguage === 'ALL' ? '#ffffff' : COLORS.textSecondary} />
                    <Text style={[styles.langChipText, selectedLanguage === 'ALL' && styles.langChipTextActive]}>
                      All Languages
                    </Text>
                  </TouchableOpacity>
                  {availableLanguages.map((lang) => {
                    const isSel = selectedLanguage === lang;
                    return (
                      <TouchableOpacity
                        key={lang}
                        style={[styles.langChip, isSel && styles.langChipActive]}
                        onPress={() => setSelectedLanguage(lang)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.langChipText, isSel && styles.langChipTextActive]}>
                          🗣️ {lang}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Priority 2: Vehicle Type */}
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.subFieldLabel}>2. Vehicle Category</Text>
                <View style={styles.vehicleGrid}>
                  {[
                    { type: 'CAR', label: 'Car', seats: '1-4 Seats', icon: '🚗' },
                    { type: 'VAN', label: 'Van', seats: '5-10 Seats', icon: '🚐' },
                    { type: 'BUS', label: 'Bus', seats: '15+ Seats', icon: '🚌' },
                    { type: 'NONE', label: 'None', seats: 'Guide only', icon: '🚶' },
                  ].map((v) => {
                    const isSel = vehicleType === v.type;
                    return (
                      <TouchableOpacity
                        key={v.type}
                        style={[styles.vehicleBtn, isSel && styles.vehicleBtnActive]}
                        onPress={() => {
                          const newType = v.type as any;
                          setVehicleType(newType);
                          if (newType !== 'NONE') {
                            const matching = availableGuides.filter((g) => {
                              if (selectedLanguage !== 'ALL') {
                                const langs = Array.isArray(g.languages) ? g.languages : [g.languages || ''];
                                if (!langs.some((l: string) => l.toLowerCase().includes(selectedLanguage.toLowerCase()))) return false;
                              }
                              return g.vehicleType?.toUpperCase() === newType.toUpperCase();
                            });
                            if (matching.length > 0 && !matching.some((g) => (g._id || g.id) === selectedGuideId)) {
                              setSelectedGuideId(matching[0]._id || matching[0].id);
                            }
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={{ fontSize: 18, marginBottom: 2 }}>{v.icon}</Text>
                        <Text style={[styles.vehicleBtnLabel, isSel && styles.vehicleBtnLabelActive]}>{v.label}</Text>
                        <Text style={styles.vehicleBtnSeats}>{v.seats}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Priority 3: Tour Guide Dropdown / Selector */}
              {vehicleType !== 'NONE' && (
                <View style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={styles.subFieldLabel}>3. Tour Guide (with Vehicle &amp; Plate)</Text>
                    <Text style={styles.guideCountText}>{filteredGuides.length} certified guides</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.guideDropdownTrigger}
                    onPress={() => setGuideDropdownOpen(!guideDropdownOpen)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1, paddingRight: 6 }}>
                      <Text style={styles.guideDropdownSelectedName} numberOfLines={1}>
                        {selectedGuideId && activeSelectedGuide
                          ? `${activeSelectedGuide.name} — ${activeSelectedGuide.vehicleType || vehicleType} (${activeSelectedGuide.vehicleNumber || 'WP CAC-1234'})`
                          : '⚡ Auto-assign Top Licensed Guide & Vehicle'}
                      </Text>
                      <Text style={styles.guideDropdownSelectedSub} numberOfLines={1}>
                        {selectedGuideId && activeSelectedGuide
                          ? `${Array.isArray(activeSelectedGuide.languages) ? activeSelectedGuide.languages.join(', ') : 'English'} · ${activeSelectedGuide.experienceYears || 1}y exp`
                          : 'GlobalVista Concierge automatically matches best certified guide'}
                      </Text>
                    </View>
                    <ChevronDown size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>

                  {/* Guide Options list when open */}
                  {guideDropdownOpen && (
                    <View style={styles.guideOptionsList}>
                      <TouchableOpacity
                        style={[styles.guideOptionItem, !selectedGuideId && styles.guideOptionItemActive]}
                        onPress={() => {
                          setSelectedGuideId('');
                          setGuideDropdownOpen(false);
                        }}
                      >
                        <Text style={[styles.guideOptionTitle, !selectedGuideId && styles.guideOptionTitleActive]}>
                          ⚡ Auto-assign Top Rated Licensed Guide
                        </Text>
                        <Text style={styles.guideOptionSub}>
                          System automatically assigns an approved driver with {vehicleType}
                        </Text>
                      </TouchableOpacity>

                      {filteredGuides.map((g) => {
                        const gId = g._id || g.id;
                        const isChosen = selectedGuideId === gId;
                        const plate = g.vehicleNumber || 'WP CAC-1234';
                        const langs = Array.isArray(g.languages) ? g.languages.join(', ') : (g.languages || 'English');
                        return (
                          <TouchableOpacity
                            key={gId}
                            style={[styles.guideOptionItem, isChosen && styles.guideOptionItemActive]}
                            onPress={() => {
                              setSelectedGuideId(gId);
                              if (g.vehicleType && g.vehicleType !== 'NONE') {
                                setVehicleType(g.vehicleType.toUpperCase());
                              }
                              setGuideDropdownOpen(false);
                            }}
                          >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text style={[styles.guideOptionTitle, isChosen && styles.guideOptionTitleActive]}>
                                {g.name}
                              </Text>
                              <View style={styles.miniPlate}>
                                <Text style={styles.miniPlateText}>{plate}</Text>
                              </View>
                            </View>
                            <Text style={styles.guideOptionSub}>
                              {g.vehicleType || vehicleType} · {langs} · {g.experienceYears || 1}y exp
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              {/* Priority 4: Verified Guide Badge Preview */}
              {vehicleType !== 'NONE' && activeSelectedGuide && (
                <View style={styles.guidePreviewCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={styles.guideAvatar}>
                        <Text style={styles.guideAvatarText}>
                          {activeSelectedGuide.name?.charAt(0) || 'G'}
                        </Text>
                      </View>
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.guideCardName}>{activeSelectedGuide.name}</Text>
                          <View style={styles.verifiedTag}>
                            <Text style={styles.verifiedTagText}>✓ VERIFIED</Text>
                          </View>
                        </View>
                        <Text style={styles.guideCardSub}>
                          {activeSelectedGuide.experienceYears || 1}+ Yrs Exp · {activeSelectedGuide.city || 'Sri Lanka'}
                        </Text>
                      </View>
                    </View>

                    {/* Sri Lanka Number Plate Badge */}
                    <View style={styles.slPlateBadge}>
                      <Text style={styles.slPlateCountry}>LK</Text>
                      <Text style={styles.slPlateNumber}>
                        {activeSelectedGuide.vehicleNumber || 'WP CAC-1234'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.guideCardBottom}>
                    <Text style={styles.guideCardLangs}>
                      🗣️ {Array.isArray(activeSelectedGuide.languages) ? activeSelectedGuide.languages.join(', ') : (activeSelectedGuide.languages || 'English')}
                    </Text>
                    <Text style={styles.guideCardFare}>
                      +{formatPrice(vehicleFare)}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Trust badge */}
            <View style={styles.trustBadge}>
              <ShieldCheck size={16} color={COLORS.success} />
              <Text style={styles.trustText}>Official GlobalVista Vouchers · 2-Hour Concierge Response</Text>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer Total & Button */}
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>TOTAL ESTIMATE</Text>
                <Text style={styles.totalSubtitle}>{guests} {guests === 1 ? 'traveller' : 'travellers'} · All inclusive</Text>
              </View>
              <Text style={styles.totalAmount}>{formatPrice(totalCost)}</Text>
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitText}>
                  {token ? 'Confirm & Reserve Expedition' : 'Sign In to Complete Booking'}
                </Text>
              )}
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
    backgroundColor: 'rgba(10, 25, 47, 0.75)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: 16,
    ...SHADOWS.large,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    maxWidth: 260,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 6,
    justifyContent: 'space-between',
  },
  counterBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  counterBtnDisabled: {
    opacity: 0.4,
  },
  counterBtnText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
  },
  counterVal: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  planCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  planCardActive: {
    borderColor: COLORS.accent,
    backgroundColor: '#f0faff',
  },
  planTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadioActive: {
    borderColor: COLORS.accent,
  },
  planRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  planName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  planNameActive: {
    color: COLORS.accentDark,
  },
  popularBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  popularText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#b45309',
  },
  planPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  planPriceActive: {
    color: COLORS.accentDark,
  },
  planFeatures: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginLeft: 22,
  },
  addOnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  addOnCardChecked: {
    borderColor: COLORS.accent,
    backgroundColor: '#f0faff',
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxChecked: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  addOnName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  addOnType: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  addOnPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  subFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  priorityBadge: {
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.accent,
  },
  ratePill: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accentDark,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  langChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  langChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  langChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  vehicleGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  vehicleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#f8fafc',
  },
  vehicleBtnActive: {
    backgroundColor: '#f0f9ff',
    borderColor: COLORS.accent,
    borderWidth: 1.5,
  },
  vehicleBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  vehicleBtnLabelActive: {
    color: COLORS.accentDark,
  },
  vehicleBtnSeats: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  guideCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },
  guideDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  guideDropdownSelectedName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  guideDropdownSelectedSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  guideOptionsList: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 10,
    marginTop: 4,
    ...SHADOWS.medium,
    overflow: 'hidden',
  },
  guideOptionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  guideOptionItemActive: {
    backgroundColor: '#f0f9ff',
  },
  guideOptionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  guideOptionTitleActive: {
    color: COLORS.accentDark,
  },
  guideOptionSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  miniPlate: {
    backgroundColor: '#fef08a',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  miniPlateText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
  },
  guidePreviewCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  guideAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  guideCardName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  verifiedTag: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  verifiedTagText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#15803d',
  },
  guideCardSub: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  slPlateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#facc15',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 4,
  },
  slPlateCountry: {
    fontSize: 8,
    fontWeight: '800',
    color: '#000000',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    paddingRight: 3,
  },
  slPlateNumber: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  guideCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 6,
  },
  guideCardLangs: {
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.accentDark,
    flex: 1,
  },
  guideCardFare: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.success,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginTop: 6,
  },
  trustText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: '#ffffff',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  totalSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});

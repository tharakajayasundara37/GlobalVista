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
import { X, Calendar, Users, Check, ShieldCheck, Sparkles, Crown } from 'lucide-react-native';
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
}

export const MobileBookingModal: React.FC<Props> = ({
  visible,
  onClose,
  pkg,
  onSuccess,
  onNavigateToAuth,
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
  const [selectedPlanId, setSelectedPlanId] = useState<string>('6ac9cbea9a0ec138e6e680df'); // default to Premium
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      api.getTravelPlans().then((res) => {
        if (res && res.length > 0) {
          setPlans(res);
          const popular = res.find((p) => p.isPopular) || res[0];
          setSelectedPlanId((prev) => (prev ? prev : popular._id));
        }
      });
    }
  }, [visible]);

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
  const totalCost = baseCost + planCost + addOnsCost;

  const handleSubmit = async () => {
    if (!token) {
      Alert.alert(
        'Sign In Required',
        'Please sign in or register to book your luxury escape.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign In',
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
                    onPress={() => setSelectedPlanId(p._id)}
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

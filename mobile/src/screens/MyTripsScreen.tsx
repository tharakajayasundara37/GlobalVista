import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar,
  Users,
  MapPin,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShieldCheck,
  UserRound,
  FileText,
  CreditCard,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { ApiBooking, api, getPackageImage, ApiPackage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { WHATSAPP_NUMBER } from '../constants/config';
import { MobileInvoiceModal } from '../components/MobileInvoiceModal';
import { MobilePaymentModal } from '../components/MobilePaymentModal';
import { WhatsAppIcon } from '../components/WhatsAppIcon';

interface Props {
  navigation: any;
}

export const MyTripsScreen: React.FC<Props> = ({ navigation }) => {
  const { user, token } = useAuth();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();

  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Invoice & Payment modal states
  const [invoiceBooking, setInvoiceBooking] = useState<ApiBooking | null>(null);
  const [paymentBooking, setPaymentBooking] = useState<ApiBooking | null>(null);

  useEffect(() => {
    if (token) {
      loadBookings();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadBookings = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await api.getUserBookings(token);
      setBookings(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const contactConciergeForTrip = (booking: ApiBooking) => {
    const pkg = typeof booking.packageId === 'object' ? booking.packageId : null;
    const msg = `Hello GlobalVista Concierge, I am inquiring about my expedition ${pkg?.title || ''} (Booking ID: ${booking._id})`;
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`);
  };

  if (!token) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.authPrompt}>
          <View style={styles.authIconWrap}>
            <UserRound size={36} color={COLORS.accent} />
          </View>
          <Text style={styles.authPromptTitle}>Sign In to View Trips</Text>
          <Text style={styles.authPromptSub}>{t.signInToView}</Text>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.85}
          >
            <Text style={styles.signInBtnText}>{t.signIn} / {t.register}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.myBookings}</Text>
        <Text style={styles.subtitle}>
          {bookings.length} {bookings.length === 1 ? 'Expedition' : 'Expeditions'} · VIP Concierge Service
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>{t.noBookings}</Text>
              <Text style={styles.emptySubtitle}>Explore our handcrafted journeys and reserve your next escape.</Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => navigation.navigate('Explore')}
                activeOpacity={0.8}
              >
                <Text style={styles.exploreBtnText}>Discover Expeditions</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const pkg = typeof item.packageId === 'object' ? (item.packageId as ApiPackage) : null;
            const status = item.status || 'CONFIRMED';
            const isPaid = item.paymentStatus === 'PAID';

            return (
              <View style={styles.card}>
                {pkg && (
                  <Image source={{ uri: getPackageImage(pkg) }} style={styles.cardImg} />
                )}

                <View style={styles.cardBody}>
                  {/* Status row */}
                  <View style={styles.statusRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {/* Booking Status Badge */}
                      <View
                        style={[
                          styles.statusBadge,
                          status === 'CONFIRMED'
                            ? styles.statusConfirmed
                            : status === 'PENDING'
                            ? styles.statusPending
                            : styles.statusCancelled,
                        ]}
                      >
                        {status === 'CONFIRMED' ? (
                          <CheckCircle2 size={12} color="#166534" />
                        ) : (
                          <Clock size={12} color="#854d0e" />
                        )}
                        <Text
                          style={[
                            styles.statusText,
                            status === 'CONFIRMED'
                              ? styles.statusTextConfirmed
                              : status === 'PENDING'
                              ? styles.statusTextPending
                              : styles.statusTextCancelled,
                          ]}
                        >
                          {status}
                        </Text>
                      </View>

                      {/* Payment Status Badge */}
                      <View style={[styles.payBadge, isPaid ? styles.payBadgePaid : styles.payBadgeUnpaid]}>
                        <Text style={[styles.payBadgeText, isPaid ? styles.payBadgeTextPaid : styles.payBadgeTextUnpaid]}>
                          {isPaid ? 'PAID' : 'PAYMENT DUE'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.refId}>#{item._id.slice(-6).toUpperCase()}</Text>
                  </View>

                  <Text style={styles.pkgTitle}>{pkg?.title || 'Luxury Expedition'}</Text>

                  {pkg?.destination && (
                    <View style={styles.metaRow}>
                      <MapPin size={12} color={COLORS.accent} />
                      <Text style={styles.metaText}>{pkg.destination}, {pkg.country}</Text>
                    </View>
                  )}

                  <View style={styles.detailsBox}>
                    <View style={styles.detailCol}>
                      <Calendar size={13} color={COLORS.textSecondary} />
                      <Text style={styles.detailLabel}>Travel Date</Text>
                      <Text style={styles.detailVal}>{item.travelDate || 'Not set'}</Text>
                    </View>

                    <View style={styles.detailCol}>
                      <Users size={13} color={COLORS.textSecondary} />
                      <Text style={styles.detailLabel}>Travellers</Text>
                      <Text style={styles.detailVal}>{item.numberOfPeople} {item.numberOfPeople === 1 ? 'Guest' : 'Guests'}</Text>
                    </View>

                    <View style={styles.detailCol}>
                      <ShieldCheck size={13} color={COLORS.textSecondary} />
                      <Text style={styles.detailLabel}>Total Bill</Text>
                      <Text style={[styles.detailVal, { color: COLORS.primary, fontWeight: '800' }]}>
                        {formatPrice(item.totalPrice)}
                      </Text>
                    </View>
                  </View>

                  {/* Billing Action Buttons */}
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.invoiceBtn}
                      onPress={() => setInvoiceBooking(item)}
                      activeOpacity={0.8}
                    >
                      <FileText size={13} color={COLORS.primary} />
                      <Text style={styles.invoiceBtnText}>View Bill</Text>
                    </TouchableOpacity>

                    {!isPaid && (
                      <TouchableOpacity
                        style={styles.payBtn}
                        onPress={() => setPaymentBooking(item)}
                        activeOpacity={0.8}
                      >
                        <CreditCard size={13} color="#ffffff" />
                        <Text style={styles.payBtnText}>Pay Now</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Concierge Contact */}
                  <TouchableOpacity
                    style={styles.chatConciergeBtn}
                    onPress={() => contactConciergeForTrip(item)}
                    activeOpacity={0.8}
                  >
                    <WhatsAppIcon size={14} color="#ffffff" />
                    <Text style={styles.chatConciergeText}>WhatsApp Concierge for this Trip</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Itemized Invoice / Bill Modal */}
      <MobileInvoiceModal
        visible={!!invoiceBooking}
        booking={invoiceBooking}
        onClose={() => setInvoiceBooking(null)}
        onPayNow={(b) => {
          setInvoiceBooking(null);
          setPaymentBooking(b);
        }}
      />

      {/* Checkout / Payment Modal */}
      <MobilePaymentModal
        visible={!!paymentBooking}
        booking={paymentBooking}
        onClose={() => setPaymentBooking(null)}
        onPaymentSuccess={loadBookings}
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  list: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.small,
  },
  cardImg: {
    width: '100%',
    height: 150,
  },
  cardBody: {
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusConfirmed: {
    backgroundColor: '#f0fdf4',
  },
  statusPending: {
    backgroundColor: '#fefce8',
  },
  statusCancelled: {
    backgroundColor: '#fef2f2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  statusTextConfirmed: {
    color: '#166534',
  },
  statusTextPending: {
    color: '#854d0e',
  },
  statusTextCancelled: {
    color: '#991b1b',
  },
  payBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  payBadgePaid: {
    backgroundColor: '#dcfce7',
  },
  payBadgeUnpaid: {
    backgroundColor: '#fef3c7',
  },
  payBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  payBadgeTextPaid: {
    color: '#15803d',
  },
  payBadgeTextUnpaid: {
    color: '#b45309',
  },
  refId: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  pkgTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  detailsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  detailCol: {
    gap: 3,
  },
  detailLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  invoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  invoiceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  payBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 10,
  },
  payBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  chatConciergeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 11,
    borderRadius: 10,
  },
  chatConciergeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
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
    paddingHorizontal: 30,
  },
  exploreBtn: {
    marginTop: 18,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  exploreBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  authPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  authIconWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  authPromptTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  authPromptSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  signInBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  signInBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

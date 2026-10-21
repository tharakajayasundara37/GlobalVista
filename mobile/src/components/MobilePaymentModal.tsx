import React, { useState } from 'react';
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
import {
  X,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Wallet,
  Building2,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { ApiBooking, ApiPackage, api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  booking: ApiBooking | null;
  onPaymentSuccess: () => void;
}

export const MobilePaymentModal: React.FC<Props> = ({
  visible,
  onClose,
  booking,
  onPaymentSuccess,
}) => {
  const { token } = useAuth();
  const { formatPrice, currentCurrency } = useCurrency();

  const [method, setMethod] = useState<'CARD' | 'WALLET' | 'ARRIVAL'>('CARD');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('888');
  const [processing, setProcessing] = useState(false);

  if (!booking) return null;

  const pkg = typeof booking.packageId === 'object' ? (booking.packageId as ApiPackage) : null;

  const handlePay = async () => {
    if (!token) {
      Alert.alert('Authentication Required', 'Please sign in to proceed with payment.');
      return;
    }

    try {
      setProcessing(true);
      const txnId = `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const paymentMethodStr =
        method === 'CARD'
          ? 'CREDIT_CARD'
          : method === 'WALLET'
          ? 'APPLE_PAY'
          : 'PAY_AT_ARRIVAL';

      await api.createPayment(
        {
          bookingId: booking._id,
          paymentMethod: paymentMethodStr,
          transactionId: txnId,
        },
        token
      );

      Alert.alert(
        'Payment Successful! 💳✨',
        `Your payment of ${formatPrice(booking.totalPrice)} for ${pkg?.title || 'your expedition'} has been confirmed.\nTransaction ID: ${txnId}`,
        [
          {
            text: 'View Confirmed Trips',
            onPress: () => {
              onClose();
              onPaymentSuccess();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Payment Error', err.message || 'Transaction could not be completed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerEyebrow}>SECURE CHECKOUT</Text>
              <Text style={styles.headerTitle}>Settle Expedition Bill</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={18} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Amount Summary Card */}
            <View style={styles.amountCard}>
              <View>
                <Text style={styles.amountLabel}>AMOUNT DUE</Text>
                <Text style={styles.amountPkg} numberOfLines={1}>{pkg?.title || 'Expedition'}</Text>
              </View>
              <Text style={styles.amountValue}>{formatPrice(booking.totalPrice)}</Text>
            </View>

            {/* Payment Method Selector */}
            <Text style={styles.sectionTitle}>SELECT PAYMENT METHOD</Text>
            <View style={styles.methodsRow}>
              <TouchableOpacity
                style={[styles.methodPill, method === 'CARD' && styles.methodPillActive]}
                onPress={() => setMethod('CARD')}
                activeOpacity={0.8}
              >
                <CreditCard size={15} color={method === 'CARD' ? COLORS.accentDark : COLORS.textMuted} />
                <Text style={[styles.methodText, method === 'CARD' && styles.methodTextActive]}>
                  Credit Card
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.methodPill, method === 'WALLET' && styles.methodPillActive]}
                onPress={() => setMethod('WALLET')}
                activeOpacity={0.8}
              >
                <Wallet size={15} color={method === 'WALLET' ? COLORS.accentDark : COLORS.textMuted} />
                <Text style={[styles.methodText, method === 'WALLET' && styles.methodTextActive]}>
                  Digital Wallet
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.methodPill, method === 'ARRIVAL' && styles.methodPillActive]}
                onPress={() => setMethod('ARRIVAL')}
                activeOpacity={0.8}
              >
                <Building2 size={15} color={method === 'ARRIVAL' ? COLORS.accentDark : COLORS.textMuted} />
                <Text style={[styles.methodText, method === 'ARRIVAL' && styles.methodTextActive]}>
                  On Arrival
                </Text>
              </TouchableOpacity>
            </View>

            {/* Card Inputs */}
            {method === 'CARD' && (
              <View style={styles.cardForm}>
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>CARD NUMBER</Text>
                  <TextInput
                    style={styles.input}
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    placeholder="4242 4242 4242 4242"
                    keyboardType="numeric"
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={[styles.inputWrap, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>EXPIRY DATE</Text>
                    <TextInput
                      style={styles.input}
                      value={expiry}
                      onChangeText={setExpiry}
                      placeholder="MM/YY"
                    />
                  </View>

                  <View style={[styles.inputWrap, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>CVC / CVV</Text>
                    <TextInput
                      style={styles.input}
                      value={cvc}
                      onChangeText={setCvc}
                      placeholder="CVC"
                      keyboardType="numeric"
                      secureTextEntry
                    />
                  </View>
                </View>
              </View>
            )}

            {method === 'WALLET' && (
              <View style={styles.infoBox}>
                <CheckCircle2 size={18} color={COLORS.accent} />
                <Text style={styles.infoBoxText}>
                  Instant 1-touch checkout with Apple Pay / Google Wallet. 256-bit encryption verified.
                </Text>
              </View>
            )}

            {method === 'ARRIVAL' && (
              <View style={styles.infoBox}>
                <ShieldCheck size={18} color="#16a34a" />
                <Text style={styles.infoBoxText}>
                  Your booking will be confirmed immediately. You may settle in cash or card directly with your VIP concierge desk upon arrival.
                </Text>
              </View>
            )}

            {/* Security Guarantee */}
            <View style={styles.securityRow}>
              <Lock size={12} color={COLORS.textMuted} />
              <Text style={styles.securityText}>End-to-End Encrypted 256-Bit SSL Payment Gateway</Text>
            </View>

            <View style={{ height: 16 }} />
          </ScrollView>

          {/* Footer Submit */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handlePay}
              disabled={processing}
              activeOpacity={0.85}
            >
              {processing ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>
                  Pay {formatPrice(booking.totalPrice)} ({currentCurrency.code})
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
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
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
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  amountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  amountPkg: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    maxWidth: 180,
  },
  amountValue: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  methodsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  methodPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#ffffff',
  },
  methodPillActive: {
    borderColor: COLORS.accent,
    backgroundColor: '#f0faff',
  },
  methodText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  methodTextActive: {
    color: COLORS.accentDark,
  },
  cardForm: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  inputWrap: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f0fdf4',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 12,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
    lineHeight: 18,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
  },
  securityText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: '#ffffff',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

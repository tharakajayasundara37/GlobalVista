import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import {
  X,
  FileText,
  Share2,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Calendar,
  Users,
  CreditCard,
  Crown,
  Globe2,
  ShieldCheck,
  Printer,
  Plane,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { ApiBooking, ApiPackage, ApiUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  booking: ApiBooking | null;
  onPayNow?: (booking: ApiBooking) => void;
}

export const MobileInvoiceModal: React.FC<Props> = ({
  visible,
  onClose,
  booking,
  onPayNow,
}) => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  if (!booking) return null;

  const pkg = typeof booking.packageId === 'object' ? (booking.packageId as ApiPackage) : null;
  const bookingUser = typeof booking.userId === 'object' ? (booking.userId as ApiUser) : user;
  const isPaid = (booking.paymentStatus || '').trim().toUpperCase() === 'PAID';

  const invoiceNumber = `INV-GV-${(booking._id || '').slice(-6).toUpperCase()}`;
  const bookingRef = `GV-BK-${(booking._id || '').slice(-8).toUpperCase()}`;
  const txnId = `TXN-GV-${(booking._id || '').slice(-8).toUpperCase()}-9842`;
  const travelDate = booking.travelDate || 'Flexible Schedule';
  const guests = booking.numberOfPeople || 1;
  const plan = booking.selectedTravelPlan;

  const basePrice = booking.baseTotal || booking.totalPrice * 0.75;
  const addOnsTotal = booking.addOnsTotal || 0;

  // Format issue date
  const issueDate = new Date(booking.createdAt || Date.now()).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleShare = async () => {
    try {
      const billSummary =
        `========================================\n` +
        `GLOBALVISTA LUXURY TRAVEL ATELIER\n` +
        `TAX INVOICE & OFFICIAL TRAVEL VOUCHER\n` +
        `========================================\n\n` +
        `INVOICE #: ${invoiceNumber}\n` +
        `BOOKING REF: ${bookingRef}\n` +
        `ISSUE DATE: ${issueDate}\n` +
        `PAYMENT STATUS: ${isPaid ? 'PAID IN FULL (VERIFIED)' : 'PAYMENT DUE / PENDING'}\n\n` +
        `BILLED TO (LEAD TRAVELLER):\n` +
        `Name: ${bookingUser?.name || 'Valued Explorer'}\n` +
        `Email: ${bookingUser?.email || 'N/A'}\n` +
        `Contact: ${bookingUser?.mobile || '+94 77 123 4567'}\n` +
        `Explorer ID: ${bookingUser?.publicId || 'GVU-INTERNATIONAL'}\n` +
        `Country: ${bookingUser?.country || 'Sri Lanka'}\n\n` +
        `EXPEDITION DETAILS:\n` +
        `Package: ${pkg?.title || 'GlobalVista Bespoke Expedition'}\n` +
        `Destination: ${pkg?.destination || 'Sri Lanka'}, ${pkg?.country || ''}\n` +
        `Departure Date: ${travelDate}\n` +
        `Guests: ${guests} Person(s)\n\n` +
        `FINANCIAL BREAKDOWN:\n` +
        `- Core Tour Package: ${formatPrice(basePrice)}\n` +
        `- Inclusions: Luxury lodging, private transfer & concierge\n` +
        `- Taxes & Tourism VAT: INCLUDED (0.00)\n` +
        `----------------------------------------\n` +
        `GRAND TOTAL: ${formatPrice(booking.totalPrice)}\n` +
        `CLEARANCE TXN: ${txnId}\n` +
        `========================================\n` +
        `Authorized by: G. Lansakara (GlobalVista Operations)`;

      await Share.share({
        title: `GlobalVista Voucher - ${invoiceNumber}`,
        message: billSummary,
      });
    } catch {
      // Ignored
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Top Modal Controls */}
          <View style={styles.topControlBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <FileText size={18} color="#38bdf8" />
              <Text style={styles.topControlTitle}>OFFICIAL BILL & TRAVEL VOUCHER</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity style={styles.circleActionBtn} onPress={handleShare} activeOpacity={0.7}>
                <Share2 size={16} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.circleActionBtn} onPress={onClose} activeOpacity={0.7}>
                <X size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Printable White Invoice Document Sheet */}
          <ScrollView
            style={styles.scrollSheet}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.invoiceSheet}>
              {/* Luxury Top Gradient Decorative Strip */}
              <View style={styles.luxuryStrip} />

              {/* INVOICE HEADER */}
              <View style={styles.invoiceHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.brandLogo}>
                    Global<Text style={styles.brandLogoAccent}>Vista</Text>
                  </Text>
                  <Text style={styles.brandTagline}>
                    LUXURY TRAVEL & EXPEDITIONS ATELIER
                  </Text>
                  <Text style={styles.brandSub}>
                    Reg No: GV-LK-2026/894 · support@globalvista.com
                  </Text>
                  <Text style={styles.brandAddress}>
                    World Travel House, Colombo / Interlaken / Zurich
                  </Text>
                </View>

                {/* Right Meta Block */}
                <View style={styles.metaBlockRight}>
                  <Text style={styles.invoiceDocTitle}>TAX INVOICE</Text>
                  <Text style={styles.invoiceDocSub}>& TRAVEL VOUCHER</Text>
                  <Text style={styles.invoiceNumberText}>{invoiceNumber}</Text>
                  <Text style={styles.invoiceDateText}>Issue Date: {issueDate}</Text>

                  {/* Stamp Badge */}
                  {isPaid ? (
                    <View style={styles.paidStamp}>
                      <ShieldCheck size={14} color="#059669" />
                      <Text style={styles.paidStampText}>VERIFIED PAID</Text>
                    </View>
                  ) : (
                    <View style={styles.unpaidStamp}>
                      <Clock size={14} color="#d97706" />
                      <Text style={styles.unpaidStampText}>PAYMENT DUE</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* TWO COLUMNS: BILLED TO & EXPEDITION DETAILS */}
              <View style={styles.infoSection}>
                {/* Column 1: Lead Traveller */}
                <View style={styles.infoCol}>
                  <Text style={styles.infoSectionLabel}>BILLED TO (LEAD TRAVELLER)</Text>
                  <Text style={styles.clientName}>{bookingUser?.name || 'Valued GlobalVista Explorer'}</Text>

                  <View style={styles.infoRow}>
                    <Globe2 size={13} color="#0284c7" />
                    <Text style={styles.infoText}>
                      Country: <Text style={styles.boldText}>{bookingUser?.country || 'International'}</Text>
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoBullet}>✉</Text>
                    <Text style={styles.infoText}>
                      Email: <Text style={styles.boldText}>{bookingUser?.email || 'explorer@globalvista.com'}</Text>
                    </Text>
                  </View>

                  {bookingUser?.mobile && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoBullet}>☎</Text>
                      <Text style={styles.infoText}>
                        Contact: <Text style={styles.boldText}>{bookingUser.mobile}</Text>
                      </Text>
                    </View>
                  )}

                  <View style={styles.infoRow}>
                    <Text style={styles.infoBullet}>🆔</Text>
                    <Text style={styles.infoText}>
                      Explorer ID: <Text style={styles.boldMonospace}>{bookingUser?.publicId || 'GVU-ONLINE'}</Text>
                    </Text>
                  </View>
                </View>

                {/* Column 2: Expedition Details */}
                <View style={[styles.infoCol, { marginTop: 14 }]}>
                  <Text style={styles.infoSectionLabel}>EXPEDITION & ITINERARY DETAILS</Text>
                  <Text style={styles.pkgTitle}>{pkg?.title || 'GlobalVista Custom Expedition'}</Text>

                  <View style={styles.infoRow}>
                    <MapPin size={13} color="#0284c7" />
                    <Text style={styles.infoText}>
                      Destination: <Text style={styles.boldText}>{pkg?.destination || 'Sri Lanka'}, {pkg?.country || ''}</Text>
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Calendar size={13} color="#0284c7" />
                    <Text style={styles.infoText}>
                      Departure Date: <Text style={styles.boldText}>{travelDate}</Text>
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Users size={13} color="#0284c7" />
                    <Text style={styles.infoText}>
                      Travel Party: <Text style={styles.boldText}>{guests} {guests === 1 ? 'Person' : 'Persons'}</Text>
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoBullet}>🔖</Text>
                    <Text style={styles.infoText}>
                      Booking Ref: <Text style={[styles.boldMonospace, { color: '#0284c7' }]}>{bookingRef}</Text>
                    </Text>
                  </View>
                </View>
              </View>

              {/* FINANCIAL ITEMIZED TABLE */}
              <View style={styles.tableCard}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.thCell, { flex: 2 }]}>DESCRIPTION & SERVICES</Text>
                  <Text style={[styles.thCell, { flex: 1, textAlign: 'center' }]}>QTY</Text>
                  <Text style={[styles.thCell, { flex: 1.2, textAlign: 'right' }]}>RATE</Text>
                  <Text style={[styles.thCell, { flex: 1.4, textAlign: 'right' }]}>AMOUNT</Text>
                </View>

                {/* Row 1: Core Experience */}
                <View style={styles.tableDataRow}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.tdTitle}>{pkg?.title || 'Bespoke Travel Tour Package'}</Text>
                    <Text style={styles.tdSubtext}>Standard luxury inclusions, lodging & itinerary</Text>
                  </View>
                  <Text style={[styles.tdCell, { flex: 1, textAlign: 'center' }]}>{guests}</Text>
                  <Text style={[styles.tdCell, { flex: 1.2, textAlign: 'right' }]}>{formatPrice(basePrice / guests)}</Text>
                  <Text style={[styles.tdCellBold, { flex: 1.4, textAlign: 'right' }]}>{formatPrice(basePrice)}</Text>
                </View>

                {/* Row 2: Selected Plan Tier (if applicable) */}
                {plan && (
                  <View style={styles.tableDataRow}>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.tdTitle}>{plan.name} Service Tier</Text>
                      <Text style={styles.tdSubtext}>Private transfers, VIP access & concierge</Text>
                    </View>
                    <Text style={[styles.tdCell, { flex: 1, textAlign: 'center' }]}>{guests}</Text>
                    <Text style={[styles.tdCell, { flex: 1.2, textAlign: 'right' }]}>{formatPrice(plan.price)}</Text>
                    <Text style={[styles.tdCellBold, { flex: 1.4, textAlign: 'right' }]}>{formatPrice(plan.price * guests)}</Text>
                  </View>
                )}

                {/* Row 3: Add-ons (if any) */}
                {booking.selectedAddOns && booking.selectedAddOns.length > 0 ? (
                  booking.selectedAddOns.map((addOn, idx) => (
                    <View key={addOn.addOnId || idx} style={styles.tableDataRow}>
                      <View style={{ flex: 2 }}>
                        <Text style={styles.tdTitle}>{addOn.name || 'Premium Add-on Upgrade'}</Text>
                        <Text style={styles.tdSubtext}>{addOn.pricingType === 'PER_PERSON' ? 'Per Person' : 'Per Booking'}</Text>
                      </View>
                      <Text style={[styles.tdCell, { flex: 1, textAlign: 'center' }]}>{addOn.quantity || 1}</Text>
                      <Text style={[styles.tdCell, { flex: 1.2, textAlign: 'right' }]}>{formatPrice(addOn.price || 0)}</Text>
                      <Text style={[styles.tdCellBold, { flex: 1.4, textAlign: 'right' }]}>
                        {formatPrice(addOn.calculatedAmount || addOn.price || 0)}
                      </Text>
                    </View>
                  ))
                ) : null}
              </View>

              {/* TOTALS CALCULATION CONTAINER */}
              <View style={styles.totalsContainer}>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Base Package Tour Fee:</Text>
                  <Text style={styles.totalsVal}>{formatPrice(basePrice)}</Text>
                </View>

                {addOnsTotal > 0 && (
                  <View style={styles.totalsRow}>
                    <Text style={styles.totalsLabel}>Supplemental Add-ons:</Text>
                    <Text style={styles.totalsVal}>{formatPrice(addOnsTotal)}</Text>
                  </View>
                )}

                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Tourism VAT & Surcharges (12%):</Text>
                  <Text style={[styles.totalsVal, { color: '#059669', fontWeight: '700' }]}>Included (0.00)</Text>
                </View>

                <View style={styles.grandTotalRow}>
                  <Text style={styles.grandTotalLabel}>GRAND TOTAL PAID:</Text>
                  <Text style={styles.grandTotalAmount}>{formatPrice(booking.totalPrice)}</Text>
                </View>
              </View>

              {/* ELECTRONIC PAYMENT CLEARANCE BOX */}
              <View style={styles.paymentClearanceBox}>
                <Text style={styles.clearanceTitle}>ELECTRONIC PAYMENT CLEARANCE</Text>
                <Text style={styles.clearanceLine}>
                  TRANSACTION ID: <Text style={styles.boldMonospace}>{txnId}</Text>
                </Text>
                <Text style={styles.clearanceLine}>
                  PAYMENT METHOD: <Text style={styles.boldText}>{booking.paymentMethod || 'VISA / MASTERCARD (ONLINE)'}</Text>
                </Text>
                <Text style={styles.clearanceLine}>
                  GATEWAY AUTH: <Text style={styles.boldText}>AUTH-OK-98421 · SETTLED</Text>
                </Text>
                <Text style={styles.clearanceLine}>
                  TIMESTAMP: <Text style={styles.boldMonospace}>{issueDate} · SECURE SSL</Text>
                </Text>
              </View>

              {/* BARCODE GRAPHIC & OFFICIAL SIGNATURE */}
              <View style={styles.footerAuthRow}>
                {/* Simulated Digital Barcode */}
                <View style={styles.barcodeWrapper}>
                  <View style={styles.barcodeVisual}>
                    {[2, 1, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 3, 1, 4, 2, 1, 3].map(
                      (w, i) => (
                        <View
                          key={i}
                          style={{
                            width: w,
                            height: 32,
                            backgroundColor: '#0f172a',
                            marginRight: (i % 2) + 1,
                          }}
                        />
                      )
                    )}
                  </View>
                  <Text style={styles.barcodeText}>*{bookingRef}*</Text>
                </View>

                {/* Authorized Officer Signature */}
                <View style={styles.signatureWrapper}>
                  <Text style={styles.signatureCursive}>G. Lansakara</Text>
                  <View style={styles.sigLine} />
                  <Text style={styles.signatureRole}>Authorized GlobalVista</Text>
                  <Text style={styles.signatureRole}>Operations Officer</Text>
                </View>
              </View>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Bottom Action Footer */}
          <View style={styles.modalBottomBar}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
              <Printer size={16} color="#ffffff" />
              <Text style={styles.shareBtnText}>Share & Print Bill</Text>
            </TouchableOpacity>

            {!isPaid && onPayNow && (
              <TouchableOpacity
                style={styles.payNowBtn}
                onPress={() => {
                  onClose();
                  onPayNow(booking);
                }}
                activeOpacity={0.85}
              >
                <CreditCard size={16} color="#ffffff" />
                <Text style={styles.payNowBtnText}>Pay Bill Now ({formatPrice(booking.totalPrice)})</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 15, 29, 0.85)',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 12,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#0a192f',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
    ...SHADOWS.large,
  },
  topControlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#081426',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  topControlTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.6,
  },
  circleActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollSheet: {
    flex: 1,
    backgroundColor: '#0a192f',
  },
  scrollContent: {
    padding: 14,
  },
  invoiceSheet: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  luxuryStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#0284c7',
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#e2e8f0',
  },
  brandLogo: {
    fontSize: 24,
    fontWeight: '900',
    color: '#071b2b',
    letterSpacing: -0.5,
  },
  brandLogoAccent: {
    color: '#0284c7',
  },
  brandTagline: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  brandSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  brandAddress: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 1,
  },
  metaBlockRight: {
    alignItems: 'flex-end',
  },
  invoiceDocTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#071b2b',
    letterSpacing: 0.6,
  },
  invoiceDocSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284c7',
    letterSpacing: 0.4,
  },
  invoiceNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0369a1',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  invoiceDateText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  paidStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#059669',
    borderRadius: 6,
    transform: [{ rotate: '-2deg' }],
  },
  paidStampText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  unpaidStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: '#fffbeb',
    borderWidth: 1.5,
    borderColor: '#d97706',
    borderRadius: 6,
    transform: [{ rotate: '-2deg' }],
  },
  unpaidStampText: {
    color: '#d97706',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  infoSection: {
    paddingVertical: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: '#e2e8f0',
  },
  infoCol: {
    gap: 4,
  },
  infoSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#071b2b',
    marginBottom: 2,
  },
  pkgTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#071b2b',
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoBullet: {
    fontSize: 11,
    color: '#0284c7',
  },
  infoText: {
    fontSize: 12,
    color: '#334155',
  },
  boldText: {
    fontWeight: '700',
    color: '#071b2b',
  },
  boldMonospace: {
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: 'monospace',
    fontSize: 11,
  },
  tableCard: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  thCell: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tdTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  tdSubtext: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  tdCell: {
    fontSize: 11,
    color: '#334155',
  },
  tdCellBold: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  totalsContainer: {
    marginTop: 14,
    alignSelf: 'flex-end',
    width: '100%',
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#e2e8f0',
    gap: 4,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  totalsLabel: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  totalsVal: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    marginTop: 6,
    borderTopWidth: 2,
    borderTopColor: '#071b2b',
  },
  grandTotalLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#071b2b',
    letterSpacing: 0.5,
  },
  grandTotalAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0284c7',
  },
  paymentClearanceBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
    gap: 2,
  },
  clearanceTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0369a1',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  clearanceLine: {
    fontSize: 10,
    color: '#475569',
  },
  footerAuthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 16,
    paddingTop: 8,
  },
  barcodeWrapper: {
    alignItems: 'flex-start',
  },
  barcodeVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  barcodeText: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#64748b',
    letterSpacing: 1.5,
  },
  signatureWrapper: {
    alignItems: 'flex-end',
  },
  signatureCursive: {
    fontSize: 22,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#071b2b',
    letterSpacing: 1,
  },
  sigLine: {
    width: 120,
    height: 1,
    backgroundColor: '#94a3b8',
    marginVertical: 2,
  },
  signatureRole: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  modalBottomBar: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    backgroundColor: '#081426',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 10,
  },
  shareBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  payNowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
  },
  payNowBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});

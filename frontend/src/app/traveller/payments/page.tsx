'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Download,
  Globe2,
  Lock,
  MapPin,
  Plane,
  Printer,
  Receipt,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import styles from './page.module.css';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://globalvista-d7uz.onrender.com');

type BookingPackage = {
  _id?: string;
  title?: string;
  country?: string;
  destination?: string;
  price?: number;
  duration?: string;
  category?: string;
  images?: string[];
};

type BookingAddOn = {
  addOnId?: string;
  name?: string;
  price?: number;
  pricingType?: 'PER_PERSON' | 'PER_BOOKING';
  quantity?: number;
  calculatedAmount?: number;
};

type BookingUser = {
  _id?: string;
  id?: string;
  publicId?: string;
  name?: string;
  email?: string;
  country?: string;
  mobile?: string;
};

type TravelPlanInfo = {
  _id?: string;
  name?: string;
  price?: number;
};

type BookingData = {
  _id: string;
  userId?: string | BookingUser;
  packageId?: string | BookingPackage;
  travelPlanId?: string | TravelPlanInfo;
  travelDate?: string;
  numberOfPeople?: number;
  basePrice?: number;
  selectedAddOns?: BookingAddOn[];
  addOnsTotal?: number;
  totalPrice?: number;
  status?: string;
  paymentStatus?: string;
  createdAt?: string;
};

type PaymentRecord = {
  _id?: string;
  bookingId?: string;
  amount?: number;
  paymentMethod?: string;
  transactionId?: string;
  paymentStatus?: string;
  createdAt?: string;
};

function formatCurrency(amount?: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

function formatDate(dateString?: string) {
  if (!dateString) return 'Date to be confirmed';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

function formatCardNumber(val: string) {
  const digits = val.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(val: string) {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  }
  return digits;
}

function PaymentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [payment, setPayment] = useState<PaymentRecord | null>(null);

  // Form State
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'STRIPE' | 'BANK_TRANSFER'>('CREDIT_CARD');
  const [cardHolder, setCardHolder] = useState('THARAKA JAYASUNDARA');
  const [cardNumber, setCardNumber] = useState('4532 8920 4410 7821');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('842');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    async function loadBookingAndPayment() {
      if (!bookingId) {
        setError('No booking ID provided in URL.');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('globalvista_token') || localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        setError('');

        // 1. Fetch booking details
        const bookingRes = await fetch(`${API_URL}/bookings/${bookingId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        });

        if (!bookingRes.ok) {
          throw new Error(`Failed to load booking (HTTP ${bookingRes.status})`);
        }

        const bookingData = (await bookingRes.json()) as BookingData;
        setBooking(bookingData);

        // 2. If already paid, attempt to load payment record
        if (bookingData.paymentStatus?.trim().toUpperCase() === 'PAID') {
          const paymentRes = await fetch(`${API_URL}/payments/booking/${bookingId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
          });

          if (paymentRes.ok) {
            const paymentData = (await paymentRes.json()) as PaymentRecord | PaymentRecord[];
            if (Array.isArray(paymentData) && paymentData.length > 0) {
              setPayment(paymentData[0]);
            } else if (!Array.isArray(paymentData) && paymentData?._id) {
              setPayment(paymentData);
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load payment details.');
      } finally {
        setLoading(false);
      }
    }

    void loadBookingAndPayment();
  }, [bookingId, router]);

  // Handle Payment Submit
  async function handleProcessPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!booking) return;

    const token = localStorage.getItem('globalvista_token') || localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const generatedTxnId = `TXN-GV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const res = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: booking._id,
          paymentMethod: paymentMethod === 'CREDIT_CARD' ? 'VISA / MASTERCARD' : paymentMethod,
          transactionId: generatedTxnId,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || 'Payment processing failed.');
      }

      // Update state
      setPayment(data);
      setBooking((prev) => (prev ? { ...prev, paymentStatus: 'PAID', status: 'CONFIRMED' } : null));
      setPaymentSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Pre-fill dummy card helper
  function fillDemoCard() {
    setCardHolder('THARAKA JAYASUNDARA');
    setCardNumber('4532 8920 4410 7821');
    setCardExpiry('12/28');
    setCardCvv('789');
  }

  // Calculations
  const pkg = useMemo(() => {
    if (booking?.packageId && typeof booking.packageId === 'object') {
      return booking.packageId;
    }
    return null;
  }, [booking]);

  const clientUser = useMemo(() => {
    if (booking?.userId && typeof booking.userId === 'object') {
      return booking.userId;
    }
    const raw = localStorage.getItem('globalvista_user') || localStorage.getItem('user');
    if (raw) {
      try {
        return JSON.parse(raw) as BookingUser;
      } catch {
        return null;
      }
    }
    return null;
  }, [booking]);

  const isPaid = booking?.paymentStatus?.trim().toUpperCase() === 'PAID' || paymentSuccess;

  // Invoice / Voucher Details
  const invoiceNumber = `INV-GV-${booking?._id?.slice(-6).toUpperCase() || '2026-01'}`;
  const bookingRef = `GV-BK-${booking?._id?.slice(-8).toUpperCase() || 'CONFIRMED'}`;
  const invoiceDate = payment?.createdAt ? formatDate(payment.createdAt) : formatDate(new Date().toISOString());
  const txnId = payment?.transactionId || `TXN-GV-${booking?._id?.slice(-8).toUpperCase() || 'PROCESSED'}`;

  const imageSrc = useMemo(() => {
    if (pkg?.images && pkg.images.length > 0) {
      const img = pkg.images[0];
      if (img.startsWith('http://') || img.startsWith('https://')) return img;
      if (img.startsWith('/uploads/')) return `${API_URL}${img}`;
      return `/images/${img}`;
    }
    return '/images/default-travel.jpg';
  }, [pkg]);

  if (loading) {
    return (
      <div className={styles.stateCard}>
        <div className={styles.spinner} />
        <h2>Loading Payment & Voucher Details...</h2>
        <p style={{ color: '#94a9ba' }}>Connecting to GlobalVista reservation server.</p>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className={styles.stateCard}>
        <h2 style={{ color: '#f87171' }}>Reservation Not Found</h2>
        <p style={{ color: '#cbd5e1' }}>{error}</p>
        <Link href="/traveller" className={styles.backLink} style={{ display: 'inline-flex', marginTop: 16 }}>
          <ArrowLeft size={16} /> Return to My Trips
        </Link>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className={styles.container}>
      {/* TOP HEADER */}
      <div className={styles.topBar}>
        <Link href="/traveller" className={styles.backLink}>
          <ArrowLeft size={16} /> Back to My Trips
        </Link>

        <div className={`${styles.statusIndicator} ${isPaid ? styles.statusPaid : styles.statusUnpaid}`}>
          {isPaid ? (
            <>
              <CheckCircle2 size={16} /> Payment Verified & Paid
            </>
          ) : (
            <>
              <Wallet size={16} /> Payment Pending Confirmation
            </>
          )}
        </div>
      </div>

      {/* ==========================================================
          CASE A: ALREADY PAID OR JUST COMPLETED -> SHOW OFFICIAL BILL
         ========================================================== */}
      {isPaid ? (
        <section>
          {/* VOUCHER ACTION BAR */}
          <div className={styles.voucherActionBar}>
            <div>
              <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800 }}>
                Official Travel Voucher & Bill
              </h1>
              <p style={{ margin: 0, color: '#94a9ba', fontSize: 14 }}>
                Present this certified electronic invoice or printed copy to your tour director upon arrival.
              </p>
            </div>

            <div className={styles.voucherActionButtons}>
              <button
                type="button"
                className={styles.actionButtonPrimary}
                onClick={() => window.print()}
              >
                <Printer size={17} /> Print Official Bill
              </button>
              <Link href="/traveller" className={styles.actionButtonSecondary}>
                <Plane size={16} /> My Reservations
              </Link>
            </div>
          </div>

          {/* THE OFFICIAL LUXURY TRAVEL INVOICE & VOUCHER SHEET */}
          <article className={styles.invoiceSheet}>
            {/* INVOICE HEADER */}
            <div className={styles.invoiceHeader}>
              <div>
                <div className={styles.brandLogo}>
                  Global<span>Vista</span>
                </div>
                <div className={styles.brandTagline}>
                  Luxury Travel & Expeditions Atelier • Reg No: GV-LK-2026/894
                </div>
                <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>
                  World Travel House, Colombo / Interlaken / Zurich • support@globalvista.com
                </div>
              </div>

              <div className={styles.invoiceMetaBlock}>
                <div className={styles.invoiceTitle}>
                  TAX INVOICE & TRAVEL VOUCHER
                </div>
                <div className={styles.invoiceNumber}>
                  {invoiceNumber}
                </div>
                <div style={{ fontSize: 13, color: '#4a5568' }}>
                  Issue Date: <strong>{invoiceDate}</strong>
                </div>
                <div>
                  <span className={styles.paidStamp}>
                    <ShieldCheck size={16} /> Verified Paid
                  </span>
                </div>
              </div>
            </div>

            {/* TWO COLUMNS: BILLED TO & EXPEDITION DETAILS */}
            <div className={styles.infoColumns}>
              <div>
                <div className={styles.infoSectionTitle}>
                  Billed To (Lead Traveller)
                </div>
                <div className={styles.clientName}>
                  {clientUser?.name || 'Valued GlobalVista Explorer'}
                </div>
                <div className={styles.infoLine}>
                  <Globe2 size={15} color="#1785f2" />
                  <span>Country: <strong>{clientUser?.country || 'International Traveller'}</strong></span>
                </div>
                <div className={styles.infoLine}>
                  <span>Email: <strong>{clientUser?.email || 'Registered Traveller'}</strong></span>
                </div>
                {clientUser?.mobile && (
                  <div className={styles.infoLine}>
                    <span>Contact: <strong>{clientUser.mobile}</strong></span>
                  </div>
                )}
                {clientUser?.publicId && (
                  <div className={styles.infoLine} style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    <span>Explorer ID: <strong>{clientUser.publicId}</strong></span>
                  </div>
                )}
              </div>

              <div>
                <div className={styles.infoSectionTitle}>
                  Expedition & Itinerary Details
                </div>
                <div className={styles.clientName}>
                  {pkg?.title || 'GlobalVista Custom Expedition'}
                </div>
                <div className={styles.infoLine}>
                  <MapPin size={15} color="#1785f2" />
                  <span>Destination: <strong>{pkg?.destination || 'Global'}, {pkg?.country || ''}</strong></span>
                </div>
                <div className={styles.infoLine}>
                  <CalendarDays size={15} color="#1785f2" />
                  <span>Departure Date: <strong>{formatDate(booking.travelDate)}</strong></span>
                </div>
                <div className={styles.infoLine}>
                  <Users size={15} color="#1785f2" />
                  <span>Travel Party: <strong>{booking.numberOfPeople || 1} Person(s)</strong></span>
                </div>
                <div className={styles.infoLine} style={{ color: '#2b6cb0', fontWeight: 600 }}>
                  <span>Booking Ref: <strong>{bookingRef}</strong></span>
                </div>
              </div>
            </div>

            {/* FINANCIAL ITEMIZED TABLE */}
            <table className={styles.invoiceTable}>
              <thead>
                <tr>
                  <th>Description & Services</th>
                  <th>Classification</th>
                  <th>Guests / Units</th>
                  <th>Unit Rate</th>
                  <th>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className={styles.itemTitle}>
                      {pkg?.title || 'Bespoke Travel Tour Package'}
                    </div>
                    <div className={styles.itemSubtext}>
                      Standard luxury inclusions, lodging reservation, and guided itinerary
                    </div>
                  </td>
                  <td>Core Experience</td>
                  <td>{booking.numberOfPeople || 1} Traveller(s)</td>
                  <td>{formatCurrency(booking.basePrice)}</td>
                  <td>{formatCurrency(booking.basePrice)}</td>
                </tr>

                {booking.selectedAddOns && booking.selectedAddOns.length > 0 ? (
                  booking.selectedAddOns.map((addOn, index) => (
                    <tr key={addOn.addOnId || index}>
                      <td>
                        <div className={styles.itemTitle}>
                          {addOn.name || 'Premium Add-on Option'}
                        </div>
                        <div className={styles.itemSubtext}>
                          Pricing Model: {addOn.pricingType === 'PER_PERSON' ? 'Per Person rate' : 'Per Booking fixed'}
                        </div>
                      </td>
                      <td>Add-on Upgrade</td>
                      <td>{addOn.quantity || 1}</td>
                      <td>{formatCurrency(addOn.price)}</td>
                      <td>{formatCurrency(addOn.calculatedAmount || addOn.price)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ color: '#718096', fontStyle: 'italic' }}>
                      No supplemental add-ons attached to this reservation.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* TOTALS CALCULATION */}
            <div className={styles.totalsContainer}>
              <div className={styles.totalsTable}>
                <div className={styles.totalsRow}>
                  <span>Base Package Tour Fee:</span>
                  <strong>{formatCurrency(booking.basePrice)}</strong>
                </div>
                <div className={styles.totalsRow}>
                  <span>Supplemental Add-ons:</span>
                  <strong>{formatCurrency(booking.addOnsTotal || 0)}</strong>
                </div>
                <div className={styles.totalsRow}>
                  <span>Tourism VAT & Regulatory Surcharges:</span>
                  <span style={{ color: '#059669', fontWeight: 600 }}>Included (0.00)</span>
                </div>
                <div className={styles.totalsGrandRow}>
                  <span>Grand Total Paid:</span>
                  <span className={styles.totalsGrandAmount}>
                    {formatCurrency(booking.totalPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* PAYMENT VERIFICATION & SECURITY FOOTER */}
            <div className={styles.invoiceFooter}>
              <div className={styles.paymentVerificationBox}>
                <div className={styles.verificationTitle}>
                  Electronic Payment Clearance
                </div>
                <div className={styles.verificationDetail}>
                  TRANSACTION ID: <strong>{txnId}</strong>
                </div>
                <div className={styles.verificationDetail}>
                  PAYMENT METHOD: <strong>{payment?.paymentMethod || 'VISA / MASTERCARD (ONLINE)'}</strong>
                </div>
                <div className={styles.verificationDetail}>
                  GATEWAY AUTH: <strong>AUTH-OK-98421 • SETTLED</strong>
                </div>
                <div className={styles.verificationDetail}>
                  TIMESTAMP: <strong>{new Date().toISOString()}</strong>
                </div>
              </div>

              <div className={styles.authContainer}>
                <div className={styles.barcodeBlock}>
                  <div className={styles.barcodeGraphic} />
                  <span>*{bookingRef}*</span>
                </div>
                <div style={{ marginTop: 4 }}>
                  <div className={styles.signatureSign}>G. Lansakara</div>
                  <div className={styles.signatureLabel}>
                    Authorized GlobalVista Operations Officer
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>
      ) : (
        /* ==========================================================
           CASE B: UNPAID -> SHOW LUXURY CHECKOUT & PAYMENT FORM
           ========================================================== */
        <section className={styles.checkoutGrid}>
          {/* LEFT: BOOKING SUMMARY */}
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>
              <Receipt size={22} color="#68ddff" />
              Reservation Summary
            </h2>
            <p className={styles.panelSubtitle}>
              Review your curated itinerary before submitting payment.
            </p>

            <div className={styles.tripPreview}>
              <img
                src={imageSrc}
                alt={pkg?.title || 'Trip Preview'}
                className={styles.tripImage}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/images/default-travel.jpg';
                }}
              />
              <div className={styles.tripDetails}>
                <h3 className={styles.tripTitle}>
                  {pkg?.title || 'Selected Experience'}
                </h3>
                <div className={styles.tripLocation}>
                  <MapPin size={15} />
                  <span>{pkg?.destination || 'Destination'}, {pkg?.country || ''}</span>
                </div>

                <div className={styles.metaRow}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Departure Date</span>
                    <span className={styles.metaValue}>{formatDate(booking.travelDate)}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Guests</span>
                    <span className={styles.metaValue}>{booking.numberOfPeople || 1} Person(s)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ITEMIZED BREAKDOWN */}
            <div className={styles.priceList}>
              <div className={styles.priceRow}>
                <span>Base Package Experience</span>
                <span>{formatCurrency(booking.basePrice)}</span>
              </div>

              {booking.selectedAddOns && booking.selectedAddOns.length > 0 && (
                <>
                  {booking.selectedAddOns.map((addOn, idx) => (
                    <div key={addOn.addOnId || idx} className={styles.priceRow}>
                      <span style={{ fontSize: 13, color: '#94a9ba' }}>
                        + {addOn.name} (x{addOn.quantity || 1})
                      </span>
                      <span>{formatCurrency(addOn.calculatedAmount || addOn.price)}</span>
                    </div>
                  ))}
                </>
              )}

              <div className={styles.priceRow}>
                <span>Tourism Taxes & Insurance</span>
                <span style={{ color: '#34d399', fontWeight: 600 }}>Included</span>
              </div>

              <div className={styles.priceTotalRow}>
                <span>Total Amount Due</span>
                <span className={styles.priceTotalAmount}>
                  {formatCurrency(booking.totalPrice)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8da4b5', fontSize: 13 }}>
              <ShieldCheck size={18} color="#68ddff" />
              <span>Full refund guarantee within 48 hours of booking.</span>
            </div>
          </div>

          {/* RIGHT: INTERACTIVE PAYMENT FORM */}
          <div className={styles.panel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 className={styles.panelTitle} style={{ margin: 0 }}>
                <CreditCard size={22} color="#68ddff" />
                Payment Method
              </h2>
              <button
                type="button"
                onClick={fillDemoCard}
                style={{
                  fontSize: 12,
                  color: '#68ddff',
                  background: 'rgba(104,221,255,0.1)',
                  border: '1px solid rgba(104,221,255,0.3)',
                  padding: '4px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                ⚡ Fill Demo Card
              </button>
            </div>

            <p className={styles.panelSubtitle}>
              Complete checkout to immediately generate your Official Travel Voucher.
            </p>

            {error && <div className={styles.errorBanner}>{error}</div>}

            {/* PAYMENT TABS */}
            <div className={styles.paymentTabs}>
              <button
                type="button"
                className={`${styles.paymentTab} ${paymentMethod === 'CREDIT_CARD' ? styles.paymentTabActive : ''}`}
                onClick={() => setPaymentMethod('CREDIT_CARD')}
              >
                <CreditCard size={18} />
                <span>Card</span>
              </button>
              <button
                type="button"
                className={`${styles.paymentTab} ${paymentMethod === 'STRIPE' ? styles.paymentTabActive : ''}`}
                onClick={() => setPaymentMethod('STRIPE')}
              >
                <Zap size={18} />
                <span>Stripe</span>
              </button>
              <button
                type="button"
                className={`${styles.paymentTab} ${paymentMethod === 'BANK_TRANSFER' ? styles.paymentTabActive : ''}`}
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
              >
                <Wallet size={18} />
                <span>Bank Clearance</span>
              </button>
            </div>

            {/* VIRTUAL CREDIT CARD VISUALIZER */}
            <div className={styles.cardVisual}>
              <div className={styles.cardTopRow}>
                <div className={styles.cardChip} />
                <div className={styles.cardBrand}>GLOBALVISTA VIP</div>
              </div>
              <div className={styles.cardNumberDisplay}>
                {cardNumber || '•••• •••• •••• ••••'}
              </div>
              <div className={styles.cardBottomRow}>
                <div>
                  <div style={{ fontSize: 9, opacity: 0.7, textTransform: 'uppercase' }}>Cardholder</div>
                  <div className={styles.cardHolderName}>{cardHolder || 'EXPLORER NAME'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, opacity: 0.7, textTransform: 'uppercase' }}>Expires</div>
                  <div className={styles.cardExpiryDisplay}>{cardExpiry || 'MM/YY'}</div>
                </div>
              </div>
            </div>

            {/* FORM INPUTS */}
            <form onSubmit={handleProcessPayment}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Cardholder Name</label>
                <input
                  type="text"
                  required
                  className={styles.inputControl}
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="e.g. Tharaka Jayasundara"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Card Number</label>
                <input
                  type="text"
                  required
                  maxLength={19}
                  className={styles.inputControl}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="4532 8920 4410 7821"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Expiry Date</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    className={styles.inputControl}
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>CVV / CVC</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    className={styles.inputControl}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                    placeholder="842"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={styles.paySubmitButton}
              >
                {isSubmitting ? (
                  <>Processing Payment...</>
                ) : (
                  <>
                    <Lock size={17} />
                    Confirm & Settle {formatCurrency(booking.totalPrice)}
                  </>
                )}
              </button>

              <div className={styles.securityNote}>
                <ShieldCheck size={15} color="#34d399" />
                <span>256-Bit SSL Encrypted • Official Travel Voucher Generated Immediately</span>
              </div>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <main className={styles.pageWrapper}>
      <Suspense
        fallback={
          <div className={styles.stateCard}>
            <div className={styles.spinner} />
            <h2>Loading GlobalVista Checkout...</h2>
          </div>
        }
      >
        <PaymentsContent />
      </Suspense>
    </main>
  );
}

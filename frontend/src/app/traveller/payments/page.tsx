'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Globe2,
  Lock,
  MapPin,
  Plane,
  Printer,
  QrCode,
  Receipt,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://globalvista-d7uz.onrender.com';

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
  vehicleType?: string;
  vehicleNumber?: string;
  vehicleFare?: number;
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
  bankReference?: string;
  slipUrl?: string;
  currency?: string;
  paymentStatus?: string;
  createdAt?: string;
};

const CURRENCY_RATES: Record<string, { rate: number; symbol: string; label: string }> = {
  USD: { rate: 1, symbol: '$', label: 'USD ($)' },
  EUR: { rate: 0.92, symbol: '€', label: 'EUR (€)' },
  GBP: { rate: 0.78, symbol: '£', label: 'GBP (£)' },
  AUD: { rate: 1.52, symbol: 'A$', label: 'AUD (A$)' },
  LKR: { rate: 300, symbol: 'Rs. ', label: 'LKR (Rs)' },
  CAD: { rate: 1.36, symbol: 'C$', label: 'CAD (C$)' },
};

function formatCurrency(amount?: number, currency = 'USD') {
  const num = Number(amount || 0);
  const info = CURRENCY_RATES[currency] || CURRENCY_RATES.USD;
  const converted = num * info.rate;

  if (currency === 'LKR') {
    return `Rs. ${Math.round(converted).toLocaleString('en-US')}`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted);
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

function detectCardBrand(num: string) {
  const clean = num.replace(/\D/g, '');
  if (/^4/.test(clean)) return 'VISA PLATINUM';
  if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'MASTERCARD BLACK';
  if (/^3[47]/.test(clean)) return 'AMERICAN EXPRESS';
  if (/^62/.test(clean)) return 'UNIONPAY DIAMOND';
  if (/^35/.test(clean)) return 'JCB PRESTIGE';
  if (/^6011/.test(clean)) return 'DISCOVER GLOBAL';
  return 'GLOBALVISTA VIP';
}

function PaymentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [payment, setPayment] = useState<PaymentRecord | null>(null);

  // Multi-Currency Converter
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');

  // Selected Payment Method
  const [paymentMethod, setPaymentMethod] = useState<
    'CREDIT_CARD' | 'APPLE_PAY' | 'GOOGLE_PAY' | 'PAYPAL' | 'BANK_TRANSFER' | 'CRYPTO'
  >('CREDIT_CARD');

  // Method 1: Credit / Debit Card State
  const [cardHolder, setCardHolder] = useState('THARAKA JAYASUNDARA');
  const [cardNumber, setCardNumber] = useState('4532 8920 4410 7821');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('842');
  const [billingCountry, setBillingCountry] = useState('United States');

  // Method 2 & 3: Wallets & PayPal State
  const [isWalletAuthorizing, setIsWalletAuthorizing] = useState(false);

  // Method 4: Bank Transfer State (USER EMPHASIZED)
  const [bankSubTab, setBankSubTab] = useState<'INTL_USD' | 'SRI_LANKA_LKR'>('INTL_USD');
  const [senderBank, setSenderBank] = useState('');
  const [bankRefNo, setBankRefNo] = useState('');
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [slipFile, setSlipFile] = useState<{ name: string; size: string; dataUrl: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string>('');

  // Method 5: Crypto State
  const [cryptoToken, setCryptoToken] = useState<'USDT_TRC20' | 'USDT_ERC20' | 'BTC' | 'ETH'>('USDT_TRC20');
  const [cryptoTxHash, setCryptoTxHash] = useState('');
  const [cryptoTimer, setCryptoTimer] = useState(900); // 15 mins countdown

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Copy helper with visual feedback
  const handleCopy = (text: string, key: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 2200);
    }
  };

  // Crypto Timer Countdown
  useEffect(() => {
    if (paymentMethod === 'CRYPTO') {
      const interval = setInterval(() => {
        setCryptoTimer((prev) => (prev > 0 ? prev - 1 : 900));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [paymentMethod]);

  const formattedTimer = useMemo(() => {
    const mins = Math.floor(cryptoTimer / 60);
    const secs = cryptoTimer % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [cryptoTimer]);

  // Load Booking & Payment
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

  // Handle Bank Slip File Upload
  const handleSlipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit. Please upload a smaller receipt image or PDF.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`;
      setSlipFile({
        name: file.name,
        size: sizeStr,
        dataUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  // Submit Payment Processor
  async function submitPayment(customMethod?: string, customTxnId?: string) {
    if (!booking) return;

    const token = localStorage.getItem('globalvista_token') || localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      let chosenMethod = customMethod;
      let txnId = customTxnId;

      if (!chosenMethod) {
        if (paymentMethod === 'CREDIT_CARD') {
          chosenMethod = detectCardBrand(cardNumber);
        } else if (paymentMethod === 'APPLE_PAY') {
          chosenMethod = 'APPLE PAY (TOUCH/FACE ID)';
        } else if (paymentMethod === 'GOOGLE_PAY') {
          chosenMethod = 'GOOGLE PAY';
        } else if (paymentMethod === 'PAYPAL') {
          chosenMethod = 'PAYPAL (EXPRESS CHECKOUT)';
        } else if (paymentMethod === 'BANK_TRANSFER') {
          chosenMethod = `BANK WIRE (${bankSubTab === 'INTL_USD' ? 'CITIBANK / HSBC SWIFT' : 'COMMERCIAL BANK LKR'})`;
        } else if (paymentMethod === 'CRYPTO') {
          chosenMethod = `CRYPTO (${cryptoToken.replace('_', ' ')})`;
        } else {
          chosenMethod = 'ONLINE SETTLEMENT';
        }
      }

      if (!txnId) {
        if (paymentMethod === 'BANK_TRANSFER' && bankRefNo.trim()) {
          txnId = `BNK-${bankRefNo.trim().toUpperCase()}`;
        } else if (paymentMethod === 'CRYPTO' && cryptoTxHash.trim()) {
          txnId = `CRYPTO-${cryptoTxHash.slice(0, 16).toUpperCase()}`;
        } else {
          txnId = `TXN-GV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        }
      }

      const payload: Record<string, any> = {
        bookingId: booking._id,
        paymentMethod: chosenMethod,
        transactionId: txnId,
        currency: selectedCurrency,
      };

      if (paymentMethod === 'BANK_TRANSFER') {
        payload.bankReference = bankRefNo || `GV-DEP-${booking._id.slice(-6).toUpperCase()}`;
        if (slipFile?.dataUrl) {
          payload.slipUrl = slipFile.dataUrl;
        }
        if (senderBank) {
          payload.notes = `Sender Bank: ${senderBank} | Date: ${transferDate}`;
        }
      }

      const res = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || 'Payment processing failed.');
      }

      setPayment(data);
      setBooking((prev) => (prev ? { ...prev, paymentStatus: 'PAID', status: 'CONFIRMED' } : null));
      setPaymentSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsWalletAuthorizing(false);
    }
  }

  // Pre-fill demo card helper
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
    if (typeof window === 'undefined') return null;
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
        <h2 style={{ fontSize: 20, fontWeight: 800 }}>Loading GlobalVista Payment Gateway...</h2>
        <p style={{ color: '#94a9ba' }}>Connecting to secure reservation and treasury servers.</p>
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
      {/* TOP NAVIGATION BAR */}
      <div className={styles.topBar}>
        <Link href="/traveller" className={styles.backLink}>
          <ArrowLeft size={16} /> Back to My Trips
        </Link>

        <div className={styles.topRightActions}>
          {/* CURRENCY SELECTOR PILL */}
          <div className={styles.currencyBar}>
            {Object.keys(CURRENCY_RATES).map((cur) => (
              <button
                key={cur}
                type="button"
                className={`${styles.currencyBtn} ${selectedCurrency === cur ? styles.currencyBtnActive : ''}`}
                onClick={() => setSelectedCurrency(cur)}
              >
                {cur}
              </button>
            ))}
          </div>

          {/* STATUS PILL */}
          <div className={`${styles.statusIndicator} ${isPaid ? styles.statusPaid : styles.statusUnpaid}`}>
            {isPaid ? (
              <>
                <CheckCircle2 size={16} /> Payment Verified &amp; Paid
              </>
            ) : (
              <>
                <Wallet size={16} /> Payment Pending Settle
              </>
            )}
          </div>
        </div>
      </div>

      {/* ==========================================================
          CASE A: ALREADY PAID OR JUST COMPLETED -> SHOW LUXURY VOUCHER
         ========================================================== */}
      {isPaid ? (
        <section>
          {/* VOUCHER ACTION BAR */}
          <div className={styles.voucherActionBar}>
            <div>
              <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800 }}>
                Certified Travel Voucher &amp; Tax Bill
              </h1>
              <p style={{ margin: 0, color: '#94a9ba', fontSize: 14 }}>
                Present this official electronic document or physical copy to your tour director upon arrival.
              </p>
            </div>

            <div className={styles.voucherActionButtons}>
              <button
                type="button"
                className={styles.actionButtonPrimary}
                onClick={() => window.print()}
              >
                <Printer size={17} /> Print Voucher &amp; Bill
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
                  Luxury Travel &amp; Expeditions Atelier • Reg No: GV-LK-2026/894
                </div>
                <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>
                  World Travel House, Colombo / Interlaken / Zurich • support@globalvista.com
                </div>
              </div>

              <div className={styles.invoiceMetaBlock}>
                <div className={styles.invoiceTitle}>
                  TAX INVOICE &amp; CERTIFIED VOUCHER
                </div>
                <div className={styles.invoiceNumber}>
                  {invoiceNumber}
                </div>
                <div style={{ fontSize: 13, color: '#4a5568' }}>
                  Cleared Date: <strong>{invoiceDate}</strong>
                </div>
                <div>
                  <span className={styles.paidStamp}>
                    <ShieldCheck size={16} /> Official Settlement Verified
                  </span>
                </div>
              </div>
            </div>

            {/* TWO COLUMNS: BILLED TO & EXPEDITION DETAILS */}
            <div className={styles.infoColumns}>
              <div>
                <div className={styles.infoSectionTitle}>
                  Billed To (Primary Explorer)
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
                  Expedition Itinerary &amp; Guide Info
                </div>
                <div className={styles.clientName}>
                  {pkg?.title || 'GlobalVista Custom Expedition'}
                </div>
                <div className={styles.infoLine}>
                  <MapPin size={15} color="#1785f2" />
                  <span>Destination: <strong>{pkg?.destination || 'Sri Lanka'}, {pkg?.country || ''}</strong></span>
                </div>
                <div className={styles.infoLine}>
                  <CalendarDays size={15} color="#1785f2" />
                  <span>Departure Date: <strong>{formatDate(booking.travelDate)}</strong></span>
                </div>
                <div className={styles.infoLine}>
                  <Users size={15} color="#1785f2" />
                  <span>Travel Party: <strong>{booking.numberOfPeople || 1} Person(s)</strong></span>
                </div>
                {booking.vehicleType && booking.vehicleType !== 'NONE' && (
                  <div className={styles.infoLine}>
                    <span>Transport: <strong>{booking.vehicleType} (Plate: {booking.vehicleNumber || 'WP CAC-1234'})</strong></span>
                  </div>
                )}
                <div className={styles.infoLine} style={{ color: '#2b6cb0', fontWeight: 600 }}>
                  <span>Booking Reference: <strong>{bookingRef}</strong></span>
                </div>
              </div>
            </div>

            {/* FINANCIAL ITEMIZED TABLE */}
            <table className={styles.invoiceTable}>
              <thead>
                <tr>
                  <th>Description &amp; Services</th>
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
                      Standard luxury inclusions, lodging reservation, and licensed itinerary
                    </div>
                  </td>
                  <td>Core Tour Experience</td>
                  <td>{booking.numberOfPeople || 1} Traveller(s)</td>
                  <td>{formatCurrency(booking.basePrice, selectedCurrency)}</td>
                  <td>{formatCurrency(booking.basePrice, selectedCurrency)}</td>
                </tr>

                {booking.vehicleFare && booking.vehicleFare > 0 ? (
                  <tr>
                    <td>
                      <div className={styles.itemTitle}>
                        {booking.vehicleType} Private Chauffeur &amp; Fuel
                      </div>
                      <div className={styles.itemSubtext}>
                        SLTDA Verified Tour Guide Vehicle (Reg: {booking.vehicleNumber || 'WP CAC-1234'})
                      </div>
                    </td>
                    <td>Private Transport</td>
                    <td>1 Vehicle</td>
                    <td>{formatCurrency(booking.vehicleFare, selectedCurrency)}</td>
                    <td>{formatCurrency(booking.vehicleFare, selectedCurrency)}</td>
                  </tr>
                ) : null}

                {booking.selectedAddOns && booking.selectedAddOns.length > 0 ? (
                  booking.selectedAddOns.map((addOn, index) => (
                    <tr key={addOn.addOnId || index}>
                      <td>
                        <div className={styles.itemTitle}>
                          {addOn.name || 'Premium Add-on Option'}
                        </div>
                        <div className={styles.itemSubtext}>
                          Pricing: {addOn.pricingType === 'PER_PERSON' ? 'Per Person' : 'Per Booking fixed'}
                        </div>
                      </td>
                      <td>Add-on Upgrade</td>
                      <td>{addOn.quantity || 1}</td>
                      <td>{formatCurrency(addOn.price, selectedCurrency)}</td>
                      <td>{formatCurrency(addOn.calculatedAmount || addOn.price, selectedCurrency)}</td>
                    </tr>
                  ))
                ) : null}
              </tbody>
            </table>

            {/* TOTALS CALCULATION */}
            <div className={styles.totalsContainer}>
              <div className={styles.totalsTable}>
                <div className={styles.totalsRow}>
                  <span>Base Package Tour Fee:</span>
                  <strong>{formatCurrency(booking.basePrice, selectedCurrency)}</strong>
                </div>
                {booking.vehicleFare ? (
                  <div className={styles.totalsRow}>
                    <span>Private Vehicle &amp; Guide:</span>
                    <strong>{formatCurrency(booking.vehicleFare, selectedCurrency)}</strong>
                  </div>
                ) : null}
                {booking.addOnsTotal ? (
                  <div className={styles.totalsRow}>
                    <span>Supplemental Add-ons:</span>
                    <strong>{formatCurrency(booking.addOnsTotal, selectedCurrency)}</strong>
                  </div>
                ) : null}
                <div className={styles.totalsRow}>
                  <span>Tourism VAT &amp; Insurance:</span>
                  <span style={{ color: '#059669', fontWeight: 600 }}>Included (0.00)</span>
                </div>
                <div className={styles.totalsGrandRow}>
                  <span>Grand Total Paid:</span>
                  <span className={styles.totalsGrandAmount}>
                    {formatCurrency(booking.totalPrice, selectedCurrency)}
                  </span>
                </div>
              </div>
            </div>

            {/* ATTACHED BANK SLIP (IF BANK TRANSFER WAS USED) */}
            {payment?.slipUrl && (
              <div className={styles.attachedSlipCard}>
                <img src={payment.slipUrl} alt="Bank Deposit Proof" className={styles.attachedSlipImg} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                    📎 Verified Bank Deposit Slip Attached
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Reference: <strong>{payment.bankReference || 'Confirmed Deposit'}</strong> • Reconciled by GlobalVista Treasury
                  </div>
                </div>
              </div>
            )}

            {/* PAYMENT VERIFICATION & SECURITY FOOTER */}
            <div className={styles.invoiceFooter}>
              <div className={styles.paymentVerificationBox}>
                <div className={styles.verificationTitle}>
                  Electronic Settlement Clearance
                </div>
                <div className={styles.verificationDetail}>
                  TRANSACTION ID: <strong>{txnId}</strong>
                </div>
                <div className={styles.verificationDetail}>
                  PAYMENT GATEWAY: <strong>{payment?.paymentMethod || 'VISA / MASTERCARD (ONLINE)'}</strong>
                </div>
                <div className={styles.verificationDetail}>
                  STATUS: <strong>AUTHORIZED • SETTLED</strong>
                </div>
                <div className={styles.verificationDetail}>
                  CLEARED TIMESTAMP: <strong>{new Date().toISOString()}</strong>
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
           CASE B: UNPAID -> SHOW LUXURY GLOBAL CHECKOUT FORM
           ========================================================== */
        <section className={styles.checkoutGrid}>
          {/* LEFT: RESERVATION SUMMARY */}
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>
              <Receipt size={22} color="#68ddff" />
              Reservation Summary
            </h2>
            <p className={styles.panelSubtitle}>
              Review your curated itinerary before selecting payment.
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

                {booking.vehicleType && booking.vehicleType !== 'NONE' && (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 12.5, color: '#a7efff', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🚗 Transport:</span>
                    <strong>{booking.vehicleType} (Plate: {booking.vehicleNumber || 'WP CAC-1234'})</strong>
                  </div>
                )}
              </div>
            </div>

            {/* ITEMIZED BREAKDOWN */}
            <div className={styles.priceList}>
              <div className={styles.priceRow}>
                <span>Base Tour Experience</span>
                <span>{formatCurrency(booking.basePrice, selectedCurrency)}</span>
              </div>

              {booking.vehicleFare && booking.vehicleFare > 0 ? (
                <div className={styles.priceRow}>
                  <span>Vehicle &amp; Chauffeur Transport</span>
                  <span>{formatCurrency(booking.vehicleFare, selectedCurrency)}</span>
                </div>
              ) : null}

              {booking.selectedAddOns && booking.selectedAddOns.length > 0 && (
                <>
                  {booking.selectedAddOns.map((addOn, idx) => (
                    <div key={addOn.addOnId || idx} className={styles.priceRow}>
                      <span style={{ fontSize: 13, color: '#94a9ba' }}>
                        + {addOn.name} (x{addOn.quantity || 1})
                      </span>
                      <span>{formatCurrency(addOn.calculatedAmount || addOn.price, selectedCurrency)}</span>
                    </div>
                  ))}
                </>
              )}

              <div className={styles.priceRow}>
                <span>Tourism Taxes &amp; Insurance</span>
                <span style={{ color: '#34d399', fontWeight: 600 }}>Included</span>
              </div>

              <div className={styles.priceTotalRow}>
                <div>
                  <span>Total Amount Due</span>
                  {selectedCurrency !== 'USD' && (
                    <span className={styles.convertedSecondaryAmount}>
                      ≈ {formatCurrency(booking.totalPrice, 'USD')} Base USD
                    </span>
                  )}
                </div>
                <span className={styles.priceTotalAmount}>
                  {formatCurrency(booking.totalPrice, selectedCurrency)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8da4b5', fontSize: 13 }}>
              <ShieldCheck size={18} color="#68ddff" />
              <span>Full refund guarantee within 48 hours of booking.</span>
            </div>
          </div>

          {/* RIGHT: MULTI-GATEWAY WORLDWIDE PAYMENT SYSTEM */}
          <div className={styles.panel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h2 className={styles.panelTitle} style={{ margin: 0 }}>
                <Wallet size={21} color="#68ddff" />
                Select Payment Method
              </h2>
              {paymentMethod === 'CREDIT_CARD' && (
                <button
                  type="button"
                  onClick={fillDemoCard}
                  style={{
                    fontSize: 11.5,
                    color: '#68ddff',
                    background: 'rgba(104,221,255,0.1)',
                    border: '1px solid rgba(104,221,255,0.3)',
                    padding: '4px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  ⚡ Fill Demo Card
                </button>
              )}
            </div>

            <p className={styles.panelSubtitle}>
              Choose from international cards, digital wallets, direct bank wire, or crypto.
            </p>

            {error && (
              <div className={styles.errorBanner}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* 6 GLOBAL PAYMENT METHOD TABS */}
            <div className={styles.paymentTabs}>
              <button
                type="button"
                className={`${styles.paymentTab} ${paymentMethod === 'CREDIT_CARD' ? styles.paymentTabActive : ''}`}
                onClick={() => setPaymentMethod('CREDIT_CARD')}
              >
                <CreditCard size={18} />
                <span>Cards (Global)</span>
              </button>

              <button
                type="button"
                className={`${styles.paymentTab} ${paymentMethod === 'BANK_TRANSFER' ? styles.paymentTabActive : ''}`}
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
              >
                <Building2 size={18} />
                <span>Bank Transfer</span>
              </button>

              <button
                type="button"
                className={`${styles.paymentTab} ${paymentMethod === 'APPLE_PAY' ? styles.paymentTabActive : ''}`}
                onClick={() => setPaymentMethod('APPLE_PAY')}
              >
                <Smartphone size={18} />
                <span>Apple Pay</span>
              </button>

              <button
                type="button"
                className={`${styles.paymentTab} ${paymentMethod === 'GOOGLE_PAY' ? styles.paymentTabActive : ''}`}
                onClick={() => setPaymentMethod('GOOGLE_PAY')}
              >
                <Zap size={18} />
                <span>Google Pay</span>
              </button>

              <button
                type="button"
                className={`${styles.paymentTab} ${paymentMethod === 'PAYPAL' ? styles.paymentTabActive : ''}`}
                onClick={() => setPaymentMethod('PAYPAL')}
              >
                <Wallet size={18} />
                <span>PayPal</span>
              </button>

              <button
                type="button"
                className={`${styles.paymentTab} ${paymentMethod === 'CRYPTO' ? styles.paymentTabActive : ''}`}
                onClick={() => setPaymentMethod('CRYPTO')}
              >
                <Coins size={18} />
                <span>Crypto (USDT)</span>
              </button>
            </div>

            {/* ----------------------------------------------------
                TAB 1: CREDIT / DEBIT CARD (VISA, MC, AMEX)
               ---------------------------------------------------- */}
            {paymentMethod === 'CREDIT_CARD' && (
              <div>
                {/* 3D LUXURY VIRTUAL CARD PREVIEW */}
                <div className={styles.cardVisual}>
                  <div className={styles.cardTopRow}>
                    <div className={styles.cardChip} />
                    <div className={styles.cardBrandBadge}>
                      {detectCardBrand(cardNumber)}
                    </div>
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

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submitPayment();
                  }}
                >
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

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Billing Country / Region</label>
                    <select
                      className={styles.inputControl}
                      value={billingCountry}
                      onChange={(e) => setBillingCountry(e.target.value)}
                    >
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Sri Lanka">Sri Lanka</option>
                      <option value="Canada">Canada</option>
                      <option value="Singapore">Singapore</option>
                      <option value="United Arab Emirates">United Arab Emirates</option>
                      <option value="Japan">Japan</option>
                      <option value="Other">Other Global Location</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={styles.paySubmitButton}
                  >
                    {isSubmitting ? (
                      <>Processing Secure Card Authorization...</>
                    ) : (
                      <>
                        <Lock size={17} />
                        Pay {formatCurrency(booking.totalPrice, selectedCurrency)}
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ----------------------------------------------------
                TAB 2: DIRECT BANK TRANSFER / WIRE (USER EMPHASIZED)
               ---------------------------------------------------- */}
            {paymentMethod === 'BANK_TRANSFER' && (
              <div className={styles.bankTransferSection}>
                {/* SUB-TABS: INTERNATIONAL USD vs LOCAL LKR */}
                <div className={styles.bankSubTabs}>
                  <button
                    type="button"
                    className={`${styles.bankSubTab} ${bankSubTab === 'INTL_USD' ? styles.bankSubTabActive : ''}`}
                    onClick={() => setBankSubTab('INTL_USD')}
                  >
                    🌐 International Wire (SWIFT / USD)
                  </button>
                  <button
                    type="button"
                    className={`${styles.bankSubTab} ${bankSubTab === 'SRI_LANKA_LKR' ? styles.bankSubTabActive : ''}`}
                    onClick={() => setBankSubTab('SRI_LANKA_LKR')}
                  >
                    🇱🇰 Sri Lanka Bank Transfer (Commercial Bank)
                  </button>
                </div>

                {/* MANDATORY REFERENCE CODE BOX */}
                <div className={styles.refNoticeBox}>
                  <div className={styles.refNoticeTitle}>
                    ⚠️ Important: Include This Booking Reference
                  </div>
                  <div className={styles.refNoticeCode}>
                    <span>{bookingRef}</span>
                    <button
                      type="button"
                      className={styles.copySmallBtn}
                      onClick={() => handleCopy(bookingRef, 'ref')}
                    >
                      {copiedKey === 'ref' ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                      {copiedKey === 'ref' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className={styles.refNoticeDesc}>
                    Please put <strong>{bookingRef}</strong> as your bank transfer remark/narration.
                  </div>
                </div>

                {/* OFFICIAL BANK ACCOUNT DETAILS CARD */}
                {bankSubTab === 'INTL_USD' ? (
                  <div className={styles.bankAccountCard}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#68ddff', marginBottom: 2 }}>
                      Citibank N.A. &amp; HSBC International Clearing (USD)
                    </div>

                    <div className={styles.bankDetailRow}>
                      <span className={styles.bankDetailLabel}>Account Beneficiary:</span>
                      <span className={styles.bankDetailVal}>GlobalVista Luxury Expeditions Ltd</span>
                    </div>

                    <div className={styles.bankDetailRow}>
                      <span className={styles.bankDetailLabel}>Account Number:</span>
                      <div className={styles.bankDetailVal}>
                        <span>8492 1048 2901 44</span>
                        <button
                          type="button"
                          className={styles.copySmallBtn}
                          onClick={() => handleCopy('84921048290144', 'acc_usd')}
                        >
                          {copiedKey === 'acc_usd' ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>

                    <div className={styles.bankDetailRow}>
                      <span className={styles.bankDetailLabel}>SWIFT / BIC Code:</span>
                      <div className={styles.bankDetailVal}>
                        <span>CITIUS33XXX</span>
                        <button
                          type="button"
                          className={styles.copySmallBtn}
                          onClick={() => handleCopy('CITIUS33XXX', 'swift_usd')}
                        >
                          {copiedKey === 'swift_usd' ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>

                    <div className={styles.bankDetailRow}>
                      <span className={styles.bankDetailLabel}>IBAN:</span>
                      <div className={styles.bankDetailVal}>
                        <span>GB29 CITI 1000 9984 9210 48</span>
                        <button
                          type="button"
                          className={styles.copySmallBtn}
                          onClick={() => handleCopy('GB29CITI10009984921048', 'iban')}
                        >
                          {copiedKey === 'iban' ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>

                    <div className={styles.bankDetailRow}>
                      <span className={styles.bankDetailLabel}>Fedwire / Routing:</span>
                      <span className={styles.bankDetailVal}>021000089 (New York Branch)</span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.bankAccountCard}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#68ddff', marginBottom: 2 }}>
                      Commercial Bank of Ceylon PLC (LKR Local Transfer)
                    </div>

                    <div className={styles.bankDetailRow}>
                      <span className={styles.bankDetailLabel}>Account Beneficiary:</span>
                      <span className={styles.bankDetailVal}>Global Vista Travels (Pvt) Ltd</span>
                    </div>

                    <div className={styles.bankDetailRow}>
                      <span className={styles.bankDetailLabel}>Account Number:</span>
                      <div className={styles.bankDetailVal}>
                        <span>1000 4892 0182</span>
                        <button
                          type="button"
                          className={styles.copySmallBtn}
                          onClick={() => handleCopy('100048920182', 'acc_lkr')}
                        >
                          {copiedKey === 'acc_lkr' ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>

                    <div className={styles.bankDetailRow}>
                      <span className={styles.bankDetailLabel}>Branch:</span>
                      <span className={styles.bankDetailVal}>Colombo City Branch (Code: 042)</span>
                    </div>

                    <div className={styles.bankDetailRow}>
                      <span className={styles.bankDetailLabel}>SWIFT Code:</span>
                      <span className={styles.bankDetailVal}>CCEYLKX</span>
                    </div>
                  </div>
                )}

                {/* TRANSFER SUBMISSION FORM */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submitPayment();
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                >
                  <div className={styles.formRow}>
                    <div className={styles.formGroup} style={{ margin: 0 }}>
                      <label className={styles.formLabel}>Transfer Reference / UTR Number</label>
                      <input
                        type="text"
                        required
                        className={styles.inputControl}
                        value={bankRefNo}
                        onChange={(e) => setBankRefNo(e.target.value)}
                        placeholder="e.g. UTR-9821447"
                      />
                    </div>
                    <div className={styles.formGroup} style={{ margin: 0 }}>
                      <label className={styles.formLabel}>Sender Bank Name</label>
                      <input
                        type="text"
                        required
                        className={styles.inputControl}
                        value={senderBank}
                        onChange={(e) => setSenderBank(e.target.value)}
                        placeholder="e.g. HSBC, Chase, Commercial"
                      />
                    </div>
                  </div>

                  {/* DEPOSIT SLIP UPLOAD */}
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.formLabel}>
                      <span>Upload Bank Deposit Slip / Transfer Screenshot</span>
                      <span style={{ fontSize: 11, color: '#38bdf8' }}>Max 10MB (PNG, JPG, PDF)</span>
                    </label>

                    {slipFile ? (
                      <div className={styles.slipPreviewCard}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src={slipFile.dataUrl} alt="Slip Preview" className={styles.slipThumb} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{slipFile.name}</div>
                            <div style={{ fontSize: 11, color: '#94a9ba' }}>{slipFile.size} • Ready to submit</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSlipFile(null)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid #ef4444',
                            color: '#fca5a5',
                            padding: '6px 10px',
                            borderRadius: 6,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 12,
                          }}
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    ) : (
                      <label className={styles.slipUploadArea}>
                        <Upload size={24} color="#68ddff" />
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                          Click or drag &amp; drop bank payment receipt
                        </div>
                        <div style={{ fontSize: 11.5, color: '#94a9ba' }}>
                          Supports bank receipt screenshots, e-banking slips, or photos
                        </div>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          style={{ display: 'none' }}
                          onChange={handleSlipUpload}
                        />
                      </label>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={styles.paySubmitButton}
                  >
                    {isSubmitting ? (
                      <>Submitting Bank Clearance &amp; Generating Voucher...</>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        Submit Bank Clearance &amp; Confirm Booking
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ----------------------------------------------------
                TAB 3: APPLE PAY
               ---------------------------------------------------- */}
            {paymentMethod === 'APPLE_PAY' && (
              <div className={styles.walletBox}>
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <Smartphone size={40} color="#a7efff" style={{ margin: '0 auto 10px' }} />
                  <h3 style={{ fontSize: 17, margin: '0 0 6px', color: '#fff' }}>Apple Pay Instant Settlement</h3>
                  <p style={{ color: '#94a9ba', fontSize: 13, margin: 0 }}>
                    Fast, secure checkout using your saved cards in Apple Wallet.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting || isWalletAuthorizing}
                  className={styles.applePayBtn}
                  onClick={() => {
                    setIsWalletAuthorizing(true);
                    setTimeout(() => {
                      void submitPayment('APPLE PAY (FACE ID VERIFIED)');
                    }, 1200);
                  }}
                >
                  {isWalletAuthorizing ? (
                    <>Verifying Face ID / Touch ID...</>
                  ) : (
                    <>
                      Pay • Pay {formatCurrency(booking.totalPrice, selectedCurrency)}
                    </>
                  )}
                </button>

                <div style={{ fontSize: 12, color: '#94a9ba', textAlign: 'center', lineHeight: 1.5 }}>
                  Biometrically authenticated with Apple Secure Element. No card details shared with merchant.
                </div>
              </div>
            )}

            {/* ----------------------------------------------------
                TAB 4: GOOGLE PAY
               ---------------------------------------------------- */}
            {paymentMethod === 'GOOGLE_PAY' && (
              <div className={styles.walletBox}>
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <Zap size={40} color="#38bdf8" style={{ margin: '0 auto 10px' }} />
                  <h3 style={{ fontSize: 17, margin: '0 0 6px', color: '#fff' }}>Google Pay Fast Checkout</h3>
                  <p style={{ color: '#94a9ba', fontSize: 13, margin: 0 }}>
                    Complete checkout instantly with cards securely stored in your Google Account.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting || isWalletAuthorizing}
                  className={styles.googlePayBtn}
                  onClick={() => {
                    setIsWalletAuthorizing(true);
                    setTimeout(() => {
                      void submitPayment('GOOGLE PAY (ONE-CLICK)');
                    }, 1200);
                  }}
                >
                  {isWalletAuthorizing ? (
                    <>Authorizing with Google Pay...</>
                  ) : (
                    <>
                      <span style={{ fontWeight: 800 }}>GPay</span> • Settle {formatCurrency(booking.totalPrice, selectedCurrency)}
                    </>
                  )}
                </button>

                <div style={{ fontSize: 12, color: '#94a9ba', textAlign: 'center', lineHeight: 1.5 }}>
                  Protected by Google multi-layer encryption and fraud monitoring.
                </div>
              </div>
            )}

            {/* ----------------------------------------------------
                TAB 5: PAYPAL & PAY IN 4
               ---------------------------------------------------- */}
            {paymentMethod === 'PAYPAL' && (
              <div className={styles.paypalBox}>
                <div className={styles.paypalInfoCard}>
                  <div style={{ fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                    🛡️ Official PayPal Buyer Protection Included
                  </div>
                  <span>
                    Your expedition is 100% insured. Eligible for <strong>PayPal Pay in 4</strong> interest-free installments of{' '}
                    <strong>{formatCurrency((booking.totalPrice || 0) / 4, selectedCurrency)}</strong> every two weeks.
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  className={styles.paypalGoldBtn}
                  onClick={() => {
                    void submitPayment('PAYPAL (BUYER PROTECTED)');
                  }}
                >
                  <span style={{ fontStyle: 'italic', fontFamily: 'serif', fontWeight: 900 }}>PayPal</span>
                  <span>Pay Now {formatCurrency(booking.totalPrice, selectedCurrency)}</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  className={styles.paypalCreditBtn}
                  onClick={() => {
                    void submitPayment('PAYPAL (PAY IN 4 INSTALLMENTS)');
                  }}
                >
                  Pay in 4 Installments of {formatCurrency((booking.totalPrice || 0) / 4, selectedCurrency)}
                </button>
              </div>
            )}

            {/* ----------------------------------------------------
                TAB 6: CRYPTO (USDT TRC-20 / ERC-20, BTC, ETH)
               ---------------------------------------------------- */}
            {paymentMethod === 'CRYPTO' && (
              <div className={styles.cryptoSection}>
                {/* CRYPTO NETWORK SWITCHER */}
                <div className={styles.cryptoNetworkGrid}>
                  {[
                    { key: 'USDT_TRC20', label: 'USDT (TRC-20)' },
                    { key: 'USDT_ERC20', label: 'USDT (ERC-20)' },
                    { key: 'BTC', label: 'Bitcoin (BTC)' },
                    { key: 'ETH', label: 'Ethereum (ETH)' },
                  ].map((net) => (
                    <button
                      key={net.key}
                      type="button"
                      className={`${styles.cryptoNetBtn} ${cryptoToken === net.key ? styles.cryptoNetBtnActive : ''}`}
                      onClick={() => setCryptoToken(net.key as any)}
                    >
                      {net.label}
                    </button>
                  ))}
                </div>

                {/* CRYPTO CARD & QR */}
                <div className={styles.cryptoCard}>
                  <div className={styles.timerBadge}>
                    <Clock size={13} />
                    <span>Price locked for {formattedTimer}</span>
                  </div>

                  {/* QR CODE VISUAL */}
                  <div className={styles.cryptoQrBox}>
                    <svg width="130" height="130" viewBox="0 0 100 100" fill="#0f172a">
                      <rect x="0" y="0" width="30" height="30" />
                      <rect x="5" y="5" width="20" height="20" fill="#ffffff" />
                      <rect x="9" y="9" width="12" height="12" />
                      <rect x="70" y="0" width="30" height="30" />
                      <rect x="75" y="5" width="20" height="20" fill="#ffffff" />
                      <rect x="79" y="9" width="12" height="12" />
                      <rect x="0" y="70" width="30" height="30" />
                      <rect x="5" y="75" width="20" height="20" fill="#ffffff" />
                      <rect x="9" y="79" width="12" height="12" />
                      <rect x="36" y="10" width="8" height="8" />
                      <rect x="48" y="10" width="8" height="8" />
                      <rect x="36" y="24" width="16" height="8" />
                      <rect x="40" y="40" width="20" height="20" />
                      <rect x="15" y="45" width="10" height="10" />
                      <rect x="75" y="45" width="12" height="12" />
                      <rect x="40" y="70" width="10" height="10" />
                      <rect x="55" y="75" width="15" height="15" />
                      <rect x="75" y="70" width="15" height="10" />
                    </svg>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: '#94a9ba' }}>
                      Treasury Deposit Address ({cryptoToken.replace('_', ' ')}):
                    </div>
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 12.5,
                        color: '#68ddff',
                        fontWeight: 700,
                        wordBreak: 'break-all',
                        margin: '4px 0 8px',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '6px 10px',
                        borderRadius: 6,
                      }}
                    >
                      {cryptoToken === 'USDT_TRC20'
                        ? 'TYDjh8m2KqPjE9xN57e3Y2x8h4wW2p8LKa'
                        : cryptoToken === 'BTC'
                        ? 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
                        : '0x71C67E7d20a066cfd49574C37b38dE75e53Db847'}
                    </div>

                    <button
                      type="button"
                      className={styles.copySmallBtn}
                      onClick={() =>
                        handleCopy(
                          cryptoToken === 'USDT_TRC20'
                            ? 'TYDjh8m2KqPjE9xN57e3Y2x8h4wW2p8LKa'
                            : cryptoToken === 'BTC'
                            ? 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
                            : '0x71C67E7d20a066cfd49574C37b38dE75e53Db847',
                          'crypto_addr'
                        )
                      }
                    >
                      {copiedKey === 'crypto_addr' ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                      {copiedKey === 'crypto_addr' ? 'Address Copied!' : 'Copy Wallet Address'}
                    </button>
                  </div>
                </div>

                {/* TXHASH INPUT */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submitPayment();
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.formLabel}>
                      <span>Transaction Hash (TxHash / TxID)</span>
                      <span style={{ fontSize: 11, color: '#34d399' }}>Instant Auto-Verify</span>
                    </label>
                    <input
                      type="text"
                      required
                      className={styles.inputControl}
                      value={cryptoTxHash}
                      onChange={(e) => setCryptoTxHash(e.target.value)}
                      placeholder="e.g. 0x8a92... or 5b8f9..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={styles.paySubmitButton}
                  >
                    {isSubmitting ? (
                      <>Verifying Blockchain Ledger...</>
                    ) : (
                      <>
                        <Coins size={17} />
                        Verify Crypto Payment &amp; Issue Voucher
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* SECURITY BADGES FOOTER */}
            <div className={styles.securityNote}>
              <ShieldCheck size={15} color="#34d399" />
              <span>PCI-DSS Level 1 Compliant • 256-Bit SSL Encrypted • Official Voucher Generated Immediately</span>
            </div>
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
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>Connecting to GlobalVista Reservation Clearing...</h2>
          </div>
        }
      >
        <PaymentsContent />
      </Suspense>
    </main>
  );
}

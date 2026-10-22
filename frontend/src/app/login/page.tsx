'use client';

import {
  FormEvent,
  useState,
} from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Compass,
  Eye,
  EyeOff,
  FileCheck2,
  LockKeyhole,
  Mail,
  MapPin,
  Plane,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';

import styles from './login.module.css';

// ==========================================
// BACKEND API
// ==========================================
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://globalvista-d7uz.onrender.com');

type UserRole = 'ADMIN' | 'USER' | 'GUIDE';
type GuideStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

type LoginUser = {
  id?: string;
  _id?: string;
  publicId?: string;
  name?: string;
  email?: string;
  mobile?: string;
  country?: string;
  role?: UserRole;
  guideStatus?: GuideStatus | null;
};

type LoginResponse = {
  message?: string;
  access_token?: string;
  user?: LoginUser;
};

type ApiError = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

type GuideNotice = 'PENDING' | 'REJECTED' | 'NOT_APPROVED' | null;

function getMessage(value: unknown, fallback = 'Request failed.'): string {
  if (!value || typeof value !== 'object') {
    return fallback;
  }
  const data = value as ApiError;
  if (Array.isArray(data.message)) {
    return data.message.join(', ');
  }
  if (typeof data.message === 'string') {
    return data.message;
  }
  return fallback;
}

function getGuideNotice(message: string): GuideNotice {
  const text = message.toLowerCase();
  if (
    text.includes('pending') ||
    text.includes('awaiting admin approval') ||
    text.includes('awaiting approval')
  ) {
    return 'PENDING';
  }
  if (text.includes('rejected')) {
    return 'REJECTED';
  }
  if (text.includes('not approved')) {
    return 'NOT_APPROVED';
  }
  return null;
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [guideNotice, setGuideNotice] = useState<GuideNotice>(null);

  function clearSession() {
    localStorage.removeItem('globalvista_token');
    localStorage.removeItem('globalvista_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  function saveSession(token: string, user: LoginUser) {
    const normalizedUser = {
      ...user,
      id: user.id || user._id,
    };
    const userJson = JSON.stringify(normalizedUser);
    localStorage.setItem('globalvista_token', token);
    localStorage.setItem('globalvista_user', userJson);
    localStorage.setItem('token', token);
    localStorage.setItem('user', userJson);
  }

  async function verifySession(token: string): Promise<LoginUser> {
    const response = await fetch(`${API_URL}/users/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    const responseData: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const detail = getMessage(
        responseData,
        'The Backend rejected the login token.',
      );
      throw new Error(`Session verification failed (HTTP ${response.status}): ${detail}`);
    }

    if (!responseData || typeof responseData !== 'object') {
      throw new Error('Invalid account verification response.');
    }

    const user = responseData as LoginUser;
    if (user.role !== 'ADMIN' && user.role !== 'USER' && user.role !== 'GUIDE') {
      throw new Error('The Backend returned an unknown account role.');
    }

    return user;
  }

  async function verifyAdminDashboard(token: string): Promise<void> {
    const response = await fetch(`${API_URL}/admin-dashboard`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const data: unknown = await response.json().catch(() => null);
      throw new Error(
        `Admin Dashboard access failed (HTTP ${response.status}): ${getMessage(
          data,
          'The Backend did not allow Admin access.',
        )}`,
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');
    setGuideNotice(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError('Please enter your email and password.');
      setLoading(false);
      return;
    }

    try {
      const loginResponse = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
        cache: 'no-store',
      });

      const loginData: unknown = await loginResponse.json().catch(() => null);

      if (!loginResponse.ok) {
        const message = getMessage(loginData, 'Invalid email or password.');
        if (loginResponse.status === 403) {
          const notice = getGuideNotice(message);
          if (notice) {
            clearSession();
            setGuideNotice(notice);
            setPassword('');
            return;
          }
        }
        throw new Error(message);
      }

      const result = loginData as LoginResponse | null;
      if (!result || !result.access_token || !result.user) {
        throw new Error('Backend login response is incomplete.');
      }

      const token = result.access_token;
      const currentUser = await verifySession(token);

      const loginId = result.user.id || result.user._id;
      const verifiedId = currentUser._id || currentUser.id;
      if (loginId && verifiedId && String(loginId) !== String(verifiedId)) {
        throw new Error('Authenticated account does not match the login response.');
      }

      if (currentUser.role === 'GUIDE') {
        if (currentUser.guideStatus === 'PENDING') {
          clearSession();
          setGuideNotice('PENDING');
          return;
        }
        if (currentUser.guideStatus === 'REJECTED') {
          clearSession();
          setGuideNotice('REJECTED');
          return;
        }
        if (currentUser.guideStatus !== 'APPROVED') {
          clearSession();
          setGuideNotice('NOT_APPROVED');
          return;
        }
      }

      if (currentUser.role === 'ADMIN') {
        await verifyAdminDashboard(token);
      }

      saveSession(token, {
        ...result.user,
        ...currentUser,
        id: currentUser._id || currentUser.id || result.user.id,
      });

      if (currentUser.role === 'ADMIN') {
        router.replace('/admin');
        return;
      }

      if (currentUser.role === 'GUIDE') {
        router.replace('/guide/dashboard');
        return;
      }

      if (currentUser.role === 'USER') {
        router.replace('/');
        return;
      }

      throw new Error('Invalid account role.');
    } catch (err) {
      clearSession();
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError(
          'Cannot connect to GlobalVista Backend. Please ensure network connectivity.',
        );
      } else {
        setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      {/* BACKGROUND VIDEO */}
      <video
        className={styles.backgroundVideo}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      >
        <source src="/videos/globalvista-hero-2.mp4" type="video/mp4" />
      </video>

      <div className={styles.overlay} />

      {/* BACK HOME */}
      <Link href="/" className={styles.backButton}>
        <ArrowLeft size={16} />
        <span>Back to Home</span>
      </Link>

      <div className={styles.container}>
        {/* BRAND SIDE */}
        <section className={styles.brandSide}>
          <div className={styles.logoRow}>
            <Link href="/" className={styles.logo}>
              Global<span>Vista</span>
            </Link>
            <div className={styles.brandPill}>
              <Sparkles size={12} />
              <span>Luxury Expeditions</span>
            </div>
          </div>

          <div className={styles.brandContent}>
            <span className={styles.eyebrow}>
              Your Journey Starts Here
            </span>

            <h1>
              Travel Further.
              <br />
              <span className={styles.heroGradient}>Live Beyond.</span>
            </h1>

            <p className={styles.brandDesc}>
              Access your bespoke traveler portal, review personalized itineraries,
              and download instant print-ready vouchers and official tax invoices.
            </p>

            {/* FEATURE PROOF POINTS */}
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <div className={styles.featureIconBox}>
                  <Compass size={18} />
                </div>
                <div className={styles.featureText}>
                  <span className={styles.featureTitle}>Curated Luxury Expeditions</span>
                  <span className={styles.featureSubtitle}>Handpicked 5-star sanctuaries across 7+ global regions</span>
                </div>
              </div>

              <div className={styles.featureItem}>
                <div className={styles.featureIconBox}>
                  <MapPin size={18} />
                </div>
                <div className={styles.featureText}>
                  <span className={styles.featureTitle}>Geospatial Route Mapping</span>
                  <span className={styles.featureSubtitle}>Interactive Leaflet GPS waypoints &amp; expedition elevations</span>
                </div>
              </div>

              <div className={styles.featureItem}>
                <div className={styles.featureIconBox}>
                  <FileCheck2 size={18} />
                </div>
                <div className={styles.featureText}>
                  <span className={styles.featureTitle}>Automated Digital Vouchers</span>
                  <span className={styles.featureSubtitle}>Print-ready traveler manifests with unique reference validation</span>
                </div>
              </div>
            </div>

            {/* TRUST PILL */}
            <div className={styles.trustPill}>
              <div className={styles.avatarGroup}>
                <div className={styles.avatarCircle}>GV</div>
                <div className={styles.avatarCircle}>LU</div>
                <div className={styles.avatarCircle}>EX</div>
              </div>
              <span className={styles.stars}>★★★★★</span>
              <span>Trusted by 12,000+ luxury travelers worldwide</span>
            </div>
          </div>
        </section>

        {/* LOGIN CARD */}
        <section className={styles.loginCard}>
          <div className={styles.cardLabel}>
            <Plane size={14} />
            <span>Welcome Back</span>
          </div>

          <div className={styles.loginHeader}>
            <h2>Sign in to GlobalVista</h2>
            <p>Enter your account credentials to continue.</p>
          </div>

          {/* LOGIN FORM */}
          <form className={styles.form} onSubmit={handleSubmit}>
            {/* EMAIL */}
            <div className={styles.fieldGroup}>
              <label htmlFor="email">Email Address</label>
              <div className={styles.inputBox}>
                <Mail size={18} />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError('');
                    setGuideNotice(null);
                  }}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className={styles.fieldGroup}>
              <div className={styles.passwordLabel}>
                <label htmlFor="password">Password</label>
                <button
                  type="button"
                  className={styles.forgotButton}
                  disabled
                  title="Password recovery is currently managed via Admin Support"
                  style={{ opacity: 0.65, cursor: 'not-allowed' }}
                >
                  Forgot password?
                </button>
              </div>

              <div className={styles.inputBox}>
                <LockKeyhole size={18} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError('');
                    setGuideNotice(null);
                  }}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* GUIDE PENDING */}
            {guideNotice === 'PENDING' && (
              <div
                role="status"
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#fef3c7',
                  marginBottom: 16,
                  fontSize: 12.5,
                  lineHeight: 1.6,
                }}
              >
                <Clock3 size={17} style={{ marginRight: 8, verticalAlign: 'middle', color: '#fbbf24' }} />
                <strong>Application Pending:</strong> Your Tour Guide application is awaiting Admin review.
              </div>
            )}

            {/* GUIDE REJECTED */}
            {guideNotice === 'REJECTED' && (
              <div
                role="alert"
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.35)',
                  color: '#ffe4e6',
                  marginBottom: 16,
                  fontSize: 12.5,
                  lineHeight: 1.6,
                }}
              >
                <XCircle size={17} style={{ verticalAlign: 'middle', marginRight: 8, color: '#fb7185' }} />
                <strong>Application Rejected:</strong> Please contact GlobalVista concierge support.
              </div>
            )}

            {/* GUIDE NOT APPROVED */}
            {guideNotice === 'NOT_APPROVED' && (
              <div
                role="alert"
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#fef3c7',
                  marginBottom: 16,
                  fontSize: 12.5,
                  lineHeight: 1.6,
                }}
              >
                <ShieldCheck size={17} style={{ verticalAlign: 'middle', marginRight: 8, color: '#fbbf24' }} />
                <strong>Guide Account Not Active:</strong> Your Guide account has not been approved yet.
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div className={styles.error} role="alert">
                <XCircle size={17} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              className={styles.loginButton}
              disabled={loading}
            >
              <span>{loading ? 'Authenticating Account...' : 'Sign In to Portal'}</span>
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          {/* REGISTER LINK */}
          <div className={styles.registerText}>
            <span>Don&apos;t have an account?</span>
            <Link href="/register">Create Account</Link>
          </div>

          {/* SECURITY NOTE */}
          <div className={styles.securityBox}>
            <ShieldCheck size={18} color="#34d399" style={{ flexShrink: 0, marginTop: 1 }} />
            <p>
              Role-Based Access Control: Traveller, approved Tour Guide, and Administrator portals are verified before signing in.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

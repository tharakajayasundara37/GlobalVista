
'use client';

import {
  FormEvent,
  useState,
} from 'react';

import Link from 'next/link';

import {
  useRouter,
} from 'next/navigation';

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Plane,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

import styles from './login.module.css';

// ==========================================
// BACKEND API
//
// Frontend stays on localhost:3000.
// NestJS Backend stays on localhost:3001.
//
// Direct Backend API calls are used here.
// No change to frontend/.env.local needed.
// ==========================================

const API_URL = 'http://localhost:3001';

// ==========================================
// ACCOUNT TYPES
// ==========================================

type UserRole =
  | 'ADMIN'
  | 'USER'
  | 'GUIDE';

type GuideStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

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

type GuideNotice =
  | 'PENDING'
  | 'REJECTED'
  | 'NOT_APPROVED'
  | null;

// ==========================================
// API ERROR HELPER
// ==========================================

function getMessage(
  value: unknown,
  fallback = 'Request failed.',
): string {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return fallback;
  }

  const data = value as ApiError;

  if (
    Array.isArray(data.message)
  ) {
    return data.message.join(', ');
  }

  if (
    typeof data.message === 'string'
  ) {
    return data.message;
  }

  return fallback;
}

// ==========================================
// GUIDE ERROR RECOGNITION
// ==========================================

function getGuideNotice(
  message: string,
): GuideNotice {
  const text = message.toLowerCase();

  if (
    text.includes('pending') ||
    text.includes('awaiting admin approval') ||
    text.includes('awaiting approval')
  ) {
    return 'PENDING';
  }

  if (
    text.includes('rejected')
  ) {
    return 'REJECTED';
  }

  if (
    text.includes('not approved')
  ) {
    return 'NOT_APPROVED';
  }

  return null;
}

// ==========================================
// LOGIN PAGE
// ==========================================

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [
    guideNotice,
    setGuideNotice,
  ] = useState<GuideNotice>(null);

  // ========================================
  // SESSION HELPERS
  // ========================================

  function clearSession() {
    localStorage.removeItem(
      'globalvista_token',
    );

    localStorage.removeItem(
      'globalvista_user',
    );

    localStorage.removeItem('token');

    localStorage.removeItem('user');
  }

  function saveSession(
    token: string,
    user: LoginUser,
  ) {
    const normalizedUser = {
      ...user,

      id:
        user.id ||
        user._id,
    };

    const userJson =
      JSON.stringify(normalizedUser);

    // Current GlobalVista keys

    localStorage.setItem(
      'globalvista_token',
      token,
    );

    localStorage.setItem(
      'globalvista_user',
      userJson,
    );

    // Legacy keys used by older pages

    localStorage.setItem(
      'token',
      token,
    );

    localStorage.setItem(
      'user',
      userJson,
    );
  }

  // ========================================
  // VERIFY LOGIN TOKEN
  //
  // Shared check for:
  // ADMIN
  // USER
  // GUIDE
  // ========================================

  async function verifySession(
    token: string,
  ): Promise<LoginUser> {
    const response = await fetch(
      `${API_URL}/users/me`,
      {
        method: 'GET',

        headers: {
          Authorization: `Bearer ${token}`,
        },

        cache: 'no-store',
      },
    );

    const responseData: unknown =
      await response
        .json()
        .catch(() => null);

    if (!response.ok) {
      const detail = getMessage(
        responseData,
        'The Backend rejected the login token.',
      );

      throw new Error(
        `Session verification failed (HTTP ${response.status}): ${detail}`,
      );
    }

    if (
      !responseData ||
      typeof responseData !== 'object'
    ) {
      throw new Error(
        'Invalid account verification response.',
      );
    }

    const user =
      responseData as LoginUser;

    if (
      user.role !== 'ADMIN' &&
      user.role !== 'USER' &&
      user.role !== 'GUIDE'
    ) {
      throw new Error(
        'The Backend returned an unknown account role.',
      );
    }

    return user;
  }

  // ========================================
  // VERIFY ADMIN DASHBOARD PERMISSION
  // ========================================

  async function verifyAdminDashboard(
    token: string,
  ): Promise<void> {
    const response = await fetch(
      `${API_URL}/admin-dashboard`,
      {
        method: 'GET',

        headers: {
          Authorization: `Bearer ${token}`,
        },

        cache: 'no-store',
      },
    );

    if (!response.ok) {
      const data: unknown =
        await response
          .json()
          .catch(() => null);

      throw new Error(
        `Admin Dashboard access failed (HTTP ${response.status}): ${getMessage(
          data,
          'The Backend did not allow Admin access.',
        )}`,
      );
    }
  }

  // ========================================
  // HANDLE LOGIN
  // ========================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError('');
    setGuideNotice(null);

    const normalizedEmail =
      email.trim().toLowerCase();

    if (
      !normalizedEmail ||
      !password
    ) {
      setError(
        'Please enter your email and password.',
      );

      setLoading(false);
      return;
    }

    try {
      // ====================================
      // STEP 1 - LOGIN
      // ====================================

      const loginResponse = await fetch(
        `${API_URL}/auth/login`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            email: normalizedEmail,
            password,
          }),

          cache: 'no-store',
        },
      );

      const loginData: unknown =
        await loginResponse
          .json()
          .catch(() => null);

      if (!loginResponse.ok) {
        const message = getMessage(
          loginData,
          'Invalid email or password.',
        );

        if (loginResponse.status === 403) {
          const notice =
            getGuideNotice(message);

          if (notice) {
            clearSession();

            setGuideNotice(notice);
            setPassword('');
            return;
          }
        }

        throw new Error(message);
      }

      const result =
        loginData as LoginResponse | null;

      if (
        !result ||
        !result.access_token ||
        !result.user
      ) {
        throw new Error(
          'Backend login response is incomplete.',
        );
      }

      const token =
        result.access_token;

      // ====================================
      // STEP 2 - VERIFY JWT
      //
      // Runs for every role.
      // ====================================

      const currentUser =
        await verifySession(token);

      // Confirm the account returned by
      // /users/me matches the login response.

      if (
        result.user.id &&
        currentUser._id &&
        String(result.user.id) !==
          String(currentUser._id)
      ) {
        throw new Error(
          'Authenticated account does not match the login response.',
        );
      }

      // ====================================
      // STEP 3 - CHECK GUIDE APPROVAL
      // ====================================

      if (
        currentUser.role === 'GUIDE'
      ) {
        if (
          currentUser.guideStatus ===
          'PENDING'
        ) {
          clearSession();

          setGuideNotice(
            'PENDING',
          );

          return;
        }

        if (
          currentUser.guideStatus ===
          'REJECTED'
        ) {
          clearSession();

          setGuideNotice(
            'REJECTED',
          );

          return;
        }

        if (
          currentUser.guideStatus !==
          'APPROVED'
        ) {
          clearSession();

          setGuideNotice(
            'NOT_APPROVED',
          );

          return;
        }
      }

      // ====================================
      // STEP 4 - CHECK ADMIN PERMISSION
      // ====================================

      if (
        currentUser.role === 'ADMIN'
      ) {
        await verifyAdminDashboard(
          token,
        );
      }

      // ====================================
      // STEP 5 - SAVE VERIFIED SESSION
      // ====================================

      saveSession(
        token,
        {
          ...result.user,
          ...currentUser,
          id:
            currentUser._id ||
            currentUser.id ||
            result.user.id,
        },
      );

      // ====================================
      // STEP 6 - ROLE REDIRECTS
      // ====================================

      if (
        currentUser.role === 'ADMIN'
      ) {
        router.replace('/admin');
        return;
      }

      if (
        currentUser.role === 'GUIDE'
      ) {
        router.replace(
          '/guide/dashboard',
        );

        return;
      }

      if (
        currentUser.role === 'USER'
      ) {
        router.replace('/');
        return;
      }

      throw new Error(
        'Invalid account role.',
      );
    } catch (err) {
      // A failed verification must not
      // leave a partially saved session.

      clearSession();

      if (
        err instanceof TypeError &&
        err.message === 'Failed to fetch'
      ) {
        setError(
          'Cannot connect to GlobalVista Backend on localhost:3001. Make sure the Backend is running.',
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'Login failed. Please try again.',
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // ORIGINAL GLOBALVISTA LOGIN DESIGN
  // ========================================

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
        <source
          src="/videos/globalvista-hero-2.mp4"
          type="video/mp4"
        />
      </video>

      <div className={styles.overlay} />

      {/* BACK HOME */}

      <Link
        href="/"
        className={styles.backButton}
      >
        <ArrowLeft size={18} />
        Back to Home
      </Link>

      <div className={styles.container}>
        {/* BRAND */}

        <section
          className={styles.brandSide}
        >
          <Link
            href="/"
            className={styles.logo}
          >
            Global<span>Vista</span>
          </Link>

          <div
            className={styles.brandContent}
          >
            <span
              className={styles.brandLine}
            />

            <span
              className={styles.eyebrow}
            >
              YOUR JOURNEY STARTS HERE
            </span>

            <h1>
              Travel Further.
              <br />
              <em>Live More.</em>
            </h1>

            <p>
              Sign in to manage your
              bookings, saved trips and
              travel experiences.
            </p>
          </div>
        </section>

        {/* LOGIN CARD */}

        <section
          className={styles.loginCard}
        >
          <div
            className={styles.cardLabel}
          >
            <Plane size={17} />
            Welcome Back
          </div>

          <div
            className={styles.loginHeader}
          >
            <h2>
              Sign in to
              <br />
              GlobalVista
            </h2>

            <p>
              Continue your journey
              with your account.
            </p>
          </div>

          {/* LOGIN FORM */}

          <form
            className={styles.form}
            onSubmit={handleSubmit}
          >
            {/* EMAIL */}

            <div
              className={styles.fieldGroup}
            >
              <label htmlFor="email">
                Email Address
              </label>

              <div
                className={styles.inputBox}
              >
                <Mail size={18} />

                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(
                      event.target.value,
                    );

                    setError('');
                    setGuideNotice(null);
                  }}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}

            <div
              className={styles.fieldGroup}
            >
              <div
                className={styles.passwordLabel}
              >
                <label htmlFor="password">
                  Password
                </label>

                <button
                  type="button"
                  className={styles.forgotButton}
                  disabled
                  title="Password recovery is not configured yet"
                  style={{
                    opacity: 0.55,
                    cursor: 'not-allowed',
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <div
                className={styles.inputBox}
              >
                <LockKeyhole size={18} />

                <input
                  id="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => {
                    setPassword(
                      event.target.value,
                    );

                    setError('');
                    setGuideNotice(null);
                  }}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() =>
                    setShowPassword(
                      (value) => !value,
                    )
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* GUIDE PENDING */}

            {guideNotice === 'PENDING' && (
              <div
                role="status"
                style={{
                  padding: 15,
                  borderRadius: 12,
                  background: '#fffbeb',
                  color: '#92400e',
                  marginBottom: 15,
                  lineHeight: 1.7,
                  fontSize: 13,
                }}
              >
                <Clock3
                  size={18}
                  style={{
                    marginRight: 8,
                    verticalAlign: 'middle',
                  }}
                />

                <strong>
                  Application Pending
                </strong>

                <p>
                  Your Tour Guide application
                  is waiting for Admin approval.
                </p>
              </div>
            )}

            {/* GUIDE REJECTED */}

            {guideNotice === 'REJECTED' && (
              <div
                role="alert"
                style={{
                  padding: 15,
                  borderRadius: 12,
                  background: '#fff1f2',
                  color: '#9f1239',
                  marginBottom: 15,
                  fontSize: 13,
                  lineHeight: 1.7,
                }}
              >
                <XCircle
                  size={18}
                  style={{
                    verticalAlign: 'middle',
                    marginRight: 8,
                  }}
                />

                <strong>
                  Application Rejected
                </strong>

                <p>
                  Your Tour Guide application
                  was rejected. Please contact
                  GlobalVista support.
                </p>
              </div>
            )}

            {/* GUIDE NOT APPROVED */}

            {guideNotice ===
              'NOT_APPROVED' && (
              <div
                role="alert"
                style={{
                  padding: 15,
                  borderRadius: 12,
                  background: '#fffbeb',
                  color: '#92400e',
                  marginBottom: 15,
                  fontSize: 13,
                  lineHeight: 1.7,
                }}
              >
                <ShieldCheck
                  size={18}
                  style={{
                    verticalAlign: 'middle',
                    marginRight: 8,
                  }}
                />

                <strong>
                  Guide Account Not Approved
                </strong>

                <p>
                  Your Guide account is not
                  currently approved for access.
                </p>
              </div>
            )}

            {/* ERROR */}

            {error && (
              <div
                className={styles.error}
                role="alert"
              >
                <XCircle
                  size={17}
                  style={{
                    verticalAlign: 'middle',
                    marginRight: 8,
                  }}
                />

                {error}
              </div>
            )}

            {/* LOGIN BUTTON */}

            <button
              type="submit"
              className={styles.loginButton}
              disabled={loading}
            >
              <span>
                {loading
                  ? 'Verifying Account...'
                  : 'Sign In'}
              </span>

              {!loading && (
                <ArrowRight size={20} />
              )}
            </button>
          </form>

          {/* REGISTER LINK */}

          <div
            className={styles.registerText}
          >
            <span>
              Don&apos;t have an account?
            </span>

            <Link href="/register">
              Create Account
            </Link>
          </div>

          {/* ACCOUNT INFORMATION */}

          <div
            style={{
              marginTop: 20,
              padding: 13,
              borderRadius: 10,
              border:
                '1px solid rgba(148,163,184,0.25)',
              display: 'flex',
              gap: 9,
              alignItems: 'flex-start',
            }}
          >
            <CheckCircle2
              size={17}
              color="#10b981"
              style={{
                flexShrink: 0,
              }}
            />

            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: '#64748b',
                lineHeight: 1.7,
              }}
            >
              Admin, Traveller and approved
              Tour Guide accounts are
              verified before signing in.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

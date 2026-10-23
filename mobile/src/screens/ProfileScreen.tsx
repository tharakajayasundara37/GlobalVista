import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  UserRound,
  Mail,
  Lock,
  Globe2,
  DollarSign,
  LogOut,
  MessageCircle,
  ShieldCheck,
  Check,
  ChevronRight,
  ShieldAlert,
  Compass,
  Award,
  Briefcase,
  CreditCard,
  Phone,
  Eye,
  EyeOff,
  BadgeCheck,
  IdCard,
  Languages,
  CheckCircle2,
  MapPin,
  Sparkles,
  Plane,
  ArrowRight,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useCurrency, CURRENCIES, CurrencyCode } from '../context/CurrencyContext';
import { useLanguage, LanguageCode } from '../context/LanguageContext';
import { WHATSAPP_NUMBER, WHATSAPP_DEFAULT_MSG } from '../constants/config';
import { api, normalizeMediaUrl } from '../services/api';
import { MobileAdminPortal } from '../components/MobileAdminPortal';
import { MobileGuidePortal } from '../components/MobileGuidePortal';
import { WhatsAppIcon } from '../components/WhatsAppIcon';

const AVAILABLE_LANGUAGES = [
  'English',
  'Sinhala',
  'Tamil',
  'French',
  'German',
  'Spanish',
  'Italian',
  'Japanese',
  'Chinese',
  'Russian',
  'Arabic',
  'Hindi',
];

export const ProfileScreen: React.FC = () => {
  const { user, token, login, register, logout, isLoading } = useAuth();
  const { currency, setCurrency, currentCurrency } = useCurrency();
  const { language, setLanguage, t } = useLanguage();

  // Auth Form State (when not signed in)
  const [authTab, setAuthTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [registerRole, setRegisterRole] = useState<'USER' | 'GUIDE'>('USER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [country, setCountry] = useState('Sri Lanka');
  const [city, setCity] = useState('');
  const [experienceYears, setExperienceYears] = useState('3');
  const [governmentIdType, setGovernmentIdType] = useState<'NIC' | 'PASSPORT'>('NIC');
  const [idNumber, setIdNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<'CAR' | 'VAN' | 'BUS'>('CAR');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [about, setAbout] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English', 'Sinhala']);
  const [acceptGuideTerms, setAcceptGuideTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Portal Modals
  const [adminPortalOpen, setAdminPortalOpen] = useState(false);
  const [guidePortalOpen, setGuidePortalOpen] = useState(false);

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleAuthSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please fill in both email and password.');
      return;
    }

    try {
      setSubmitting(true);
      if (authTab === 'LOGIN') {
        const loggedInUser = await login(email.trim(), password);
        if (loggedInUser?.role === 'ADMIN') {
          Alert.alert(
            'Admin Authenticated 🛡️',
            'Master Administrator credentials verified. Opening Command Center...',
            [
              {
                text: 'Launch Admin Suite',
                onPress: () => setAdminPortalOpen(true),
              },
            ]
          );
        } else if (loggedInUser?.role === 'GUIDE') {
          Alert.alert(
            'Guide Portal 🧭',
            'Tour Guide credentials verified. Welcome back!',
            [
              {
                text: 'Launch Guide Suite',
                onPress: () => setGuidePortalOpen(true),
              },
            ]
          );
        } else {
          Alert.alert('Welcome Back! 👋', `Signed in successfully as ${loggedInUser?.name || 'Explorer'}.`);
        }
      } else {
        // ==========================================
        // REGISTRATION VALIDATIONS
        // ==========================================
        if (!name.trim() || name.trim().length < 2) {
          Alert.alert('Name Required', 'Please enter your full name (at least 2 characters).');
          return;
        }
        if (!country.trim()) {
          Alert.alert('Country Required', 'Please enter your country.');
          return;
        }
        if (!mobile.trim() || mobile.trim().length < 7) {
          Alert.alert('Mobile Required', 'Please enter a valid mobile number (min 7 digits).');
          return;
        }
        if (password !== confirmPassword) {
          Alert.alert('Password Mismatch', 'Password and Confirm Password do not match.');
          return;
        }

        if (registerRole === 'USER') {
          // ==========================================
          // 1. TRAVELLER REGISTRATION
          // ==========================================
          if (password.length < 6) {
            Alert.alert('Password Too Short', 'Password must be at least 6 characters long.');
            return;
          }

          await register({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            mobile: mobile.trim(),
            country: country.trim(),
          });
          Alert.alert('Account Created! 🎉', 'Welcome to GlobalVista Luxury Travel.');
        } else {
          // ==========================================
          // 2. TOUR GUIDE REGISTRATION
          // ==========================================
          const isStrong =
            password.length >= 10 &&
            /[A-Z]/.test(password) &&
            /[a-z]/.test(password) &&
            /[0-9]/.test(password) &&
            /[^A-Za-z0-9]/.test(password);

          if (!isStrong) {
            Alert.alert(
              'Guide Security Requirements 🔒',
              'Guide passwords must be at least 10 characters long, containing uppercase, lowercase, number, and a special character.'
            );
            return;
          }

          if (!city.trim()) {
            Alert.alert('Operating City Required', 'Please specify your primary guiding city.');
            return;
          }
          if (!idNumber.trim() || idNumber.trim().length < 4) {
            Alert.alert('Government ID Required', 'Please enter your NIC or Passport number.');
            return;
          }
          if (selectedLanguages.length === 0) {
            Alert.alert('Languages Required', 'Please select at least 1 spoken language.');
            return;
          }
          if (about.trim().length < 20) {
            Alert.alert('Bio Required', 'Please provide at least 20 characters about your experience.');
            return;
          }
          if (!acceptGuideTerms) {
            Alert.alert('Terms Agreement Required', 'Please accept the Tour Guide Terms & Identity Review standards.');
            return;
          }

          await api.registerGuide({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            country: country.trim() || 'Sri Lanka',
            city: city.trim(),
            mobile: mobile.trim(),
            languages: selectedLanguages,
            experienceYears: Number(experienceYears) || 1,
            governmentIdType,
            governmentIdNumber: idNumber.trim(),
            about: about.trim(),
          });

          Alert.alert(
            'Application Submitted! 🧭',
            'Your Tour Guide application has been received with PENDING status. The GlobalVista Admin team will verify your credentials and approve your certification.',
            [
              {
                text: 'Sign In Now',
                onPress: () => {
                  setAuthTab('LOGIN');
                  setPassword('');
                  setConfirmPassword('');
                },
              },
            ]
          );
        }
      }
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('email already exists')) {
        Alert.alert(
          'Account Exists',
          'This email is already registered. Please switch to "Sign In" to enter your password.',
          [
            { text: 'Switch to Sign In', onPress: () => setAuthTab('LOGIN') },
            { text: 'OK', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Authentication Error', err.message || 'Please check your credentials.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of GlobalVista?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const openWhatsApp = () => {
    const url = `whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(WHATSAPP_DEFAULT_MSG)}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_DEFAULT_MSG)}`);
      }
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {token && user ? (
          /* ========================================================
             AUTHENTICATED USER VIEW (Profile, Concierge & Settings)
             ======================================================== */
          <View>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                {user.profileImage ? (
                  <Image
                    source={{ uri: normalizeMediaUrl(user.profileImage) }}
                    style={styles.avatarImg}
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {(user.name?.trim().charAt(0) || 'T').toUpperCase()}
                  </Text>
                )}
              </View>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.roleBadge}>
                <ShieldCheck size={12} color={COLORS.accent} />
                <Text style={styles.roleText}>{user.role || 'VERIFIED TRAVELLER'}</Text>
              </View>
            </View>

            {/* Admin Command Center Launcher (For all ADMIN role accounts) */}
            {user.role === 'ADMIN' && (
              <TouchableOpacity
                style={styles.adminBanner}
                onPress={() => setAdminPortalOpen(true)}
                activeOpacity={0.85}
              >
                <View style={styles.adminBannerIcon}>
                  <ShieldCheck size={22} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.adminBannerTitle}>GLOBALVISTA ADMIN SUITE</Text>
                  <Text style={styles.adminBannerSub}>
                    Executive Dashboard · Bookings, Packages, Guides, Users & Payments
                  </Text>
                </View>
                <ChevronRight size={18} color="#10b981" />
              </TouchableOpacity>
            )}

            {/* Guide Workspace Launcher (Only if GUIDE) */}
            {user.role === 'GUIDE' && (
              <TouchableOpacity
                style={styles.guideBanner}
                onPress={() => setGuidePortalOpen(true)}
                activeOpacity={0.85}
              >
                <View style={styles.guideBannerIcon}>
                  <Compass size={22} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.guideBannerTitle}>TOUR GUIDE WORKSPACE</Text>
                  <Text style={styles.guideBannerSub}>
                    Status: {user.guideStatus || 'PENDING'} · View assignments & roster
                  </Text>
                </View>
                <ChevronRight size={18} color="#ffffff" />
              </TouchableOpacity>
            )}

            {/* Preferences Section (Only when logged in) */}
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>PREFERENCES</Text>

              {/* Currency Preference */}
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => {
                  const codes: CurrencyCode[] = ['USD', 'LKR', 'EUR', 'GBP', 'AUD', 'JPY'];
                  const next = codes[(codes.indexOf(currency) + 1) % codes.length];
                  setCurrency(next);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.menuLeft}>
                  <View style={styles.menuIconWrap}>
                    <DollarSign size={18} color={COLORS.accent} />
                  </View>
                  <View>
                    <Text style={styles.menuTitle}>{t.currencyPreference}</Text>
                    <Text style={styles.menuSubtitle}>{currentCurrency.label} ({currentCurrency.symbol})</Text>
                  </View>
                </View>
                <View style={styles.badgeWrap}>
                  <Text style={styles.badgeText}>{currentCurrency.flag} {currency}</Text>
                  <ChevronRight size={16} color={COLORS.textMuted} />
                </View>
              </TouchableOpacity>

              {/* Language Preference */}
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => {
                  const langs: LanguageCode[] = ['EN', 'SI', 'FR', 'DE'];
                  const next = langs[(langs.indexOf(language) + 1) % langs.length];
                  setLanguage(next);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.menuLeft}>
                  <View style={styles.menuIconWrap}>
                    <Globe2 size={18} color={COLORS.accent} />
                  </View>
                  <View>
                    <Text style={styles.menuTitle}>{t.languagePreference}</Text>
                    <Text style={styles.menuSubtitle}>
                      {language === 'EN' ? 'English (Global)' : language === 'SI' ? 'සිංහල (Sri Lanka)' : language === 'FR' ? 'Français' : 'Deutsch'}
                    </Text>
                  </View>
                </View>
                <View style={styles.badgeWrap}>
                  <Text style={styles.badgeText}>
                    {language === 'EN' ? '🇺🇸 EN' : language === 'SI' ? '🇱🇰 SI' : language === 'FR' ? '🇫🇷 FR' : '🇩🇪 DE'}
                  </Text>
                  <ChevronRight size={16} color={COLORS.textMuted} />
                </View>
              </TouchableOpacity>
            </View>

            {/* VIP Services & Concierge Section (Only when logged in) */}
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>VIP SERVICES & CONCIERGE</Text>

              <TouchableOpacity style={styles.menuRow} onPress={openWhatsApp} activeOpacity={0.7}>
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIconWrap, { backgroundColor: '#dcfce7' }]}>
                    <WhatsAppIcon size={18} color="#16a34a" />
                  </View>
                  <View>
                    <Text style={styles.menuTitle}>{t.chatWhatsApp}</Text>
                    <Text style={styles.menuSubtitle}>24/7 Direct Concierge Desk</Text>
                  </View>
                </View>
                <ChevronRight size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <LogOut size={16} color="#ef4444" />
              <Text style={styles.logoutText}>{t.signOut}</Text>
            </TouchableOpacity>

            <View style={styles.footerInfo}>
              <Text style={styles.footerCopy}>GlobalVista Luxury Expeditions v1.0.0</Text>
              <Text style={styles.footerSub}>Official iOS & Android Mobile Companion</Text>
            </View>
          </View>
        ) : (
          /* ========================================================
             GUEST VIEW: DEDICATED LUXURY LOGIN & REGISTER SUITE
             ======================================================== */
          <View>
            {/* HERO BRAND HEADER (Directly Inspired by Web Hero) */}
            <View style={styles.brandHero}>
              <View style={styles.brandTopRow}>
                <View style={styles.brandLogoWrap}>
                  <Plane size={18} color="#38bdf8" />
                  <Text style={styles.brandLogoText}>
                    Global<Text style={{ color: '#38bdf8' }}>Vista</Text>
                  </Text>
                </View>
                <View style={styles.brandAtelierTag}>
                  <Text style={styles.brandAtelierText}>EST. 2026 · ATELIER</Text>
                </View>
              </View>

              <View style={styles.brandDivider} />

              <Text style={styles.brandEyebrow}>YOUR JOURNEY STARTS HERE</Text>
              <Text style={styles.brandHeading}>
                Travel Further.{'\n'}
                <Text style={styles.brandHeadingItalic}>Live More.</Text>
              </Text>
              <Text style={styles.brandSub}>
                {authTab === 'LOGIN'
                  ? 'Sign in to manage your bookings, saved trips and luxury travel experiences.'
                  : 'Join GlobalVista’s distinguished network of luxury explorers & certified tour concierges.'}
              </Text>

              <View style={styles.brandFeaturesRow}>
                <View style={styles.brandFeaturePill}>
                  <Sparkles size={11} color="#38bdf8" />
                  <Text style={styles.brandFeatureText}>Bespoke Tours</Text>
                </View>
                <View style={styles.brandFeaturePill}>
                  <ShieldCheck size={11} color="#38bdf8" />
                  <Text style={styles.brandFeatureText}>Verified Guides</Text>
                </View>
                <View style={styles.brandFeaturePill}>
                  <Globe2 size={11} color="#38bdf8" />
                  <Text style={styles.brandFeatureText}>24/7 Concierge</Text>
                </View>
              </View>
            </View>

            {/* MAIN AUTH CARD */}
            <View style={styles.authCard}>
              {/* Segmented Pill Tabs */}
              <View style={styles.authTabs}>
                <TouchableOpacity
                  style={[styles.authTab, authTab === 'LOGIN' && styles.authTabActive]}
                  onPress={() => setAuthTab('LOGIN')}
                  activeOpacity={0.8}
                >
                  <Lock size={15} color={authTab === 'LOGIN' ? COLORS.primary : COLORS.textMuted} />
                  <Text style={[styles.authTabText, authTab === 'LOGIN' && styles.authTabTextActive]}>
                    Sign In
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.authTab, authTab === 'REGISTER' && styles.authTabActive]}
                  onPress={() => setAuthTab('REGISTER')}
                  activeOpacity={0.8}
                >
                  <Sparkles size={15} color={authTab === 'REGISTER' ? COLORS.primary : COLORS.textMuted} />
                  <Text style={[styles.authTabText, authTab === 'REGISTER' && styles.authTabTextActive]}>
                    Create Account
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                {/* ----------------------------------------------------
                   IF AUTH TAB IS LOGIN (Matches Web Login page)
                   ---------------------------------------------------- */}
                {authTab === 'LOGIN' ? (
                  <>
                    <View style={styles.loginWelcomeHeader}>
                      <View style={styles.loginWelcomeBadge}>
                        <Plane size={13} color="#0284c7" />
                        <Text style={styles.loginWelcomeBadgeText}>WELCOME BACK</Text>
                      </View>
                      <Text style={styles.loginTitle}>Sign in to GlobalVista</Text>
                      <Text style={styles.loginSub}>Continue your journey with your explorer account.</Text>
                    </View>

                    {/* Email Field */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                      <View style={styles.inputWrap}>
                        <Mail size={16} color={COLORS.textMuted} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="you@example.com"
                          placeholderTextColor={COLORS.textMuted}
                          autoCapitalize="none"
                          keyboardType="email-address"
                          value={email}
                          onChangeText={setEmail}
                        />
                      </View>
                    </View>

                    {/* Password Field */}
                    <View style={styles.inputGroup}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.inputLabel}>PASSWORD</Text>
                        <TouchableOpacity
                          onPress={() =>
                            Alert.alert(
                              'Password Recovery 🔒',
                              'To maintain highest confidentiality, please contact the GlobalVista Concierge at support@globalvista.com or via WhatsApp to reset your password.'
                            )
                          }
                        >
                          <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.inputWrap}>
                        <Lock size={16} color={COLORS.textMuted} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="Enter your password"
                          placeholderTextColor={COLORS.textMuted}
                          secureTextEntry={!showPassword}
                          value={password}
                          onChangeText={setPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                          {showPassword ? <EyeOff size={16} color={COLORS.textMuted} /> : <Eye size={16} color={COLORS.textMuted} />}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Sign In Button */}
                    <TouchableOpacity
                      style={styles.submitBtn}
                      onPress={handleAuthSubmit}
                      disabled={submitting}
                      activeOpacity={0.85}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.submitBtnText}>Sign In</Text>
                          <ArrowRight size={16} color="#ffffff" />
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Security Trust Card (Matches Web) */}
                    <View style={styles.securityTrustCard}>
                      <CheckCircle2 size={16} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
                      <Text style={styles.securityTrustText}>
                        Admin, Traveller and approved Tour Guide accounts are securely verified before signing in.
                      </Text>
                    </View>

                    {/* Register Switch */}
                    <View style={styles.authSwitchRow}>
                      <Text style={styles.authSwitchLabel}>Don't have an account yet?</Text>
                      <TouchableOpacity onPress={() => setAuthTab('REGISTER')}>
                        <Text style={styles.authSwitchLink}>Create Account</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Admin Portal Quick Sign In (On Login only) */}
                    <TouchableOpacity
                      style={styles.adminQuickLoginBtn}
                      onPress={() => {
                        setEmail('admin@globalvista.com');
                        setPassword('');
                        Alert.alert(
                          'Admin Portal Sign In 🛡️',
                          'Administrator credentials selected. Please enter your administrator password to sign in and open the Command Center.'
                        );
                      }}
                      activeOpacity={0.75}
                    >
                      <ShieldAlert size={14} color="#e11d48" />
                      <Text style={styles.adminQuickLoginText}>Sign in to Admin Portal</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  /* ----------------------------------------------------
                     IF AUTH TAB IS REGISTER (Matches Web Register page)
                     ---------------------------------------------------- */
                  <>
                    {/* Account Type Selector (Matches Web Exactly) */}
                    <View style={styles.roleSwitcherContainer}>
                      <TouchableOpacity
                        style={[
                          styles.roleSwitcherBtn,
                          registerRole === 'USER' && styles.roleSwitcherBtnActive,
                        ]}
                        onPress={() => setRegisterRole('USER')}
                        activeOpacity={0.8}
                      >
                        <View
                          style={[
                            styles.roleIconWrap,
                            registerRole === 'USER' && styles.roleIconWrapActive,
                          ]}
                        >
                          <UserRound
                            size={18}
                            color={registerRole === 'USER' ? '#ffffff' : COLORS.textMuted}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.roleBtnTitle,
                              registerRole === 'USER' && styles.roleBtnTitleActive,
                            ]}
                          >
                            Traveller
                          </Text>
                          <Text style={styles.roleBtnSub}>Book & explore trips</Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.roleSwitcherBtn,
                          registerRole === 'GUIDE' && styles.roleSwitcherBtnActive,
                        ]}
                        onPress={() => setRegisterRole('GUIDE')}
                        activeOpacity={0.8}
                      >
                        <View
                          style={[
                            styles.roleIconWrap,
                            registerRole === 'GUIDE' && styles.roleIconWrapActive,
                          ]}
                        >
                          <Compass
                            size={18}
                            color={registerRole === 'GUIDE' ? '#ffffff' : COLORS.textMuted}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.roleBtnTitle,
                              registerRole === 'GUIDE' && styles.roleBtnTitleActive,
                            ]}
                          >
                            Tour Guide
                          </Text>
                          <Text style={styles.roleBtnSub}>Apply as certified guide</Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                    {/* Form Banner Header */}
                    <View style={styles.formSectionBanner}>
                      <Text style={styles.formSectionBadge}>
                        {registerRole === 'USER'
                          ? '🌍 VALUED EXPLORER REGISTRATION'
                          : '🧭 PROFESSIONAL CONCIERGE GUILD'}
                      </Text>
                      <Text style={styles.formSectionTitle}>
                        {registerRole === 'USER'
                          ? 'Create Traveller Account'
                          : 'Tour Guide Application'}
                      </Text>
                      <Text style={styles.formSectionSub}>
                        {registerRole === 'USER'
                          ? 'Discover curated expeditions and unlock luxury reservations.'
                          : 'Join GlobalVista’s premier verified chauffeur & expedition guide network.'}
                      </Text>
                    </View>

                    {/* Full Name */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>FULL NAME *</Text>
                      <View style={styles.inputWrap}>
                        <UserRound size={16} color={COLORS.textMuted} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="e.g. Alexander Wright"
                          placeholderTextColor={COLORS.textMuted}
                          value={name}
                          onChangeText={setName}
                        />
                      </View>
                    </View>

                    {/* Country */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>COUNTRY *</Text>
                      <View style={styles.inputWrap}>
                        <Globe2 size={16} color={COLORS.textMuted} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="e.g. Sri Lanka / Germany"
                          placeholderTextColor={COLORS.textMuted}
                          value={country}
                          onChangeText={setCountry}
                        />
                      </View>
                    </View>

                    {/* TOUR GUIDE SPECIFIC FIELDS */}
                    {registerRole === 'GUIDE' && (
                      <>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <View style={[styles.inputGroup, { flex: 1.5 }]}>
                            <Text style={styles.inputLabel}>OPERATING CITY *</Text>
                            <View style={styles.inputWrap}>
                              <MapPin size={16} color={COLORS.textMuted} />
                              <TextInput
                                style={styles.textInput}
                                placeholder="e.g. Kandy / Colombo"
                                placeholderTextColor={COLORS.textMuted}
                                value={city}
                                onChangeText={setCity}
                              />
                            </View>
                          </View>

                          <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.inputLabel}>YEARS EXP. *</Text>
                            <View style={styles.inputWrap}>
                              <Briefcase size={16} color={COLORS.textMuted} />
                              <TextInput
                                style={styles.textInput}
                                placeholder="3"
                                placeholderTextColor={COLORS.textMuted}
                                keyboardType="numeric"
                                value={experienceYears}
                                onChangeText={setExperienceYears}
                              />
                            </View>
                          </View>
                        </View>

                        {/* Language Selector Pills */}
                        <View style={styles.inputGroup}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <Languages size={14} color={COLORS.accent} />
                            <Text style={styles.inputLabel}>SPOKEN LANGUAGES * ({selectedLanguages.length} selected)</Text>
                          </View>
                          <View style={styles.languagesContainer}>
                            {AVAILABLE_LANGUAGES.map((lang) => {
                              const isSelected = selectedLanguages.includes(lang);
                              return (
                                <TouchableOpacity
                                  key={lang}
                                  style={[
                                    styles.langPill,
                                    isSelected && styles.langPillActive,
                                  ]}
                                  onPress={() => toggleLanguage(lang)}
                                  activeOpacity={0.7}
                                >
                                  <Text
                                    style={[
                                      styles.langPillText,
                                      isSelected && styles.langPillTextActive,
                                    ]}
                                  >
                                    {lang}
                                  </Text>
                                  {isSelected && <Check size={12} color="#ffffff" />}
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>

                        {/* Government ID Type Selector */}
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>GOVERNMENT ID TYPE *</Text>
                          <View style={styles.idTypeRow}>
                            <TouchableOpacity
                              style={[
                                styles.idTypeBtn,
                                governmentIdType === 'NIC' && styles.idTypeBtnActive,
                              ]}
                              onPress={() => setGovernmentIdType('NIC')}
                              activeOpacity={0.8}
                            >
                              <IdCard size={14} color={governmentIdType === 'NIC' ? '#ffffff' : COLORS.textMuted} />
                              <Text
                                style={[
                                  styles.idTypeText,
                                  governmentIdType === 'NIC' && styles.idTypeTextActive,
                                ]}
                              >
                                National Identity (NIC)
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[
                                styles.idTypeBtn,
                                governmentIdType === 'PASSPORT' && styles.idTypeBtnActive,
                              ]}
                              onPress={() => setGovernmentIdType('PASSPORT')}
                              activeOpacity={0.8}
                            >
                              <ShieldCheck size={14} color={governmentIdType === 'PASSPORT' ? '#ffffff' : COLORS.textMuted} />
                              <Text
                                style={[
                                  styles.idTypeText,
                                  governmentIdType === 'PASSPORT' && styles.idTypeTextActive,
                                ]}
                              >
                                Passport
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>GOVERNMENT ID NUMBER *</Text>
                          <View style={styles.inputWrap}>
                            <IdCard size={16} color={COLORS.textMuted} />
                            <TextInput
                              style={styles.textInput}
                              placeholder={governmentIdType === 'NIC' ? 'e.g. 199512345678 or 951234567V' : 'e.g. N12345678'}
                              placeholderTextColor={COLORS.textMuted}
                              value={idNumber}
                              onChangeText={setIdNumber}
                              autoCapitalize="characters"
                            />
                          </View>
                        </View>
                      </>
                    )}

                    {/* Vehicle Type Selector */}
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>REGISTERED VEHICLE TYPE *</Text>
                          <View style={styles.idTypeRow}>
                            {(['CAR', 'VAN', 'BUS'] as const).map((vt) => {
                              const active = vehicleType === vt;
                              return (
                                <TouchableOpacity
                                  key={vt}
                                  style={[styles.idTypeBtn, active && styles.idTypeBtnActive]}
                                  onPress={() => setVehicleType(vt)}
                                >
                                  <Text style={[styles.idTypeText, active && styles.idTypeTextActive]}>
                                    {vt === 'CAR' ? '🚗 Car (1-4)' : vt === 'VAN' ? '🚐 Van (5-10)' : '🚌 Bus (15+)'}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>

                        {/* Vehicle Number Plate */}
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>VEHICLE NUMBER PLATE *</Text>
                          <View style={styles.inputWrap}>
                            <Briefcase size={16} color={COLORS.textMuted} />
                            <TextInput
                              style={styles.textInput}
                              placeholder="e.g. WP CAC-1234"
                              placeholderTextColor={COLORS.textMuted}
                              value={vehicleNumber}
                              onChangeText={setVehicleNumber}
                              autoCapitalize="characters"
                            />
                          </View>
                        </View>

                    {/* Email Address */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>EMAIL ADDRESS *</Text>
                      <View style={styles.inputWrap}>
                        <Mail size={16} color={COLORS.textMuted} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="name@example.com"
                          placeholderTextColor={COLORS.textMuted}
                          autoCapitalize="none"
                          keyboardType="email-address"
                          value={email}
                          onChangeText={setEmail}
                        />
                      </View>
                    </View>

                    {/* Mobile Phone Number */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>MOBILE PHONE NUMBER *</Text>
                      <View style={styles.inputWrap}>
                        <Phone size={16} color={COLORS.textMuted} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="+94 77 123 4567"
                          placeholderTextColor={COLORS.textMuted}
                          keyboardType="phone-pad"
                          value={mobile}
                          onChangeText={setMobile}
                        />
                      </View>
                    </View>

                    {/* Guide Guiding Bio */}
                    {registerRole === 'GUIDE' && (
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>GUIDING SPECIALTY & EXPERIENCE BIO * (Min 20 characters)</Text>
                        <View style={[styles.inputWrap, { height: 80, alignItems: 'flex-start', paddingVertical: 10 }]}>
                          <TextInput
                            style={[styles.textInput, { height: '100%', textAlignVertical: 'top' }]}
                            placeholder="e.g. Certified wildlife safari expert & cultural heritage chauffeur with 5 years experience across Sigiriya & Yala..."
                            placeholderTextColor={COLORS.textMuted}
                            multiline
                            value={about}
                            onChangeText={setAbout}
                          />
                        </View>
                      </View>
                    )}

                    {/* Password Field */}
                    <View style={styles.inputGroup}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.inputLabel}>PASSWORD *</Text>
                        {registerRole === 'GUIDE' && (
                          <Text style={{ fontSize: 9, color: COLORS.accent, fontWeight: '700' }}>
                            10+ chars, uppercase, lowercase, number, symbol
                          </Text>
                        )}
                      </View>
                      <View style={styles.inputWrap}>
                        <Lock size={16} color={COLORS.textMuted} />
                        <TextInput
                          style={styles.textInput}
                          placeholder={
                            registerRole === 'GUIDE'
                              ? '10+ characters with symbols'
                              : '••••••••'
                          }
                          placeholderTextColor={COLORS.textMuted}
                          secureTextEntry={!showPassword}
                          value={password}
                          onChangeText={setPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                          {showPassword ? <EyeOff size={16} color={COLORS.textMuted} /> : <Eye size={16} color={COLORS.textMuted} />}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Confirm Password */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>CONFIRM PASSWORD *</Text>
                      <View style={styles.inputWrap}>
                        <Lock size={16} color={COLORS.textMuted} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="Repeat your password"
                          placeholderTextColor={COLORS.textMuted}
                          secureTextEntry={!showConfirmPassword}
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: 4 }}>
                          {showConfirmPassword ? <EyeOff size={16} color={COLORS.textMuted} /> : <Eye size={16} color={COLORS.textMuted} />}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Tour Guide Terms Agreement Checkbox */}
                    {registerRole === 'GUIDE' && (
                      <TouchableOpacity
                        style={styles.guideTermsRow}
                        onPress={() => setAcceptGuideTerms(!acceptGuideTerms)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.guideCheckbox, acceptGuideTerms && styles.guideCheckboxActive]}>
                          {acceptGuideTerms && <Check size={12} color="#ffffff" strokeWidth={3} />}
                        </View>
                        <Text style={styles.guideTermsText}>
                          I have read and agree to the GlobalVista Tour Guide Terms & Identity Review standards, consenting to verification of my NIC/Passport.
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Submit Action Button */}
                    <TouchableOpacity
                      style={styles.submitBtn}
                      onPress={handleAuthSubmit}
                      disabled={submitting}
                      activeOpacity={0.85}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.submitBtnText}>
                            {registerRole === 'USER'
                              ? 'Create Traveller Account 🚀'
                              : 'Submit Guide Application 🧭'}
                          </Text>
                          <ArrowRight size={16} color="#ffffff" />
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Switch back to Sign In */}
                    <View style={styles.authSwitchRow}>
                      <Text style={styles.authSwitchLabel}>Already have a GlobalVista account?</Text>
                      <TouchableOpacity onPress={() => setAuthTab('LOGIN')}>
                        <Text style={styles.authSwitchLink}>Sign In</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Clean Guest Footer */}
            <View style={styles.guestFooter}>
              <Text style={styles.guestFooterBrand}>GLOBALVISTA LUXURY EXPEDITIONS</Text>
              <Text style={styles.guestFooterSub}>Atelier Zurich · Interlaken · Colombo</Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Admin Suite Modal */}
      <MobileAdminPortal
        visible={adminPortalOpen}
        onClose={() => setAdminPortalOpen(false)}
      />

      {/* Tour Guide Modal */}
      <MobileGuidePortal
        visible={guidePortalOpen}
        user={user}
        onClose={() => setGuidePortalOpen(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scroll: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 14,
    ...SHADOWS.small,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  userName: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.primary,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: '#f0faff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accentDark,
    letterSpacing: 0.5,
  },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    ...SHADOWS.medium,
  },
  adminBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  adminBannerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#18212f',
    letterSpacing: 0.5,
  },
  adminBannerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  guideBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#064e3b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#059669',
    ...SHADOWS.medium,
  },
  guideBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideBannerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  guideBannerSub: {
    fontSize: 11,
    color: '#a7f3d0',
    marginTop: 2,
  },
  brandHero: {
    backgroundColor: '#0a192f',
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    ...SHADOWS.medium,
  },
  brandTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandLogoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogoText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  brandAtelierTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  brandAtelierText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.8,
  },
  brandDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 14,
  },
  brandEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    color: '#f59e0b',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  brandHeading: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  brandHeadingItalic: {
    fontStyle: 'italic',
    color: '#38bdf8',
  },
  brandSub: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 14,
  },
  brandFeaturesRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  brandFeaturePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  brandFeatureText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  authCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 20,
    marginBottom: 24,
    ...SHADOWS.small,
  },
  authTabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  authTab: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  authTabActive: {
    backgroundColor: '#ffffff',
    ...SHADOWS.small,
  },
  authTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  authTabTextActive: {
    color: COLORS.primary,
  },
  loginWelcomeHeader: {
    marginBottom: 8,
  },
  loginWelcomeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  loginWelcomeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284c7',
    letterSpacing: 0.8,
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  loginSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  forgotPasswordText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  securityTrustCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 4,
  },
  securityTrustText: {
    flex: 1,
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
  guestFooter: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  guestFooterBrand: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  guestFooterSub: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 3,
  },
  form: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#f8fafc',
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  roleSwitcherContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  roleSwitcherBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  roleSwitcherBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#f0f9ff',
  },
  roleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconWrapActive: {
    backgroundColor: COLORS.primary,
  },
  roleBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  roleBtnTitleActive: {
    color: COLORS.primary,
  },
  roleBtnSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  formSectionBanner: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
    marginBottom: 4,
  },
  formSectionBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  formSectionSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 15,
  },
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  langPillActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  langPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  langPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  idTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  idTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  idTypeBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  idTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  idTypeTextActive: {
    color: '#ffffff',
  },
  guideTermsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  guideTermsText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  authSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  authSwitchLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  authSwitchLink: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.accent,
  },
  guideToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  guideCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideCheckboxActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  guideToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  guideFieldsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  guideSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  guideInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    ...SHADOWS.medium,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  adminQuickLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 10,
    backgroundColor: '#fff1f2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  adminQuickLoginText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#e11d48',
    letterSpacing: 0.4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 8,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f0faff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  menuSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ef4444',
  },
  footerInfo: {
    alignItems: 'center',
    paddingTop: 10,
  },
  footerCopy: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  footerSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
});

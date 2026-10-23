'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, BadgeCheck, BriefcaseBusiness, Car, Hash, Check,
  CheckCircle2, ChevronDown, Compass, Eye, EyeOff, FileCheck2, FileImage,
  Globe2, IdCard, Languages, LockKeyhole, Mail, MapPin, Phone, Plane,
  Search, ShieldCheck, Sparkles, UploadCloud, UserRound, X,
} from 'lucide-react';
import styles from './register.module.css';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://globalvista-d7uz.onrender.com');
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const LANGUAGE_OPTIONS = [
  'English', 'Sinhala', 'Tamil', 'French', 'German', 'Spanish', 'Italian',
  'Portuguese', 'Dutch', 'Arabic', 'Hindi', 'Bengali', 'Urdu', 'Chinese',
  'Mandarin', 'Japanese', 'Korean', 'Russian', 'Thai', 'Malay',
  'Indonesian', 'Vietnamese', 'Turkish', 'Greek', 'Polish', 'Swedish',
  'Norwegian', 'Danish', 'Finnish',
];

type Role = 'USER' | 'GUIDE';
type GovernmentIdType = 'NIC' | 'PASSPORT';
type Step = 'register' | 'documents' | 'complete';
type RegisterResponse = {
  message?: string;
  access_token?: string;
  user?: {
    id?: string;
    publicId?: string;
    name?: string;
    email: string;
    role: Role;
    guideStatus?: string;
  };
};

type ApiError = { message?: string | string[]; error?: string };

async function responseMessage(response: Response): Promise<string> {
  const result = (await response.json().catch(() => ({}))) as ApiError;
  return Array.isArray(result.message)
    ? result.message.join(', ')
    : result.message || result.error || `Request failed (${response.status})`;
}

function checkImage(file: File | null, field: string): string | null {
  if (!file) return `Please select ${field}.`;
  if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
    return `${field} must be a JPG or PNG image.`;
  }
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
    return `${field} must be between 1 byte and 5 MB.`;
  }
  return null;
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('register');
  const [role, setRole] = useState<Role>('USER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [city, setCity] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [governmentIdType, setGovernmentIdType] = useState<GovernmentIdType>('NIC');
  const [governmentIdNumber, setGovernmentIdNumber] = useState('');
  const [about, setAbout] = useState('');
  const [vehicleType, setVehicleType] = useState<'CAR' | 'VAN' | 'BUS'>('CAR');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [acceptGuideTerms, setAcceptGuideTerms] = useState(false);

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [languageSearch, setLanguageSearch] = useState('');
  const [showOtherLanguage, setShowOtherLanguage] = useState(false);
  const [otherLanguage, setOtherLanguage] = useState('');
  const languageRef = useRef<HTMLDivElement>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false);

  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredPublicId, setRegisteredPublicId] = useState('');
  const [resumeUpload, setResumeUpload] = useState(false);
  const [uploadPassword, setUploadPassword] = useState('');
  const [uploadIdType, setUploadIdType] = useState<GovernmentIdType>('NIC');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setLanguageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLanguages = LANGUAGE_OPTIONS.filter((language) =>
    language.toLowerCase().includes(languageSearch.trim().toLowerCase()),
  );

  const finalLanguages = [...selectedLanguages];
  if (showOtherLanguage && otherLanguage.trim()) {
    const customLanguage = otherLanguage.trim();
    if (!finalLanguages.some((language) => language.toLowerCase() === customLanguage.toLowerCase())) {
      finalLanguages.push(customLanguage);
    }
  }

  function changeRole(nextRole: Role) {
    setRole(nextRole);
    setError('');
    setEmailAlreadyExists(false);
    setLanguageDropdownOpen(false);
  }

  function toggleLanguage(language: string) {
    setSelectedLanguages((current) => current.includes(language)
      ? current.filter((value) => value !== language)
      : [...current, language]);
    setError('');
  }

  function beginResumeUpload() {
    setError('');
    setSuccess('');
    setResumeUpload(true);
    setRole('GUIDE');
    setRegisteredEmail(email.trim().toLowerCase());
    setUploadPassword('');
    setUploadIdType('NIC');
    setIdFront(null);
    setIdBack(null);
    if (frontFileInputRef.current) frontFileInputRef.current.value = '';
    if (backFileInputRef.current) backFileInputRef.current.value = '';
    setStep('documents');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError('');
    setEmailAlreadyExists(false);

    if (name.trim().length < 2) return setError('Please enter your full name (at least 2 characters).');
    if (!country.trim()) return setError('Please enter your country.');
    if (!email.trim() || !email.includes('@')) return setError('Please enter a valid email address.');
    if (mobile.trim().length < 7) return setError('Please enter a valid mobile number.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');

    if (role === 'GUIDE') {
      const strong = password.length >= 10 && /[A-Z]/.test(password) &&
        /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
      if (!strong) return setError('Guide password needs 10+ characters, uppercase, lowercase, a number and a symbol.');
      if (!city.trim()) return setError('Please enter your city.');
      const years = Number(experienceYears);
      if (experienceYears === '' || !Number.isInteger(years) || years < 0 || years > 80) {
        return setError('Experience must be a whole number from 0 to 80.');
      }
      if (!finalLanguages.length || finalLanguages.length > 15) {
        return setError('Please select 1 to 15 languages.');
      }
      if (governmentIdNumber.trim().length < 4) {
        return setError('Please enter a valid NIC or Passport number.');
      }
      if (about.trim().length < 20) {
        return setError('Please provide at least 20 characters about your guide experience.');
      }
      if (!vehicleType) return setError('Please select your vehicle type (Car, Van, or Bus).');
      if (!vehicleNumber.trim()) return setError('Please enter your vehicle number plate.');
      if (!acceptGuideTerms) {
        return setError('Please accept the Tour Guide Terms and Privacy Policy.');
      }
    }

    const commonPayload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
      country: country.trim(),
      password,
      role,
    };
    const payload = role === 'GUIDE'
      ? {
          ...commonPayload,
          city: city.trim(),
          languages: finalLanguages,
          experienceYears: Number(experienceYears),
          governmentIdType,
          governmentIdNumber: governmentIdNumber.trim(),
          about: about.trim(),
          acceptGuideTerms,
        }
      : commonPayload;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const message = await responseMessage(response);
        if (message.toLowerCase().includes('email already exists') || response.status === 409) {
          setEmailAlreadyExists(true);
          setError('This email is already registered. Please sign in or use another email.');
        } else {
          setError(message);
        }
        return;
      }
      const data = (await response.json()) as RegisterResponse;
      if (!data.user || !data.user.email) {
        setError('The backend returned incomplete registration information.');
        return;
      }

      localStorage.removeItem('globalvista_token');
      localStorage.removeItem('globalvista_user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (data.user.role === 'USER') {
        router.replace(`/login?registered=user&email=${encodeURIComponent(data.user.email)}`);
        return;
      }
      if (data.user.role === 'GUIDE') {
        setRegisteredEmail(data.user.email);
        setRegisteredPublicId(data.user.publicId || '');
        setResumeUpload(false);
        setGovernmentIdNumber('');
        setStep('documents');
        setSuccess('Guide account created. Upload your NIC or Passport images to complete the application.');
        return;
      }
      setError('Unknown account role returned by the backend.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect to GlobalVista server.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDocumentUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError('');
    setSuccess('');

    const idType = resumeUpload ? uploadIdType : governmentIdType;
    const frontIssue = checkImage(idFront, idType === 'NIC' ? 'NIC front image' : 'Passport photo page');
    if (frontIssue) return setError(frontIssue);
    if (idType === 'NIC') {
      const backIssue = checkImage(idBack, 'NIC back image');
      if (backIssue) return setError(backIssue);
    }
    const accountEmail = registeredEmail.trim().toLowerCase();
    const accountPassword = resumeUpload ? uploadPassword : password;
    if (!accountEmail || !accountPassword) return setError('Enter your registered email and password to upload documents.');

    const formData = new FormData();
    formData.append('email', accountEmail);
    formData.append('password', accountPassword);
    formData.append('idFront', idFront!);
    if (idType === 'NIC' && idBack) formData.append('idBack', idBack);

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/guide/documents`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        setError(await responseMessage(response));
        return;
      }
      setPassword('');
      setConfirmPassword('');
      setUploadPassword('');
      setIdFront(null);
      setIdBack(null);
      if (frontFileInputRef.current) frontFileInputRef.current.value = '';
      if (backFileInputRef.current) backFileInputRef.current.value = '';
      setSuccess('Documents submitted. Your Guide application is awaiting Admin review.');
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Document upload failed. Please retry.');
    } finally {
      setLoading(false);
    }
  }

  const isNicUpload = (resumeUpload ? uploadIdType : governmentIdType) === 'NIC';

  return (
    <main className={styles.page}>
      <video className={styles.backgroundVideo} autoPlay muted loop playsInline preload="metadata">
        <source src="/videos/globalvista-hero-1.mp4" type="video/mp4" />
      </video>
      <div className={styles.overlay} />
      <Link href="/" className={styles.backButton}><ArrowLeft size={16} /> <span>Back to Home</span></Link>

      <div className={styles.container}>
        <section className={styles.brandSide}>
          <div className={styles.logoRow}>
            <Link href="/" className={styles.logo}>Global<span>Vista</span></Link>
            <div className={styles.brandPill}>
              <Sparkles size={12} />
              <span>Luxury Expeditions</span>
            </div>
          </div>
          <div className={styles.brandContent}>
            <span className={styles.eyebrow}>Your Journey Starts Here</span>
            <h1>Discover More.<br /><span className={styles.heroGradient}>Travel Beyond.</span></h1>
            <p className={styles.brandDesc}>
              Create your GlobalVista account as a luxury traveler to reserve bespoke expeditions,
              or apply as a certified tour guide to lead private expeditions.
            </p>

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

        <section className={styles.registerCard}>
          <div className={styles.cardLabel}><Plane size={14} /> <span>Join GlobalVista</span></div>
          <div className={styles.registerHeader}>
            {step === 'register' ? (
              <><h2>Create your account</h2><p>Choose your account type to begin.</p></>
            ) : step === 'documents' ? (
              <><h2>Identity verification</h2><p>Complete your certified Tour Guide application.</p></>
            ) : (
              <><h2>Application submitted</h2><p>Your guide application is awaiting Admin review.</p></>
            )}
          </div>

          {step === 'register' && (
            <>
              <div className={styles.roleSelector}>
                <button type="button" className={`${styles.roleButton} ${role === 'USER' ? styles.roleButtonActive : ''}`} onClick={() => changeRole('USER')}>
                  <UserRound size={19} /><div><strong>Traveller</strong><span>Book &amp; explore trips</span></div>
                </button>
                <button type="button" className={`${styles.roleButton} ${role === 'GUIDE' ? styles.roleButtonActive : ''}`} onClick={() => changeRole('GUIDE')}>
                  <BadgeCheck size={19} /><div><strong>Tour Guide</strong><span>Apply as a guide</span></div>
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="name">Full Name</label>
                    <div className={styles.inputBox}><UserRound size={18} />
                      <input id="name" type="text" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={100} required />
                    </div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="country">Country</label>
                    <div className={styles.inputBox}><Globe2 size={18} />
                      <input id="country" type="text" placeholder="e.g. Sri Lanka, Japan" value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country-name" maxLength={100} required />
                    </div>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="email">Email Address</label>
                  <div className={styles.inputBox}><Mail size={18} />
                    <input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); setEmailAlreadyExists(false); setError(''); }} autoComplete="email" maxLength={254} required />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="mobile">Mobile Number</label>
                  <div className={styles.inputBox}><Phone size={18} />
                    <input id="mobile" type="tel" placeholder="+94 77 123 4567" value={mobile} onChange={(e) => setMobile(e.target.value)} autoComplete="tel" minLength={7} maxLength={30} required />
                  </div>
                </div>

                {role === 'GUIDE' && (
                  <>
                    <div className={styles.guideTitle}>Guide Credentials &amp; Experience</div>
                    <div className={styles.formGrid}>
                      <div className={styles.fieldGroup}>
                        <label htmlFor="city">Operating City</label>
                        <div className={styles.inputBox}><MapPin size={18} />
                          <input id="city" type="text" placeholder="e.g. Colombo, Kandy" value={city} onChange={(e) => setCity(e.target.value)} maxLength={100} required />
                        </div>
                      </div>
                      <div className={styles.fieldGroup}>
                        <label htmlFor="experienceYears">Experience (Years)</label>
                        <div className={styles.inputBox}><BriefcaseBusiness size={18} />
                          <input id="experienceYears" type="number" min={0} max={80} step={1} placeholder="Years" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} required />
                        </div>
                      </div>
                    </div>

                    <div className={styles.fieldGroup} ref={languageRef}>
                      <div className={styles.formGrid}>
                      <div className={styles.fieldGroup}>
                        <label htmlFor="vehicleType">Vehicle Type</label>
                        <div className={styles.inputBox}><Car size={18} />
                          <select
                            id="vehicleType"
                            value={vehicleType}
                            onChange={(e) => setVehicleType(e.target.value as any)}
                            style={{ background: 'transparent', color: '#fff', border: 'none', width: '100%', outline: 'none', cursor: 'pointer' }}
                            required
                          >
                            <option value="CAR" style={{ background: '#0b1329', color: '#fff' }}>Car (1-4 Seats)</option>
                            <option value="VAN" style={{ background: '#0b1329', color: '#fff' }}>Van (5-10 Seats)</option>
                            <option value="BUS" style={{ background: '#0b1329', color: '#fff' }}>Bus (15+ Seats)</option>
                          </select>
                        </div>
                      </div>
                      <div className={styles.fieldGroup}>
                        <label htmlFor="vehicleNumber">Vehicle Number Plate</label>
                        <div className={styles.inputBox}><Hash size={18} />
                          <input id="vehicleNumber" type="text" placeholder="e.g. WP CAC-1234" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())} maxLength={30} required />
                        </div>
                      </div>
                    </div>

                    <label>Languages Spoken</label>
                      <div className={styles.languageSelector}>
                        <button type="button" className={styles.languageTrigger} onClick={() => setLanguageDropdownOpen((current) => !current)} aria-expanded={languageDropdownOpen}>
                          <div className={styles.languageTriggerLeft}><Languages size={18} />
                            <span>{selectedLanguages.length ? `${selectedLanguages.length} language${selectedLanguages.length === 1 ? '' : 's'} selected` : 'Select languages'}</span>
                          </div>
                          <ChevronDown size={18} className={languageDropdownOpen ? styles.chevronOpen : ''} />
                        </button>
                        {languageDropdownOpen && (
                          <div className={styles.languageDropdown}>
                            <div className={styles.languageSearch}><Search size={16} />
                              <input type="text" placeholder="Search language..." value={languageSearch} onChange={(e) => setLanguageSearch(e.target.value)} />
                            </div>
                            <div className={styles.languageOptions}>
                              {filteredLanguages.length ? filteredLanguages.map((language) => {
                                const selected = selectedLanguages.includes(language);
                                return (
                                  <button type="button" key={language} className={`${styles.languageOption} ${selected ? styles.languageOptionActive : ''}`} onClick={() => toggleLanguage(language)}>
                                    <span>{language}</span><span className={styles.languageCheck}>{selected && <Check size={15} />}</span>
                                  </button>
                                );
                              }) : <div style={{ padding: '10px 12px', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>No languages found</div>}
                              <button type="button" className={`${styles.languageOption} ${showOtherLanguage ? styles.languageOptionActive : ''}`} onClick={() => { setShowOtherLanguage((current) => !current); setOtherLanguage(''); }}>
                                <span>Other language</span><span className={styles.languageCheck}>{showOtherLanguage && <Check size={15} />}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      {!!selectedLanguages.length && (
                        <div className={styles.languageChips}>
                          {selectedLanguages.map((language) => (
                            <span key={language} className={styles.languageChip}>{language}
                              <button type="button" onClick={() => toggleLanguage(language)} aria-label={`Remove ${language}`}><X size={13} /></button>
                            </span>
                          ))}
                        </div>
                      )}
                      {showOtherLanguage && (
                        <div className={styles.otherLanguageBox}><Languages size={17} />
                          <input type="text" placeholder="Enter other language" value={otherLanguage} onChange={(e) => setOtherLanguage(e.target.value)} maxLength={50} />
                          <button type="button" onClick={() => { setShowOtherLanguage(false); setOtherLanguage(''); }} aria-label="Remove other language"><X size={16} /></button>
                        </div>
                      )}
                    </div>

                    <div className={styles.formGrid}>
                      <div className={styles.fieldGroup}>
                        <label htmlFor="governmentIdType">Government ID Type</label>
                        <div className={styles.inputBox}><IdCard size={18} />
                          <select id="governmentIdType" value={governmentIdType} onChange={(e) => { setGovernmentIdType(e.target.value as GovernmentIdType); setIdBack(null); }}>
                            <option value="NIC">NIC</option><option value="PASSPORT">Passport</option>
                          </select>
                        </div>
                      </div>
                      <div className={styles.fieldGroup}>
                        <label htmlFor="governmentIdNumber">ID / Passport Number</label>
                        <div className={styles.inputBox}><IdCard size={18} />
                          <input id="governmentIdNumber" type="text" placeholder="ID number" value={governmentIdNumber} onChange={(e) => setGovernmentIdNumber(e.target.value)} autoComplete="off" minLength={4} maxLength={40} required />
                        </div>
                      </div>
                    </div>

                    <div className={styles.fieldGroup}>
                      <label htmlFor="about">About Your Guiding Background</label>
                      <textarea id="about" className={styles.textArea} placeholder="Tell travelers and admin about your expedition experience (at least 20 characters)..." value={about} onChange={(e) => setAbout(e.target.value)} minLength={20} maxLength={2000} required />
                    </div>

                    <div className={styles.fieldGroup}>
                      <label style={{ display: 'flex', gap: 11, alignItems: 'flex-start', fontSize: 12, lineHeight: 1.6, cursor: 'pointer', padding: 12, borderRadius: 11, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)' }}>
                        <input type="checkbox" checked={acceptGuideTerms} onChange={(e) => setAcceptGuideTerms(e.target.checked)} required style={{ width: 16, height: 16, marginTop: 2, flexShrink: 0, accentColor: '#38bdf8' }} />
                        <span>I have read and agree to the Tour Guide Terms &amp; Conditions and Privacy Policy, including verification of my NIC/Passport for identity compliance.</span>
                      </label>
                    </div>
                  </>
                )}

                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="password">Password</label>
                    <div className={styles.inputBox}><LockKeyhole size={18} />
                      <input id="password" type={showPassword ? 'text' : 'password'} placeholder={role === 'GUIDE' ? '10+ chars, mixed' : 'Min 6 characters'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={role === 'GUIDE' ? 10 : 6} required />
                      <button type="button" className={styles.eyeButton} onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <div className={styles.inputBox}><LockKeyhole size={18} />
                      <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Repeat password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" minLength={role === 'GUIDE' ? 10 : 6} required />
                      <button type="button" className={styles.eyeButton} onClick={() => setShowConfirmPassword((current) => !current)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                  </div>
                </div>

                {error && <div className={styles.error} role="alert"><span>{error}</span>{emailAlreadyExists && <> <Link href="/login">Sign in</Link></>}</div>}

                <button type="submit" className={styles.registerButton} disabled={loading}>
                  <span>{loading ? (role === 'GUIDE' ? 'Creating Guide Account...' : 'Creating Account...') : (role === 'GUIDE' ? 'Continue to Document Upload' : 'Create Account')}</span>
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>

              <div className={styles.loginText}>
                <span>Already have an account?</span><Link href="/login">Sign In</Link>
              </div>
              <div className={styles.loginText} style={{ marginTop: 8, fontSize: 12 }}>
                <span style={{ opacity: 0.7 }}>Created a Guide account and need to upload documents?</span>
                <button type="button" onClick={beginResumeUpload} style={{ border: 0, background: 'none', padding: 0, font: 'inherit', cursor: 'pointer', color: '#38bdf8', fontWeight: 700 }}>Resume Upload</button>
              </div>
            </>
          )}

          {step === 'documents' && (
            <form onSubmit={handleDocumentUpload} className={styles.form}>
              <div style={{ padding: 14, borderRadius: 12, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)', marginBottom: 17, fontSize: 13, lineHeight: 1.6 }}>
                <ShieldCheck size={20} style={{ verticalAlign: 'middle', marginRight: 7, color: '#38bdf8' }} />
                {resumeUpload ? 'Enter your registered Guide credentials to upload your identity documents.' : 'Your Guide account has been created with PENDING status.'}
                {!!registeredPublicId && <div style={{ marginTop: 8, fontWeight: 700, color: '#7dd3fc' }}>Guide ID: {registeredPublicId}</div>}
              </div>
              {success && <div role="status" style={{ color: '#34d399', fontSize: 13, marginBottom: 12 }}><CheckCircle2 size={16} style={{ verticalAlign: 'middle', marginRight: 7 }} />{success}</div>}

              {resumeUpload && (
                <>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="resumeEmail">Registered Guide Email</label>
                    <div className={styles.inputBox}><Mail size={18} />
                      <input id="resumeEmail" type="email" value={registeredEmail} onChange={(e) => setRegisteredEmail(e.target.value)} required autoComplete="email" />
                    </div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="resumePassword">Account Password</label>
                    <div className={styles.inputBox}><LockKeyhole size={18} />
                      <input id="resumePassword" type="password" value={uploadPassword} onChange={(e) => setUploadPassword(e.target.value)} autoComplete="current-password" required />
                    </div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="resumeIdType">Registered Government ID Type</label>
                    <div className={styles.inputBox}><IdCard size={18} />
                      <select id="resumeIdType" value={uploadIdType} onChange={(e) => { setUploadIdType(e.target.value as GovernmentIdType); setIdBack(null); }}>
                        <option value="NIC">NIC</option><option value="PASSPORT">Passport</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className={styles.fieldGroup}>
                <label htmlFor="idFront">{isNicUpload ? 'NIC Front Image' : 'Passport Photo Page'}</label>
                <div className={styles.documentPicker}>
                  <input
                    id="idFront"
                    ref={frontFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    hidden
                    onChange={(event) => {
                      setIdFront(event.target.files?.[0] || null);
                      setError('');
                    }}
                  />
                  <button
                    type="button"
                    className={styles.documentPickerButton}
                    onClick={() => frontFileInputRef.current?.click()}
                    aria-label={isNicUpload ? 'Choose NIC front image' : 'Choose passport photo page'}
                  >
                    <UploadCloud size={18} />
                    {isNicUpload ? 'Upload NIC Front' : 'Upload Passport Photo'}
                  </button>
                  <span className={styles.documentPickerFilename}>
                    {idFront ? <><FileImage size={14} /> {idFront.name}</> : 'No file selected'}
                  </span>
                </div>
              </div>

              {isNicUpload && (
                <div className={styles.fieldGroup}>
                  <label htmlFor="idBack">NIC Back Image</label>
                  <div className={styles.documentPicker}>
                    <input
                      id="idBack"
                      ref={backFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      hidden
                      onChange={(event) => {
                        setIdBack(event.target.files?.[0] || null);
                        setError('');
                      }}
                    />
                    <button
                      type="button"
                      className={styles.documentPickerButton}
                      onClick={() => backFileInputRef.current?.click()}
                      aria-label="Choose NIC back image"
                    >
                      <UploadCloud size={18} />
                      Upload NIC Back
                    </button>
                    <span className={styles.documentPickerFilename}>
                      {idBack ? <><FileImage size={14} /> {idBack.name}</> : 'No file selected'}
                    </span>
                  </div>
                </div>
              )}

              <p style={{ fontSize: 11.5, lineHeight: 1.6, opacity: 0.7 }}>JPG or PNG files only (up to 5 MB). Documents are encrypted and sent to private admin verification endpoints.</p>
              {error && <div className={styles.error} role="alert"><span>{error}</span></div>}
              <button type="submit" className={styles.registerButton} disabled={loading}>
                <span>{loading ? 'Uploading Documents...' : 'Submit Identity Documents'}</span>
                {!loading && <ArrowRight size={18} />}
              </button>
              <div className={styles.loginText}><span>Already completed verification?</span><Link href="/login">Sign In</Link></div>
            </form>
          )}

          {step === 'complete' && (
            <div className={styles.form} style={{ textAlign: 'center', padding: '16px 0' }}>
              <CheckCircle2 size={50} style={{ margin: '0 auto 12px', color: '#10b981' }} />
              <h3 style={{ fontSize: 22, margin: '0 0 10px', color: '#ffffff' }}>Documents Submitted!</h3>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)' }}>Your Tour Guide account is now <strong>PENDING</strong>. An administrator will review your application before activating your account.</p>
              {!!registeredPublicId && <p style={{ fontSize: 13, fontWeight: 750, color: '#38bdf8', marginTop: 12 }}>Guide ID: {registeredPublicId}</p>}
              <button type="button" className={styles.registerButton} onClick={() => router.replace('/login')} style={{ marginTop: 20 }}>
                <span>Proceed to Login</span><ArrowRight size={18} />
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

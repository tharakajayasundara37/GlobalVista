'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Bus,
  Car,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck,
  FileText,
  Globe2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Truck,
  UploadCloud,
  UserCheck,
  UserX,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import styles from './page.module.css';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://globalvista-d7uz.onrender.com';

type VehicleType = 'CAR' | 'VAN' | 'BUS';

type Guide = {
  _id: string;
  id: string;
  publicId?: string;
  name: string;
  email: string;
  mobile?: string;
  country?: string;
  city?: string;
  languages?: string[];
  experienceYears?: number;
  about?: string;
  governmentIdType?: 'NIC' | 'PASSPORT';
  role: string;
  guideStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  vehicleType?: VehicleType | null;
  vehicleNumber?: string;
  profileImage?: string;
  guideTermsAcceptedAt?: string | null;
  guideReviewReason?: string;
  guideReviewedAt?: string | null;
  guideReviewedBy?: string;
  hasIdFrontDocument?: boolean;
  hasIdBackDocument?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export default function AdminGuidesPage() {
  const router = useRouter();

  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  >('ALL');
  const [vehicleFilter, setVehicleFilter] = useState<'ALL' | VehicleType>(
    'ALL',
  );

  // Inspection Modal
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [frontDocUrl, setFrontDocUrl] = useState<string | null>(null);
  const [backDocUrl, setBackDocUrl] = useState<string | null>(null);
  const [loadingFrontDoc, setLoadingFrontDoc] = useState(false);
  const [loadingBackDoc, setLoadingBackDoc] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rejectingGuide, setRejectingGuide] = useState<Guide | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const adminFrontInputRef = useRef<HTMLInputElement>(null);
  const adminBackInputRef = useRef<HTMLInputElement>(null);

  const handleAdminUploadDoc = (side: 'front' | 'back', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedGuide) return;

    if (file.size > 8 * 1024 * 1024) {
      setDocError('Image file must be under 8 MB');
      return;
    }

    const token = getToken();
    if (!token) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        if (side === 'front') setLoadingFrontDoc(true);
        else setLoadingBackDoc(true);

        const res = await fetch(`${API_URL}/admin-dashboard/guides/${selectedGuide._id}/documents/${side}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ data: dataUrl }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || `Failed to upload ${side} document`);
        }

        if (side === 'front') {
          setFrontDocUrl(dataUrl);
        } else {
          setBackDocUrl(dataUrl);
        }

        setSuccess(`Guide ID (${side}) updated & saved to database successfully!`);
        setSelectedGuide((prev) =>
          prev
            ? {
                ...prev,
                [side === 'front' ? 'hasIdFrontDocument' : 'hasIdBackDocument']: true,
              }
            : null,
        );
        setGuides((prev) =>
          prev.map((g) =>
            g._id === selectedGuide._id
              ? {
                  ...g,
                  [side === 'front' ? 'hasIdFrontDocument' : 'hasIdBackDocument']: true,
                }
              : g,
          ),
        );
      } catch (err) {
        setDocError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        if (side === 'front') setLoadingFrontDoc(false);
        else setLoadingBackDoc(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const getToken = useCallback(
    () =>
      localStorage.getItem('globalvista_token') ||
      localStorage.getItem('token'),
    [],
  );

  const getStoredUser = useCallback(() => {
    try {
      const raw =
        localStorage.getItem('globalvista_user') ||
        localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  // Check Admin Authentication
  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();

    if (!token || !user || user.role !== 'ADMIN') {
      router.replace('/login');
      return;
    }

    void fetchGuides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup Document Object URLs on modal change
  useEffect(() => {
    return () => {
      if (frontDocUrl) URL.revokeObjectURL(frontDocUrl);
      if (backDocUrl) URL.revokeObjectURL(backDocUrl);
    };
  }, [frontDocUrl, backDocUrl]);

  const fetchGuides = async (isRefresh = false) => {
    const token = getToken();
    if (!token) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const res = await fetch(`${API_URL}/admin-dashboard/guides`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      if (res.status === 401 || res.status === 403) {
        router.replace('/login');
        return;
      }

      const data = await res.json().catch(() => []);
      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message || 'Failed to load tour guides.',
        );
      }

      setGuides(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error loading guide applications.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Approve Guide
  const handleApprove = async (guideId: string) => {
    const token = getToken();
    if (!token) return;

    setActionLoadingId(guideId);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(
        `${API_URL}/admin-dashboard/guides/${guideId}/approve`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message || 'Unable to approve guide application.',
        );
      }

      setSuccess('Tour Guide approved successfully and is now active!');
      setGuides((prev) =>
        prev.map((g) =>
          g._id === guideId
            ? {
                ...g,
                guideStatus: 'APPROVED',
                guideReviewedAt: new Date().toISOString(),
              }
            : g,
        ),
      );

      if (selectedGuide && selectedGuide._id === guideId) {
        setSelectedGuide((prev) =>
          prev
            ? {
                ...prev,
                guideStatus: 'APPROVED',
                guideReviewedAt: new Date().toISOString(),
              }
            : null,
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to approve guide.',
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject Guide
  const handleRejectConfirm = async () => {
    if (!rejectingGuide) return;
    const token = getToken();
    if (!token) return;

    const guideId = rejectingGuide._id;
    setActionLoadingId(guideId);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(
        `${API_URL}/admin-dashboard/guides/${guideId}/reject`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: rejectReason.trim() }),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message || 'Unable to reject guide application.',
        );
      }

      setSuccess('Guide application was rejected.');
      setGuides((prev) =>
        prev.map((g) =>
          g._id === guideId
            ? {
                ...g,
                guideStatus: 'REJECTED',
                guideReviewReason: rejectReason.trim(),
                guideReviewedAt: new Date().toISOString(),
              }
            : g,
        ),
      );

      if (selectedGuide && selectedGuide._id === guideId) {
        setSelectedGuide((prev) =>
          prev
            ? {
                ...prev,
                guideStatus: 'REJECTED',
                guideReviewReason: rejectReason.trim(),
                guideReviewedAt: new Date().toISOString(),
              }
            : null,
        );
      }

      setRejectingGuide(null);
      setRejectReason('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to reject guide.',
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // Inspect Modal Open
  const handleOpenInspect = (guide: Guide) => {
    setSelectedGuide(guide);
    setFrontDocUrl(null);
    setBackDocUrl(null);
    setDocError(null);
  };

  const handleCloseInspect = () => {
    if (frontDocUrl) URL.revokeObjectURL(frontDocUrl);
    if (backDocUrl) URL.revokeObjectURL(backDocUrl);
    setSelectedGuide(null);
    setFrontDocUrl(null);
    setBackDocUrl(null);
    setDocError(null);
  };

  // Load Decrypted Document Image Stream
  const handleLoadDoc = async (guideId: string, side: 'front' | 'back') => {
    const token = getToken();
    if (!token) return;

    if (side === 'front') {
      setLoadingFrontDoc(true);
    } else {
      setLoadingBackDoc(true);
    }
    setDocError(null);

    try {
      const res = await fetch(
        `${API_URL}/admin-dashboard/guides/${guideId}/documents/${side}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(
          errorJson.message || `Unable to decrypt or load ${side} document.`,
        );
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      if (side === 'front') {
        if (frontDocUrl) URL.revokeObjectURL(frontDocUrl);
        setFrontDocUrl(objectUrl);
      } else {
        if (backDocUrl) URL.revokeObjectURL(backDocUrl);
        setBackDocUrl(objectUrl);
      }
    } catch (err) {
      setDocError(
        err instanceof Error
          ? err.message
          : `Failed to load ${side} identity document.`,
      );
    } finally {
      if (side === 'front') {
        setLoadingFrontDoc(false);
      } else {
        setLoadingBackDoc(false);
      }
    }
  };

  // Stats calculation
  const totalCount = guides.length;
  const pendingCount = useMemo(
    () => guides.filter((g) => g.guideStatus === 'PENDING').length,
    [guides],
  );
  const approvedCount = useMemo(
    () => guides.filter((g) => g.guideStatus === 'APPROVED').length,
    [guides],
  );
  const rejectedCount = useMemo(
    () => guides.filter((g) => g.guideStatus === 'REJECTED').length,
    [guides],
  );

  const carCount = useMemo(
    () => guides.filter((g) => g.vehicleType === 'CAR').length,
    [guides],
  );
  const vanCount = useMemo(
    () => guides.filter((g) => g.vehicleType === 'VAN').length,
    [guides],
  );
  const busCount = useMemo(
    () => guides.filter((g) => g.vehicleType === 'BUS').length,
    [guides],
  );

  // Filtered Guides list
  const filteredGuides = useMemo(() => {
    return guides.filter((guide) => {
      // Status filter
      if (statusFilter !== 'ALL' && guide.guideStatus !== statusFilter) {
        return false;
      }

      // Vehicle filter
      if (vehicleFilter !== 'ALL' && guide.vehicleType !== vehicleFilter) {
        return false;
      }

      // Search term
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const nameMatch = guide.name?.toLowerCase().includes(q);
        const emailMatch = guide.email?.toLowerCase().includes(q);
        const publicIdMatch = guide.publicId?.toLowerCase().includes(q);
        const cityMatch = guide.city?.toLowerCase().includes(q);
        const countryMatch = guide.country?.toLowerCase().includes(q);
        const plateMatch = guide.vehicleNumber?.toLowerCase().includes(q);

        return (
          nameMatch ||
          emailMatch ||
          publicIdMatch ||
          cityMatch ||
          countryMatch ||
          plateMatch
        );
      }

      return true;
    });
  }, [guides, statusFilter, vehicleFilter, search]);

  if (loading) {
    return (
      <main className={styles.loadingScreen}>
        <RefreshCw size={28} className={styles.spin} />
        <span>Loading Tour Guide Applications & Fleet Data...</span>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        {/* ================= HEADER ================= */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              type="button"
              className={styles.backButton}
              onClick={() => router.push('/admin')}
              title="Return to Admin Overview"
            >
              <ArrowLeft size={20} />
            </button>
            <div className={styles.headerMeta}>
              <span className={styles.superTitle}>GLOBALVISTA ADMINISTRATION</span>
              <h1 className={styles.title}>Tour Guide Applications & Fleets</h1>
              <p className={styles.subtitle}>
                Review guide registration requests, inspect vehicle types and number plates, verify encrypted ID documents, and manage approval status.
              </p>
            </div>
          </div>

          <div className={styles.headerRight}>
            <button
              type="button"
              className={styles.refreshButton}
              disabled={refreshing}
              onClick={() => void fetchGuides(true)}
            >
              <RefreshCw
                size={16}
                className={refreshing ? styles.spin : ''}
              />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </header>

        {/* ================= ALERTS ================= */}
        {success && (
          <div className={styles.alertSuccess}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
            <button
              type="button"
              className={styles.alertCloseBtn}
              onClick={() => setSuccess('')}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {error && (
          <div className={styles.alertError}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            <button
              type="button"
              className={styles.alertCloseBtn}
              onClick={() => setError('')}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ================= SUMMARY CARDS ================= */}
        <section className={styles.summaryGrid}>
          <article className={styles.summaryCard}>
            <div className={styles.summaryIconBlue}>
              <Users size={24} />
            </div>
            <div className={styles.summaryContent}>
              <span className={styles.summaryLabel}>Total Guides</span>
              <strong className={styles.summaryValue}>{totalCount}</strong>
              <p className={styles.summaryDesc}>Registered tour guides</p>
            </div>
          </article>

          <article className={styles.summaryCard}>
            <div className={styles.summaryIconAmber}>
              <Clock size={24} />
            </div>
            <div className={styles.summaryContent}>
              <span className={styles.summaryLabel}>
                Pending Review
                {pendingCount > 0 && (
                  <span className={styles.pendingBadgeGlow}>Action Required</span>
                )}
              </span>
              <strong className={styles.summaryValue}>{pendingCount}</strong>
              <p className={styles.summaryDesc}>Awaiting admin verification</p>
            </div>
          </article>

          <article className={styles.summaryCard}>
            <div className={styles.summaryIconGreen}>
              <ShieldCheck size={24} />
            </div>
            <div className={styles.summaryContent}>
              <span className={styles.summaryLabel}>Approved & Active</span>
              <strong className={styles.summaryValue}>{approvedCount}</strong>
              <p className={styles.summaryDesc}>Verified guides ready for tours</p>
            </div>
          </article>

          <article className={styles.summaryCard}>
            <div className={styles.summaryIconPurple}>
              <Car size={24} />
            </div>
            <div className={styles.summaryContent}>
              <span className={styles.summaryLabel}>Registered Fleets</span>
              <strong className={styles.summaryValue}>
                {carCount + vanCount + busCount}
              </strong>
              <p className={styles.summaryDesc}>
                {carCount} Cars • {vanCount} Vans • {busCount} Buses
              </p>
            </div>
          </article>
        </section>

        {/* ================= TOOLBAR & FILTERS ================= */}
        <section className={styles.toolbar}>
          <div className={styles.toolbarTop}>
            <div className={styles.searchBox}>
              <Search size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search guide name, email, plate number, city..."
              />
              {search && (
                <button
                  type="button"
                  className={styles.clearSearchBtn}
                  onClick={() => setSearch('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className={styles.filterGroup}>
              {/* Status Tabs */}
              <div className={styles.statusTabs}>
                <button
                  type="button"
                  className={`${styles.statusTab} ${
                    statusFilter === 'ALL' ? styles.statusTabActive : ''
                  }`}
                  onClick={() => setStatusFilter('ALL')}
                >
                  All
                  <span className={styles.tabCountBadge}>{totalCount}</span>
                </button>

                <button
                  type="button"
                  className={`${styles.statusTab} ${
                    statusFilter === 'PENDING' ? styles.statusTabActive : ''
                  }`}
                  onClick={() => setStatusFilter('PENDING')}
                >
                  Pending
                  <span className={styles.tabCountBadge}>{pendingCount}</span>
                </button>

                <button
                  type="button"
                  className={`${styles.statusTab} ${
                    statusFilter === 'APPROVED' ? styles.statusTabActive : ''
                  }`}
                  onClick={() => setStatusFilter('APPROVED')}
                >
                  Approved
                  <span className={styles.tabCountBadge}>{approvedCount}</span>
                </button>

                <button
                  type="button"
                  className={`${styles.statusTab} ${
                    statusFilter === 'REJECTED' ? styles.statusTabActive : ''
                  }`}
                  onClick={() => setStatusFilter('REJECTED')}
                >
                  Rejected
                  <span className={styles.tabCountBadge}>{rejectedCount}</span>
                </button>
              </div>

              {/* Vehicle Filter */}
              <select
                className={styles.vehicleFilterSelect}
                value={vehicleFilter}
                onChange={(e) =>
                  setVehicleFilter(e.target.value as 'ALL' | VehicleType)
                }
              >
                <option value="ALL">All Vehicles</option>
                <option value="CAR">Cars Only</option>
                <option value="VAN">Vans Only</option>
                <option value="BUS">Buses Only</option>
              </select>
            </div>
          </div>

          <div className={styles.resultsMeta}>
            <span>
              Showing {filteredGuides.length} of {totalCount} guide registrations
            </span>
            {vehicleFilter !== 'ALL' && (
              <span>Filter: Vehicle {vehicleFilter}</span>
            )}
          </div>
        </section>

        {/* ================= GUIDES TABLE ================= */}
        <section className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <span>Guide Profile</span>
            <span>Contact Details</span>
            <span>Vehicle & Plate</span>
            <span>Govt ID Status</span>
            <span>Status</span>
            <span style={{ textAlign: 'right' }}>Actions</span>
          </div>

          {filteredGuides.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <UserCheck size={32} />
              </div>
              <h3>No Guide Registrations Found</h3>
              <p>
                {search || statusFilter !== 'ALL' || vehicleFilter !== 'ALL'
                  ? 'No tour guides match your search or filter criteria. Try resetting filters.'
                  : 'There are currently no tour guide applications in the system.'}
              </p>
            </div>
          ) : (
            filteredGuides.map((guide) => {
              const isActionRunning = actionLoadingId === guide._id;

              return (
                <div key={guide._id} className={styles.tableRow}>
                  {/* Guide Profile */}
                  <div className={styles.guideCol}>
                    <div className={styles.avatar}>
                      {guide.profileImage ? (
                        <img
                          src={guide.profileImage}
                          alt={guide.name}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        guide.name?.charAt(0)?.toUpperCase() || 'G'
                      )}
                    </div>
                    <div className={styles.guideMeta}>
                      <span className={styles.guideName}>{guide.name}</span>
                      <span className={styles.guideIdBadge}>
                        {guide.publicId || `#${guide._id.slice(-6)}`}
                      </span>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className={styles.contactCol}>
                    <span className={styles.contactItem} title={guide.email}>
                      <Mail size={13} />
                      {guide.email}
                    </span>
                    {guide.mobile && (
                      <span className={styles.contactItem}>
                        <Phone size={13} />
                        {guide.mobile}
                      </span>
                    )}
                    {guide.city && (
                      <span className={styles.contactItem}>
                        <MapPin size={13} />
                        {guide.city}, {guide.country || 'LK'}
                      </span>
                    )}
                  </div>

                  {/* Vehicle */}
                  <div className={styles.vehicleCol}>
                    {guide.vehicleType ? (
                      <>
                        <span
                          className={`${styles.vehicleTypeBadge} ${
                            guide.vehicleType === 'CAR'
                              ? styles.vehicleBadgeCar
                              : guide.vehicleType === 'VAN'
                              ? styles.vehicleBadgeVan
                              : styles.vehicleBadgeBus
                          }`}
                        >
                          {guide.vehicleType === 'CAR' && <Car size={13} />}
                          {guide.vehicleType === 'VAN' && <Truck size={13} />}
                          {guide.vehicleType === 'BUS' && <Bus size={13} />}
                          {guide.vehicleType}
                        </span>
                        {guide.vehicleNumber ? (
                          <span className={styles.licensePlate}>
                            {guide.vehicleNumber}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            Plate not set
                          </span>
                        )}
                      </>
                    ) : (
                      <span
                        className={`${styles.vehicleTypeBadge} ${styles.vehicleBadgeNone}`}
                      >
                        No Vehicle
                      </span>
                    )}
                  </div>

                  {/* Govt ID Verification */}
                  <div className={styles.govIdCol}>
                    <span className={styles.govIdTypeBadge}>
                      <FileText size={13} />
                      {guide.governmentIdType || 'NIC'}
                    </span>
                    {guide.hasIdFrontDocument ? (
                      <span className={styles.docVerifiedPill}>
                        <CheckCircle2 size={12} /> Front Uploaded
                      </span>
                    ) : (
                      <span className={styles.docMissingPill}>
                        <AlertCircle size={12} /> Front Missing
                      </span>
                    )}
                    {guide.governmentIdType === 'NIC' && (
                      guide.hasIdBackDocument ? (
                        <span className={styles.docVerifiedPill}>
                          <CheckCircle2 size={12} /> Back Uploaded
                        </span>
                      ) : (
                        <span className={styles.docMissingPill}>
                          <AlertCircle size={12} /> Back Missing
                        </span>
                      )
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className={styles.statusCol}>
                    {guide.guideStatus === 'PENDING' && (
                      <span className={styles.statusBadgePending}>
                        <Clock size={13} /> Pending Review
                      </span>
                    )}
                    {guide.guideStatus === 'APPROVED' && (
                      <span className={styles.statusBadgeApproved}>
                        <ShieldCheck size={13} /> Approved
                      </span>
                    )}
                    {guide.guideStatus === 'REJECTED' && (
                      <span className={styles.statusBadgeRejected}>
                        <XCircle size={13} /> Rejected
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className={styles.actionsCol}>
                    <button
                      type="button"
                      className={styles.actionBtnInspect}
                      onClick={() => handleOpenInspect(guide)}
                      title="Inspect Profile & Documents"
                    >
                      <Eye size={14} />
                      Inspect
                    </button>

                    {guide.guideStatus === 'PENDING' && (
                      <>
                        <button
                          type="button"
                          className={styles.actionBtnApprove}
                          disabled={isActionRunning}
                          onClick={() => void handleApprove(guide._id)}
                          title="Approve Guide Application"
                        >
                          <CheckCircle2 size={14} />
                          Approve
                        </button>

                        <button
                          type="button"
                          className={styles.actionBtnReject}
                          disabled={isActionRunning}
                          onClick={() => {
                            setRejectingGuide(guide);
                            setRejectReason('');
                          }}
                          title="Reject Guide Application"
                        >
                          <X size={14} />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>

      {/* ================= INSPECTION MODAL ================= */}
      {selectedGuide && (
        <div className={styles.modalBackdrop} onClick={handleCloseInspect}>
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <h2 className={styles.modalTitle}>Guide Application Inspection</h2>
                <span className={styles.guideIdBadge}>
                  {selectedGuide.publicId || `#${selectedGuide._id}`}
                </span>
              </div>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={handleCloseInspect}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className={styles.modalBody}>
              {/* Hero */}
              <div className={styles.guideHero}>
                <div className={styles.largeAvatar}>
                  {selectedGuide.profileImage ? (
                    <img
                      src={selectedGuide.profileImage}
                      alt={selectedGuide.name}
                    />
                  ) : (
                    selectedGuide.name?.charAt(0)?.toUpperCase() || 'G'
                  )}
                </div>

                <div className={styles.heroDetails}>
                  <h3 className={styles.heroName}>{selectedGuide.name}</h3>
                  <div className={styles.heroMetaRow}>
                    <span
                      className={
                        selectedGuide.guideStatus === 'PENDING'
                          ? styles.statusBadgePending
                          : selectedGuide.guideStatus === 'APPROVED'
                          ? styles.statusBadgeApproved
                          : styles.statusBadgeRejected
                      }
                    >
                      {selectedGuide.guideStatus}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Registered on{' '}
                      {selectedGuide.createdAt
                        ? new Date(selectedGuide.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vehicle Highlight Card */}
              <div className={styles.modalSection}>
                <div className={styles.sectionHeader}>
                  <Car size={16} />
                  <span>Assigned Vehicle & Fleet Registration</span>
                </div>

                <div className={styles.vehicleCardBox}>
                  <div className={styles.vehicleCardLeft}>
                    <div className={styles.vehicleTypeIconBox}>
                      {selectedGuide.vehicleType === 'CAR' && <Car size={26} />}
                      {selectedGuide.vehicleType === 'VAN' && <Truck size={26} />}
                      {selectedGuide.vehicleType === 'BUS' && <Bus size={26} />}
                      {!selectedGuide.vehicleType && <Car size={26} />}
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#64748b',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        Vehicle Category
                      </span>
                      <h4
                        style={{
                          margin: '2px 0 0',
                          fontSize: '18px',
                          color: '#0f172a',
                          fontWeight: 800,
                        }}
                      >
                        {selectedGuide.vehicleType || 'No Vehicle Specified'}
                      </h4>
                    </div>
                  </div>

                  <div>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        color: '#64748b',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        marginBottom: '4px',
                      }}
                    >
                      Registered License Plate
                    </span>
                    {selectedGuide.vehicleNumber ? (
                      <span className={styles.vehiclePlateBig}>
                        {selectedGuide.vehicleNumber}
                      </span>
                    ) : (
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                        No plate number registered
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal & Contact Grid */}
              <div className={styles.modalSection}>
                <div className={styles.sectionHeader}>
                  <UserCheck size={16} />
                  <span>Guide Profile & Details</span>
                </div>

                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <div className={styles.infoItemIcon}>
                      <Mail size={16} />
                    </div>
                    <div className={styles.infoItemMeta}>
                      <span className={styles.infoItemLabel}>Email</span>
                      <span className={styles.infoItemValue} title={selectedGuide.email}>
                        {selectedGuide.email}
                      </span>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.infoItemIcon}>
                      <Phone size={16} />
                    </div>
                    <div className={styles.infoItemMeta}>
                      <span className={styles.infoItemLabel}>Mobile Phone</span>
                      <span className={styles.infoItemValue}>
                        {selectedGuide.mobile || 'Not provided'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.infoItemIcon}>
                      <MapPin size={16} />
                    </div>
                    <div className={styles.infoItemMeta}>
                      <span className={styles.infoItemLabel}>Location</span>
                      <span className={styles.infoItemValue}>
                        {selectedGuide.city || 'N/A'}, {selectedGuide.country || 'LK'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.infoItemIcon}>
                      <Clock size={16} />
                    </div>
                    <div className={styles.infoItemMeta}>
                      <span className={styles.infoItemLabel}>Experience</span>
                      <span className={styles.infoItemValue}>
                        {selectedGuide.experienceYears || 0} Years Experience
                      </span>
                    </div>
                  </div>
                </div>

                {/* Languages */}
                <div style={{ marginTop: '14px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#64748b',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    Spoken Languages
                  </span>
                  <div className={styles.langTags}>
                    {selectedGuide.languages && selectedGuide.languages.length > 0 ? (
                      selectedGuide.languages.map((lang, idx) => (
                        <span key={idx} className={styles.langTag}>
                          {lang}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        None specified
                      </span>
                    )}
                  </div>
                </div>

                {/* About Bio */}
                {selectedGuide.about && (
                  <div style={{ marginTop: '14px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#64748b',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      About & Bio
                    </span>
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: '13px',
                        color: '#334155',
                        lineHeight: 1.5,
                      }}
                    >
                      {selectedGuide.about}
                    </p>
                  </div>
                )}
              </div>

              {/* Identity Documents Inspection */}
              <div className={styles.modalSection}>
                <div className={styles.sectionHeader}>
                  <FileCheck size={16} />
                  <span>
                    Government Identity Verification ({selectedGuide.governmentIdType || 'NIC'})
                  </span>
                </div>

                {docError && (
                  <div className={styles.alertError} style={{ marginBottom: '12px' }}>
                    <span>{docError}</span>
                  </div>
                )}

                <div className={styles.documentsRow}>
                  {/* Front Side */}
                  <div className={styles.docBox}>
                    <div className={styles.docBoxTitle}>
                      <span>Identity Document (Front)</span>
                      {selectedGuide.hasIdFrontDocument ? (
                        <span className={styles.docVerifiedPill}>
                          <CheckCircle2 size={12} /> Available
                        </span>
                      ) : (
                        <span className={styles.docMissingPill}>
                          <AlertCircle size={12} /> Not Uploaded
                        </span>
                      )}
                    </div>

                    <div className={styles.docPreviewBox}>
                      {loadingFrontDoc ? (
                        <RefreshCw size={24} className={styles.spin} />
                      ) : frontDocUrl ? (
                        <img
                          src={frontDocUrl}
                          alt="Front Document"
                          className={styles.docPreviewImg}
                        />
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                          Click inspect below to decrypt & preview
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <button
                        type="button"
                        className={styles.viewDocBtn}
                        style={{ flex: 1 }}
                        disabled={loadingFrontDoc}
                        onClick={() =>
                          void handleLoadDoc(selectedGuide._id, 'front')
                        }
                      >
                        <Eye size={14} />
                        {frontDocUrl ? 'Reload Front ID' : 'Inspect Front ID'}
                      </button>

                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        style={{ display: 'none' }}
                        ref={adminFrontInputRef}
                        onChange={(e) => handleAdminUploadDoc('front', e)}
                      />
                      <button
                        type="button"
                        className={styles.viewDocBtn}
                        style={{ flex: 1, background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}
                        disabled={loadingFrontDoc}
                        onClick={() => adminFrontInputRef.current?.click()}
                        title="Upload or replace with a real NIC photo file"
                      >
                        <UploadCloud size={14} />
                        Upload Front Photo
                      </button>
                    </div>
                  </div>

                  {/* Back Side (for NIC) */}
                  <div className={styles.docBox}>
                    <div className={styles.docBoxTitle}>
                      <span>Identity Document (Back)</span>
                      {selectedGuide.hasIdBackDocument ? (
                        <span className={styles.docVerifiedPill}>
                          <CheckCircle2 size={12} /> Available
                        </span>
                      ) : (
                        <span className={styles.docMissingPill}>
                          <AlertCircle size={12} /> Not Uploaded
                        </span>
                      )}
                    </div>

                    <div className={styles.docPreviewBox}>
                      {loadingBackDoc ? (
                        <RefreshCw size={24} className={styles.spin} />
                      ) : backDocUrl ? (
                        <img
                          src={backDocUrl}
                          alt="Back Document"
                          className={styles.docPreviewImg}
                        />
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {selectedGuide.governmentIdType === 'PASSPORT'
                            ? 'Passport does not require a back document'
                            : 'Click inspect below to decrypt & preview'}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <button
                        type="button"
                        className={styles.viewDocBtn}
                        style={{ flex: 1 }}
                        disabled={loadingBackDoc}
                        onClick={() =>
                          void handleLoadDoc(selectedGuide._id, 'back')
                        }
                      >
                        <Eye size={14} />
                        {backDocUrl ? 'Reload Back ID' : 'Inspect Back ID'}
                      </button>

                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        style={{ display: 'none' }}
                        ref={adminBackInputRef}
                        onChange={(e) => handleAdminUploadDoc('back', e)}
                      />
                      <button
                        type="button"
                        className={styles.viewDocBtn}
                        style={{ flex: 1, background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}
                        disabled={loadingBackDoc}
                        onClick={() => adminBackInputRef.current?.click()}
                        title="Upload or replace with a real NIC photo file"
                      >
                        <UploadCloud size={14} />
                        Upload Back Photo
                      </button>
                    </div>
                  </div>
                </div>

                {selectedGuide.guideTermsAcceptedAt && (
                  <p
                    style={{
                      margin: '12px 0 0',
                      fontSize: '11px',
                      color: '#64748b',
                    }}
                  >
                    Guide Terms & Identity Consent accepted on:{' '}
                    {new Date(selectedGuide.guideTermsAcceptedAt).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Rejection notice if rejected */}
              {selectedGuide.guideStatus === 'REJECTED' &&
                selectedGuide.guideReviewReason && (
                  <div className={styles.reasonBox}>
                    <strong>Rejection Reason:</strong>
                    <p style={{ margin: '4px 0 0' }}>
                      {selectedGuide.guideReviewReason}
                    </p>
                  </div>
                )}
            </div>

            {/* Modal Footer */}
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.actionBtnInspect}
                onClick={handleCloseInspect}
              >
                Close Inspection
              </button>

              <div className={styles.modalFooterRight}>
                {selectedGuide.guideStatus === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      className={styles.actionBtnReject}
                      disabled={actionLoadingId === selectedGuide._id}
                      onClick={() => {
                        setRejectingGuide(selectedGuide);
                        setRejectReason('');
                      }}
                    >
                      <X size={15} />
                      Reject Application
                    </button>

                    <button
                      type="button"
                      className={styles.actionBtnApprove}
                      disabled={actionLoadingId === selectedGuide._id}
                      onClick={() => void handleApprove(selectedGuide._id)}
                    >
                      <CheckCircle2 size={15} />
                      Approve Guide Application
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= REJECT PROMPT MODAL ================= */}
      {rejectingGuide && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setRejectingGuide(null)}
        >
          <div
            className={styles.promptModalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.promptTitle}>Reject Guide Application</h3>
            <p className={styles.promptDesc}>
              Provide a reason for rejecting <strong>{rejectingGuide.name}</strong>
              &apos;s guide registration (e.g. invalid vehicle plate, unclear identity card).
            </p>

            <textarea
              className={styles.promptTextarea}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason for the applicant..."
              maxLength={1000}
            />

            <div className={styles.promptActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setRejectingGuide(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className={styles.confirmRejectBtn}
                disabled={actionLoadingId === rejectingGuide._id}
                onClick={() => void handleRejectConfirm()}
              >
                <X size={15} />
                {actionLoadingId === rejectingGuide._id
                  ? 'Rejecting...'
                  : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

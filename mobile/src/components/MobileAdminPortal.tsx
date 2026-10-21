import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Switch,
} from 'react-native';
import {
  ShieldAlert,
  X,
  TrendingUp,
  Calendar,
  Users,
  Compass,
  Package,
  MapPin,
  CreditCard,
  Plus,
  Check,
  Award,
  Search,
  Trash,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  FileText,
} from 'lucide-react-native';
import { MobileInvoiceModal } from './MobileInvoiceModal';
import { COLORS, SHADOWS } from '../constants/theme';
import {
  ApiAdminStats,
  ApiBooking,
  ApiUser,
  ApiPackage,
  ApiDestination,
  ApiPayment,
  ApiTravelPlan,
  api,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type TabType =
  | 'OVERVIEW'
  | 'BOOKINGS'
  | 'PACKAGES'
  | 'DESTINATIONS'
  | 'GUIDES'
  | 'USERS'
  | 'PAYMENTS'
  | 'PLANS';

export const MobileAdminPortal: React.FC<Props> = ({ visible, onClose }) => {
  const { token } = useAuth();
  const { formatPrice } = useCurrency();

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');

  // Core Data States
  const [stats, setStats] = useState<ApiAdminStats | null>(null);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [packages, setPackages] = useState<ApiPackage[]>([]);
  const [destinations, setDestinations] = useState<ApiDestination[]>([]);
  const [guides, setGuides] = useState<ApiUser[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [travelPlans, setTravelPlans] = useState<ApiTravelPlan[]>([]);

  // UI / Filter States
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingFilter, setBookingFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'>('ALL');
  const [guideFilter, setGuideFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('PENDING');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'USER' | 'GUIDE' | 'ADMIN'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING' | 'FAILED'>('ALL');
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<ApiBooking | null>(null);

  // Sub-modal creation sheets
  const [showNewPackageModal, setShowNewPackageModal] = useState(false);
  const [showNewDestModal, setShowNewDestModal] = useState(false);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);

  // New Package Form State
  const [pkgTitle, setPkgTitle] = useState('');
  const [pkgDestination, setPkgDestination] = useState('');
  const [pkgCountry, setPkgCountry] = useState('Sri Lanka');
  const [pkgDuration, setPkgDuration] = useState('3 Days / 2 Nights');
  const [pkgPrice, setPkgPrice] = useState('450');
  const [pkgCategory, setPkgCategory] = useState('Adventure');
  const [pkgDescription, setPkgDescription] = useState('');

  // New Destination Form State
  const [destName, setDestName] = useState('');
  const [destCountry, setDestCountry] = useState('Sri Lanka');
  const [destBestTime, setDestBestTime] = useState('November to April');
  const [destDescription, setDestDescription] = useState('');

  // New Travel Plan Form State
  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState('499');
  const [planSuffix, setPlanSuffix] = useState('/ person');
  const [planFeatures, setPlanFeatures] = useState('Private transport, 4-star hotel, Breakfast, Dedicated tour guide');

  useEffect(() => {
    if (visible && token) {
      loadAllAdminData();
    }
  }, [visible, token]);

  const loadAllAdminData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [s, b, p, d, g, u, pay, tp] = await Promise.all([
        api.getAdminStats(token),
        api.getAdminBookings(token),
        api.getPackages(),
        api.getDestinations(),
        api.getAdminGuides(token),
        api.getAdminUsers(token),
        api.getAdminPayments(token),
        api.getTravelPlans(),
      ]);

      setStats(s);
      setBookings(b || []);
      setPackages(p || []);
      setDestinations(d || []);
      setGuides(g || []);
      setUsers(u || []);
      setPayments(pay || []);
      setTravelPlans(tp || []);
    } catch (err: any) {
      console.warn('Admin load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ==========================================
  // ACTIONS: BOOKINGS
  // ==========================================
  const handleUpdateBooking = async (id: string, status: 'CONFIRMED' | 'CANCELLED') => {
    if (!token) return;
    try {
      await api.updateBookingStatus(id, status, token);
      Alert.alert('Status Updated', `Booking has been marked as ${status}.`);
      loadAllAdminData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update status');
    }
  };

  const handleDeleteBooking = (id: string) => {
    if (!token) return;
    Alert.alert(
      'Delete Booking',
      'Are you sure you want to permanently delete this booking record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteBooking(id, token);
              Alert.alert('Deleted', 'Booking removed successfully.');
              loadAllAdminData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not delete booking');
            }
          },
        },
      ]
    );
  };

  // ==========================================
  // ACTIONS: PACKAGES
  // ==========================================
  const handleTogglePackageAvailability = async (pkg: ApiPackage) => {
    if (!token) return;
    try {
      const newStatus = pkg.availability === false ? true : false;
      await api.updatePackage(pkg._id, { availability: newStatus }, token);
      setPackages((prev) =>
        prev.map((p) => (p._id === pkg._id ? { ...p, availability: newStatus } : p))
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not toggle package status');
      loadAllAdminData();
    }
  };

  const handleDeletePackage = (id: string, title: string) => {
    if (!token) return;
    Alert.alert(
      'Delete Package',
      `Permanently remove "${title}" from the catalog?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deletePackage(id, token);
              Alert.alert('Deleted', 'Package removed successfully.');
              loadAllAdminData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not delete package');
            }
          },
        },
      ]
    );
  };

  const handleCreatePackage = async () => {
    if (!token) return;
    if (!pkgTitle.trim() || !pkgDestination.trim() || !pkgPrice.trim()) {
      Alert.alert('Missing Fields', 'Please enter a title, destination, and price.');
      return;
    }
    try {
      await api.createPackage(
        {
          title: pkgTitle.trim(),
          destination: pkgDestination.trim(),
          country: pkgCountry.trim() || 'Sri Lanka',
          duration: pkgDuration.trim() || '3 Days',
          price: Number(pkgPrice) || 300,
          category: pkgCategory.trim() || 'Adventure',
          description: pkgDescription.trim() || `Discover the finest spots in ${pkgDestination}.`,
          included: ['Hotel Accommodation', 'Breakfast', 'Private Transport', 'Local Guide'],
          addOns: [],
          images: [],
          availability: true,
        },
        token
      );
      Alert.alert('Success! 🎉', `Package "${pkgTitle}" created successfully.`);
      setShowNewPackageModal(false);
      setPkgTitle('');
      setPkgDestination('');
      loadAllAdminData();
    } catch (err: any) {
      Alert.alert('Error Creating Package', err.message || 'Could not create package');
    }
  };

  // ==========================================
  // ACTIONS: DESTINATIONS
  // ==========================================
  const handleDeleteDestination = (id: string, name: string) => {
    if (!token) return;
    Alert.alert(
      'Delete Destination',
      `Permanently remove "${name}" from destinations?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteDestination(id, token);
              Alert.alert('Deleted', 'Destination deleted successfully.');
              loadAllAdminData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not delete destination');
            }
          },
        },
      ]
    );
  };

  const handleCreateDestination = async () => {
    if (!token) return;
    if (!destName.trim()) {
      Alert.alert('Missing Field', 'Please enter a destination name.');
      return;
    }
    try {
      await api.createDestination(
        {
          name: destName.trim(),
          country: destCountry.trim() || 'Sri Lanka',
          bestTimeToVisit: destBestTime.trim() || 'Year-round',
          description: destDescription.trim() || `Experience breathtaking wonders in ${destName}.`,
          rating: 4.8,
          isActive: true,
          images: [],
        },
        token
      );
      Alert.alert('Success! 🌟', `Destination "${destName}" added successfully.`);
      setShowNewDestModal(false);
      setDestName('');
      loadAllAdminData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not create destination');
    }
  };

  // ==========================================
  // ACTIONS: GUIDES
  // ==========================================
  const handleApproveGuide = async (id: string) => {
    if (!token) return;
    try {
      await api.approveGuide(id, token);
      Alert.alert('Guide Certified! 🌟', 'Tour guide is now verified and active.');
      loadAllAdminData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not approve guide');
    }
  };

  const handleRejectGuide = (id: string) => {
    if (!token) return;
    Alert.alert('Reject Application', 'Do you want to reject this guide application?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.rejectGuide(id, 'Document verification criteria not satisfied', token);
            Alert.alert('Rejected', 'Guide application has been rejected.');
            loadAllAdminData();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  // ==========================================
  // ACTIONS: USERS
  // ==========================================
  const handleDeleteUser = (id: string, email: string) => {
    if (!token) return;
    Alert.alert('Delete Account', `Permanently delete user account ${email}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteUser(id, token);
            Alert.alert('Deleted', 'Account removed successfully.');
            loadAllAdminData();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Could not delete user');
          }
        },
      },
    ]);
  };

  // ==========================================
  // ACTIONS: TRAVEL PLANS
  // ==========================================
  const handleCreateTravelPlan = async () => {
    if (!token) return;
    if (!planName.trim() || !planPrice.trim()) {
      Alert.alert('Missing Fields', 'Please specify a name and price.');
      return;
    }
    try {
      const featArr = planFeatures
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);
      await api.createTravelPlan(
        {
          name: planName.trim(),
          price: Number(planPrice) || 499,
          priceSuffix: planSuffix.trim() || '/ person',
          features: featArr.length > 0 ? featArr : ['Luxury Hotel', 'Private Transport'],
          isPopular: false,
          isActive: true,
          sortOrder: travelPlans.length + 1,
        },
        token
      );
      Alert.alert('Success! 💎', `Travel plan tier "${planName}" created.`);
      setShowNewPlanModal(false);
      setPlanName('');
      loadAllAdminData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not create travel plan');
    }
  };

  const handleDeleteTravelPlan = (id: string, name: string) => {
    if (!token) return;
    Alert.alert('Delete Plan Tier', `Remove "${name}" tier?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteTravelPlan(id, token);
            Alert.alert('Deleted', 'Travel plan tier removed.');
            loadAllAdminData();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Could not delete travel plan');
          }
        },
      },
    ]);
  };

  // ==========================================
  // FILTERED DATASETS
  // ==========================================
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const pkgTitle = typeof b.packageId === 'object' ? (b.packageId as any).title : '';
      const matchesSearch =
        searchQuery === '' ||
        (b._id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkgTitle.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = bookingFilter === 'ALL' || b.status === bookingFilter;
      return matchesSearch && matchesFilter;
    });
  }, [bookings, bookingFilter, searchQuery]);

  const filteredPackages = useMemo(() => {
    return packages.filter((p) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (p.title || '').toLowerCase().includes(q) ||
        (p.destination || '').toLowerCase().includes(q) ||
        (p.country || '').toLowerCase().includes(q)
      );
    });
  }, [packages, searchQuery]);

  const filteredDestinations = useMemo(() => {
    return destinations.filter((d) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (d.name || '').toLowerCase().includes(q) ||
        (d.country || '').toLowerCase().includes(q)
      );
    });
  }, [destinations, searchQuery]);

  const filteredGuides = useMemo(() => {
    return guides.filter((g) => {
      const matchesFilter =
        guideFilter === 'ALL' ||
        (guideFilter === 'PENDING' && g.guideStatus === 'PENDING') ||
        (guideFilter === 'APPROVED' && g.guideStatus === 'APPROVED');
      const matchesSearch =
        !searchQuery ||
        (g.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.city || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [guides, guideFilter, searchQuery]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
      const matchesSearch =
        !searchQuery ||
        (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.publicId || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [users, userRoleFilter, searchQuery]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchesFilter = paymentFilter === 'ALL' || p.status === paymentFilter;
      const matchesSearch =
        !searchQuery ||
        (p._id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.paymentMethod || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (typeof p.userId === 'object' &&
          ((p.userId as any)?.email || '').toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [payments, paymentFilter, searchQuery]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.badgeWrap}>
              <ShieldAlert size={20} color="#ffffff" />
            </View>
            <View>
              <Text style={styles.headerEyebrow}>GLOBALVISTA COMMAND CENTER</Text>
              <Text style={styles.headerTitle}>Platform Admin Suite</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <X size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation Pill Bar */}
        <View style={styles.tabBarWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBar}
          >
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'OVERVIEW' && styles.tabItemActive]}
              onPress={() => { setActiveTab('OVERVIEW'); setSearchQuery(''); }}
            >
              <TrendingUp size={14} color={activeTab === 'OVERVIEW' ? '#38bdf8' : '#94a3b8'} />
              <Text style={[styles.tabText, activeTab === 'OVERVIEW' && styles.tabTextActive]}>Overview</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'BOOKINGS' && styles.tabItemActive]}
              onPress={() => { setActiveTab('BOOKINGS'); setSearchQuery(''); }}
            >
              <Calendar size={14} color={activeTab === 'BOOKINGS' ? '#38bdf8' : '#94a3b8'} />
              <Text style={[styles.tabText, activeTab === 'BOOKINGS' && styles.tabTextActive]}>
                Bookings ({bookings.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'PACKAGES' && styles.tabItemActive]}
              onPress={() => { setActiveTab('PACKAGES'); setSearchQuery(''); }}
            >
              <Package size={14} color={activeTab === 'PACKAGES' ? '#38bdf8' : '#94a3b8'} />
              <Text style={[styles.tabText, activeTab === 'PACKAGES' && styles.tabTextActive]}>
                Packages ({packages.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'DESTINATIONS' && styles.tabItemActive]}
              onPress={() => { setActiveTab('DESTINATIONS'); setSearchQuery(''); }}
            >
              <MapPin size={14} color={activeTab === 'DESTINATIONS' ? '#38bdf8' : '#94a3b8'} />
              <Text style={[styles.tabText, activeTab === 'DESTINATIONS' && styles.tabTextActive]}>
                Destinations ({destinations.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'GUIDES' && styles.tabItemActive]}
              onPress={() => { setActiveTab('GUIDES'); setSearchQuery(''); }}
            >
              <Compass size={14} color={activeTab === 'GUIDES' ? '#38bdf8' : '#94a3b8'} />
              <Text style={[styles.tabText, activeTab === 'GUIDES' && styles.tabTextActive]}>
                Guides ({guides.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'USERS' && styles.tabItemActive]}
              onPress={() => { setActiveTab('USERS'); setSearchQuery(''); }}
            >
              <Users size={14} color={activeTab === 'USERS' ? '#38bdf8' : '#94a3b8'} />
              <Text style={[styles.tabText, activeTab === 'USERS' && styles.tabTextActive]}>
                Users ({users.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'PAYMENTS' && styles.tabItemActive]}
              onPress={() => { setActiveTab('PAYMENTS'); setSearchQuery(''); }}
            >
              <CreditCard size={14} color={activeTab === 'PAYMENTS' ? '#38bdf8' : '#94a3b8'} />
              <Text style={[styles.tabText, activeTab === 'PAYMENTS' && styles.tabTextActive]}>
                Payments ({payments.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'PLANS' && styles.tabItemActive]}
              onPress={() => { setActiveTab('PLANS'); setSearchQuery(''); }}
            >
              <Award size={14} color={activeTab === 'PLANS' ? '#38bdf8' : '#94a3b8'} />
              <Text style={[styles.tabText, activeTab === 'PLANS' && styles.tabTextActive]}>
                Plans ({travelPlans.length})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Global Search Bar (for tabs other than Overview) */}
        {activeTab !== 'OVERVIEW' && (
          <View style={styles.searchBarWrap}>
            <Search size={16} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search in ${activeTab.toLowerCase()}...`}
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Scrollable Content Body */}
        <ScrollView
          style={styles.body}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadAllAdminData();
              }}
              tintColor="#38bdf8"
            />
          }
        >
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color="#38bdf8" style={{ marginTop: 40 }} />
          ) : activeTab === 'OVERVIEW' ? (
            /* ==========================================
               MODULE 1: OVERVIEW & ANALYTICS
            ========================================== */
            <View>
              {/* Total Revenue Hero Card */}
              <View style={styles.revenueCard}>
                <Text style={styles.revLabel}>TOTAL PLATFORM REVENUE</Text>
                <Text style={styles.revAmount}>{formatPrice(stats?.totalRevenue || 0)}</Text>
                <Text style={styles.revSubtitle}>
                  From {stats?.totalPayments || payments.length || 0} completed transactions across mobile and web
                </Text>
              </View>

              {/* KPI Grid */}
              <View style={styles.grid}>
                <TouchableOpacity
                  style={styles.kpiCard}
                  onPress={() => setActiveTab('BOOKINGS')}
                  activeOpacity={0.8}
                >
                  <Calendar size={18} color="#38bdf8" />
                  <Text style={styles.kpiValue}>{stats?.totalBookings || bookings.length || 0}</Text>
                  <Text style={styles.kpiLabel}>Total Bookings</Text>
                  <Text style={styles.kpiSub}>{stats?.pendingBookings || 0} Pending Confirmation</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.kpiCard}
                  onPress={() => setActiveTab('USERS')}
                  activeOpacity={0.8}
                >
                  <Users size={18} color="#10b981" />
                  <Text style={styles.kpiValue}>{stats?.totalAccounts || users.length || 0}</Text>
                  <Text style={styles.kpiLabel}>Total Accounts</Text>
                  <Text style={styles.kpiSub}>{stats?.totalUsers || 0} Travellers</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.kpiCard}
                  onPress={() => setActiveTab('GUIDES')}
                  activeOpacity={0.8}
                >
                  <Compass size={18} color="#f59e0b" />
                  <Text style={styles.kpiValue}>{stats?.totalGuides || guides.length || 0}</Text>
                  <Text style={styles.kpiLabel}>Tour Guides</Text>
                  <Text style={styles.kpiSub}>{stats?.approvedGuides || 0} Certified Active</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.kpiCard}
                  onPress={() => setActiveTab('PACKAGES')}
                  activeOpacity={0.8}
                >
                  <Package size={18} color="#8b5cf6" />
                  <Text style={styles.kpiValue}>{stats?.totalPackages || packages.length || 0}</Text>
                  <Text style={styles.kpiLabel}>Expedition Packages</Text>
                  <Text style={styles.kpiSub}>{destinations.length} Destinations</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Admin Actions */}
              <View style={styles.quickActionsSection}>
                <Text style={styles.sectionHeading}>QUICK CREATION SHORTCUTS</Text>
                <View style={styles.quickBtnRow}>
                  <TouchableOpacity
                    style={styles.quickBtn}
                    onPress={() => setShowNewPackageModal(true)}
                    activeOpacity={0.8}
                  >
                    <Plus size={16} color="#ffffff" />
                    <Text style={styles.quickBtnText}>New Package</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickBtnSecondary}
                    onPress={() => setShowNewDestModal(true)}
                    activeOpacity={0.8}
                  >
                    <Plus size={16} color="#38bdf8" />
                    <Text style={styles.quickBtnSecondaryText}>New Destination</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : activeTab === 'BOOKINGS' ? (
            /* ==========================================
               MODULE 2: BOOKINGS MANAGEMENT
            ========================================== */
            <View>
              {/* Filter Pills */}
              <View style={styles.filterRow}>
                {(['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED'] as const).map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterPill, bookingFilter === f && styles.filterPillActive]}
                    onPress={() => setBookingFilter(f)}
                  >
                    <Text style={[styles.filterText, bookingFilter === f && styles.filterTextActive]}>
                      {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {filteredBookings.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>No matching bookings found.</Text>
                </View>
              ) : (
                filteredBookings.map((b) => {
                  const pkgTitle = typeof b.packageId === 'object' ? (b.packageId as any).title : 'Expedition';
                  const isPending = b.status === 'PENDING';
                  return (
                    <View key={b._id} style={styles.adminCard}>
                      <View style={styles.adminCardTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.adminCardId}>#{(b._id || '').slice(-6).toUpperCase()}</Text>
                          <Text style={styles.adminCardTitle} numberOfLines={1}>{pkgTitle}</Text>
                        </View>
                        <View
                          style={[
                            styles.statusTag,
                            b.status === 'CONFIRMED'
                              ? styles.statusTagConfirmed
                              : b.status === 'PENDING'
                              ? styles.statusTagPending
                              : styles.statusTagCancelled,
                          ]}
                        >
                          <Text style={styles.statusTagText}>{b.status}</Text>
                        </View>
                      </View>

                      <View style={styles.adminCardMeta}>
                        <Text style={styles.metaLabel}>Date: <Text style={styles.metaVal}>{b.travelDate}</Text></Text>
                        <Text style={styles.metaLabel}>Guests: <Text style={styles.metaVal}>{b.numberOfPeople}</Text></Text>
                        <Text style={styles.metaLabel}>Total: <Text style={styles.metaValHighlight}>{formatPrice(b.totalPrice)}</Text></Text>
                        <Text style={styles.metaLabel}>Payment: <Text style={styles.metaVal}>{b.paymentStatus || 'UNPAID'}</Text></Text>
                      </View>

                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={styles.viewBillBtn}
                          onPress={() => setSelectedInvoiceBooking(b)}
                          activeOpacity={0.8}
                        >
                          <FileText size={13} color="#38bdf8" />
                          <Text style={styles.viewBillBtnText}>View Bill</Text>
                        </TouchableOpacity>

                        {isPending && (
                          <TouchableOpacity
                            style={styles.approveBtn}
                            onPress={() => handleUpdateBooking(b._id, 'CONFIRMED')}
                            activeOpacity={0.8}
                          >
                            <Check size={14} color="#ffffff" />
                            <Text style={styles.actionBtnText}>Confirm</Text>
                          </TouchableOpacity>
                        )}

                        {b.status !== 'CANCELLED' && (
                          <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => handleUpdateBooking(b._id, 'CANCELLED')}
                            activeOpacity={0.8}
                          >
                            <X size={14} color="#f87171" />
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={styles.deleteIconBtn}
                          onPress={() => handleDeleteBooking(b._id)}
                          activeOpacity={0.7}
                        >
                          <Trash size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          ) : activeTab === 'PACKAGES' ? (
            /* ==========================================
               MODULE 3: PACKAGES MANAGEMENT
            ========================================== */
            <View>
              {/* Header with "+ Add Package" */}
              <View style={styles.sectionHeaderBar}>
                <Text style={styles.sectionBarTitle}>Packages Catalog ({packages.length})</Text>
                <TouchableOpacity
                  style={styles.addSmallBtn}
                  onPress={() => setShowNewPackageModal(true)}
                  activeOpacity={0.8}
                >
                  <Plus size={14} color="#ffffff" />
                  <Text style={styles.addSmallBtnText}>Add Package</Text>
                </TouchableOpacity>
              </View>

              {filteredPackages.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>No packages matching your search.</Text>
                </View>
              ) : (
                filteredPackages.map((pkg) => {
                  const isAvailable = pkg.availability !== false;
                  return (
                    <View key={pkg._id} style={styles.adminCard}>
                      <View style={styles.adminCardTop}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={styles.adminCardTitle}>{pkg.title}</Text>
                          <Text style={styles.cardSubtitle}>
                            📍 {pkg.destination}, {pkg.country} · {pkg.duration}
                          </Text>
                        </View>
                        <Text style={styles.priceTag}>{formatPrice(pkg.price)}</Text>
                      </View>

                      <View style={styles.packageBottomRow}>
                        <View style={styles.toggleRow}>
                          <Text style={styles.toggleLabel}>
                            {isAvailable ? '🟢 Available' : '🔴 Hidden'}
                          </Text>
                          <Switch
                            value={isAvailable}
                            onValueChange={() => handleTogglePackageAvailability(pkg)}
                            trackColor={{ false: '#334155', true: '#0284c7' }}
                            thumbColor={isAvailable ? '#38bdf8' : '#94a3b8'}
                          />
                        </View>

                        <TouchableOpacity
                          style={styles.deleteIconBtn}
                          onPress={() => handleDeletePackage(pkg._id, pkg.title)}
                          activeOpacity={0.7}
                        >
                          <Trash size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          ) : activeTab === 'DESTINATIONS' ? (
            /* ==========================================
               MODULE 4: DESTINATIONS MANAGEMENT
            ========================================== */
            <View>
              <View style={styles.sectionHeaderBar}>
                <Text style={styles.sectionBarTitle}>Destinations ({destinations.length})</Text>
                <TouchableOpacity
                  style={styles.addSmallBtn}
                  onPress={() => setShowNewDestModal(true)}
                  activeOpacity={0.8}
                >
                  <Plus size={14} color="#ffffff" />
                  <Text style={styles.addSmallBtnText}>Add Destination</Text>
                </TouchableOpacity>
              </View>

              {filteredDestinations.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>No destinations found.</Text>
                </View>
              ) : (
                filteredDestinations.map((d) => (
                  <View key={d._id} style={styles.adminCard}>
                    <View style={styles.adminCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.adminCardTitle}>{d.name}</Text>
                        <Text style={styles.cardSubtitle}>
                          🌏 {d.country} · ⭐ {d.rating || 4.8} / 5
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteIconBtn}
                        onPress={() => handleDeleteDestination(d._id, d.name)}
                        activeOpacity={0.7}
                      >
                        <Trash size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.metaLabel} numberOfLines={2}>
                      Best Time: <Text style={styles.metaVal}>{d.bestTimeToVisit || 'Year-round'}</Text>
                    </Text>
                  </View>
                ))
              )}
            </View>
          ) : activeTab === 'GUIDES' ? (
            /* ==========================================
               MODULE 5: TOUR GUIDES APPROVAL & ROSTER
            ========================================== */
            <View>
              <View style={styles.filterRow}>
                {(['PENDING', 'APPROVED', 'ALL'] as const).map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterPill, guideFilter === f && styles.filterPillActive]}
                    onPress={() => setGuideFilter(f)}
                  >
                    <Text style={[styles.filterText, guideFilter === f && styles.filterTextActive]}>
                      {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {filteredGuides.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>No {guideFilter.toLowerCase()} guide applications found.</Text>
                </View>
              ) : (
                filteredGuides.map((g) => {
                  const isPending = g.guideStatus === 'PENDING';
                  return (
                    <View key={g._id || g.id} style={styles.adminCard}>
                      <View style={styles.adminCardTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.adminCardTitle}>{g.name}</Text>
                          <Text style={styles.guideEmail}>{g.email} · {g.mobile || 'No mobile'}</Text>
                        </View>
                        <View
                          style={[
                            styles.statusTag,
                            g.guideStatus === 'APPROVED' ? styles.statusTagConfirmed : styles.statusTagPending,
                          ]}
                        >
                          <Text style={styles.statusTagText}>{g.guideStatus || 'PENDING'}</Text>
                        </View>
                      </View>

                      <View style={styles.guideMetaGrid}>
                        <Text style={styles.guideMetaItem}>📍 City: <Text style={styles.metaVal}>{g.city || 'Sri Lanka'}</Text></Text>
                        <Text style={styles.guideMetaItem}>⏳ Experience: <Text style={styles.metaVal}>{g.experienceYears || 1} Years</Text></Text>
                        <Text style={styles.guideMetaItem}>🗣 Languages: <Text style={styles.metaVal}>{g.languages?.join(', ') || 'English'}</Text></Text>
                      </View>

                      {isPending && (
                        <View style={styles.actionRow}>
                          <TouchableOpacity
                            style={styles.approveBtn}
                            onPress={() => handleApproveGuide(g._id || g.id)}
                            activeOpacity={0.8}
                          >
                            <Check size={14} color="#ffffff" />
                            <Text style={styles.actionBtnText}>Approve Certified Guide</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => handleRejectGuide(g._id || g.id)}
                            activeOpacity={0.8}
                          >
                            <X size={14} color="#f87171" />
                            <Text style={styles.cancelBtnText}>Reject</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          ) : activeTab === 'USERS' ? (
            /* ==========================================
               MODULE 6: USERS & ACCOUNTS
            ========================================== */
            <View>
              {/* Role filter */}
              <View style={styles.filterRow}>
                {(['ALL', 'USER', 'GUIDE', 'ADMIN'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.filterPill, userRoleFilter === r && styles.filterPillActive]}
                    onPress={() => setUserRoleFilter(r)}
                  >
                    <Text style={[styles.filterText, userRoleFilter === r && styles.filterTextActive]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {filteredUsers.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>No registered accounts found.</Text>
                </View>
              ) : (
                filteredUsers.map((u) => {
                  const roleColor =
                    u.role === 'ADMIN'
                      ? '#a855f7'
                      : u.role === 'GUIDE'
                      ? '#f59e0b'
                      : '#38bdf8';
                  return (
                    <View key={u._id || u.id} style={styles.adminCard}>
                      <View style={styles.adminCardTop}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.adminCardTitle}>{u.name || 'Anonymous'}</Text>
                            <View style={[styles.rolePill, { backgroundColor: `${roleColor}20` }]}>
                              <Text style={[styles.rolePillText, { color: roleColor }]}>{u.role}</Text>
                            </View>
                          </View>
                          <Text style={styles.guideEmail}>{u.email}</Text>
                        </View>
                        {u.role !== 'ADMIN' && (
                          <TouchableOpacity
                            style={styles.deleteIconBtn}
                            onPress={() => handleDeleteUser(u._id || u.id, u.email)}
                            activeOpacity={0.7}
                          >
                            <Trash size={16} color="#ef4444" />
                          </TouchableOpacity>
                        )}
                      </View>

                      <View style={styles.userBottomRow}>
                        <Text style={styles.metaLabel}>ID: <Text style={styles.metaVal}>{u.publicId || 'N/A'}</Text></Text>
                        <Text style={styles.metaLabel}>Phone: <Text style={styles.metaVal}>{u.mobile || 'None'}</Text></Text>
                        <Text style={styles.metaLabel}>Country: <Text style={styles.metaVal}>{u.country || 'Sri Lanka'}</Text></Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          ) : activeTab === 'PAYMENTS' ? (
            /* ==========================================
               MODULE 7: PAYMENTS & FINANCIAL STREAM
            ========================================== */
            <View>
              <View style={styles.filterRow}>
                {(['ALL', 'COMPLETED', 'PENDING', 'FAILED'] as const).map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterPill, paymentFilter === f && styles.filterPillActive]}
                    onPress={() => setPaymentFilter(f)}
                  >
                    <Text style={[styles.filterText, paymentFilter === f && styles.filterTextActive]}>
                      {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {filteredPayments.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>No transactions recorded.</Text>
                </View>
              ) : (
                filteredPayments.map((p) => {
                  const isSuccess = p.status === 'COMPLETED';
                  const userEmail = typeof p.userId === 'object' ? (p.userId as any)?.email : 'Customer';
                  return (
                    <View key={p._id} style={styles.adminCard}>
                      <View style={styles.adminCardTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.adminCardId}>TX #{(p._id || '').slice(-8).toUpperCase()}</Text>
                          <Text style={styles.adminCardTitle}>{formatPrice(p.amount || 0)}</Text>
                          <Text style={styles.cardSubtitle}>
                            Method: {p.paymentMethod || 'Credit Card'}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusTag,
                            isSuccess
                              ? styles.statusTagConfirmed
                              : p.status === 'PENDING'
                              ? styles.statusTagPending
                              : styles.statusTagCancelled,
                          ]}
                        >
                          <Text style={styles.statusTagText}>{p.status}</Text>
                        </View>
                      </View>

                      <View style={styles.adminCardMeta}>
                        <Text style={styles.metaLabel}>User: <Text style={styles.metaVal}>{userEmail}</Text></Text>
                        <Text style={styles.metaLabel}>Date: <Text style={styles.metaVal}>{new Date(p.createdAt || Date.now()).toLocaleDateString()}</Text></Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          ) : (
            /* ==========================================
               MODULE 8: TRAVEL PLANS & TIERS
            ========================================== */
            <View>
              <View style={styles.sectionHeaderBar}>
                <Text style={styles.sectionBarTitle}>Service Tiers ({travelPlans.length})</Text>
                <TouchableOpacity
                  style={styles.addSmallBtn}
                  onPress={() => setShowNewPlanModal(true)}
                  activeOpacity={0.8}
                >
                  <Plus size={14} color="#ffffff" />
                  <Text style={styles.addSmallBtnText}>Add Tier</Text>
                </TouchableOpacity>
              </View>

              {travelPlans.map((tp) => (
                <View key={tp._id} style={styles.adminCard}>
                  <View style={styles.adminCardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.adminCardTitle}>{tp.name} Plan</Text>
                      <Text style={styles.priceTag}>
                        {formatPrice(tp.price)} <Text style={{ fontSize: 11, color: '#94a3b8' }}>{tp.priceSuffix || '/ person'}</Text>
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteIconBtn}
                      onPress={() => handleDeleteTravelPlan(tp._id, tp.name)}
                      activeOpacity={0.7}
                    >
                      <Trash size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                  <View style={{ gap: 4, marginTop: 8 }}>
                    {tp.features?.map((f, idx) => (
                      <Text key={idx} style={styles.metaLabel}>
                        ✓ <Text style={styles.metaVal}>{f}</Text>
                      </Text>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* ==========================================
           MODAL 1: CREATE NEW PACKAGE SHEET
        ========================================== */}
        <Modal
          visible={showNewPackageModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowNewPackageModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create New Package</Text>
                <TouchableOpacity onPress={() => setShowNewPackageModal(false)}>
                  <X size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Package Title *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Ella Scenic Highlands Adventure"
                  placeholderTextColor="#64748b"
                  value={pkgTitle}
                  onChangeText={setPkgTitle}
                />

                <Text style={styles.inputLabel}>Destination *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Ella"
                  placeholderTextColor="#64748b"
                  value={pkgDestination}
                  onChangeText={setPkgDestination}
                />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Country</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Sri Lanka"
                      placeholderTextColor="#64748b"
                      value={pkgCountry}
                      onChangeText={setPkgCountry}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Duration</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="3 Days / 2 Nights"
                      placeholderTextColor="#64748b"
                      value={pkgDuration}
                      onChangeText={setPkgDuration}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Price (USD) *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="450"
                      placeholderTextColor="#64748b"
                      keyboardType="numeric"
                      value={pkgPrice}
                      onChangeText={setPkgPrice}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Category</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Adventure / Beach"
                      placeholderTextColor="#64748b"
                      value={pkgCategory}
                      onChangeText={setPkgCategory}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, { height: 70 }]}
                  placeholder="Enter details about this expedition..."
                  placeholderTextColor="#64748b"
                  multiline
                  value={pkgDescription}
                  onChangeText={setPkgDescription}
                />
              </ScrollView>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleCreatePackage}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSubmitBtnText}>Publish Package</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ==========================================
           MODAL 2: CREATE DESTINATION SHEET
        ========================================== */}
        <Modal
          visible={showNewDestModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowNewDestModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Destination</Text>
                <TouchableOpacity onPress={() => setShowNewDestModal(false)}>
                  <X size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Destination Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Mirissa"
                  placeholderTextColor="#64748b"
                  value={destName}
                  onChangeText={setDestName}
                />

                <Text style={styles.inputLabel}>Country</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Sri Lanka"
                  placeholderTextColor="#64748b"
                  value={destCountry}
                  onChangeText={setDestCountry}
                />

                <Text style={styles.inputLabel}>Best Time to Visit</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. November to April"
                  placeholderTextColor="#64748b"
                  value={destBestTime}
                  onChangeText={setDestBestTime}
                />

                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, { height: 70 }]}
                  placeholder="Brief summary of sights and attractions..."
                  placeholderTextColor="#64748b"
                  multiline
                  value={destDescription}
                  onChangeText={setDestDescription}
                />
              </ScrollView>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleCreateDestination}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSubmitBtnText}>Add Destination</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ==========================================
           MODAL 3: CREATE TRAVEL PLAN SHEET
        ========================================== */}
        <Modal
          visible={showNewPlanModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowNewPlanModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Travel Service Tier</Text>
                <TouchableOpacity onPress={() => setShowNewPlanModal(false)}>
                  <X size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Tier Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. VIP Concierge"
                  placeholderTextColor="#64748b"
                  value={planName}
                  onChangeText={setPlanName}
                />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Price (USD) *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="499"
                      placeholderTextColor="#64748b"
                      keyboardType="numeric"
                      value={planPrice}
                      onChangeText={setPlanPrice}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Price Suffix</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="/ person"
                      placeholderTextColor="#64748b"
                      value={planSuffix}
                      onChangeText={setPlanSuffix}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Features (Comma-separated)</Text>
                <TextInput
                  style={[styles.formInput, { height: 70 }]}
                  placeholder="5-star hotel, Private luxury van, Chauffeur guide"
                  placeholderTextColor="#64748b"
                  multiline
                  value={planFeatures}
                  onChangeText={setPlanFeatures}
                />
              </ScrollView>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleCreateTravelPlan}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSubmitBtnText}>Create Service Tier</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Invoice / Voucher Inspector Modal */}
        <MobileInvoiceModal
          visible={!!selectedInvoiceBooking}
          booking={selectedInvoiceBooking}
          onClose={() => setSelectedInvoiceBooking(null)}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a192f',
  },
  header: {
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#081426',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  badgeWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fb7185',
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarWrapper: {
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  tabBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  tabItemActive: {
    backgroundColor: '#0284c7',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 13,
    color: '#ffffff',
  },
  body: {
    flex: 1,
    padding: 16,
  },
  revenueCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  revLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  revAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 6,
  },
  revSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  kpiSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  quickActionsSection: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  quickBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 10,
  },
  quickBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  quickBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 10,
  },
  quickBtnSecondaryText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionBarTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  addSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284c7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addSmallBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  filterPillActive: {
    backgroundColor: '#38bdf8',
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  filterTextActive: {
    color: '#0f172a',
  },
  adminCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  adminCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  adminCardId: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
    marginBottom: 2,
  },
  adminCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  priceTag: {
    fontSize: 15,
    fontWeight: '900',
    color: '#38bdf8',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTagConfirmed: {
    backgroundColor: '#065f46',
  },
  statusTagPending: {
    backgroundColor: '#78350f',
  },
  statusTagCancelled: {
    backgroundColor: '#7f1d1d',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  adminCardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  metaVal: {
    fontWeight: '700',
    color: '#ffffff',
  },
  metaValHighlight: {
    fontWeight: '800',
    color: '#38bdf8',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  viewBillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  viewBillBtnText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f87171',
  },
  cancelBtnText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  guideEmail: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  guideMetaGrid: {
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    marginBottom: 8,
  },
  guideMetaItem: {
    fontSize: 11,
    color: '#94a3b8',
  },
  rolePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rolePillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  userBottomRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  emptyWrap: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 4,
    marginTop: 8,
  },
  formInput: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalSubmitBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});

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
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Globe2,
  Users,
  UserCheck,
  Package,
  BookOpenCheck,
  CircleDollarSign,
  CreditCard,
  WalletCards,
  CalendarDays,
  ShieldCheck,
  ShieldAlert,
  LayoutDashboard,
  Plus,
  X,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  FileText,
  MapPinned,
  BadgeDollarSign,
  ChevronRight,
  TrendingUp,
  MapPin,
  Check,
  Award,
  Calendar,
  Compass,
  Bell,
  Trash,
  Pencil,
  KeyRound,
  ChevronDown,
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
  const { token, user, updateUser } = useAuth();
  const { formatPrice } = useCurrency();

  // Navigation State (Matching Web Sidebar/TopNav)
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');

  // Core Data States (100% Preserved)
  const [stats, setStats] = useState<ApiAdminStats | null>(null);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [packages, setPackages] = useState<ApiPackage[]>([]);
  const [destinations, setDestinations] = useState<ApiDestination[]>([]);
  const [guides, setGuides] = useState<ApiUser[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [travelPlans, setTravelPlans] = useState<ApiTravelPlan[]>([]);

  // UI / Filter States (100% Preserved)
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingFilter, setBookingFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'>('ALL');
  const [guideFilter, setGuideFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('PENDING');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'USER' | 'GUIDE' | 'ADMIN'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING' | 'FAILED'>('ALL');
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<ApiBooking | null>(null);

  // Admin Profile Modals & Form State (Matching Web)
  const [showProfileActionsModal, setShowProfileActionsModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileMobile, setProfileMobile] = useState(user?.mobile || '');
  const [profileCountry, setProfileCountry] = useState(user?.country || 'Sri Lanka');
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Sub-modal creation sheets (100% Preserved)
  const [showNewPackageModal, setShowNewPackageModal] = useState(false);
  const [showNewDestModal, setShowNewDestModal] = useState(false);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);

  // New Package Form State (100% Preserved)
  const [pkgTitle, setPkgTitle] = useState('');
  const [pkgDestination, setPkgDestination] = useState('');
  const [pkgCountry, setPkgCountry] = useState('Sri Lanka');
  const [pkgDuration, setPkgDuration] = useState('3 Days / 2 Nights');
  const [pkgPrice, setPkgPrice] = useState('450');
  const [pkgCategory, setPkgCategory] = useState('Adventure');
  const [pkgDescription, setPkgDescription] = useState('');

  // New Destination Form State (100% Preserved)
  const [destName, setDestName] = useState('');
  const [destCountry, setDestCountry] = useState('Sri Lanka');
  const [destBestTime, setDestBestTime] = useState('November to April');
  const [destDescription, setDestDescription] = useState('');

  // New Travel Plan Form State (100% Preserved)
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
  // ACTIONS: BOOKINGS (100% Preserved Logic)
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
  // ACTIONS: PACKAGES (100% Preserved Logic)
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
  // ACTIONS: DESTINATIONS (100% Preserved Logic)
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
  // ACTIONS: GUIDES (100% Preserved Logic)
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
  // ACTIONS: USERS (100% Preserved Logic)
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
  // ACTIONS: TRAVEL PLANS (100% Preserved Logic)
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
  // ACTIONS: ADMIN PROFILE & SECURITY (Matching Web)
  // ==========================================
  const handleOpenEditProfile = () => {
    setProfileName(user?.name || '');
    setProfileMobile(user?.mobile || '');
    setProfileCountry(user?.country || 'Sri Lanka');
    setShowProfileActionsModal(false);
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = async () => {
    if (!token) return;
    if (!profileName.trim()) {
      Alert.alert('Required', 'Please enter your administrator name.');
      return;
    }
    setProfileSaving(true);
    try {
      const res = await api.updateMyProfile(
        {
          name: profileName.trim(),
          mobile: profileMobile.trim(),
          country: profileCountry.trim(),
        },
        token
      );
      if (res.user) {
        await updateUser(res.user);
      } else {
        await updateUser({
          name: profileName.trim(),
          mobile: profileMobile.trim(),
          country: profileCountry.trim(),
        });
      }
      setShowEditProfileModal(false);
      Alert.alert('Success! 🎉', 'Administrator profile updated successfully.');
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleOpenChangePassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowProfileActionsModal(false);
    setShowChangePasswordModal(true);
  };

  const handleChangePassword = async () => {
    if (!token) return;
    if (!currentPassword) {
      Alert.alert('Required', 'Please enter your current administrator password.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Password Length', 'New password must have at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New password and confirmation password do not match.');
      return;
    }
    setPasswordSaving(true);
    try {
      await api.changeMyPassword({ currentPassword, newPassword }, token);
      setShowChangePasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Security Updated! 🔒', 'Administrator password has been successfully changed.');
    } catch (err: any) {
      Alert.alert('Change Failed', err.message || 'Could not change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  // ==========================================
  // FILTERED DATASETS (100% Preserved Logic)
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
        p.title.toLowerCase().includes(q) ||
        p.destination.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [packages, searchQuery]);

  const filteredDestinations = useMemo(() => {
    return destinations.filter((d) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return d.name.toLowerCase().includes(q) || d.country.toLowerCase().includes(q);
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
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.city || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [guides, guideFilter, searchQuery]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesFilter = userRoleFilter === 'ALL' || u.role === userRoleFilter;
      const matchesSearch =
        !searchQuery ||
        (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.publicId || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
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

  // ==========================================
  // WEB DASHBOARD CALCULATED METRICS
  // ==========================================
  const totalUsers = stats?.totalUsers ?? users.length;
  const totalGuides = stats?.totalGuides ?? guides.length;
  const totalPackages = stats?.totalPackages ?? packages.length;
  const totalBookings = stats?.totalBookings ?? bookings.length;
  const totalPayments = stats?.totalPayments ?? payments.length;
  const totalAccounts = stats?.totalAccounts ?? (totalUsers + totalGuides);
  const totalRevenue = stats?.totalRevenue ?? 0;
  const confirmedBookings = stats?.confirmedBookings ?? bookings.filter((b) => b.status === 'CONFIRMED').length;
  const pendingBookings = stats?.pendingBookings ?? bookings.filter((b) => b.status === 'PENDING').length;
  const approvedGuides = stats?.approvedGuides ?? guides.filter((g) => g.guideStatus === 'APPROVED').length;
  const pendingGuides = stats?.pendingGuides ?? guides.filter((g) => g.guideStatus === 'PENDING').length;
  const averagePayment = totalPayments > 0 ? Math.round(totalRevenue / totalPayments) : 0;

  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Exactly matching the 8 Web Summary Cards
  const summaryCards = [
    {
      title: 'Total Accounts',
      value: totalAccounts,
      subtitle: 'Platform members',
      icon: Users,
      trend: '+ Active',
      color: '#ea580c',
      bg: '#fff7ed',
      tab: 'USERS' as TabType,
    },
    {
      title: 'Travellers',
      value: totalUsers,
      subtitle: 'Registered users',
      icon: Globe2,
      trend: 'Users',
      color: '#2563eb',
      bg: '#eff6ff',
      tab: 'USERS' as TabType,
    },
    {
      title: 'Tour Guides',
      value: totalGuides,
      subtitle: `${pendingGuides} pending`,
      icon: UserCheck,
      trend: `${approvedGuides} approved`,
      color: '#db2777',
      bg: '#fdf2f8',
      tab: 'GUIDES' as TabType,
    },
    {
      title: 'Packages',
      value: totalPackages,
      subtitle: 'Travel packages',
      icon: Package,
      trend: 'Available',
      color: '#059669',
      bg: '#ecfdf5',
      tab: 'PACKAGES' as TabType,
    },
    {
      title: 'Bookings',
      value: totalBookings,
      subtitle: `${pendingBookings} pending`,
      icon: BookOpenCheck,
      trend: `${confirmedBookings} confirmed`,
      color: '#7c3aed',
      bg: '#f5f3ff',
      tab: 'BOOKINGS' as TabType,
    },
    {
      title: 'Revenue',
      value: formatPrice(totalRevenue),
      subtitle: `${totalPayments} completed`,
      icon: CircleDollarSign,
      trend: 'Total',
      color: '#0891b2',
      bg: '#ecfeff',
      tab: 'PAYMENTS' as TabType,
    },
    {
      title: 'Payments',
      value: totalPayments,
      subtitle: 'Successful records',
      icon: CreditCard,
      trend: 'Processed',
      color: '#e11d48',
      bg: '#fff1f2',
      tab: 'PAYMENTS' as TabType,
    },
    {
      title: 'Avg. Payment',
      value: formatPrice(averagePayment),
      subtitle: 'Average transaction',
      icon: WalletCards,
      trend: 'Average',
      color: '#334155',
      bg: '#f1f5f9',
      tab: 'PAYMENTS' as TabType,
    },
  ];

  // Exactly matching the Web Navigation Items
  const navTabs: { id: TabType; label: string; icon: any; count?: number }[] = [
    { id: 'OVERVIEW', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'BOOKINGS', label: 'Bookings', icon: BookOpenCheck, count: bookings.length },
    { id: 'PACKAGES', label: 'Packages', icon: Package, count: packages.length },
    { id: 'DESTINATIONS', label: 'Destinations', icon: MapPinned, count: destinations.length },
    { id: 'GUIDES', label: 'Guides', icon: UserCheck, count: pendingGuides },
    { id: 'USERS', label: 'Users', icon: Users, count: users.length },
    { id: 'PAYMENTS', label: 'Payments', icon: CreditCard, count: payments.length },
    { id: 'PLANS', label: 'Travel Plans', icon: BadgeDollarSign, count: travelPlans.length },
  ];

  const insets = useSafeAreaInsets();
  const topSafeArea = Math.max(insets.top, Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 24));
  const bottomSafeArea = Math.max(insets.bottom, 16);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={[styles.container, { paddingBottom: bottomSafeArea }]}>
        {/* ========================================================
            TOP BAR (Safe Inset Padded - Well Clear of Status Bar Icons)
            ======================================================== */}
        <View style={[styles.topbarWrapper, { paddingTop: topSafeArea }]}>
          <View style={styles.topbar}>
            <View style={styles.topbarLeft}>
              <View style={styles.logoBadge}>
                <Globe2 size={18} color="#ffffff" />
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.brandTitle}>Global</Text>
                  <Text style={[styles.brandTitle, { color: '#10b981' }]}>Vista</Text>
                </View>
                <Text style={styles.brandSub}>ADMIN COMMAND CENTER</Text>
              </View>
            </View>

            <View style={styles.topbarRight}>
              <TouchableOpacity
                style={styles.adminUserPill}
                onPress={() => setShowProfileActionsModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.adminAvatar}>
                  <Text style={styles.adminAvatarText}>
                    {(user?.name || 'A').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.adminUserName} numberOfLines={1}>
                    {user?.name || 'Admin'}
                  </Text>
                  <Text style={styles.adminUserRole}>Administrator</Text>
                </View>
                <ChevronDown size={12} color="#64748b" style={{ marginLeft: 2 }} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeCircleBtn} onPress={onClose} activeOpacity={0.7}>
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ========================================================
            TAB NAVIGATION BAR (Matching Web TopNav with Emerald Active State)
            ======================================================== */}
        <View style={styles.tabBarWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBar}
          >
            {navTabs.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.tabItem, isActive && styles.tabItemActive]}
                  onPress={() => {
                    setActiveTab(item.id);
                    setSearchQuery('');
                  }}
                  activeOpacity={0.8}
                >
                  <Icon size={14} color={isActive ? '#ffffff' : '#64748b'} />
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {item.label}
                  </Text>
                  {typeof item.count === 'number' && item.count > 0 && (
                    <View
                      style={[
                        styles.tabCountBadge,
                        isActive ? styles.tabCountBadgeActive : styles.tabCountBadgeInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabCountBadgeText,
                          isActive ? styles.tabCountBadgeTextActive : styles.tabCountBadgeTextInactive,
                        ]}
                      >
                        {item.count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Global Search Bar (for tabs other than Overview) */}
        {activeTab !== 'OVERVIEW' && (
          <View style={styles.searchBarWrap}>
            <Search size={16} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search in ${activeTab.toLowerCase()}...`}
              placeholderTextColor="#94a3b8"
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
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadAllAdminData();
              }}
              tintColor="#10b981"
            />
          }
        >
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 40 }} />
          ) : activeTab === 'OVERVIEW' ? (
            /* ========================================================
               MODULE 1: OVERVIEW & ANALYTICS (EXACT WEB MATCH)
               ======================================================== */
            <View>
              {/* Welcome Section */}
              <View style={styles.welcomeCard}>
                <View style={styles.welcomeRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.welcomeBadge}>
                      <ShieldCheck size={11} color="#10b981" />
                      <Text style={styles.welcomeBadgeText}>ADMIN DASHBOARD</Text>
                    </View>
                    <Text style={styles.welcomeTitle}>
                      Welcome Back, <Text style={styles.welcomeTitleBold}>{user?.name || 'Admin'}</Text>
                    </Text>
                    <Text style={styles.welcomeSubtitle}>
                      Here&apos;s what&apos;s happening with GlobalVista today.
                    </Text>
                  </View>

                  <View style={styles.welcomeMeta}>
                    <View style={styles.datePill}>
                      <CalendarDays size={13} color="#64748b" />
                      <Text style={styles.datePillText}>{today}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.refreshBtn}
                      onPress={() => {
                        setRefreshing(true);
                        loadAllAdminData();
                      }}
                      disabled={refreshing}
                      activeOpacity={0.7}
                    >
                      <RefreshCw size={12} color="#059669" />
                      <Text style={styles.refreshBtnText}>{refreshing ? 'Updating...' : 'Refresh'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* The 8 Signature Web Summary Cards Grid */}
              <View style={styles.summaryGrid}>
                {summaryCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <TouchableOpacity
                      key={item.title}
                      style={styles.summaryCard}
                      onPress={() => {
                        setActiveTab(item.tab);
                        setSearchQuery('');
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.summaryCardTop}>
                        <View style={[styles.summaryIconWrap, { backgroundColor: item.bg }]}>
                          <Icon size={18} color={item.color} />
                        </View>
                        <View style={styles.summaryTrendBadge}>
                          <Text style={styles.summaryTrendText}>{item.trend}</Text>
                        </View>
                      </View>

                      <Text style={styles.summaryValue} numberOfLines={1}>
                        {item.value}
                      </Text>
                      <Text style={styles.summaryTitle}>{item.title}</Text>
                      <Text style={styles.summarySubtitle} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Quick Admin Creation Shortcuts (Web Style) */}
              <View style={styles.quickShortcutsCard}>
                <View style={styles.quickShortcutsHeader}>
                  <Text style={styles.quickShortcutsTitle}>QUICK CREATION SHORTCUTS</Text>
                  <Text style={styles.quickShortcutsSub}>Instant catalog & itinerary deployment</Text>
                </View>

                <View style={styles.quickShortcutsRow}>
                  <TouchableOpacity
                    style={styles.quickShortcutPrimary}
                    onPress={() => setShowNewPackageModal(true)}
                    activeOpacity={0.85}
                  >
                    <Plus size={15} color="#ffffff" />
                    <Text style={styles.quickShortcutPrimaryText}>New Package</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickShortcutSecondary}
                    onPress={() => setShowNewDestModal(true)}
                    activeOpacity={0.85}
                  >
                    <Plus size={15} color="#059669" />
                    <Text style={styles.quickShortcutSecondaryText}>New Haven</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickShortcutTertiary}
                    onPress={() => setShowNewPlanModal(true)}
                    activeOpacity={0.85}
                  >
                    <Plus size={15} color="#7c3aed" />
                    <Text style={styles.quickShortcutTertiaryText}>New Tier</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Recent Bookings Quick Preview */}
              <View style={styles.recentSection}>
                <View style={styles.recentSectionHeader}>
                  <Text style={styles.recentSectionTitle}>Recent Bookings</Text>
                  <TouchableOpacity onPress={() => setActiveTab('BOOKINGS')}>
                    <Text style={styles.recentViewAll}>View all ({bookings.length})</Text>
                  </TouchableOpacity>
                </View>

                {bookings.slice(0, 3).map((b) => {
                  const pkgTitle = typeof b.packageId === 'object' ? (b.packageId as any).title : 'Expedition';
                  const isConfirmed = b.status === 'CONFIRMED';
                  return (
                    <View key={b._id} style={styles.recentCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.recentCardTitle} numberOfLines={1}>{pkgTitle}</Text>
                        <Text style={styles.recentCardMeta}>{b.travelDate} · {b.numberOfPeople} Guests · {formatPrice(b.totalPrice)}</Text>
                      </View>
                      <View style={[styles.statusBadge, isConfirmed ? styles.statusBadgeConfirmed : styles.statusBadgePending]}>
                        <Text style={[styles.statusBadgeText, isConfirmed ? styles.statusBadgeTextConfirmed : styles.statusBadgeTextPending]}>
                          {b.status}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : activeTab === 'BOOKINGS' ? (
            /* ========================================================
               MODULE 2: BOOKINGS MANAGEMENT (EXACT WEB MATCH)
               ======================================================== */
            <View>
              {/* Filter Pills */}
              <View style={styles.filterRow}>
                {(['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED'] as const).map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterPill, bookingFilter === f && styles.filterPillActive]}
                    onPress={() => setBookingFilter(f)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterText, bookingFilter === f && styles.filterTextActive]}>
                      {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {filteredBookings.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No matching bookings found.</Text>
                </View>
              ) : (
                filteredBookings.map((b) => {
                  const pkgTitle = typeof b.packageId === 'object' ? (b.packageId as any).title : 'Expedition';
                  const isPending = b.status === 'PENDING';
                  const isConfirmed = b.status === 'CONFIRMED';
                  return (
                    <View key={b._id} style={styles.adminItemCard}>
                      <View style={styles.itemCardTop}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={styles.itemIdTag}>#{String(b._id || '').slice(-6).toUpperCase()}</Text>
                          <Text style={styles.itemTitle} numberOfLines={1}>{pkgTitle}</Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            isConfirmed
                              ? styles.statusBadgeConfirmed
                              : isPending
                              ? styles.statusBadgePending
                              : styles.statusBadgeCancelled,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              isConfirmed
                                ? styles.statusBadgeTextConfirmed
                                : isPending
                                ? styles.statusBadgeTextPending
                                : styles.statusBadgeTextCancelled,
                            ]}
                          >
                            {b.status}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.itemMetaGrid}>
                        <View style={styles.itemMetaCol}>
                          <Text style={styles.metaLabel}>Date</Text>
                          <Text style={styles.metaVal}>{b.travelDate}</Text>
                        </View>
                        <View style={styles.itemMetaCol}>
                          <Text style={styles.metaLabel}>Guests</Text>
                          <Text style={styles.metaVal}>{b.numberOfPeople} Persons</Text>
                        </View>
                        <View style={styles.itemMetaCol}>
                          <Text style={styles.metaLabel}>Total</Text>
                          <Text style={[styles.metaVal, { color: '#059669', fontWeight: '800' }]}>
                            {formatPrice(b.totalPrice)}
                          </Text>
                        </View>
                        <View style={styles.itemMetaCol}>
                          <Text style={styles.metaLabel}>Payment</Text>
                          <Text style={styles.metaVal}>{b.paymentStatus || 'UNPAID'}</Text>
                        </View>
                      </View>

                      <View style={styles.itemActionRow}>
                        <TouchableOpacity
                          style={styles.viewBillBtn}
                          onPress={() => setSelectedInvoiceBooking(b)}
                          activeOpacity={0.8}
                        >
                          <FileText size={13} color="#2563eb" />
                          <Text style={styles.viewBillBtnText}>View Bill</Text>
                        </TouchableOpacity>

                        {isPending && (
                          <TouchableOpacity
                            style={styles.confirmBtn}
                            onPress={() => handleUpdateBooking(b._id, 'CONFIRMED')}
                            activeOpacity={0.8}
                          >
                            <Check size={13} color="#ffffff" />
                            <Text style={styles.confirmBtnText}>Confirm</Text>
                          </TouchableOpacity>
                        )}

                        {b.status !== 'CANCELLED' && (
                          <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => handleUpdateBooking(b._id, 'CANCELLED')}
                            activeOpacity={0.8}
                          >
                            <X size={13} color="#dc2626" />
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => handleDeleteBooking(b._id)}
                          activeOpacity={0.7}
                        >
                          <Trash size={15} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          ) : activeTab === 'PACKAGES' ? (
            /* ========================================================
               MODULE 3: PACKAGES MANAGEMENT (EXACT WEB MATCH)
               ======================================================== */
            <View>
              <View style={styles.sectionTitleRow}>
                <View>
                  <Text style={styles.sectionHeaderTitle}>Expedition Packages</Text>
                  <Text style={styles.sectionHeaderSubtitle}>All active travel catalog entries</Text>
                </View>
                <TouchableOpacity
                  style={styles.createPillBtn}
                  onPress={() => setShowNewPackageModal(true)}
                  activeOpacity={0.85}
                >
                  <Plus size={14} color="#ffffff" />
                  <Text style={styles.createPillBtnText}>Add Package</Text>
                </TouchableOpacity>
              </View>

              {filteredPackages.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No packages matching your search.</Text>
                </View>
              ) : (
                filteredPackages.map((pkg) => {
                  const isAvailable = pkg.availability !== false;
                  return (
                    <View key={pkg._id} style={styles.adminItemCard}>
                      <View style={styles.itemCardTop}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={styles.itemTitle}>{pkg.title}</Text>
                          <Text style={styles.itemSubtitle}>
                            📍 {pkg.destination}, {pkg.country} · {pkg.duration}
                          </Text>
                        </View>
                        <Text style={styles.priceHighlight}>{formatPrice(pkg.price)}</Text>
                      </View>

                      <View style={styles.packageBottomRow}>
                        <View style={styles.availabilityToggle}>
                          <Text style={[styles.availabilityText, { color: isAvailable ? '#059669' : '#dc2626' }]}>
                            {isAvailable ? 'Active in Catalog' : 'Hidden'}
                          </Text>
                          <Switch
                            value={isAvailable}
                            onValueChange={() => handleTogglePackageAvailability(pkg)}
                            trackColor={{ false: '#e2e8f0', true: '#a7f3d0' }}
                            thumbColor={isAvailable ? '#10b981' : '#94a3b8'}
                          />
                        </View>

                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => handleDeletePackage(pkg._id, pkg.title)}
                          activeOpacity={0.7}
                        >
                          <Trash size={15} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          ) : activeTab === 'DESTINATIONS' ? (
            /* ========================================================
               MODULE 4: DESTINATIONS MANAGEMENT (EXACT WEB MATCH)
               ======================================================== */
            <View>
              <View style={styles.sectionTitleRow}>
                <View>
                  <Text style={styles.sectionHeaderTitle}>Sanctuaries & Destinations</Text>
                  <Text style={styles.sectionHeaderSubtitle}>Curated havens across the globe</Text>
                </View>
                <TouchableOpacity
                  style={styles.createPillBtn}
                  onPress={() => setShowNewDestModal(true)}
                  activeOpacity={0.85}
                >
                  <Plus size={14} color="#ffffff" />
                  <Text style={styles.createPillBtnText}>Add Haven</Text>
                </TouchableOpacity>
              </View>

              {filteredDestinations.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No destinations found.</Text>
                </View>
              ) : (
                filteredDestinations.map((d) => (
                  <View key={d._id} style={styles.adminItemCard}>
                    <View style={styles.itemCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{d.name}</Text>
                        <Text style={styles.itemSubtitle}>
                          🌏 {d.country} · ⭐ {d.rating || 4.8} / 5
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteDestination(d._id, d.name)}
                        activeOpacity={0.7}
                      >
                        <Trash size={15} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.destinationBestTime} numberOfLines={2}>
                      Best Time: <Text style={styles.metaVal}>{d.bestTimeToVisit || 'Year-round'}</Text>
                    </Text>
                  </View>
                ))
              )}
            </View>
          ) : activeTab === 'GUIDES' ? (
            /* ========================================================
               MODULE 5: TOUR GUIDES (EXACT WEB MATCH)
               ======================================================== */
            <View>
              <View style={styles.filterRow}>
                {(['PENDING', 'APPROVED', 'ALL'] as const).map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterPill, guideFilter === f && styles.filterPillActive]}
                    onPress={() => setGuideFilter(f)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterText, guideFilter === f && styles.filterTextActive]}>
                      {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {filteredGuides.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No {guideFilter.toLowerCase()} guide applications found.</Text>
                </View>
              ) : (
                filteredGuides.map((g) => {
                  const isPending = g.guideStatus === 'PENDING';
                  const isApproved = g.guideStatus === 'APPROVED';
                  return (
                    <View key={g._id || g.id} style={styles.adminItemCard}>
                      <View style={styles.itemCardTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemTitle}>{g.name}</Text>
                          <Text style={styles.itemSubtitle}>{g.email} · {g.mobile || 'No mobile'}</Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            isApproved ? styles.statusBadgeConfirmed : styles.statusBadgePending,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              isApproved ? styles.statusBadgeTextConfirmed : styles.statusBadgeTextPending,
                            ]}
                          >
                            {g.guideStatus || 'PENDING'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.itemMetaGrid}>
                        <View style={styles.itemMetaCol}>
                          <Text style={styles.metaLabel}>City</Text>
                          <Text style={styles.metaVal}>{g.city || 'Sri Lanka'}</Text>
                        </View>
                        <View style={styles.itemMetaCol}>
                          <Text style={styles.metaLabel}>Experience</Text>
                          <Text style={styles.metaVal}>{g.experienceYears || 1} Years</Text>
                        </View>
                        <View style={[styles.itemMetaCol, { flex: 2 }]}>
                          <Text style={styles.metaLabel}>Languages</Text>
                          <Text style={styles.metaVal} numberOfLines={1}>{g.languages?.join(', ') || 'English'}</Text>
                        </View>
                      </View>

                      {isPending && (
                        <View style={styles.itemActionRow}>
                          <TouchableOpacity
                            style={styles.confirmBtn}
                            onPress={() => handleApproveGuide(g._id || g.id)}
                            activeOpacity={0.8}
                          >
                            <Check size={13} color="#ffffff" />
                            <Text style={styles.confirmBtnText}>Approve Guide</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => handleRejectGuide(g._id || g.id)}
                            activeOpacity={0.8}
                          >
                            <X size={13} color="#dc2626" />
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
            /* ========================================================
               MODULE 6: USERS & ACCOUNTS (EXACT WEB MATCH)
               ======================================================== */
            <View>
              <View style={styles.filterRow}>
                {(['ALL', 'USER', 'GUIDE', 'ADMIN'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.filterPill, userRoleFilter === r && styles.filterPillActive]}
                    onPress={() => setUserRoleFilter(r)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterText, userRoleFilter === r && styles.filterTextActive]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {filteredUsers.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No registered accounts found.</Text>
                </View>
              ) : (
                filteredUsers.map((u) => {
                  const roleBg =
                    u.role === 'ADMIN'
                      ? '#f5f3ff'
                      : u.role === 'GUIDE'
                      ? '#fffbeb'
                      : '#eff6ff';
                  const roleColor =
                    u.role === 'ADMIN'
                      ? '#7c3aed'
                      : u.role === 'GUIDE'
                      ? '#d97706'
                      : '#2563eb';
                  return (
                    <View key={u._id || u.id} style={styles.adminItemCard}>
                      <View style={styles.itemCardTop}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.itemTitle}>{u.name || 'Anonymous'}</Text>
                            <View style={[styles.roleTag, { backgroundColor: roleBg }]}>
                              <Text style={[styles.roleTagText, { color: roleColor }]}>{u.role}</Text>
                            </View>
                          </View>
                          <Text style={styles.itemSubtitle}>{u.email}</Text>
                        </View>
                        {u.role !== 'ADMIN' && (
                          <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => handleDeleteUser(u._id || u.id, u.email)}
                            activeOpacity={0.7}
                          >
                            <Trash size={15} color="#ef4444" />
                          </TouchableOpacity>
                        )}
                      </View>

                      <View style={styles.itemMetaGrid}>
                        <View style={styles.itemMetaCol}>
                          <Text style={styles.metaLabel}>ID</Text>
                          <Text style={styles.metaVal}>{u.publicId || 'N/A'}</Text>
                        </View>
                        <View style={styles.itemMetaCol}>
                          <Text style={styles.metaLabel}>Phone</Text>
                          <Text style={styles.metaVal}>{u.mobile || 'None'}</Text>
                        </View>
                        <View style={styles.itemMetaCol}>
                          <Text style={styles.metaLabel}>Country</Text>
                          <Text style={styles.metaVal}>{u.country || 'Sri Lanka'}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          ) : activeTab === 'PAYMENTS' ? (
            /* ========================================================
               MODULE 7: PAYMENTS (EXACT WEB MATCH)
               ======================================================== */
            <View>
              <View style={styles.filterRow}>
                {(['ALL', 'COMPLETED', 'PENDING', 'FAILED'] as const).map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterPill, paymentFilter === f && styles.filterPillActive]}
                    onPress={() => setPaymentFilter(f)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterText, paymentFilter === f && styles.filterTextActive]}>
                      {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {filteredPayments.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No transactions recorded.</Text>
                </View>
              ) : (
                filteredPayments.map((p) => {
                  const isSuccess = p.status === 'COMPLETED';
                  const userEmail = typeof p.userId === 'object' ? (p.userId as any)?.email : 'Customer';
                  return (
                    <View key={p._id} style={styles.adminItemCard}>
                      <View style={styles.itemCardTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemIdTag}>TX #{String(p._id || '').slice(-8).toUpperCase()}</Text>
                          <Text style={styles.priceHighlight}>{formatPrice(p.amount || 0)}</Text>
                          <Text style={styles.itemSubtitle}>
                            Method: {p.paymentMethod || 'Credit Card'}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            isSuccess
                              ? styles.statusBadgeConfirmed
                              : p.status === 'PENDING'
                              ? styles.statusBadgePending
                              : styles.statusBadgeCancelled,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              isSuccess
                                ? styles.statusBadgeTextConfirmed
                                : p.status === 'PENDING'
                                ? styles.statusBadgeTextPending
                                : styles.statusBadgeTextCancelled,
                            ]}
                          >
                            {p.status}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.itemMetaGrid}>
                        <View style={[styles.itemMetaCol, { flex: 2 }]}>
                          <Text style={styles.metaLabel}>Customer</Text>
                          <Text style={styles.metaVal} numberOfLines={1}>{userEmail}</Text>
                        </View>
                        <View style={styles.itemMetaCol}>
                          <Text style={styles.metaLabel}>Date</Text>
                          <Text style={styles.metaVal}>
                            {new Date(p.createdAt || Date.now()).toLocaleDateString('en-GB')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          ) : (
            /* ========================================================
               MODULE 8: TRAVEL PLANS & TIERS (EXACT WEB MATCH)
               ======================================================== */
            <View>
              <View style={styles.sectionTitleRow}>
                <View>
                  <Text style={styles.sectionHeaderTitle}>Service Tier Packages</Text>
                  <Text style={styles.sectionHeaderSubtitle}>Exclusive membership concierge tiers</Text>
                </View>
                <TouchableOpacity
                  style={styles.createPillBtn}
                  onPress={() => setShowNewPlanModal(true)}
                  activeOpacity={0.85}
                >
                  <Plus size={14} color="#ffffff" />
                  <Text style={styles.createPillBtnText}>Add Tier</Text>
                </TouchableOpacity>
              </View>

              {travelPlans.map((tp) => (
                <View key={tp._id} style={styles.adminItemCard}>
                  <View style={styles.itemCardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{tp.name} Plan</Text>
                      <Text style={styles.priceHighlight}>
                        {formatPrice(tp.price)}{' '}
                        <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '500' }}>
                          {tp.priceSuffix || '/ person'}
                        </Text>
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteTravelPlan(tp._id, tp.name)}
                      activeOpacity={0.7}
                    >
                      <Trash size={15} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                  <View style={{ gap: 4, marginTop: 8 }}>
                    {tp.features?.map((f, idx) => (
                      <Text key={idx} style={styles.planFeatureItem}>
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

        {/* ========================================================
           CREATION MODAL 1: NEW PACKAGE (Clean Web Style)
           ======================================================== */}
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
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Package Title *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Ella Scenic Highlands Adventure"
                  placeholderTextColor="#94a3b8"
                  value={pkgTitle}
                  onChangeText={setPkgTitle}
                />

                <Text style={styles.inputLabel}>Destination *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Ella"
                  placeholderTextColor="#94a3b8"
                  value={pkgDestination}
                  onChangeText={setPkgDestination}
                />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Country</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Sri Lanka"
                      placeholderTextColor="#94a3b8"
                      value={pkgCountry}
                      onChangeText={setPkgCountry}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Duration</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="3 Days / 2 Nights"
                      placeholderTextColor="#94a3b8"
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
                      placeholderTextColor="#94a3b8"
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
                      placeholderTextColor="#94a3b8"
                      value={pkgCategory}
                      onChangeText={setPkgCategory}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, { height: 70 }]}
                  placeholder="Enter details about this expedition..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  value={pkgDescription}
                  onChangeText={setPkgDescription}
                />
              </ScrollView>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleCreatePackage}
                activeOpacity={0.85}
              >
                <Text style={styles.modalSubmitBtnText}>Publish Package</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ========================================================
           CREATION MODAL 2: NEW DESTINATION (Clean Web Style)
           ======================================================== */}
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
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Destination Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Mirissa"
                  placeholderTextColor="#94a3b8"
                  value={destName}
                  onChangeText={setDestName}
                />

                <Text style={styles.inputLabel}>Country</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Sri Lanka"
                  placeholderTextColor="#94a3b8"
                  value={destCountry}
                  onChangeText={setDestCountry}
                />

                <Text style={styles.inputLabel}>Best Time to Visit</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. November to April"
                  placeholderTextColor="#94a3b8"
                  value={destBestTime}
                  onChangeText={setDestBestTime}
                />

                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, { height: 70 }]}
                  placeholder="Brief summary of sights and attractions..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  value={destDescription}
                  onChangeText={setDestDescription}
                />
              </ScrollView>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleCreateDestination}
                activeOpacity={0.85}
              >
                <Text style={styles.modalSubmitBtnText}>Add Destination</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ========================================================
           CREATION MODAL 3: NEW TRAVEL PLAN (Clean Web Style)
           ======================================================== */}
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
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Tier Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. VIP Concierge"
                  placeholderTextColor="#94a3b8"
                  value={planName}
                  onChangeText={setPlanName}
                />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Price (USD) *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="499"
                      placeholderTextColor="#94a3b8"
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
                      placeholderTextColor="#94a3b8"
                      value={planSuffix}
                      onChangeText={setPlanSuffix}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Features (Comma-separated)</Text>
                <TextInput
                  style={[styles.formInput, { height: 70 }]}
                  placeholder="5-star hotel, Private luxury van, Chauffeur guide"
                  placeholderTextColor="#94a3b8"
                  multiline
                  value={planFeatures}
                  onChangeText={setPlanFeatures}
                />
              </ScrollView>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleCreateTravelPlan}
                activeOpacity={0.85}
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

        {/* ========================================================
           ADMIN PROFILE MODAL 1: ACTIONS SHEET (Web Menu Replica)
           ======================================================== */}
        <Modal
          visible={showProfileActionsModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowProfileActionsModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.profileActionSheet}>
              <View style={styles.profileSheetHeader}>
                <View style={styles.sheetAvatar}>
                  <Text style={styles.sheetAvatarText}>
                    {(user?.name || 'A').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetName}>{user?.name || 'Administrator'}</Text>
                  <Text style={styles.sheetEmail}>{user?.email || 'admin@globalvista.com'}</Text>
                  <View style={styles.sheetRoleTag}>
                    <Text style={styles.sheetRoleText}>MASTER ADMINISTRATOR</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setShowProfileActionsModal(false)}>
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={styles.sheetDivider} />

              <TouchableOpacity
                style={styles.sheetActionItem}
                onPress={handleOpenEditProfile}
                activeOpacity={0.75}
              >
                <View style={[styles.sheetActionIcon, { backgroundColor: '#ecfdf5' }]}>
                  <Pencil size={18} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetActionTitle}>Edit Profile Information</Text>
                  <Text style={styles.sheetActionSub}>Update your name, phone number, and country</Text>
                </View>
                <ChevronRight size={16} color="#94a3b8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetActionItem}
                onPress={handleOpenChangePassword}
                activeOpacity={0.75}
              >
                <View style={[styles.sheetActionIcon, { backgroundColor: '#eff6ff' }]}>
                  <KeyRound size={18} color="#2563eb" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetActionTitle}>Change Password</Text>
                  <Text style={styles.sheetActionSub}>Enhance administrator account security</Text>
                </View>
                <ChevronRight size={16} color="#94a3b8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setShowProfileActionsModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.sheetCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ========================================================
           ADMIN PROFILE MODAL 2: EDIT PROFILE FORM
           ======================================================== */}
        <Modal
          visible={showEditProfileModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowEditProfileModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Edit Administrator Profile</Text>
                  <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    Update your official GlobalVista identity details
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Administrator Name"
                  placeholderTextColor="#94a3b8"
                  value={profileName}
                  onChangeText={setProfileName}
                />

                <Text style={styles.inputLabel}>Contact Mobile</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="+94 77 123 4567"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  value={profileMobile}
                  onChangeText={setProfileMobile}
                />

                <Text style={styles.inputLabel}>Country of Residence</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Sri Lanka"
                  placeholderTextColor="#94a3b8"
                  value={profileCountry}
                  onChangeText={setProfileCountry}
                />
              </ScrollView>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, profileSaving && { opacity: 0.7 }]}
                onPress={handleSaveProfile}
                disabled={profileSaving}
                activeOpacity={0.85}
              >
                <Text style={styles.modalSubmitBtnText}>
                  {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ========================================================
           ADMIN PROFILE MODAL 3: CHANGE PASSWORD FORM
           ======================================================== */}
        <Modal
          visible={showChangePasswordModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowChangePasswordModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Change Admin Password</Text>
                  <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    Enter current password and set a secure new password
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowChangePasswordModal(false)}>
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Current Password *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter current password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />

                <Text style={styles.inputLabel}>New Password (Min. 8 characters) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter at least 8 characters"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />

                <Text style={styles.inputLabel}>Confirm New Password *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Confirm matching new password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </ScrollView>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, passwordSaving && { opacity: 0.7 }]}
                onPress={handleChangePassword}
                disabled={passwordSaving}
                activeOpacity={0.85}
              >
                <Text style={styles.modalSubmitBtnText}>
                  {passwordSaving ? 'Updating Password...' : 'Update Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa', // Executive Web Shell Background
  },
  /* ========================================================
     TOP BAR (Safe Inset Padded - Exact Web Topbar Match)
     ======================================================== */
  topbarWrapper: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#edf0f4',
    ...SHADOWS.small,
  },
  topbar: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  topbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#18212f',
    letterSpacing: -0.3,
  },
  brandSub: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  topbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adminUserPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  adminAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminAvatarText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
  adminUserName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#18212f',
    maxWidth: 70,
  },
  adminUserRole: {
    fontSize: 8.5,
    color: '#64748b',
    fontWeight: '600',
  },
  closeCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  /* ========================================================
     TAB NAVIGATION BAR (Exact Web Nav Pill Match)
     ======================================================== */
  tabBarWrapper: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#edf0f4',
  },
  tabBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabItemActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  tabCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  tabCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabCountBadgeInactive: {
    backgroundColor: '#e2e8f0',
  },
  tabCountBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  tabCountBadgeTextActive: {
    color: '#ffffff',
  },
  tabCountBadgeTextInactive: {
    color: '#475569',
  },

  /* ========================================================
     SEARCH BAR
     ======================================================== */
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#18212f',
    fontSize: 13,
    padding: 0,
  },

  /* ========================================================
     BODY CONTENT
     ======================================================== */
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },

  /* ========================================================
     WELCOME BANNER (Matching Web Welcome Card)
     ======================================================== */
  welcomeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#edf0f4',
    marginBottom: 14,
    ...SHADOWS.small,
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  welcomeBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.8,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#18212f',
    letterSpacing: -0.3,
  },
  welcomeTitleBold: {
    color: '#10b981',
    fontWeight: '900',
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
  },
  welcomeMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  datePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  refreshBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },

  /* ========================================================
     THE 8 WEB SUMMARY CARDS GRID
     ======================================================== */
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: '#edf0f4',
    ...SHADOWS.small,
  },
  summaryCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTrendBadge: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryTrendText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#18212f',
    letterSpacing: -0.5,
  },
  summaryTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#334155',
    marginTop: 2,
  },
  summarySubtitle: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 1,
  },

  /* ========================================================
     QUICK SHORTCUTS CARD
     ======================================================== */
  quickShortcutsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#edf0f4',
    marginBottom: 16,
    ...SHADOWS.small,
  },
  quickShortcutsHeader: {
    marginBottom: 12,
  },
  quickShortcutsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.8,
  },
  quickShortcutsSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  quickShortcutsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickShortcutPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 10,
  },
  quickShortcutPrimaryText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
  },
  quickShortcutSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 10,
  },
  quickShortcutSecondaryText: {
    color: '#059669',
    fontSize: 11.5,
    fontWeight: '800',
  },
  quickShortcutTertiary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#8b5cf6',
    paddingVertical: 10,
    borderRadius: 10,
  },
  quickShortcutTertiaryText: {
    color: '#7c3aed',
    fontSize: 11.5,
    fontWeight: '800',
  },

  /* ========================================================
     RECENT PREVIEW SECTION
     ======================================================== */
  recentSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#edf0f4',
    marginBottom: 20,
    ...SHADOWS.small,
  },
  recentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#18212f',
  },
  recentViewAll: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#10b981',
  },
  recentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  recentCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#18212f',
  },
  recentCardMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },

  /* ========================================================
     DATA TABS HEADER & FILTER PILLS
     ======================================================== */
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#18212f',
  },
  sectionHeaderSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  createPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  createPillBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterPillActive: {
    backgroundColor: '#18212f',
    borderColor: '#18212f',
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  filterTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#edf0f4',
  },
  emptyText: {
    fontSize: 12.5,
    color: '#94a3b8',
    fontWeight: '600',
  },

  /* ========================================================
     ADMIN ITEM CARD (Exact Web Table/Card Replica)
     ======================================================== */
  adminItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#edf0f4',
    ...SHADOWS.small,
  },
  itemCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemIdTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#18212f',
  },
  itemSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  priceHighlight: {
    fontSize: 15,
    fontWeight: '900',
    color: '#18212f',
  },
  itemMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  itemMetaCol: {
    flex: 1,
    minWidth: 65,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  metaVal: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#18212f',
    marginTop: 1,
  },
  itemActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  viewBillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  viewBillBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  confirmBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  packageBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  availabilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availabilityText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  destinationBestTime: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 6,
  },
  roleTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleTagText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  planFeatureItem: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
  },

  /* ========================================================
     STATUS BADGES (Web Colors)
     ======================================================== */
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeConfirmed: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  statusBadgePending: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  statusBadgeCancelled: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadgeTextConfirmed: {
    color: '#059669',
  },
  statusBadgeTextPending: {
    color: '#d97706',
  },
  statusBadgeTextCancelled: {
    color: '#e11d48',
  },

  /* ========================================================
     CREATION MODALS (Clean Web Dialog Replica)
     ======================================================== */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#edf0f4',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#18212f',
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#334155',
    marginTop: 10,
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#18212f',
  },
  modalSubmitBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  /* ========================================================
     PROFILE ACTION SHEET STYLES
     ======================================================== */
  profileActionSheet: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 20,
    ...SHADOWS.large,
  },
  profileSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetAvatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  sheetName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18212f',
  },
  sheetEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  sheetRoleTag: {
    backgroundColor: '#ecfdf5',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  sheetRoleText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: '#edf0f4',
    marginVertical: 14,
  },
  sheetActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  sheetActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetActionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#18212f',
  },
  sheetActionSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  sheetCloseBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 14,
  },
  sheetCloseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
});

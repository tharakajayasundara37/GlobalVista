import React, { useState, useEffect, useCallback } from 'react';
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
  Linking,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Compass,
  CheckCircle2,
  Clock,
  MapPin,
  Globe2,
  Award,
  MessageCircle,
  FileCheck,
  ShieldCheck,
  LayoutDashboard,
  MapPinned,
  BookOpenCheck,
  UserRound,
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  RefreshCw,
  Calendar,
  Users,
  ChevronRight,
  BadgeCheck,
  Phone,
  Mail,
  Languages as LanguagesIcon,
  Sparkles,
  ExternalLink,
  CreditCard,
  FileText,
  AlertCircle,
  Camera,
  Image as ImageIcon,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { ApiUser, ApiDestination, ApiBooking, api, normalizeMediaUrl } from '../services/api';
import { WHATSAPP_NUMBER } from '../constants/config';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { SafeImage } from './SafeImage';
import { MobileInvoiceModal } from './MobileInvoiceModal';

interface Props {
  visible: boolean;
  onClose: () => void;
  user: ApiUser | null;
}

type TabType = 'dashboard' | 'destinations' | 'bookings' | 'profile';
type DestinationFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export const MobileGuidePortal: React.FC<Props> = ({ visible, onClose, user: propUser }) => {
  const insets = useSafeAreaInsets();
  const topSafeArea = Math.max(insets.top, Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 24));

  const { user: authUser, token, updateUser } = useAuth();
  const { formatPrice } = useCurrency();

  // Use current user from auth or props
  const currentUser = authUser || propUser;

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Destinations State
  const [destinations, setDestinations] = useState<ApiDestination[]>([]);
  const [destinationsLoading, setDestinationsLoading] = useState(false);
  const [destFilter, setDestFilter] = useState<DestinationFilter>('ALL');

  // Destination Suggest / Edit Modal State
  const [showDestModal, setShowDestModal] = useState(false);
  const [editingDestId, setEditingDestId] = useState<string | null>(null);
  const [destName, setDestName] = useState('');
  const [destCountry, setDestCountry] = useState('');
  const [destDescription, setDestDescription] = useState('');
  const [destBestTime, setDestBestTime] = useState('');
  const [destBudget, setDestBudget] = useState('');
  const [destActivities, setDestActivities] = useState('');
  const [destImages, setDestImages] = useState('');
  const [destLat, setDestLat] = useState('');
  const [destLng, setDestLng] = useState('');
  const [destSaving, setDestSaving] = useState(false);

  // Bookings State
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<ApiBooking | null>(null);

  // Profile Edit Modal State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileMobile, setProfileMobile] = useState('');
  const [profileCountry, setProfileCountry] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [profileLanguages, setProfileLanguages] = useState('');
  const [profileExperience, setProfileExperience] = useState('');
  const [profileAbout, setProfileAbout] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // Change Password Modal State
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Fetch guide destinations
  const loadDestinations = useCallback(async () => {
    if (!token) return;
    setDestinationsLoading(true);
    try {
      const data = await api.getGuideDestinations(token);
      setDestinations(data);
    } catch (err) {
      console.warn('Failed to load guide destinations', err);
    } finally {
      setDestinationsLoading(false);
    }
  }, [token]);

  // Fetch guide bookings
  const loadBookings = useCallback(async () => {
    if (!token) return;
    setBookingsLoading(true);
    try {
      const data = await api.getUserBookings(token);
      setBookings(data);
    } catch (err) {
      console.warn('Failed to load guide bookings', err);
    } finally {
      setBookingsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (visible) {
      loadDestinations();
      loadBookings();
    }
  }, [visible, loadDestinations, loadBookings]);

  if (!currentUser) return null;

  const isApproved = currentUser.guideStatus === 'APPROVED';
  const isPending = currentUser.guideStatus === 'PENDING' || !currentUser.guideStatus;

  // Open WhatsApp concierge
  const openConcierge = (customMsg?: string) => {
    const msg = customMsg || `Hello Operations Desk, this is certified guide ${currentUser.name} (${currentUser.publicId || currentUser.email}). I am inquiring about my assigned expeditions.`;
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`);
  };

  // ==========================================
  // PROFILE EDIT & PHOTO HANDLERS
  // ==========================================
  const handleOpenEditProfile = () => {
    setProfileName(currentUser.name || '');
    setProfileMobile(currentUser.mobile || '');
    setProfileCountry(currentUser.country || '');
    setProfileCity(currentUser.city || '');
    setProfileLanguages(Array.isArray(currentUser.languages) ? currentUser.languages.join(', ') : '');
    setProfileExperience(currentUser.experienceYears ? String(currentUser.experienceYears) : '');
    setProfileAbout(currentUser.about || '');
    setProfileImage(currentUser.profileImage || '');
    setShowEditProfileModal(true);
  };

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Please allow gallery access to select a profile photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadSelectedImage(result.assets[0]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not pick image.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Please allow camera access to take a profile photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadSelectedImage(result.assets[0]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not take photo.');
    }
  };

  const uploadSelectedImage = async (asset: { uri: string; fileName?: string | null; mimeType?: string | null }) => {
    if (!token) return;
    setUploadingImage(true);
    try {
      const res = await api.uploadProfileImage(
        {
          uri: asset.uri,
          name: asset.fileName || 'guide-profile.jpg',
          type: asset.mimeType || 'image/jpeg',
        },
        token
      );
      const updatedUser = res.user || res;
      const newPath = updatedUser.profileImage || asset.uri;
      setProfileImage(newPath);
      await updateUser({ profileImage: newPath });
      Alert.alert('Photo Updated 🎉', 'Your guide profile photo has been updated!');
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Could not upload profile photo.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!token) return;
    if (!profileName.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name.');
      return;
    }
    setProfileSaving(true);
    try {
      const langArray = profileLanguages
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const expNum = profileExperience.trim() ? parseInt(profileExperience.trim(), 10) : undefined;

      const payload: any = {
        name: profileName.trim(),
        mobile: profileMobile.trim(),
        country: profileCountry.trim(),
        city: profileCity.trim(),
        languages: langArray.length > 0 ? langArray : undefined,
        experienceYears: isNaN(expNum as number) ? undefined : expNum,
        about: profileAbout.trim(),
      };
      if (profileImage.trim()) {
        payload.profileImage = profileImage.trim();
      }

      const res = await api.updateMyProfile(payload, token);
      const updatedData = res.user || res;

      await updateUser({
        name: updatedData.name || payload.name,
        mobile: updatedData.mobile ?? payload.mobile,
        country: updatedData.country ?? payload.country,
        city: updatedData.city ?? payload.city,
        languages: updatedData.languages ?? payload.languages,
        experienceYears: updatedData.experienceYears ?? payload.experienceYears,
        about: updatedData.about ?? payload.about,
        profileImage: updatedData.profileImage ?? (profileImage.trim() || undefined),
      });

      setShowEditProfileModal(false);
      Alert.alert('Profile Updated 🎉', 'Your Tour Guide credentials have been successfully saved.');
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update your profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // ==========================================
  // CHANGE PASSWORD HANDLERS
  // ==========================================
  const handleOpenChangePassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowChangePasswordModal(true);
  };

  const handleChangePassword = async () => {
    if (!token) return;
    if (!currentPassword) {
      Alert.alert('Validation Error', 'Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Validation Error', 'New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New password and confirmation do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      await api.changeMyPassword({ currentPassword, newPassword }, token);
      setShowChangePasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Password Changed', 'Your account password has been updated successfully.');
    } catch (err: any) {
      Alert.alert('Password Change Failed', err.message || 'Could not change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  // ==========================================
  // DESTINATION CREATE & EDIT HANDLERS
  // ==========================================
  const handleOpenAddDestination = () => {
    setEditingDestId(null);
    setDestName('');
    setDestCountry(currentUser.country || 'Sri Lanka');
    setDestDescription('');
    setDestBestTime('December to April');
    setDestBudget('LKR 10,000 - 25,000');
    setDestActivities('Scenic Photography, Hiking, Cultural Tour');
    setDestImages('');
    setDestLat('');
    setDestLng('');
    setShowDestModal(true);
  };

  const handleOpenEditDestination = (dest: ApiDestination) => {
    setEditingDestId(dest._id);
    setDestName(dest.name || '');
    setDestCountry(dest.country || '');
    setDestDescription(dest.description || '');
    setDestBestTime(dest.bestTimeToVisit || '');
    setDestBudget(dest.budget || '');
    setDestActivities(Array.isArray(dest.activities) ? dest.activities.join(', ') : '');
    setDestImages(Array.isArray(dest.images) ? dest.images.join('\n') : '');
    setDestLat(dest.latitude ? String(dest.latitude) : '');
    setDestLng(dest.longitude ? String(dest.longitude) : '');
    setShowDestModal(true);
  };

  const handleSaveDestination = async () => {
    if (!token) return;
    if (!destName.trim() || !destCountry.trim()) {
      Alert.alert('Validation Error', 'Please provide destination name and country.');
      return;
    }

    const activityList = destActivities
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const imageList = destImages
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/'));

    const lat = destLat.trim() ? parseFloat(destLat.trim()) : undefined;
    const lng = destLng.trim() ? parseFloat(destLng.trim()) : undefined;

    const payload: any = {
      name: destName.trim(),
      country: destCountry.trim(),
      description: destDescription.trim(),
      bestTimeToVisit: destBestTime.trim() || 'Year Round',
      budget: destBudget.trim() || 'Moderate',
      activities: activityList.length > 0 ? activityList : ['Sightseeing'],
      images: imageList.length > 0 ? imageList : ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'],
    };

    if (!isNaN(lat as number) && !isNaN(lng as number)) {
      payload.latitude = lat;
      payload.longitude = lng;
    }

    setDestSaving(true);
    try {
      if (editingDestId) {
        await api.updateGuideDestination(editingDestId, payload, token);
        Alert.alert('Success', 'Destination updated and resubmitted for admin review.');
      } else {
        await api.createGuideDestination(payload, token);
        Alert.alert('Destination Submitted', 'Your destination has been submitted for admin verification and review.');
      }
      setShowDestModal(false);
      await loadDestinations();
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to submit destination.');
    } finally {
      setDestSaving(false);
    }
  };

  const handleDeleteDestination = (dest: ApiDestination) => {
    Alert.alert(
      'Delete Destination',
      `Are you sure you want to delete "${dest.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            try {
              await api.deleteGuideDestination(dest._id, token);
              await loadDestinations();
              Alert.alert('Deleted', `"${dest.name}" has been deleted.`);
            } catch (err: any) {
              Alert.alert('Delete Failed', err.message || 'Could not delete destination.');
            }
          },
        },
      ]
    );
  };

  // Destination filter logic
  const filteredDestinations = destinations.filter((d) => {
    if (destFilter === 'ALL') return true;
    const status = d.approvalStatus || 'PENDING';
    return status === destFilter;
  });

  // Profile completion calculation
  const profileFields = [
    Boolean(currentUser.name?.trim()),
    Boolean(currentUser.email?.trim()),
    Boolean(currentUser.mobile?.trim()),
    Boolean(currentUser.country?.trim()),
    Boolean(currentUser.city?.trim()),
    Array.isArray(currentUser.languages) && currentUser.languages.length > 0,
    Boolean(currentUser.about?.trim()),
  ];
  const completedFieldCount = profileFields.filter(Boolean).length;
  const completionPercentage = Math.round((completedFieldCount / profileFields.length) * 100);

  // Joined year
  const joinedYear = currentUser.createdAt ? new Date(currentUser.createdAt).getFullYear() : '2024';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* ========================================================
            TOPBAR (Safe Area Clear, Web SaaS Header)
            ======================================================== */}
        <View style={[styles.topbar, { paddingTop: topSafeArea }]}>
          <View style={styles.topbarLeft}>
            <View style={styles.brandIconWrap}>
              <Compass size={20} color="#ffffff" />
            </View>
            <View>
              <Text style={styles.brandTitle}>GlobalVista</Text>
              <Text style={styles.brandSubtitle}>GUIDE PORTAL</Text>
            </View>
          </View>

          <View style={styles.topbarRight}>
            <View
              style={[
                styles.statusBadge,
                isApproved ? styles.statusBadgeApproved : styles.statusBadgePending,
              ]}
            >
              {isApproved ? (
                <BadgeCheck size={13} color="#059669" />
              ) : (
                <Clock size={13} color="#d97706" />
              )}
              <Text
                style={[
                  styles.statusBadgeText,
                  isApproved ? styles.statusBadgeTextApproved : styles.statusBadgeTextPending,
                ]}
              >
                {isApproved ? 'CERTIFIED' : 'PENDING'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.profileChip}
              onPress={() => setActiveTab('profile')}
              activeOpacity={0.8}
            >
              <View style={styles.profileAvatar}>
                {currentUser.profileImage ? (
                  <Image
                    source={{ uri: normalizeMediaUrl(currentUser.profileImage) }}
                    style={styles.profileAvatarImg}
                  />
                ) : (
                  <Text style={styles.profileAvatarText}>
                    {(currentUser.name || 'G').charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <Text style={styles.profileName} numberOfLines={1}>
                {currentUser.name ? currentUser.name.split(' ')[0] : 'Guide'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.75}>
              <X size={20} color="#475569" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ========================================================
            SEGMENTED NAVIGATION TABS (4 Core Guide Tabs)
            ======================================================== */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'dashboard' && styles.tabItemActive]}
            onPress={() => setActiveTab('dashboard')}
            activeOpacity={0.8}
          >
            <LayoutDashboard
              size={15}
              color={activeTab === 'dashboard' ? '#10b981' : '#64748b'}
            />
            <Text
              style={[styles.tabItemText, activeTab === 'dashboard' && styles.tabItemTextActive]}
            >
              Dashboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'destinations' && styles.tabItemActive]}
            onPress={() => setActiveTab('destinations')}
            activeOpacity={0.8}
          >
            <MapPinned
              size={15}
              color={activeTab === 'destinations' ? '#10b981' : '#64748b'}
            />
            <Text
              style={[
                styles.tabItemText,
                activeTab === 'destinations' && styles.tabItemTextActive,
              ]}
            >
              Destinations
            </Text>
            {destinations.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{destinations.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'bookings' && styles.tabItemActive]}
            onPress={() => setActiveTab('bookings')}
            activeOpacity={0.8}
          >
            <BookOpenCheck
              size={15}
              color={activeTab === 'bookings' ? '#10b981' : '#64748b'}
            />
            <Text
              style={[styles.tabItemText, activeTab === 'bookings' && styles.tabItemTextActive]}
            >
              Bookings
            </Text>
            {bookings.length > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: '#3b82f6' }]}>
                <Text style={styles.tabBadgeText}>{bookings.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'profile' && styles.tabItemActive]}
            onPress={() => setActiveTab('profile')}
            activeOpacity={0.8}
          >
            <UserRound
              size={15}
              color={activeTab === 'profile' ? '#10b981' : '#64748b'}
            />
            <Text
              style={[styles.tabItemText, activeTab === 'profile' && styles.tabItemTextActive]}
            >
              My Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* ========================================================
            TAB CONTENT
            ======================================================== */}
        <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
          {/* ========================================================
              TAB 1: DASHBOARD OVERVIEW
              ======================================================== */}
          {activeTab === 'dashboard' && (
            <View style={styles.tabPane}>
              {/* Welcome Card */}
              <View style={styles.welcomeBanner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.welcomeEyebrow}>GLOBALVISTA TOUR GUIDE PORTAL</Text>
                  <Text style={styles.welcomeTitle}>
                    Welcome back,{' '}
                    <Text style={{ fontWeight: '900', color: '#10b981' }}>
                      {currentUser.name || 'Tour Guide'}
                    </Text>
                  </Text>
                  <Text style={styles.welcomeSubtitle}>
                    Manage your field expeditions, proposed havens, and professional credentials.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.refreshBtn}
                  onPress={() => {
                    loadDestinations();
                    loadBookings();
                  }}
                  activeOpacity={0.75}
                >
                  <RefreshCw size={14} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Guide Status Callout Card */}
              <View
                style={[
                  styles.statusCallout,
                  isApproved ? styles.statusCalloutApproved : styles.statusCalloutPending,
                ]}
              >
                {isApproved ? (
                  <>
                    <CheckCircle2 size={24} color="#059669" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.calloutTitleApproved}>CERTIFIED LUXURY GUIDE</Text>
                      <Text style={styles.calloutSubApproved}>
                        Your field credentials are fully verified. You are authorized to lead GlobalVista expeditions.
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Clock size={24} color="#d97706" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.calloutTitlePending}>APPLICATION UNDER REVIEW</Text>
                      <Text style={styles.calloutSubPending}>
                        GlobalVista safety & operations compliance is reviewing your profile. Verification updates will appear here.
                      </Text>
                    </View>
                  </>
                )}
              </View>

              {/* 8 Signature Summary Cards (Matches Web Guide Dashboard) */}
              <View style={styles.kpiGrid}>
                {/* 1. Guide Status */}
                <View style={[styles.kpiCard, { borderLeftColor: '#10b981' }]}>
                  <View style={styles.kpiHeader}>
                    <View style={[styles.kpiIconWrap, { backgroundColor: '#ecfdf5' }]}>
                      <BadgeCheck size={18} color="#059669" />
                    </View>
                    <View style={[styles.kpiTag, { backgroundColor: '#ecfdf5' }]}>
                      <Text style={[styles.kpiTagText, { color: '#059669' }]}>STATUS</Text>
                    </View>
                  </View>
                  <Text style={styles.kpiValue}>{isApproved ? 'Approved' : 'Pending'}</Text>
                  <Text style={styles.kpiLabel}>Guide Status</Text>
                  <Text style={styles.kpiSub}>Admin verified</Text>
                </View>

                {/* 2. Experience */}
                <View style={[styles.kpiCard, { borderLeftColor: '#f59e0b' }]}>
                  <View style={styles.kpiHeader}>
                    <View style={[styles.kpiIconWrap, { backgroundColor: '#fffbeb' }]}>
                      <Award size={18} color="#d97706" />
                    </View>
                    <View style={[styles.kpiTag, { backgroundColor: '#fffbeb' }]}>
                      <Text style={[styles.kpiTagText, { color: '#d97706' }]}>EXPERIENCE</Text>
                    </View>
                  </View>
                  <Text style={styles.kpiValue}>
                    {currentUser.experienceYears || '2'} Years
                  </Text>
                  <Text style={styles.kpiLabel}>Field Experience</Text>
                  <Text style={styles.kpiSub}>Guiding in field</Text>
                </View>

                {/* 3. Languages */}
                <View style={[styles.kpiCard, { borderLeftColor: '#3b82f6' }]}>
                  <View style={styles.kpiHeader}>
                    <View style={[styles.kpiIconWrap, { backgroundColor: '#eff6ff' }]}>
                      <LanguagesIcon size={18} color="#2563eb" />
                    </View>
                    <View style={[styles.kpiTag, { backgroundColor: '#eff6ff' }]}>
                      <Text style={[styles.kpiTagText, { color: '#2563eb' }]}>LANGUAGES</Text>
                    </View>
                  </View>
                  <Text style={styles.kpiValue}>
                    {Array.isArray(currentUser.languages) && currentUser.languages.length > 0
                      ? currentUser.languages.length
                      : '2'}
                  </Text>
                  <Text style={styles.kpiLabel}>Spoken Languages</Text>
                  <Text style={styles.kpiSub}>Client communication</Text>
                </View>

                {/* 4. Profile Completion */}
                <View style={[styles.kpiCard, { borderLeftColor: '#ec4899' }]}>
                  <View style={styles.kpiHeader}>
                    <View style={[styles.kpiIconWrap, { backgroundColor: '#fdf2f8' }]}>
                      <UserRound size={18} color="#db2777" />
                    </View>
                    <View style={[styles.kpiTag, { backgroundColor: '#fdf2f8' }]}>
                      <Text style={[styles.kpiTagText, { color: '#db2777' }]}>READINESS</Text>
                    </View>
                  </View>
                  <Text style={styles.kpiValue}>{completionPercentage}%</Text>
                  <Text style={styles.kpiLabel}>Profile Completion</Text>
                  <Text style={styles.kpiSub}>{completedFieldCount} of 7 fields complete</Text>
                </View>

                {/* 5. My Destinations */}
                <TouchableOpacity
                  style={[styles.kpiCard, { borderLeftColor: '#8b5cf6' }]}
                  onPress={() => setActiveTab('destinations')}
                  activeOpacity={0.8}
                >
                  <View style={styles.kpiHeader}>
                    <View style={[styles.kpiIconWrap, { backgroundColor: '#f5f3ff' }]}>
                      <MapPinned size={18} color="#7c3aed" />
                    </View>
                    <View style={[styles.kpiTag, { backgroundColor: '#f5f3ff' }]}>
                      <Text style={[styles.kpiTagText, { color: '#7c3aed' }]}>DESTINATIONS</Text>
                    </View>
                  </View>
                  <Text style={styles.kpiValue}>{destinations.length}</Text>
                  <Text style={styles.kpiLabel}>Proposed Havens</Text>
                  <Text style={styles.kpiSub}>Tap to view list &rarr;</Text>
                </TouchableOpacity>

                {/* 6. Active Bookings */}
                <TouchableOpacity
                  style={[styles.kpiCard, { borderLeftColor: '#06b6d4' }]}
                  onPress={() => setActiveTab('bookings')}
                  activeOpacity={0.8}
                >
                  <View style={styles.kpiHeader}>
                    <View style={[styles.kpiIconWrap, { backgroundColor: '#ecfeff' }]}>
                      <BookOpenCheck size={18} color="#0891b2" />
                    </View>
                    <View style={[styles.kpiTag, { backgroundColor: '#ecfeff' }]}>
                      <Text style={[styles.kpiTagText, { color: '#0891b2' }]}>ROSTER</Text>
                    </View>
                  </View>
                  <Text style={styles.kpiValue}>{bookings.length}</Text>
                  <Text style={styles.kpiLabel}>Assigned Expeditions</Text>
                  <Text style={styles.kpiSub}>Tap to view roster &rarr;</Text>
                </TouchableOpacity>

                {/* 7. Account Role */}
                <View style={[styles.kpiCard, { borderLeftColor: '#f43f5e' }]}>
                  <View style={styles.kpiHeader}>
                    <View style={[styles.kpiIconWrap, { backgroundColor: '#fff1f2' }]}>
                      <ShieldCheck size={18} color="#e11d48" />
                    </View>
                    <View style={[styles.kpiTag, { backgroundColor: '#fff1f2' }]}>
                      <Text style={[styles.kpiTagText, { color: '#e11d48' }]}>ROLE</Text>
                    </View>
                  </View>
                  <Text style={styles.kpiValue}>Tour Guide</Text>
                  <Text style={styles.kpiLabel}>Account Type</Text>
                  <Text style={styles.kpiSub}>Official GlobalVista Guide</Text>
                </View>

                {/* 8. Registration Year */}
                <View style={[styles.kpiCard, { borderLeftColor: '#475569' }]}>
                  <View style={styles.kpiHeader}>
                    <View style={[styles.kpiIconWrap, { backgroundColor: '#f1f5f9' }]}>
                      <Calendar size={18} color="#475569" />
                    </View>
                    <View style={[styles.kpiTag, { backgroundColor: '#f1f5f9' }]}>
                      <Text style={[styles.kpiTagText, { color: '#475569' }]}>MEMBER</Text>
                    </View>
                  </View>
                  <Text style={styles.kpiValue}>{joinedYear}</Text>
                  <Text style={styles.kpiLabel}>Registered</Text>
                  <Text style={styles.kpiSub}>Certified Guide Partner</Text>
                </View>
              </View>

              {/* Quick Action Shortcuts */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Quick Management Actions</Text>
              </View>
              <View style={styles.actionGrid}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleOpenAddDestination}
                  activeOpacity={0.8}
                >
                  <View style={[styles.actionIcon, { backgroundColor: '#ecfdf5' }]}>
                    <Plus size={20} color="#059669" />
                  </View>
                  <Text style={styles.actionTitle}>+ Suggest Haven</Text>
                  <Text style={styles.actionSub}>Submit new destination for review</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setActiveTab('bookings')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.actionIcon, { backgroundColor: '#eff6ff' }]}>
                    <BookOpenCheck size={20} color="#2563eb" />
                  </View>
                  <Text style={styles.actionTitle}>Assigned Expeditions</Text>
                  <Text style={styles.actionSub}>View travellers & itinerary roster</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleOpenEditProfile}
                  activeOpacity={0.8}
                >
                  <View style={[styles.actionIcon, { backgroundColor: '#fdf2f8' }]}>
                    <Pencil size={20} color="#db2777" />
                  </View>
                  <Text style={styles.actionTitle}>Edit Guide Profile</Text>
                  <Text style={styles.actionSub}>Update languages, phone & bio</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => openConcierge()}
                  activeOpacity={0.8}
                >
                  <View style={[styles.actionIcon, { backgroundColor: '#fefce8' }]}>
                    <MessageCircle size={20} color="#d97706" />
                  </View>
                  <Text style={styles.actionTitle}>Operations Command</Text>
                  <Text style={styles.actionSub}>Direct line to Admin Concierge</Text>
                </TouchableOpacity>
              </View>

              {/* Profile Readiness Checklist Panel */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={styles.cardEyebrow}>CREDENTIAL VERIFICATION</Text>
                    <Text style={styles.cardTitle}>Profile Readiness Checklist</Text>
                  </View>
                  <View style={styles.readinessPill}>
                    <Text style={styles.readinessPillText}>{completionPercentage}% COMPLETE</Text>
                  </View>
                </View>

                <View style={styles.checklist}>
                  {[
                    { label: 'Full Name', done: Boolean(currentUser.name?.trim()) },
                    { label: 'Email Address', done: Boolean(currentUser.email?.trim()) },
                    { label: 'Contact Phone / Mobile', done: Boolean(currentUser.mobile?.trim()) },
                    { label: 'Country & Base City', done: Boolean(currentUser.country?.trim() && currentUser.city?.trim()) },
                    { label: 'Registered Languages', done: Array.isArray(currentUser.languages) && currentUser.languages.length > 0 },
                    { label: 'Guiding Bio / About', done: Boolean(currentUser.about?.trim()) },
                  ].map((item, idx) => (
                    <View style={styles.checkItem} key={idx}>
                      {item.done ? (
                        <CheckCircle2 size={16} color="#059669" />
                      ) : (
                        <Clock size={16} color="#94a3b8" />
                      )}
                      <Text style={[styles.checkLabel, item.done && styles.checkLabelDone]}>
                        {item.label}
                      </Text>
                      <Text style={[styles.checkStatus, item.done ? styles.checkStatusDone : styles.checkStatusPending]}>
                        {item.done ? 'Configured' : 'Missing'}
                      </Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.cardFooterBtn}
                  onPress={handleOpenEditProfile}
                  activeOpacity={0.8}
                >
                  <Pencil size={14} color="#10b981" />
                  <Text style={styles.cardFooterBtnText}>Complete Profile Details</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 40 }} />
            </View>
          )}

          {/* ========================================================
              TAB 2: DESTINATIONS WORKSPACE
              ======================================================== */}
          {activeTab === 'destinations' && (
            <View style={styles.tabPane}>
              {/* Workspace Header */}
              <View style={styles.headingBlock}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.workspaceEyebrow}>TOUR GUIDE HAVEN WORKSPACE</Text>
                  <Text style={styles.workspaceTitle}>My Destinations</Text>
                  <Text style={styles.workspaceSubtitle}>
                    Propose luxury havens for admin verification and public catalog display.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.addPrimaryBtn}
                  onPress={handleOpenAddDestination}
                  activeOpacity={0.85}
                >
                  <Plus size={16} color="#ffffff" />
                  <Text style={styles.addPrimaryBtnText}>Suggest Haven</Text>
                </TouchableOpacity>
              </View>

              {/* Filter Pills */}
              <View style={styles.filterRow}>
                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as DestinationFilter[]).map((f) => {
                  const count =
                    f === 'ALL'
                      ? destinations.length
                      : destinations.filter((d) => (d.approvalStatus || 'PENDING') === f).length;
                  const isActive = destFilter === f;
                  return (
                    <TouchableOpacity
                      key={f}
                      style={[styles.filterChip, isActive && styles.filterChipActive]}
                      onPress={() => setDestFilter(f)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          isActive && styles.filterChipTextActive,
                        ]}
                      >
                        {f === 'ALL' ? 'All' : f === 'PENDING' ? 'Pending' : f === 'APPROVED' ? 'Approved' : 'Rejected'} ({count})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Destinations List */}
              {destinationsLoading ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator size="large" color="#10b981" />
                  <Text style={styles.emptyStateTitle}>Loading your destinations...</Text>
                </View>
              ) : filteredDestinations.length === 0 ? (
                <View style={styles.emptyState}>
                  <MapPinned size={36} color="#94a3b8" />
                  <Text style={styles.emptyStateTitle}>No destinations found</Text>
                  <Text style={styles.emptyStateSub}>
                    {destFilter === 'ALL'
                      ? 'You have not submitted any destinations yet. Tap "+ Suggest Haven" to propose your first haven.'
                      : `No destinations matching "${destFilter}" status.`}
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyActionBtn}
                    onPress={handleOpenAddDestination}
                    activeOpacity={0.85}
                  >
                    <Plus size={16} color="#ffffff" />
                    <Text style={styles.emptyActionBtnText}>Suggest a Haven Now</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.destList}>
                  {filteredDestinations.map((dest) => {
                    const status = dest.approvalStatus || 'PENDING';
                    const isApprovedStatus = status === 'APPROVED';
                    const isPendingStatus = status === 'PENDING';
                    const isRejectedStatus = status === 'REJECTED';

                    const mainImage = Array.isArray(dest.images) && dest.images[0] ? dest.images[0] : null;

                    return (
                      <View style={styles.destCard} key={dest._id}>
                        {mainImage && (
                          <View style={styles.destMediaWrapper}>
                            <SafeImage
                              uri={mainImage}
                              keywords={dest.name || dest.country}
                              style={styles.destMediaImage}
                            />
                            <View style={styles.destMediaOverlay}>
                              <View style={styles.destCountryTag}>
                                <MapPin size={12} color="#ffffff" />
                                <Text style={styles.destCountryText}>{dest.country}</Text>
                              </View>
                              <View
                                style={[
                                  styles.destStatusTag,
                                  isApprovedStatus && styles.destStatusApproved,
                                  isPendingStatus && styles.destStatusPending,
                                  isRejectedStatus && styles.destStatusRejected,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.destStatusTagText,
                                    isApprovedStatus && styles.destStatusTextApproved,
                                    isPendingStatus && styles.destStatusTextPending,
                                    isRejectedStatus && styles.destStatusTextRejected,
                                  ]}
                                >
                                  {isApprovedStatus ? 'APPROVED' : isPendingStatus ? 'PENDING REVIEW' : 'REJECTED'}
                                </Text>
                              </View>
                            </View>
                          </View>
                        )}

                        <View style={styles.destBody}>
                          {!mainImage && (
                            <View style={styles.destHeaderNoImg}>
                              <View style={styles.destCountryTagPlain}>
                                <MapPin size={12} color="#64748b" />
                                <Text style={styles.destCountryTextPlain}>{dest.country}</Text>
                              </View>
                              <View
                                style={[
                                  styles.destStatusTag,
                                  isApprovedStatus && styles.destStatusApproved,
                                  isPendingStatus && styles.destStatusPending,
                                  isRejectedStatus && styles.destStatusRejected,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.destStatusTagText,
                                    isApprovedStatus && styles.destStatusTextApproved,
                                    isPendingStatus && styles.destStatusTextPending,
                                    isRejectedStatus && styles.destStatusTextRejected,
                                  ]}
                                >
                                  {isApprovedStatus ? 'APPROVED' : isPendingStatus ? 'PENDING' : 'REJECTED'}
                                </Text>
                              </View>
                            </View>
                          )}

                          <Text style={styles.destTitle}>{dest.name}</Text>
                          <Text style={styles.destDesc} numberOfLines={2}>
                            {dest.description || 'No description provided.'}
                          </Text>

                          {/* Highlights Meta Grid */}
                          <View style={styles.destMetaRow}>
                            {dest.bestTimeToVisit && (
                              <View style={styles.destMetaItem}>
                                <Calendar size={12} color="#64748b" />
                                <Text style={styles.destMetaVal} numberOfLines={1}>
                                  {dest.bestTimeToVisit}
                                </Text>
                              </View>
                            )}
                            {dest.budget && (
                              <View style={styles.destMetaItem}>
                                <CreditCard size={12} color="#64748b" />
                                <Text style={styles.destMetaVal} numberOfLines={1}>
                                  {dest.budget}
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Rejection Alert if applicable */}
                          {isRejectedStatus && dest.rejectionReason && (
                            <View style={styles.rejectionBox}>
                              <AlertCircle size={15} color="#e11d48" />
                              <View style={{ flex: 1 }}>
                                <Text style={styles.rejectionTitle}>Admin Feedback</Text>
                                <Text style={styles.rejectionBody}>{dest.rejectionReason}</Text>
                              </View>
                            </View>
                          )}

                          {isPendingStatus && (
                            <View style={styles.pendingNotice}>
                              <Clock size={13} color="#d97706" />
                              <Text style={styles.pendingNoticeText}>
                                Pending verification. Will appear publicly upon approval.
                              </Text>
                            </View>
                          )}

                          {/* Action Footer */}
                          <View style={styles.destActions}>
                            <TouchableOpacity
                              style={styles.destActionBtnEdit}
                              onPress={() => handleOpenEditDestination(dest)}
                              activeOpacity={0.75}
                            >
                              <Pencil size={14} color="#059669" />
                              <Text style={styles.destActionBtnEditText}>Edit Haven</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.destActionBtnDelete}
                              onPress={() => handleDeleteDestination(dest)}
                              activeOpacity={0.75}
                            >
                              <Trash2 size={14} color="#e11d48" />
                              <Text style={styles.destActionBtnDeleteText}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              <View style={{ height: 40 }} />
            </View>
          )}

          {/* ========================================================
              TAB 3: BOOKINGS (Assigned Expeditions)
              ======================================================== */}
          {activeTab === 'bookings' && (
            <View style={styles.tabPane}>
              <View style={styles.headingBlock}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.workspaceEyebrow}>TOUR GUIDE EXPEDITION ROSTER</Text>
                  <Text style={styles.workspaceTitle}>Assigned Bookings</Text>
                  <Text style={styles.workspaceSubtitle}>
                    Travellers and private expeditions assigned under your guidance.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.refreshBtn}
                  onPress={loadBookings}
                  activeOpacity={0.75}
                >
                  <RefreshCw size={14} color="#64748b" />
                </TouchableOpacity>
              </View>

              {bookingsLoading ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator size="large" color="#10b981" />
                  <Text style={styles.emptyStateTitle}>Loading assigned bookings...</Text>
                </View>
              ) : bookings.length === 0 ? (
                <View style={styles.emptyState}>
                  <BookOpenCheck size={36} color="#94a3b8" />
                  <Text style={styles.emptyStateTitle}>No Active Expeditions Assigned</Text>
                  <Text style={styles.emptyStateSub}>
                    When travellers book expeditions and operations designates you as tour guide, your full travel roster and vouchers will appear here.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyActionBtn}
                    onPress={() => openConcierge('Hello Ops Desk, I am available for new expedition assignments.')}
                    activeOpacity={0.85}
                  >
                    <MessageCircle size={16} color="#ffffff" />
                    <Text style={styles.emptyActionBtnText}>Notify Operations of Availability</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.bookingList}>
                  {bookings.map((booking) => {
                    const pkgTitle =
                      typeof booking.packageId === 'object' && booking.packageId
                        ? (booking.packageId as any).title || 'Signature Luxury Expedition'
                        : 'Signature Luxury Expedition';
                    const bookingCode = `GV-BK-${(booking._id || '').slice(-6).toUpperCase()}`;
                    const isConfirmed = booking.status === 'CONFIRMED';
                    const isPaid = (booking.paymentStatus || '').toUpperCase() === 'PAID';

                    return (
                      <View style={styles.bookingCard} key={booking._id}>
                        <View style={styles.bookingHeader}>
                          <View>
                            <Text style={styles.bookingCode}>{bookingCode}</Text>
                            <Text style={styles.bookingTitle}>{pkgTitle}</Text>
                          </View>
                          <View
                            style={[
                              styles.statusTag,
                              isConfirmed ? styles.statusConfirmed : styles.statusPending,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusTagText,
                                isConfirmed ? styles.statusTextConfirmed : styles.statusTextPending,
                              ]}
                            >
                              {booking.status || 'PENDING'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.bookingMetaGrid}>
                          <View style={styles.metaCell}>
                            <Calendar size={13} color="#64748b" />
                            <Text style={styles.metaCellVal}>
                              {booking.travelDate || 'Schedule Flexible'}
                            </Text>
                          </View>
                          <View style={styles.metaCell}>
                            <Users size={13} color="#64748b" />
                            <Text style={styles.metaCellVal}>
                              {booking.numberOfPeople || 1} Guests
                            </Text>
                          </View>
                          <View style={styles.metaCell}>
                            <CreditCard size={13} color="#64748b" />
                            <Text style={styles.metaCellVal}>
                              {formatPrice(booking.totalPrice || 0)}
                            </Text>
                          </View>
                          <View style={styles.metaCell}>
                            <BadgeCheck size={13} color={isPaid ? '#059669' : '#d97706'} />
                            <Text
                              style={[
                                styles.metaCellVal,
                                { color: isPaid ? '#059669' : '#d97706', fontWeight: '800' },
                              ]}
                            >
                              {isPaid ? 'PAID' : 'PAYMENT DUE'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.bookingFooter}>
                          <TouchableOpacity
                            style={styles.invoiceBtn}
                            onPress={() => setSelectedInvoiceBooking(booking)}
                            activeOpacity={0.8}
                          >
                            <FileText size={14} color="#059669" />
                            <Text style={styles.invoiceBtnText}>View Voucher / Invoice</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.contactDeskBtn}
                            onPress={() =>
                              openConcierge(
                                `Regarding booking ${bookingCode} (${pkgTitle}) on ${booking.travelDate}: Inquiry from certified guide ${currentUser.name}.`
                              )
                            }
                            activeOpacity={0.8}
                          >
                            <MessageCircle size={14} color="#475569" />
                            <Text style={styles.contactDeskBtnText}>Contact Ops</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              <View style={{ height: 40 }} />
            </View>
          )}

          {/* ========================================================
              TAB 4: MY PROFILE
              ======================================================== */}
          {activeTab === 'profile' && (
            <View style={styles.tabPane}>
              {/* Profile Card */}
              <View style={styles.profileCard}>
                <View style={styles.profileHeader}>
                  <View style={styles.bigAvatar}>
                    {currentUser.profileImage ? (
                      <Image
                        source={{ uri: normalizeMediaUrl(currentUser.profileImage) }}
                        style={styles.bigAvatarImg}
                      />
                    ) : (
                      <Text style={styles.bigAvatarText}>
                        {(currentUser.name || 'G').charAt(0).toUpperCase()}
                      </Text>
                    )}
                    {uploadingImage && (
                      <View style={styles.avatarLoadingOverlay}>
                        <ActivityIndicator size="small" color="#ffffff" />
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bigProfileName}>{currentUser.name || 'Tour Guide'}</Text>
                    <Text style={styles.publicIdText}>{currentUser.publicId || 'GV-GUIDE-PARTNER'}</Text>
                    
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                      <TouchableOpacity
                        style={styles.guidePhotoActionBtn}
                        onPress={handlePickImage}
                        disabled={uploadingImage}
                        activeOpacity={0.8}
                      >
                        <ImageIcon size={12} color="#059669" />
                        <Text style={styles.guidePhotoActionBtnText}>Gallery</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.guidePhotoActionBtn}
                        onPress={handleTakePhoto}
                        disabled={uploadingImage}
                        activeOpacity={0.8}
                      >
                        <Camera size={12} color="#2563eb" />
                        <Text style={[styles.guidePhotoActionBtnText, { color: '#2563eb' }]}>Camera</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.certPill}>
                      <BadgeCheck size={12} color="#059669" />
                      <Text style={styles.certPillText}>
                        {isApproved ? 'VERIFIED TOUR GUIDE' : 'UNDER VERIFICATION'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.profileDivider} />

                {/* Profile Details List */}
                <View style={styles.detailsList}>
                  <View style={styles.detailRow}>
                    <Mail size={16} color="#10b981" />
                    <Text style={styles.detailLabel}>Email Address:</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {currentUser.email || 'Not provided'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Phone size={16} color="#10b981" />
                    <Text style={styles.detailLabel}>Contact Mobile:</Text>
                    <Text style={styles.detailValue}>
                      {currentUser.mobile || 'Not configured'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <MapPin size={16} color="#10b981" />
                    <Text style={styles.detailLabel}>Base Location:</Text>
                    <Text style={styles.detailValue}>
                      {[currentUser.city, currentUser.country].filter(Boolean).join(', ') ||
                        'Sri Lanka'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Award size={16} color="#10b981" />
                    <Text style={styles.detailLabel}>Field Experience:</Text>
                    <Text style={styles.detailValue}>
                      {currentUser.experienceYears || '2'} Years
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <LanguagesIcon size={16} color="#10b981" />
                    <Text style={styles.detailLabel}>Languages:</Text>
                    <Text style={styles.detailValue}>
                      {Array.isArray(currentUser.languages) && currentUser.languages.length > 0
                        ? currentUser.languages.join(', ')
                        : 'English, Sinhala'}
                    </Text>
                  </View>
                </View>

                {/* About Bio Section */}
                <View style={styles.aboutWrapper}>
                  <Text style={styles.aboutTitle}>PROFESSIONAL BIO & CREDENTIALS</Text>
                  <Text style={styles.aboutBody}>
                    {currentUser.about ||
                      'Certified GlobalVista Luxury Expedition Guide. Trained in hospitality, cultural storytelling, wilderness navigation, and elite concierge services.'}
                  </Text>
                </View>

                {/* Profile Action Buttons */}
                <View style={styles.profileBtnRow}>
                  <TouchableOpacity
                    style={styles.profileEditBtn}
                    onPress={handleOpenEditProfile}
                    activeOpacity={0.85}
                  >
                    <Pencil size={15} color="#ffffff" />
                    <Text style={styles.profileEditBtnText}>Edit Guide Profile</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.profilePasswordBtn}
                    onPress={handleOpenChangePassword}
                    activeOpacity={0.85}
                  >
                    <KeyRound size={15} color="#334155" />
                    <Text style={styles.profilePasswordBtnText}>Change Password</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Support Desk Card */}
              <View style={styles.supportDeskCard}>
                <View style={styles.supportDeskHeader}>
                  <ShieldCheck size={22} color="#059669" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.supportDeskTitle}>Operations & Logistics Desk</Text>
                    <Text style={styles.supportDeskSub}>
                      Direct 24/7 communications with GlobalVista Operations Command for transport, passes, and emergencies.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.supportDeskBtn}
                  onPress={() => openConcierge()}
                  activeOpacity={0.85}
                >
                  <MessageCircle size={16} color="#ffffff" />
                  <Text style={styles.supportDeskBtnText}>Connect via WhatsApp Concierge</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 40 }} />
            </View>
          )}
        </ScrollView>

        {/* ========================================================
            MODAL 1: SUGGEST / EDIT DESTINATION MODAL
            ======================================================== */}
        <Modal
          visible={showDestModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowDestModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    {editingDestId ? 'Edit Haven Destination' : 'Suggest New Haven'}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    Submissions require admin review before appearing publicly
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowDestModal(false)}>
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Destination Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Sigiriya Rock Fortress"
                  placeholderTextColor="#94a3b8"
                  value={destName}
                  onChangeText={setDestName}
                />

                <Text style={styles.inputLabel}>Country *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Sri Lanka"
                  placeholderTextColor="#94a3b8"
                  value={destCountry}
                  onChangeText={setDestCountry}
                />

                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, { height: 75, textAlignVertical: 'top' }]}
                  placeholder="Describe what makes this luxury haven extraordinary..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  value={destDescription}
                  onChangeText={setDestDescription}
                />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Best Time to Visit</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. Jan to April"
                      placeholderTextColor="#94a3b8"
                      value={destBestTime}
                      onChangeText={setDestBestTime}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Budget Tier</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. LKR 15,000 - 30,000"
                      placeholderTextColor="#94a3b8"
                      value={destBudget}
                      onChangeText={setDestBudget}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Activities (comma-separated)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Scenic Hike, Wildlife Safari, Photography"
                  placeholderTextColor="#94a3b8"
                  value={destActivities}
                  onChangeText={setDestActivities}
                />

                <Text style={styles.inputLabel}>Image URLs (one per line)</Text>
                <TextInput
                  style={[styles.formInput, { height: 60, textAlignVertical: 'top' }]}
                  placeholder="https://images.unsplash.com/photo-..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  value={destImages}
                  onChangeText={setDestImages}
                />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Latitude (Optional)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. 7.9570"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={destLat}
                      onChangeText={setDestLat}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Longitude (Optional)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. 80.7603"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={destLng}
                      onChangeText={setDestLng}
                    />
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, destSaving && { opacity: 0.7 }]}
                onPress={handleSaveDestination}
                disabled={destSaving}
                activeOpacity={0.85}
              >
                <Text style={styles.modalSubmitBtnText}>
                  {destSaving
                    ? 'Submitting to Admin...'
                    : editingDestId
                    ? 'Save & Resubmit Haven'
                    : 'Submit Haven for Approval'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ========================================================
            MODAL 2: EDIT PROFILE MODAL
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
                  <Text style={styles.modalTitle}>Edit Guide Profile</Text>
                  <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    Update your professional details and languages
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                {/* Guide Profile Photo Section */}
                <View style={styles.modalAvatarSection}>
                  <View style={styles.modalAvatarCircle}>
                    {profileImage ? (
                      <Image
                        source={{ uri: normalizeMediaUrl(profileImage) }}
                        style={styles.modalAvatarImg}
                      />
                    ) : (
                      <Text style={styles.modalAvatarText}>
                        {(profileName || currentUser.name || 'G').charAt(0).toUpperCase()}
                      </Text>
                    )}
                    {uploadingImage && (
                      <View style={styles.avatarLoadingOverlay}>
                        <ActivityIndicator size="small" color="#ffffff" />
                      </View>
                    )}
                  </View>

                  <View style={styles.avatarBtnGroup}>
                    <Text style={styles.avatarPickerTitle}>Guide Profile Photo</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 5 }}>
                      <TouchableOpacity
                        style={styles.avatarPickerBtn}
                        onPress={handlePickImage}
                        disabled={uploadingImage}
                        activeOpacity={0.8}
                      >
                        <ImageIcon size={13} color="#059669" />
                        <Text style={styles.avatarPickerBtnText}>Gallery</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.avatarPickerBtn}
                        onPress={handleTakePhoto}
                        disabled={uploadingImage}
                        activeOpacity={0.8}
                      >
                        <Camera size={13} color="#2563eb" />
                        <Text style={styles.avatarPickerBtnText}>Camera</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <Text style={styles.inputLabel}>Profile Image URL</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="https://... or choose photo above"
                  placeholderTextColor="#94a3b8"
                  value={profileImage}
                  onChangeText={setProfileImage}
                />

                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Your full legal name"
                  placeholderTextColor="#94a3b8"
                  value={profileName}
                  onChangeText={setProfileName}
                />

                <Text style={styles.inputLabel}>Contact Phone / Mobile *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="+94 77 123 4567"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  value={profileMobile}
                  onChangeText={setProfileMobile}
                />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Country *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Sri Lanka"
                      placeholderTextColor="#94a3b8"
                      value={profileCountry}
                      onChangeText={setProfileCountry}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Base City</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Colombo / Kandy"
                      placeholderTextColor="#94a3b8"
                      value={profileCity}
                      onChangeText={setProfileCity}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Guiding Experience (Years)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. 5"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={profileExperience}
                      onChangeText={setProfileExperience}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Languages (comma-separated)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="English, French, German"
                      placeholderTextColor="#94a3b8"
                      value={profileLanguages}
                      onChangeText={setProfileLanguages}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>About Me / Bio</Text>
                <TextInput
                  style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Tell travellers about your expertise and travel passion..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  value={profileAbout}
                  onChangeText={setProfileAbout}
                />
              </ScrollView>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, profileSaving && { opacity: 0.7 }]}
                onPress={handleSaveProfile}
                disabled={profileSaving}
                activeOpacity={0.85}
              >
                <Text style={styles.modalSubmitBtnText}>
                  {profileSaving ? 'Saving Profile...' : 'Save Profile Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ========================================================
            MODAL 3: CHANGE PASSWORD MODAL
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
                  <Text style={styles.modalTitle}>Change Guide Password</Text>
                  <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    Update your account credentials safely
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
                  {passwordSaving ? 'Updating Password...' : 'Change Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ========================================================
            MODAL 4: INVOICE / VOUCHER MODAL
            ======================================================== */}
        <MobileInvoiceModal
          visible={Boolean(selectedInvoiceBooking)}
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
    backgroundColor: '#f7f8fa',
  },

  /* ========================================================
     TOPBAR
     ======================================================== */
  topbar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#edf0f4',
    ...SHADOWS.small,
  },
  topbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#18212f',
    letterSpacing: -0.2,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.8,
  },
  topbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeApproved: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  statusBadgePending: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadgeTextApproved: {
    color: '#059669',
  },
  statusBadgeTextPending: {
    color: '#d97706',
  },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  profileAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
  },
  profileName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#18212f',
    maxWidth: 70,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ========================================================
     NAVIGATION TAB BAR
     ======================================================== */
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#edf0f4',
    gap: 6,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  tabItemActive: {
    backgroundColor: '#ecfdf5',
  },
  tabItemText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
  },
  tabItemTextActive: {
    color: '#059669',
    fontWeight: '800',
  },
  tabBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ffffff',
  },

  /* ========================================================
     CONTENT PANE
     ======================================================== */
  contentScroll: {
    flex: 1,
  },
  tabPane: {
    padding: 16,
  },

  /* ========================================================
     WELCOME BANNER & STATUS CALLOUT
     ======================================================== */
  welcomeBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  welcomeEyebrow: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.6,
  },
  welcomeTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#18212f',
    marginTop: 2,
  },
  welcomeSubtitle: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 3,
    lineHeight: 16,
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  statusCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusCalloutApproved: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  statusCalloutPending: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  calloutTitleApproved: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: 0.4,
  },
  calloutSubApproved: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
    lineHeight: 15,
  },
  calloutTitlePending: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#d97706',
    letterSpacing: 0.4,
  },
  calloutSubPending: {
    fontSize: 11,
    color: '#b45309',
    marginTop: 2,
    lineHeight: 15,
  },

  /* ========================================================
     8 KPI SUMMARY CARDS
     ======================================================== */
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#edf0f4',
    borderLeftWidth: 3.5,
    ...SHADOWS.small,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiTag: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  kpiTagText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#18212f',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 9.5,
    color: '#94a3b8',
    marginTop: 1,
  },

  /* ========================================================
     ACTION SHORTCUTS
     ======================================================== */
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#18212f',
    letterSpacing: -0.1,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  actionBtn: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#edf0f4',
    ...SHADOWS.small,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#18212f',
  },
  actionSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },

  /* ========================================================
     CARD & CHECKLIST
     ======================================================== */
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#edf0f4',
    ...SHADOWS.small,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardEyebrow: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#18212f',
    marginTop: 1,
  },
  readinessPill: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  readinessPillText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#059669',
  },
  checklist: {
    gap: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  checkLabel: {
    flex: 1,
    fontSize: 12,
    color: '#64748b',
  },
  checkLabelDone: {
    color: '#18212f',
    fontWeight: '700',
  },
  checkStatus: {
    fontSize: 10,
    fontWeight: '800',
  },
  checkStatusDone: {
    color: '#059669',
  },
  checkStatusPending: {
    color: '#94a3b8',
  },
  cardFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardFooterBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },

  /* ========================================================
     DESTINATIONS WORKSPACE
     ======================================================== */
  headingBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  workspaceEyebrow: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.6,
  },
  workspaceTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#18212f',
    marginTop: 1,
  },
  workspaceSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 15,
  },
  addPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    ...SHADOWS.small,
  },
  addPrimaryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#edf0f4',
    marginVertical: 10,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#18212f',
    marginTop: 10,
  },
  emptyStateSub: {
    fontSize: 11.5,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
  },
  emptyActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  destList: {
    gap: 12,
  },
  destCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#edf0f4',
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  destMediaWrapper: {
    height: 140,
    position: 'relative',
  },
  destMediaImage: {
    width: '100%',
    height: '100%',
  },
  destMediaOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  destCountryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  destCountryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  destHeaderNoImg: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  destCountryTagPlain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  destCountryTextPlain: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
  },
  destStatusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  destStatusApproved: {
    backgroundColor: '#ecfdf5',
  },
  destStatusPending: {
    backgroundColor: '#fffbeb',
  },
  destStatusRejected: {
    backgroundColor: '#fff1f2',
  },
  destStatusTagText: {
    fontSize: 9,
    fontWeight: '900',
  },
  destStatusTextApproved: {
    color: '#059669',
  },
  destStatusTextPending: {
    color: '#d97706',
  },
  destStatusTextRejected: {
    color: '#e11d48',
  },
  destBody: {
    padding: 14,
  },
  destTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#18212f',
  },
  destDesc: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 16,
  },
  destMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  destMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  destMetaVal: {
    fontSize: 10.5,
    color: '#475569',
    fontWeight: '600',
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  rejectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#e11d48',
  },
  rejectionBody: {
    fontSize: 10.5,
    color: '#be123c',
    marginTop: 1,
  },
  pendingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fffbeb',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  pendingNoticeText: {
    fontSize: 10.5,
    color: '#d97706',
    fontWeight: '600',
    flex: 1,
  },
  destActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  destActionBtnEdit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#ecfdf5',
    paddingVertical: 8,
    borderRadius: 8,
  },
  destActionBtnEditText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#059669',
  },
  destActionBtnDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#fff1f2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  destActionBtnDeleteText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#e11d48',
  },

  /* ========================================================
     BOOKINGS ROSTER
     ======================================================== */
  bookingList: {
    gap: 12,
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#edf0f4',
    ...SHADOWS.small,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bookingCode: {
    fontSize: 10,
    fontWeight: '900',
    color: '#10b981',
    letterSpacing: 0.5,
  },
  bookingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#18212f',
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusConfirmed: {
    backgroundColor: '#ecfdf5',
  },
  statusPending: {
    backgroundColor: '#fffbeb',
  },
  statusTagText: {
    fontSize: 9,
    fontWeight: '900',
  },
  statusTextConfirmed: {
    color: '#059669',
  },
  statusTextPending: {
    color: '#d97706',
  },
  bookingMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    marginVertical: 6,
  },
  metaCell: {
    width: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaCellVal: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  bookingFooter: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  invoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    paddingVertical: 9,
    borderRadius: 8,
  },
  invoiceBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#059669',
  },
  contactDeskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
  },
  contactDeskBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },

  /* ========================================================
     MY PROFILE TAB
     ======================================================== */
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#edf0f4',
    ...SHADOWS.small,
    marginBottom: 14,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bigAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  bigAvatarText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
  },
  bigProfileName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#18212f',
  },
  publicIdText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
  },
  certPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  certPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  profileDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 14,
  },
  detailsList: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    width: 115,
  },
  detailValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#18212f',
  },
  aboutWrapper: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#edf0f4',
  },
  aboutTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  aboutBody: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
  },
  profileBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  profileEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
  },
  profileEditBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  profilePasswordBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  profilePasswordBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#334155',
  },
  supportDeskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#edf0f4',
    ...SHADOWS.small,
  },
  supportDeskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  supportDeskTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#18212f',
  },
  supportDeskSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 15,
  },
  supportDeskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 11,
    borderRadius: 10,
  },
  supportDeskBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },

  /* ========================================================
     MODALS
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
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#edf0f4',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#18212f',
  },
  inputLabel: {
    fontSize: 11,
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
    fontSize: 12.5,
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
     AVATAR & PHOTO UPLOAD STYLES
     ======================================================== */
  profileAvatarImg: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  bigAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
  },
  guidePhotoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  guidePhotoActionBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  modalAvatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 6,
  },
  modalAvatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  modalAvatarImg: {
    width: '100%',
    height: '100%',
  },
  modalAvatarText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },
  avatarBtnGroup: {
    flex: 1,
  },
  avatarPickerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#18212f',
  },
  avatarPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatarPickerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
});

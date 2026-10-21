import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
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
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { ApiUser } from '../services/api';
import { WHATSAPP_NUMBER } from '../constants/config';

interface Props {
  visible: boolean;
  onClose: () => void;
  user: ApiUser | null;
}

export const MobileGuidePortal: React.FC<Props> = ({ visible, onClose, user }) => {
  if (!user) return null;

  const isApproved = user.guideStatus === 'APPROVED';
  const isPending = user.guideStatus === 'PENDING' || !user.guideStatus;

  const openConcierge = () => {
    const msg = `Hello Admin, this is certified guide ${user.name} (${user.publicId || user.email}). I am inquiring about my assigned expeditions.`;
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={styles.badgeWrap}>
              <Compass size={20} color="#ffffff" />
            </View>
            <View>
              <Text style={styles.headerEyebrow}>GLOBALVISTA TOUR GUIDE</Text>
              <Text style={styles.headerTitle}>Professional Guide Portal</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <X size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {/* Guide Status Banner */}
          <View
            style={[
              styles.statusCard,
              isApproved ? styles.statusCardApproved : styles.statusCardPending,
            ]}
          >
            {isApproved ? (
              <>
                <CheckCircle2 size={24} color="#166534" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusTitleApproved}>CERTIFIED LUXURY GUIDE</Text>
                  <Text style={styles.statusSubApproved}>
                    Your credentials are verified. You are authorized to lead GlobalVista expeditions.
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Clock size={24} color="#854d0e" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusTitlePending}>APPLICATION UNDER REVIEW</Text>
                  <Text style={styles.statusSubPending}>
                    Our safety & compliance team is reviewing your identification documents. You will receive an update shortly.
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Guide Identity Profile */}
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>GUIDE PROFILE</Text>
            <Text style={styles.guideName}>{user.name}</Text>
            <Text style={styles.guidePublicId}>{user.publicId || 'GV-GUIDE'}</Text>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <MapPin size={15} color={COLORS.accent} />
              <Text style={styles.infoLabel}>Base Location:</Text>
              <Text style={styles.infoVal}>{user.city || 'Colombo'}, {user.country || 'Sri Lanka'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Award size={15} color={COLORS.gold} />
              <Text style={styles.infoLabel}>Field Experience:</Text>
              <Text style={styles.infoVal}>{user.experienceYears || 2} Years</Text>
            </View>

            <View style={styles.infoRow}>
              <Globe2 size={15} color={COLORS.accent} />
              <Text style={styles.infoLabel}>Languages:</Text>
              <Text style={styles.infoVal}>
                {user.languages && user.languages.length > 0
                  ? user.languages.join(', ')
                  : 'English, Sinhala'}
              </Text>
            </View>
          </View>

          {/* Upcoming Expeditions Assigned */}
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>EXPEDITION ROSTER</Text>
            <View style={styles.rosterItem}>
              <View style={styles.rosterLeft}>
                <Text style={styles.rosterTitle}>Cultural Heritage & Sigiriya Trail</Text>
                <Text style={styles.rosterMeta}>4 Travellers · VIP Concierge Service</Text>
              </View>
              <View style={styles.rosterBadge}>
                <Text style={styles.rosterBadgeText}>ASSIGNED</Text>
              </View>
            </View>

            <View style={styles.rosterItem}>
              <View style={styles.rosterLeft}>
                <Text style={styles.rosterTitle}>Ella Scenic Tea Hills & Highlands</Text>
                <Text style={styles.rosterMeta}>2 Travellers · Private Mercedes Transfer</Text>
              </View>
              <View style={styles.rosterBadge}>
                <Text style={styles.rosterBadgeText}>UPCOMING</Text>
              </View>
            </View>
          </View>

          {/* Guide Support Desk */}
          <View style={styles.supportCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ShieldCheck size={18} color="#166534" />
              <Text style={styles.supportTitle}>Guide Operations Command</Text>
            </View>
            <Text style={styles.supportDesc}>
              Need assistance with traveller logistics, entry passes, or emergency assistance? Reach the operations desk directly.
            </Text>
            <TouchableOpacity style={styles.supportBtn} onPress={openConcierge} activeOpacity={0.85}>
              <MessageCircle size={16} color="#ffffff" />
              <Text style={styles.supportBtnText}>Connect with Operations Desk</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
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
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fbbf24',
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
  body: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  statusCardApproved: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  statusCardPending: {
    backgroundColor: '#fefce8',
    borderColor: '#fef08a',
  },
  statusTitleApproved: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.4,
  },
  statusSubApproved: {
    fontSize: 11,
    color: '#15803d',
    lineHeight: 16,
    marginTop: 2,
  },
  statusTitlePending: {
    fontSize: 12,
    fontWeight: '800',
    color: '#854d0e',
    letterSpacing: 0.4,
  },
  statusSubPending: {
    fontSize: 11,
    color: '#a16207',
    lineHeight: 16,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  guideName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  guidePublicId: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  rosterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  rosterLeft: {
    flex: 1,
  },
  rosterTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  rosterMeta: {
    fontSize: 11,
    color: '#94a3b8',
  },
  rosterBadge: {
    backgroundColor: '#065f46',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rosterBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
  supportCard: {
    backgroundColor: '#064e3b',
    borderRadius: 14,
    padding: 16,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#059669',
  },
  supportTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  supportDesc: {
    fontSize: 11,
    color: '#a7f3d0',
    lineHeight: 16,
    marginBottom: 12,
  },
  supportBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  supportBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});

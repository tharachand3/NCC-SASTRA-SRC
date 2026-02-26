import { db } from '@/config/firebase';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    collection,
    getDocs,
    query, where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView, ScrollView,
    StyleSheet,
    
    TouchableOpacity,
    View
} from 'react-native';

import { Card } from '../../components/ui/Card';

interface AttendanceSummary {
    total: number;
    present: number;
    normalParade: number;
    extraParade: number;
    camp: number;
    duty: number;
}

export default function CadetProfileScreen() {
    const { userProfile, logout } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [attendance, setAttendance] = useState<AttendanceSummary>({
        total: 0, present: 0, normalParade: 0, extraParade: 0, camp: 0, duty: 0,
    });

    useEffect(() => {
        if (!userProfile?.uid) return;

        // Fetch all attendance sessions where this cadet is present
        const fetchAttendance = async () => {
            try {
                const q = query(
                    collection(db, 'attendance'),
                    where('presentCadets', 'array-contains', userProfile.uid)
                );
                const snap = await getDocs(q);

                const summary: AttendanceSummary = {
                    total: 0, present: snap.size, normalParade: 0, extraParade: 0, camp: 0, duty: 0,
                };

                snap.forEach(d => {
                    const type = d.data().type as string;
                    if (type === 'normal') summary.normalParade++;
                    else if (type === 'extra') summary.extraParade++;
                    else if (type === 'camp') summary.camp++;
                    else if (type === 'duty') summary.duty++;
                });

                // Also get total sessions to compute attendance %
                const totalQ = query(collection(db, 'attendance'), where('type', '!=', ''));
                const totalSnap = await getDocs(totalQ);
                summary.total = totalSnap.size;

                setAttendance(summary);
            } catch (e) {
                console.error('Attendance fetch error:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [userProfile?.uid]);

    const attendancePct = attendance.total > 0
        ? Math.round((attendance.present / attendance.total) * 100)
        : 0;

    if (!userProfile) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Profile</Text>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Hero Card */}
                <View style={styles.heroCard}>
                    <View style={styles.avatarLarge}>
                        <Text style={styles.avatarText}>{userProfile.fullName?.[0]?.toUpperCase() ?? 'C'}</Text>
                    </View>
                    <Text style={styles.heroName}>{userProfile.fullName}</Text>
                    <Text style={styles.heroSub}>{userProfile.department} • {userProfile.year}</Text>
                    <Text style={[styles.heroSub, { marginTop: 4, fontWeight: '700', color: COLORS.white }]}>
                        {userProfile.wing} Wing • {userProfile.squad} Squad
                    </Text>

                    <View style={{ marginBottom: 20 }}>
                        <View style={[styles.statusBadge, { backgroundColor: userProfile.status === 'active' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)' }]}>
                            <Text style={[styles.statusText, { color: userProfile.status === 'active' ? '#81C784' : '#FFB74D' }]}>
                                {userProfile.status === 'active' ? 'Active Cadet' : 'Alumni'}
                            </Text>
                        </View>
                    </View>

                    {/* Points & Rank */}
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{userProfile.totalPoints ?? 0}</Text>
                            <Text style={styles.statLabel}>Total Points</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{userProfile.cdtRank || 'Cadet'}</Text>
                            <Text style={styles.statLabel}>Rank</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{attendancePct}%</Text>
                            <Text style={styles.statLabel}>Attendance</Text>
                        </View>
                    </View>
                </View>

                {/* Personal Details */}
                <Card style={{ marginBottom: 16 }}>
                    <Text style={styles.sectionTitle}>Personal Details</Text>
                    <InfoRow icon="id-card-outline" label="Register No." value={userProfile.registerNumber} />
                    <InfoRow icon="layers-outline" label="Enrollment No." value={userProfile.enrollmentNumber} />
                    <InfoRow icon="mail-outline" label="Email" value={userProfile.email} />
                    <InfoRow icon="call-outline" label="Phone" value={userProfile.phone} />
                    <InfoRow icon="water-outline" label="Blood Group" value={userProfile.bloodGroup} />
                </Card>

                {/* Attendance Summary */}
                {loading ? (
                    <Card style={{ alignItems: 'center', padding: 30 }}>
                        <ActivityIndicator color={COLORS.primary} />
                    </Card>
                ) : (
                    <Card style={{ marginBottom: 16 }}>
                        <Text style={styles.sectionTitle}>Attendance Summary</Text>
                        <View style={styles.attendanceGrid}>
                            <StatCard label="Normal Parades" value={attendance.normalParade} color={COLORS.primary} />
                            <StatCard label="Extra Parades" value={attendance.extraParade} color="#6A1B9A" />
                            <StatCard label="Camps" value={attendance.camp} color={COLORS.success} />
                            <StatCard label="Duties" value={attendance.duty} color={COLORS.warning} />
                        </View>
                        <View style={styles.pctRow}>
                            <Text style={styles.pctLabel}>Overall Attendance</Text>
                            <Text style={styles.pctValue}>{attendancePct}%</Text>
                        </View>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${attendancePct}%` }]} />
                        </View>
                        <Text style={styles.pctSub}>{attendance.present} of {attendance.total} sessions attended</Text>
                        <TouchableOpacity
                            style={styles.historyBtn}
                            onPress={() => router.push('/(cadet)/attendance-history')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="list-outline" size={18} color={COLORS.primary} />
                            <Text style={styles.historyBtnText}>View Full Attendance History</Text>
                            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                    </Card>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value?: string }) {
    return (
        <View style={styles.infoRow}>
            <Ionicons name={icon} size={18} color={COLORS.textMuted} style={styles.infoIcon} />
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value || '—'}</Text>
        </View>
    );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <View style={[styles.statCard, { borderTopColor: color }]}>
            <Text style={[styles.statCardValue, { color }]}>{value}</Text>
            <Text style={styles.statCardLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: COLORS.card,
        paddingHorizontal: 20,
        paddingTop: 48,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: { color: COLORS.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.errorBg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.error + '20' },
    logoutText: { color: COLORS.error, fontSize: 13, fontWeight: '700' },
    scroll: { padding: 16, paddingBottom: 40 },
    heroCard: {
        backgroundColor: COLORS.primary,
        borderRadius: 24, // Softer outer radius for the hero card
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },
    avatarLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.1)', // More modern translucent avatar background
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: { color: COLORS.white, fontSize: 32, fontWeight: '800' },
    heroName: { color: COLORS.white, fontSize: 28, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
    heroSub: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4, marginBottom: 8, fontWeight: '500' },
    statusBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    statusText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)', // Extremely subtle internal card
        borderRadius: 16,
        width: '100%',
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    statBox: { flex: 1, alignItems: 'center' },
    statValue: { color: COLORS.white, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4, fontWeight: '600' },
    statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.primary, // Using near black instead of gray for authority
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    infoIcon: { marginRight: 12 },
    infoLabel: { flex: 1, fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
    infoValue: { fontSize: 14, color: COLORS.text, fontWeight: '600', flex: 1, textAlign: 'right' },
    attendanceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border, // Crisp 1px border all around
    },
    statCardValue: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
    statCardLabel: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, textAlign: 'center', fontWeight: '600' },
    pctRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    pctLabel: { fontSize: 14, color: COLORS.text, fontWeight: '700' },
    pctValue: { fontSize: 18, color: COLORS.primary, fontWeight: '800' },
    progressBar: {
        height: 10,
        backgroundColor: COLORS.border,
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 5,
    },
    pctSub: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 16, fontWeight: '500' },
    historyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: COLORS.primaryLight,
        borderRadius: 12,
        padding: 16,
        marginTop: 4,
    },
    historyBtnText: { flex: 1, fontSize: 14, color: COLORS.primary, fontWeight: '700' },
});

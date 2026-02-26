import { db } from '@/config/firebase';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet,  TouchableOpacity, View } from 'react-native';

import { SectionHeader } from '../../components/ui/SectionHeader';
import { CardSkeleton } from '../../components/ui/SkeletonLoader';
import { StatCard } from '../../components/ui/StatCard';

interface CadetStats {
    totalSessions: number;
    attendedSessions: number;
    attendancePercent: number;
    approvedDocs: number;
    pendingDocs: number;
}

export default function CadetDashboard() {
    const { userProfile, logout } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<CadetStats>({
        totalSessions: 0,
        attendedSessions: 0,
        attendancePercent: 0,
        approvedDocs: 0,
        pendingDocs: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userProfile?.uid) return;

        // Attendance Listener
        const unsubAtt = onSnapshot(collection(db, 'attendance'), (snap) => {
            const total = snap.docs.length;
            let attended = 0;

            snap.docs.forEach(d => {
                const data = d.data();
                if (data.presentCadets?.includes(userProfile.uid)) {
                    attended++;
                }
            });

            const percent = total > 0 ? Math.round((attended / total) * 100) : 0;

            setStats(prev => ({
                ...prev,
                totalSessions: total,
                attendedSessions: attended,
                attendancePercent: percent
            }));
        });

        // Documents Listener
        const qDocs = query(collection(db, 'documents'), where('userId', '==', userProfile.uid));
        const unsubDocs = onSnapshot(qDocs, (snap) => {
            let approved = 0;
            let pending = 0;
            snap.docs.forEach(d => {
                const data = d.data();
                if (data.isDeleted) return;
                const s = data.status;
                if (s === 'approved') approved++;
                if (s === 'pending') pending++;
            });
            setStats(prev => ({
                ...prev,
                approvedDocs: approved,
                pendingDocs: pending
            }));
            setLoading(false);
        });

        return () => {
            unsubAtt();
            unsubDocs();
        };
    }, [userProfile?.uid]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Welcome back,</Text>
                    <Text style={styles.name}>{userProfile?.fullName ?? 'Cadet'}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => router.push('/(cadet)/chat')} style={styles.iconBtn}>
                        <Ionicons name="chatbubble-ellipses-outline" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                        <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {loading ? (
                    <View style={styles.loaderContainer}>
                        <CardSkeleton />
                        <CardSkeleton />
                    </View>
                ) : (
                    <>
                        {/* Rank & Points Featured Card */}
                        <View style={styles.featuredCard}>
                            <View style={styles.featuredMain}>
                                <View style={styles.featuredIconBox}>
                                    <Ionicons name="medal" size={36} color={COLORS.white} />
                                </View>
                                <View style={{ marginLeft: 16 }}>
                                    <Text style={styles.featuredLabel}>Current Rank</Text>
                                    <Text style={styles.featuredValue}>{userProfile?.cdtRank || 'Cadet'}</Text>
                                </View>
                            </View>
                            <View style={styles.featuredDivider} />
                            <View style={styles.featuredFooter}>
                                <Text style={styles.footerText}>Total Points Earned</Text>
                                <Text style={styles.footerValue}>{userProfile?.totalPoints || 0} pts</Text>
                            </View>
                        </View>

                        <SectionHeader title="Your Analytics" />

                        <View style={styles.statsGrid}>
                            <StatCard
                                title="Attendance"
                                value={`${stats.attendancePercent}%`}
                                icon="pie-chart"
                                color={stats.attendancePercent >= 75 ? COLORS.success : COLORS.warning}
                            />
                            <StatCard
                                title="Parades Attended"
                                value={`${stats.attendedSessions} / ${stats.totalSessions}`}
                                icon="calendar-outline"
                                color={COLORS.primary}
                            />
                        </View>

                        <View style={styles.statsGrid}>
                            <StatCard
                                title="Approved Docs"
                                value={stats.approvedDocs}
                                icon="checkmark-circle"
                                color={COLORS.success}
                            />
                            <StatCard
                                title="Pending Docs"
                                value={stats.pendingDocs}
                                icon="time"
                                color={COLORS.warning}
                            />
                        </View>
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
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
    greeting: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 4 },
    name: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
    iconBtn: {
        padding: 10,
        backgroundColor: COLORS.primaryLight,
        borderRadius: 12
    },
    logoutBtn: {
        padding: 10,
        backgroundColor: COLORS.errorBg,
        borderRadius: 12
    },
    scrollContent: { padding: 16 },
    loaderContainer: { marginHorizontal: 6, marginTop: 12 },

    // Featured Card
    featuredCard: {
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        padding: 24,
        marginBottom: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    featuredMain: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    featuredIconBox: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    featuredLabel: { color: COLORS.primaryLight, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
    featuredValue: { color: COLORS.white, fontSize: 28, fontWeight: '800', letterSpacing: 0.5 },
    featuredDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.15)',
        marginVertical: 20,
    },
    featuredFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerText: { color: COLORS.white, fontSize: 15, fontWeight: '500' },
    footerValue: { color: COLORS.white, fontSize: 18, fontWeight: '700' },

    statsGrid: {
        flexDirection: 'row',
        marginHorizontal: -6,
    },
});

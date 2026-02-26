import { db } from '@/config/firebase';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet,  TouchableOpacity, View } from 'react-native';

import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { CardSkeleton } from '../../components/ui/SkeletonLoader';
import { StatCard } from '../../components/ui/StatCard';

// Make sure to map rank to priority
const RANK_PRIORITY: Record<string, number> = {
    'CUO': 1,
    'Sergent': 2,
    'CPL': 3,
    'LCPL': 4,
    'Cadet': 5
};

interface DashboardStats {
    activeCadets: number;
    alumni: number;
    totalSessions: number;
    avgAttendance: number;
    pendingDocs: number;
}

interface RankedCadet {
    id: string;
    fullName: string;
    totalPoints: number;
    rank?: string;
}

export default function AdminDashboard() {
    const { userProfile, logout } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats>({
        activeCadets: 0,
        alumni: 0,
        totalSessions: 0,
        avgAttendance: 0,
        pendingDocs: 0
    });
    const [topCadets, setTopCadets] = useState<RankedCadet[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let activeCount = 0;
        let alumniCount = 0;
        let totalAttendedCount = 0; // Sum of all attended entries across active cadets

        // Users Listener (Active Cadets + Alumni + Top 5)
        const qUsers = query(collection(db, 'users'), where('role', '==', 'cadet'));
        const unsubUsers = onSnapshot(qUsers, (snap) => {
            activeCount = 0;
            alumniCount = 0;
            let activeList: any[] = [];

            snap.docs.forEach(d => {
                const data = d.data();
                if (data.status === 'passedOut') {
                    alumniCount++;
                } else {
                    activeCount++;
                    activeList.push({ id: d.id, ...data });
                }
            });

            // Sort for Top 5: By Rank Priority, then by Total Points
            activeList.sort((a, b) => {
                const rankA = RANK_PRIORITY[a.rank] ?? 5;
                const rankB = RANK_PRIORITY[b.rank] ?? 5;
                if (rankA !== rankB) {
                    return rankA - rankB; // Ascending priority (1 is highest)
                }
                return (b.totalPoints || 0) - (a.totalPoints || 0); // Descending points
            });
            setTopCadets(activeList.slice(0, 5));

            setStats(prev => ({ ...prev, activeCadets: activeCount, alumni: alumniCount }));
        });

        // Attendance Listener (Total Sessions)
        const unsubAtt = onSnapshot(collection(db, 'attendance'), (snap) => {
            const sessionsCount = snap.docs.length;

            let totalPresent = 0;
            snap.docs.forEach(d => {
                const data = d.data();
                totalPresent += (data.presentCadets?.length || 0);
            });

            let avg = 0;
            if (sessionsCount > 0 && activeCount > 0) {
                avg = (totalPresent / (sessionsCount * activeCount)) * 100;
                if (avg > 100) avg = 100;
            }

            setStats(prev => ({
                ...prev,
                totalSessions: sessionsCount,
                avgAttendance: Math.round(avg)
            }));
            setLoading(false);
        });

        // Documents Listener (Pending)
        const qDocs = query(collection(db, 'documents'), where('status', '==', 'pending'));
        const unsubDocs = onSnapshot(qDocs, (snap) => {
            let count = 0;
            snap.docs.forEach(d => {
                if (!d.data().isDeleted) count++;
            });
            setStats(prev => ({ ...prev, pendingDocs: count }));
        });

        return () => {
            unsubUsers();
            unsubAtt();
            unsubDocs();
        };
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Welcome,</Text>
                    <Text style={styles.name}>{userProfile?.fullName ?? 'Admin'}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => router.push('/(admin)/messages')} style={styles.iconBtn}>
                        <Ionicons name="chatbubbles-outline" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                        <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <SectionHeader title="Overview" />

                {loading ? (
                    <View style={styles.loaderContainer}>
                        <CardSkeleton />
                        <CardSkeleton />
                    </View>
                ) : (
                    <>
                        <View style={styles.statsGrid}>
                            <StatCard title="Active Cadets" value={stats.activeCadets} icon="people" color={COLORS.primary} />
                            <StatCard title="Total Sessions" value={stats.totalSessions} icon="calendar" color={COLORS.info} />
                        </View>

                        <View style={styles.statsGrid}>
                            <StatCard title="Avg Attendance" value={`${stats.avgAttendance}%`} icon="analytics" color={COLORS.success} />
                            <StatCard title="Pending Docs" value={stats.pendingDocs} icon="document-text" color={COLORS.warning} />
                        </View>

                        <SectionHeader
                            title="Top Cadets"
                            actionLabel="View All"
                            onAction={() => router.push('/(admin)/leaderboard')}
                        />

                        <Card noPadding style={{ paddingBottom: 8 }}>
                            {topCadets.length === 0 ? (
                                <Text style={styles.emptyText}>No active cadets found.</Text>
                            ) : (
                                topCadets.map((cadet, index) => (
                                    <TouchableOpacity
                                        key={cadet.id}
                                        style={[styles.topCadetRow, index === topCadets.length - 1 && { borderBottomWidth: 0 }]}
                                        onPress={() => router.push(`/(admin)/cadet-detail?id=${cadet.id}`)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.rankIcon}>
                                            <Text style={styles.rankText}>{index + 1}</Text>
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 16 }}>
                                            <Text style={styles.topCadetName} numberOfLines={1}>{cadet.fullName}</Text>
                                            <Text style={styles.topCadetPoints}>{cadet.rank || 'Cadet'}</Text>
                                        </View>
                                        <View style={styles.pointsBadge}>
                                            <Text style={styles.pointsValue}>{cadet.totalPoints || 0} pts</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            )}
                        </Card>
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
    greeting: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 2 },
    name: { color: COLORS.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
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
    statsGrid: {
        flexDirection: 'row',
        marginHorizontal: -6,
    },
    loaderContainer: { marginHorizontal: 6 },
    topCadetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 24, // Aligned with new card padding
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    rankIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    rankText: { color: COLORS.textInverse, fontSize: 16, fontWeight: '800' },
    topCadetName: { fontSize: 16, fontWeight: '700', color: COLORS.text, letterSpacing: -0.2 },
    topCadetPoints: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500', marginTop: 4 },
    pointsBadge: {
        backgroundColor: COLORS.successBg,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.success + '20', // subtle border for crispness
    },
    pointsValue: { fontSize: 14, fontWeight: '800', color: COLORS.success },
    emptyText: { textAlign: 'center', color: COLORS.textMuted, padding: 32, fontSize: 15, fontWeight: '500' },
});

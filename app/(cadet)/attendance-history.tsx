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
    FlatList,
    SafeAreaView,
    StyleSheet,
    
    TouchableOpacity,
    View} from 'react-native';

// ── Type config ───────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { label: string; color: string; points: number }> = {
    normal: { label: 'Normal Parade', color: COLORS.navy, points: 5 },
    extra: { label: 'Extra Parade', color: '#6A1B9A', points: 10 },
    camp: { label: 'Camp', color: COLORS.success, points: 50 },
    duty: { label: 'Duty', color: COLORS.warning, points: 20 },
};

interface Session {
    id: string;
    date: string;
    type: string;
    totalPresent: number;
    totalCadets: number;
}

function formatDateDisplay(iso: string) {
    const [y, m, d] = iso.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d} ${months[parseInt(m) - 1]} ${y}`;
}

export default function CadetAttendanceHistoryScreen() {
    const { userProfile } = useAuth();
    const router = useRouter();

    const [attended, setAttended] = useState<Session[]>([]);
    const [totalSessions, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userProfile?.uid) return;
        fetchHistory();
    }, [userProfile?.uid]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const uid = userProfile!.uid;

            // Sessions this cadet attended (array-contains query)
            const attendedQ = query(
                collection(db, 'attendance'),
                where('presentCadets', 'array-contains', uid),
            );
            const attendedSnap = await getDocs(attendedQ);
            const attendedList: Session[] = attendedSnap.docs
                .map(d => ({ id: d.id, ...d.data() } as Session))
                .sort((a, b) => b.date.localeCompare(a.date)); // newest first

            // Total sessions ever (for % calc)
            const allSnap = await getDocs(collection(db, 'attendance'));
            const total = allSnap.size;

            setAttended(attendedList);
            setTotal(total);
        } catch (e) {
            console.error('History fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    // ── Derived stats ────────────────────────────────────────────────────
    const pct = totalSessions > 0
        ? Math.round((attended.length / totalSessions) * 100)
        : 0;

    const earnedByType = attended.reduce((acc, s) => {
        const cfg = TYPE_CONFIG[s.type];
        if (cfg) acc[s.type] = (acc[s.type] ?? 0) + cfg.points;
        return acc;
    }, {} as Record<string, number>);

    const totalEarned = Object.values(earnedByType).reduce((a, b) => a + b, 0);

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Attendance History</Text>
                <View style={{ width: 30 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.navy} />
                </View>
            ) : (
                <FlatList
                    data={attended}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={
                        <>
                            {/* Summary Card */}
                            <View style={styles.summaryCard}>
                                {/* Attendance % circle */}
                                <View style={styles.pctSection}>
                                    <View style={styles.pctCircle}>
                                        <Text style={styles.pctNumber}>{pct}%</Text>
                                        <Text style={styles.pctLabel}>Attendance</Text>
                                    </View>
                                    <View style={styles.pctMeta}>
                                        <Text style={styles.metaLine}>
                                            <Text style={styles.metaBold}>{attended.length}</Text> sessions attended
                                        </Text>
                                        <Text style={styles.metaLine}>
                                            out of <Text style={styles.metaBold}>{totalSessions}</Text> total
                                        </Text>
                                        <View style={styles.pctBarTrack}>
                                            <View style={[styles.pctBarFill, { width: `${pct}%` }]} />
                                        </View>
                                    </View>
                                </View>

                                {/* Points earned by type */}
                                <View style={styles.divider} />
                                <Text style={styles.subTitle}>Points Earned by Category</Text>
                                <View style={styles.typeGrid}>
                                    {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                                        <View
                                            key={key}
                                            style={[styles.typeCell, { borderTopColor: cfg.color }]}
                                        >
                                            <Text style={[styles.typeCellValue, { color: cfg.color }]}>
                                                {earnedByType[key] ?? 0}
                                            </Text>
                                            <Text style={styles.typeCellLabel}>{cfg.label}</Text>
                                        </View>
                                    ))}
                                </View>

                                <View style={[styles.totalRow]}>
                                    <Text style={styles.totalLabel}>Total Points from Attendance</Text>
                                    <Text style={styles.totalValue}>{totalEarned} pts</Text>
                                </View>
                            </View>

                            {/* History list header */}
                            {attended.length > 0 && (
                                <Text style={styles.listHeader}>Session History</Text>
                            )}
                        </>
                    }
                    renderItem={({ item }) => {
                        const cfg = TYPE_CONFIG[item.type] ?? { label: item.type, color: COLORS.midGray, points: 0 };
                        return (
                            <View style={styles.sessionCard}>
                                <View style={[styles.sessionTypeBar, { backgroundColor: cfg.color }]} />
                                <View style={styles.sessionBody}>
                                    <View style={styles.sessionMain}>
                                        <Text style={styles.sessionDate}>{formatDateDisplay(item.date)}</Text>
                                        <View style={[styles.typePill, { backgroundColor: cfg.color + '18' }]}>
                                            <Text style={[styles.typePillText, { color: cfg.color }]}>{cfg.label}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.sessionRight}>
                                        <Text style={[styles.sessionPts, { color: cfg.color }]}>+{cfg.points} pts</Text>
                                        <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                                    </View>
                                </View>
                            </View>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Ionicons name="calendar-outline" size={40} color={COLORS.midGray} />
                            <Text style={styles.emptyText}>No attendance records yet.</Text>
                            <Text style={styles.emptySub}>Sessions you attend will appear here.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.offWhite },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: COLORS.navy,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 28,
        paddingBottom: 16,
    },
    backBtn: { padding: 4 },
    headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
    listContent: { padding: 16, paddingBottom: 40 },
    // Summary card
    summaryCard: {
        backgroundColor: COLORS.white,
        borderRadius: 14,
        padding: 18,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    pctSection: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 14 },
    pctCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: COLORS.navy,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pctNumber: { color: COLORS.white, fontSize: 24, fontWeight: '800' },
    pctLabel: { color: COLORS.lightGray, fontSize: 10, marginTop: 2 },
    pctMeta: { flex: 1 },
    metaLine: { fontSize: 13, color: COLORS.darkGray, marginBottom: 4 },
    metaBold: { fontWeight: '700', color: COLORS.darkText },
    pctBarTrack: {
        height: 7,
        backgroundColor: COLORS.lightGray,
        borderRadius: 4,
        overflow: 'hidden',
        marginTop: 8,
    },
    pctBarFill: { height: '100%', backgroundColor: COLORS.navy, borderRadius: 4 },
    divider: { height: 1, backgroundColor: COLORS.offWhite, marginVertical: 14 },
    subTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.navy,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 12,
    },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
    typeCell: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: COLORS.offWhite,
        borderRadius: 8,
        padding: 10,
        borderTopWidth: 3,
        alignItems: 'center',
    },
    typeCellValue: { fontSize: 22, fontWeight: '800' },
    typeCellLabel: { fontSize: 10, color: COLORS.midGray, marginTop: 3, textAlign: 'center' },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#EFF3FF',
        borderRadius: 8,
        padding: 12,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.navy,
    },
    totalLabel: { fontSize: 13, fontWeight: '600', color: COLORS.navy },
    totalValue: { fontSize: 16, fontWeight: '800', color: COLORS.navy },
    // List header
    listHeader: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.navy,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 10,
    },
    // Session card
    sessionCard: {
        backgroundColor: COLORS.white,
        borderRadius: 10,
        marginBottom: 8,
        flexDirection: 'row',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    sessionTypeBar: { width: 5 },
    sessionBody: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 13,
    },
    sessionMain: { flex: 1 },
    sessionDate: { fontSize: 14, fontWeight: '600', color: COLORS.darkText, marginBottom: 5 },
    typePill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    typePillText: { fontSize: 11, fontWeight: '600' },
    sessionRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sessionPts: { fontSize: 15, fontWeight: '800' },
    // Empty
    emptyBox: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: COLORS.darkGray, fontSize: 15, marginTop: 12, fontWeight: '500' },
    emptySub: { color: COLORS.midGray, fontSize: 13, marginTop: 6 },
});

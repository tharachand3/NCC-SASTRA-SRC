import { db } from '@/config/firebase';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/Colors';
import { UserProfile } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StyleSheet,
    
    View
} from 'react-native';

import { Card } from '../../components/ui/Card';

const RANK_PRIORITY: Record<string, number> = {
    'CUO': 1,
    'Sergent': 2,
    'CPL': 3,
    'LCPL': 4,
    'Cadet': 5
};

export default function LeaderboardScreen() {
    const [cadets, setCadets] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch all active cadets
        const q = query(
            collection(db, 'users'),
            where('role', '==', 'cadet'),
            where('status', '==', 'active')
        );

        // Real-time listener
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));

            // Sort by rank priority, then totalPoints descending
            data.sort((a, b) => {
                const rankA = RANK_PRIORITY[a.cdtRank || 'Cadet'] ?? 5;
                const rankB = RANK_PRIORITY[b.cdtRank || 'Cadet'] ?? 5;
                if (rankA !== rankB) {
                    return rankA - rankB; // Ascending priority (1 is highest)
                }
                const ptsA = a.totalPoints ?? 0;
                const ptsB = b.totalPoints ?? 0;
                return ptsB - ptsA;
            });

            setCadets(data);
            setLoading(false);
        });

        // Cleanup listener on unmount
        return () => unsub();
    }, []);

    const renderItem = ({ item, index }: { item: UserProfile; index: number }) => {
        // Rank logic
        const rank = index + 1;

        let rankColor = COLORS.primary;
        let badgeColor = COLORS.primaryLight;
        let isTop3 = false;

        if (rank === 1) {
            rankColor = '#B8860B'; // Gold
            badgeColor = '#FFF8DC';
            isTop3 = true;
        } else if (rank === 2) {
            rankColor = '#708090'; // Silver
            badgeColor = '#F5F5F5';
            isTop3 = true;
        } else if (rank === 3) {
            rankColor = '#CD7F32'; // Bronze
            badgeColor = '#FFF5EE';
            isTop3 = true;
        }

        return (
            <Card style={[styles.card, isTop3 && { borderColor: rankColor, borderWidth: 1 }]}>
                <View style={styles.rankContainer}>
                    <View style={[styles.rankBadge, { backgroundColor: badgeColor }]}>
                        {isTop3 ? (
                            <Ionicons name="trophy" size={20} color={rankColor} />
                        ) : (
                            <Text style={[styles.rankText, { color: rankColor }]}>#{rank}</Text>
                        )}
                    </View>
                </View>

                <View style={styles.infoContainer}>
                    <Text style={styles.name} numberOfLines={1}>{item.fullName}</Text>
                    <Text style={[styles.sub, { color: COLORS.primary, fontWeight: '700', marginBottom: 2 }]}>
                        {item.cdtRank || 'Cadet'} • {item.wing || 'SD'} {item.squad || 'Alpha'}
                    </Text>
                    <Text style={styles.sub}>{item.department} • {item.year}</Text>
                </View>

                <View style={[styles.pointsContainer, { backgroundColor: rankColor + '15' }]}>
                    <Text style={[styles.points, { color: rankColor }]}>{item.totalPoints ?? 0}</Text>
                    <Text style={[styles.pointsLabel, { color: rankColor }]}>pts</Text>
                </View>
            </Card>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Leaderboard</Text>
                <Ionicons name="podium" size={24} color={COLORS.text} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={cadets}
                    renderItem={renderItem}
                    keyExtractor={item => item.uid}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="trophy-outline" size={48} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>No cadets on the leaderboard yet.</Text>
                        </View>
                    }
                    ListHeaderComponent={
                        <View style={styles.listHeaderBox}>
                            <Text style={styles.listHeaderText}>Top Cadets</Text>
                            <Text style={styles.listHeaderSubText}>Ranking based on Rank and Total Points</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
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
    headerTitle: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
    list: { padding: 16, paddingBottom: 40 },
    listHeaderBox: { marginBottom: 16 },
    listHeaderText: { fontSize: 18, fontWeight: '700', color: COLORS.text },
    listHeaderSubText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
    card: {
        flexDirection: 'row',
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
    },
    rankContainer: { width: 44, alignItems: 'center', marginRight: 12 },
    rankBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankText: { fontSize: 15, fontWeight: '700' },
    infoContainer: { flex: 1 },
    name: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
    sub: { fontSize: 13, color: COLORS.textSecondary },
    pointsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 64,
    },
    points: { fontSize: 16, fontWeight: '800' },
    pointsLabel: { fontSize: 11, fontWeight: '600', marginTop: -2 },
    empty: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: COLORS.textMuted, fontSize: 15, marginTop: 12 },
});

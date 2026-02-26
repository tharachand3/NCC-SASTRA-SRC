import { db } from '@/config/firebase';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StyleSheet,
    
    TouchableOpacity,
    View
} from 'react-native';

export default function AttendanceHistoryScreen() {
    const router = useRouter();
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'attendance'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSessions(data);
            setLoading(false);
        });

        return () => unsub();
    }, []);

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(admin)/attendance-detail?id=${item.id}`)}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={styles.dateBox}>
                    <Text style={styles.dateText}>{item.date}</Text>
                </View>
                <View style={styles.pointsBadge}>
                    <Text style={styles.pointsText}>+{item.points} pts</Text>
                </View>
            </View>
            <Text style={styles.eventName}>{item.eventName}</Text>

            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Ionicons name="people" size={16} color={COLORS.midGray} />
                    <Text style={styles.statText}>{item.totalPresent} Present</Text>
                </View>
                <View style={styles.stat}>
                    <Ionicons name="time-outline" size={16} color={COLORS.midGray} />
                    <Text style={styles.statText}>
                        {new Date((item.createdAt?.seconds || 0) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Past Sessions</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={sessions}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="calendar-outline" size={48} color={COLORS.border} />
                            <Text style={styles.emptyText}>No attendance sessions found.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 16,
    },
    backBtn: { padding: 4 },
    headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 16, paddingBottom: 40 },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    dateBox: {
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    dateText: { color: COLORS.primary, fontWeight: '700', fontSize: 12 },
    pointsBadge: {
        backgroundColor: COLORS.successBg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    pointsText: { color: COLORS.success, fontWeight: '700', fontSize: 12 },
    eventName: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
    statsRow: { flexDirection: 'row', gap: 16 },
    stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
    emptyText: { marginTop: 12, color: COLORS.textSecondary, fontSize: 15 },
});

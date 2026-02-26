import { db } from '@/config/firebase';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, increment, query, where, writeBatch } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    
    TouchableOpacity,
    View
} from 'react-native';
import { Card } from '../../components/ui/Card';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { UserProfile } from '../../context/AuthContext';

export default function AttendanceDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [session, setSession] = useState<any>(null);
    const [cadets, setCadets] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!id) return;
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const docRef = doc(db, 'attendance', id as string);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                Alert.alert('Error', 'Session not found');
                router.back();
                return;
            }
            const sessionData = { id: docSnap.id, ...(docSnap.data() as any) };
            setSession(sessionData);

            if (sessionData.presentCadets?.length > 0) {
                const q = query(collection(db, 'users'), where('role', '==', 'cadet'));
                const usersSnap = await getDocs(q);
                const usersList = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));

                const presentList = usersList.filter(u => sessionData.presentCadets.includes(u.uid));
                presentList.sort((a, b) => (a.fullName ?? '').localeCompare(b.fullName ?? ''));
                setCadets(presentList);
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to load details.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Session',
            `Are you sure you want to delete this session? This will reverse the awarded points (-${session?.points} pts) for all present cadets.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: performDelete }
            ]
        );
    };

    const performDelete = async () => {
        setDeleting(true);
        try {
            const batch = writeBatch(db);

            // 1. Delete session doc
            batch.delete(doc(db, 'attendance', id as string));

            // 2. Find and delete all associated points_log entries
            const logQuery = query(collection(db, 'points_log'), where('sessionId', '==', id));
            const logSnap = await getDocs(logQuery);
            logSnap.docs.forEach(d => {
                batch.delete(d.ref);
            });

            // 3. Decrement points for all present cadets
            if (session?.presentCadets?.length > 0 && session?.points > 0) {
                session.presentCadets.forEach((cadetId: string) => {
                    batch.update(doc(db, 'users', cadetId), {
                        totalPoints: increment(-session.points)
                    });
                });
            }

            await batch.commit();

            Alert.alert('Success', 'Session deleted and points reversed.', [
                { text: 'OK', onPress: () => router.back() }
            ]);

        } catch (e: any) {
            console.error(e);
            Alert.alert('Error', e?.message || 'Failed to delete session.');
        } finally {
            setDeleting(false);
        }
    };

    const renderItem = ({ item }: { item: UserProfile }) => (
        <Card style={styles.cadetRow}>
            <View style={styles.cadetAvatar}>
                <Text style={styles.cadetAvatarText}>{item.fullName?.[0]?.toUpperCase() ?? 'C'}</Text>
            </View>
            <View style={styles.cadetInfo}>
                <Text style={styles.cadetName}>{item.fullName}</Text>
                <Text style={styles.cadetSub}>{item.registerNumber} • {item.department}</Text>
            </View>
            <View style={styles.ptsBadge}>
                <Text style={styles.ptsText}>+{session?.points}</Text>
            </View>
        </Card>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Session Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <Card style={styles.infoCard}>
                <Text style={styles.eventName}>{session?.eventName}</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Date:</Text>
                    <Text style={styles.infoVal}>{session?.date}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Points per cadet:</Text>
                    <Text style={styles.infoVal}>+{session?.points}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Total Present:</Text>
                    <Text style={styles.infoVal}>{session?.totalPresent}</Text>
                </View>

                <PrimaryButton
                    title="Delete Session"
                    variant="danger"
                    onPress={handleDelete}
                    loading={deleting}
                    style={{ marginTop: 24 }}
                />
            </Card>

            <View style={styles.listHeader}>
                <Text style={styles.listTitle}>Present Cadets</Text>
            </View>

            <FlatList
                data={cadets}
                keyExtractor={item => item.uid}
                contentContainerStyle={styles.list}
                renderItem={renderItem}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={styles.emptyText}>No cadets were marked present.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        backgroundColor: COLORS.card,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backBtn: { padding: 8, backgroundColor: COLORS.primaryLight, borderRadius: 12 },
    headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    infoCard: {
        padding: 20,
        margin: 16,
    },
    eventName: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    infoLabel: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500' },
    infoVal: { fontSize: 15, color: COLORS.text, fontWeight: '700' },
    listHeader: { paddingHorizontal: 20, marginBottom: 12, marginTop: 8 },
    listTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
    list: { paddingHorizontal: 16, paddingBottom: 40 },
    cadetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 10,
        gap: 14,
    },
    cadetAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cadetAvatarText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
    cadetInfo: { flex: 1 },
    cadetName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
    cadetSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    ptsBadge: { backgroundColor: COLORS.successBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    ptsText: { fontSize: 12, fontWeight: '700', color: COLORS.success },
    emptyText: { color: COLORS.textSecondary, fontSize: 15 },
});

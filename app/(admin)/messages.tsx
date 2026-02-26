import { db } from '@/config/firebase';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet,  TouchableOpacity, View } from 'react-native';

export default function AdminMessages() {
    const { userProfile } = useAuth();
    const router = useRouter();
    const [threads, setThreads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'messages'), orderBy('lastUpdated', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setThreads(data);
            setLoading(false);
        });
        return unsub;
    }, []);

    const formatDate = (ts: any) => {
        if (!ts) return '';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        const today = new Date();
        if (d.toDateString() === today.toDateString()) {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Cadet Messages</Text>
                    <Text style={styles.subtitle}>Inbox</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={COLORS.navy} /></View>
            ) : threads.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="chatbubbles-outline" size={48} color={COLORS.midGray} />
                    <Text style={styles.emptyText}>No messages yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={threads}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => router.push({ pathname: '/(admin)/chat', params: { cadetId: item.id, cadetName: item.cadetName } })}
                        >
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{item.cadetName?.[0]?.toUpperCase() || 'C'}</Text>
                            </View>
                            <View style={styles.info}>
                                <View style={styles.row}>
                                    <Text style={[styles.name, item.unreadByAdmin && styles.unreadName]}>
                                        {item.cadetName || 'Unknown Cadet'}
                                    </Text>
                                    <Text style={[styles.time, item.unreadByAdmin && styles.unreadTime]}>
                                        {formatDate(item.lastUpdated)}
                                    </Text>
                                </View>
                                <Text style={[styles.msg, item.unreadByAdmin && styles.unreadMsg]} numberOfLines={1}>
                                    {item.lastMessage || 'No messages'}
                                </Text>
                            </View>
                            {item.unreadByAdmin && <View style={styles.dot} />}
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.offWhite },
    header: {
        backgroundColor: COLORS.navy, paddingHorizontal: 16, paddingTop: 28, paddingBottom: 16,
        flexDirection: 'row', alignItems: 'center', gap: 12
    },
    backBtn: { padding: 4 },
    title: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
    subtitle: { color: COLORS.lightGray, fontSize: 12, marginTop: 2 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: COLORS.midGray, fontSize: 15, marginTop: 12 },
    list: { padding: 16 },
    card: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
        padding: 16, borderRadius: 12, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2
    },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.navy, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
    info: { flex: 1 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    name: { fontSize: 15, fontWeight: '600', color: COLORS.darkText },
    unreadName: { fontWeight: '800' },
    time: { fontSize: 12, color: COLORS.midGray },
    unreadTime: { color: COLORS.navy, fontWeight: '700' },
    msg: { fontSize: 14, color: COLORS.darkGray },
    unreadMsg: { color: COLORS.darkText, fontWeight: '600' },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.navy, marginLeft: 12 }
});

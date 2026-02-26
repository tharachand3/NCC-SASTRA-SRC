import { db } from '@/config/firebase';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    SafeAreaView,
    StyleSheet,
    
    TouchableOpacity,
    View} from 'react-native';

interface Announcement {
    id: string;
    title: string;
    description: string;
    link?: string;
    createdAt?: any;
    createdBy?: string;
    isDeleted?: boolean;
}

export default function AdminAnnouncementsScreen() {
    const router = useRouter();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'announcements'),
            orderBy('createdAt', 'desc')
        );

        const unsub = onSnapshot(q, (snap) => {
            let data = snap.docs
                .map(d => ({ id: d.id, ...d.data() } as Announcement))
                .filter(a => !a.isDeleted);

            setAnnouncements(data);
            setLoading(false);
        }, (err) => {
            console.error(err);
            Alert.alert('Error', 'Failed to load announcements.');
            setLoading(false);
        });

        return () => unsub();
    }, []);

    const handleDelete = (id: string, title: string) => {
        Alert.alert(
            'Delete Announcement',
            `Are you sure you want to delete "${title}" ? `,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Soft Delete
                            await updateDoc(doc(db, 'announcements', id), { isDeleted: true });
                        } catch (e) {
                            Alert.alert('Error', 'Could not delete announcement.');
                        }
                    },
                },
            ]
        );
    };

    const openLink = async (url: string) => {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert('Invalid URL', 'Cannot open this link.');
        }
    };

    const isNew = (createdAt: any) => {
        if (!createdAt?.toDate) return false;
        const diff = new Date().getTime() - createdAt.toDate().getTime();
        return diff < 24 * 60 * 60 * 1000; // less than 24 hours
    };

    const formatDate = (createdAt: any) => {
        if (!createdAt?.toDate) return 'Just now';
        return createdAt.toDate().toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const renderItem = ({ item }: { item: Announcement }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.titleRow}>
                    {isNew(item.createdAt) && (
                        <View style={styles.newBadge}>
                            <Text style={styles.newBadgeText}>NEW</Text>
                        </View>
                    )}
                    <Text style={styles.title}>{item.title}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.title)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={18} color={COLORS.red} />
                </TouchableOpacity>
            </View>

            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>

            <Text style={styles.desc}>{item.description}</Text>

            {item.link ? (
                <TouchableOpacity style={styles.linkBtn} onPress={() => openLink(item.link as string)}>
                    <Ionicons name="link-outline" size={16} color={COLORS.navy} />
                    <Text style={styles.linkText} numberOfLines={1}>{item.link}</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Announcements</Text>
                <Ionicons name="megaphone-outline" size={24} color={COLORS.white} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.navy} />
                </View>
            ) : (
                <FlatList
                    data={announcements}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="notifications-off-outline" size={48} color={COLORS.midGray} />
                            <Text style={styles.emptyText}>No announcements posted yet.</Text>
                        </View>
                    }
                />
            )}

            {/* Fab to add announcement */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/(admin)/add-announcement')}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={28} color={COLORS.white} />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.offWhite },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: COLORS.navy,
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: { color: COLORS.white, fontSize: 22, fontWeight: '700' },
    list: { padding: 16, paddingBottom: 80 },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    titleRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6 },
    title: { fontSize: 16, fontWeight: '700', color: COLORS.darkText, flexShrink: 1 },
    newBadge: {
        backgroundColor: COLORS.red,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 2,
    },
    newBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: '800' },
    deleteBtn: { padding: 4, marginLeft: 8 },
    date: { fontSize: 11, color: COLORS.midGray, marginBottom: 12 },
    desc: { fontSize: 14, color: COLORS.darkText, lineHeight: 22 },
    linkBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.offWhite,
    },
    linkText: { fontSize: 13, color: COLORS.navy, fontWeight: '500', flex: 1 },
    empty: { alignItems: 'center', marginTop: 80 },
    emptyText: { color: COLORS.midGray, fontSize: 15, marginTop: 12 },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.red,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
});

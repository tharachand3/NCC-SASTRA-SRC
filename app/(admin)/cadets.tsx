import { db } from '@/config/firebase';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/Colors';
import { UserProfile } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    
    TextInput, TouchableOpacity,
    View
} from 'react-native';

import { Card } from '../../components/ui/Card';
import { PrimaryButton } from '../../components/ui/PrimaryButton';

export default function AdminCadetsScreen() {
    const router = useRouter();
    const [cadets, setCadets] = useState<UserProfile[]>([]);
    const [filtered, setFiltered] = useState<UserProfile[]>([]);
    const [search, setSearch] = useState('');
    const [wingFilter, setWingFilter] = useState('All');
    const [squadFilter, setSquadFilter] = useState('All');
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'active' | 'passedOut'>('active');

    useEffect(() => {
        const q = query(
            collection(db, 'users'),
            where('role', '==', 'cadet'),
            where('status', '==', tab),
        );
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
            // Sort by name
            data.sort((a, b) => (a.fullName ?? '').localeCompare(b.fullName ?? ''));
            setCadets(data);
            setLoading(false);
        });
        return unsub;
    }, [tab]);

    useEffect(() => {
        let result = cadets;

        const q = search.trim().toLowerCase();
        if (q) {
            result = result.filter(c =>
                c.fullName?.toLowerCase().includes(q) ||
                c.registerNumber?.toLowerCase().includes(q) ||
                c.department?.toLowerCase().includes(q)
            );
        }

        if (wingFilter !== 'All') {
            result = result.filter(c => c.wing === wingFilter);
        }

        if (squadFilter !== 'All') {
            result = result.filter(c => c.squad === squadFilter);
        }

        setFiltered(result);
    }, [search, wingFilter, squadFilter, cadets]);

    const renderCadet = ({ item }: { item: UserProfile }) => (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/(admin)/cadet-detail', params: { uid: item.uid } })}
        >
            <Card style={styles.card}>
                <View style={styles.cardLeft}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.fullName?.[0]?.toUpperCase() ?? 'C'}</Text>
                    </View>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.name} numberOfLines={1}>{item.fullName}</Text>
                        <Text style={[styles.sub, { fontWeight: '700', color: COLORS.primary, marginBottom: 2 }]}>
                            {item.cdtRank || 'Cadet'} • {item.wing || 'SD'} {item.squad || 'QA'}
                        </Text>
                        <Text style={styles.sub}>{item.registerNumber} • {item.department}</Text>
                    </View>
                </View>
                <View style={styles.cardRight}>
                    <View style={styles.pointsBadge}>
                        <Text style={styles.pointsText}>{item.totalPoints ?? 0} pts</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={{ marginTop: 4 }} />
                </View>
            </Card>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Cadets</Text>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => router.push('/(admin)/add-cadet')}
                    activeOpacity={0.85}
                >
                    <Ionicons name="add" size={20} color={COLORS.white} />
                    <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
            </View>

            {/* Toggle Tabs */}
            <View style={styles.toggleRow}>
                <TouchableOpacity
                    style={[styles.toggleBtn, tab === 'active' && styles.toggleActive]}
                    onPress={() => setTab('active')}
                >
                    <Text style={[styles.toggleText, tab === 'active' && styles.toggleTextActive]}>Active</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleBtn, tab === 'passedOut' && styles.toggleActive]}
                    onPress={() => setTab('passedOut')}
                >
                    <Text style={[styles.toggleText, tab === 'passedOut' && styles.toggleTextActive]}>Alumni</Text>
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
                <Ionicons name="search-outline" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name, reg. no. or dept..."
                    placeholderTextColor={COLORS.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filters */}
            <View style={{ paddingHorizontal: 16 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    <Text style={styles.filterLabel}>Wing:</Text>
                    {['All', 'SD', 'SW'].map(w => (
                        <TouchableOpacity
                            key={w}
                            style={[styles.filterChip, wingFilter === w && styles.filterChipActive]}
                            onPress={() => setWingFilter(w)}
                        >
                            <Text style={[styles.filterChipText, wingFilter === w && styles.filterChipTextActive]}>{w}</Text>
                        </TouchableOpacity>
                    ))}

                    <View style={{ width: 12 }} />
                    <Text style={styles.filterLabel}>Squad:</Text>
                    {['All', 'Alpha', 'Bravo', 'Charlie', 'Delta'].map(s => (
                        <TouchableOpacity
                            key={s}
                            style={[styles.filterChip, squadFilter === s && styles.filterChipActive]}
                            onPress={() => setSquadFilter(s)}
                        >
                            <Text style={[styles.filterChipText, squadFilter === s && styles.filterChipTextActive]}>{s}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Count */}
            {!loading && (
                <Text style={styles.count}>{filtered.length} cadet{filtered.length !== 1 ? 's' : ''}</Text>
            )}

            {/* List */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : filtered.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>No cadets found.</Text>
                    {tab === 'active' && (
                        <PrimaryButton
                            title="+ Add First Cadet"
                            onPress={() => router.push('/(admin)/add-cadet')}
                            style={{ paddingHorizontal: 24, marginTop: 12 }}
                        />
                    )}
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.uid}
                    renderItem={renderCadet}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
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
    headerTitle: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
    addBtn: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        gap: 6,
    },
    addBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 13 },
    toggleRow: {
        flexDirection: 'row',
        backgroundColor: COLORS.card,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
        marginHorizontal: 4,
        backgroundColor: COLORS.background,
    },
    toggleActive: { backgroundColor: COLORS.primary },
    toggleText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: 14 },
    toggleTextActive: { color: COLORS.white },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    searchIcon: { marginRight: 8 },
    searchInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 15,
        color: COLORS.text,
    },
    count: {
        marginLeft: 20,
        marginVertical: 8,
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    list: { paddingHorizontal: 16, paddingBottom: 24 },
    card: {
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        // Card inherently provides border, but we ensure list padding stands out
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: { color: COLORS.primary, fontSize: 20, fontWeight: '700' },
    name: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 4, letterSpacing: -0.2 },
    sub: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
    cardRight: { alignItems: 'flex-end', paddingLeft: 8 },
    pointsBadge: {
        backgroundColor: COLORS.successBg,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: COLORS.success + '20',
    },
    pointsText: { fontSize: 13, fontWeight: '800', color: COLORS.success },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: COLORS.textMuted, fontSize: 15, marginTop: 16 },
    filterScroll: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    filterLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginRight: 10 },
    filterChip: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
        marginRight: 8
    },
    filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    filterChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
    filterChipTextActive: { color: COLORS.white },
});

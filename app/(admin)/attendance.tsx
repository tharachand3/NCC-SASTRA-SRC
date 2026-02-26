import { db } from '@/config/firebase';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/Colors';
import { useAuth, UserProfile } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    collection,
    doc,
    getDocs,
    increment,
    query,
    serverTimestamp,
    where,
    writeBatch
} from 'firebase/firestore';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { Card } from '../../components/ui/Card';
import { PrimaryButton } from '../../components/ui/PrimaryButton';

// ─── Date helpers ────────────────────────────────────────────────────
function formatDate(d: Date): string {
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function isoDate(d: Date): string {
    return d.toISOString().split('T')[0];
}


// ─── Component ───────────────────────────────────────────────────────
export default function AdminAttendanceScreen() {
    const { userProfile } = useAuth();
    const router = useRouter();

    // Step: 'config' → 'mark'
    const [step, setStep] = useState<'config' | 'mark'>('config');

    // Session config
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [eventName, setEventName] = useState<string>('');
    const [pointsValue, setPointsValue] = useState<string>('');
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    // Cadets
    const [cadets, setCadets] = useState<UserProfile[]>([]);
    const [loadingCadets, setLoadingCadets] = useState(false);
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

    // Saving
    const [saving, setSaving] = useState(false);

    // ── Adjust date by N days
    const shiftDate = (days: number) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setSelectedDate(d);
    };

    // ── Load all active cadets from Firestore
    const loadCadets = async () => {
        if (!eventName.trim() || !pointsValue.trim()) {
            Alert.alert('Missing Info', 'Please provide an Event Name and Points Value.');
            return;
        }
        const pts = parseInt(pointsValue, 10);
        if (isNaN(pts) || pts <= 0) {
            Alert.alert('Invalid Points', 'Points must be a positive number.');
            return;
        }

        setLoadingCadets(true);
        try {
            const q = query(collection(db, 'users'), where('role', '==', 'cadet'), where('status', '==', 'active'));
            const snap = await getDocs(q);
            const list = snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
            list.sort((a, b) => (a.fullName ?? '').localeCompare(b.fullName ?? ''));
            setCadets(list);
            setCheckedIds(new Set());
            setStep('mark');
        } catch (e) {
            Alert.alert('Error', 'Failed to load cadets. Check your connection.');
        } finally {
            setLoadingCadets(false);
        }
    };

    // ── Toggle a cadet checkbox
    const toggleCadet = (uid: string) => {
        setCheckedIds(prev => {
            const next = new Set(prev);
            next.has(uid) ? next.delete(uid) : next.add(uid);
            return next;
        });
    };

    // ── Toggle all
    const toggleAll = () => {
        if (checkedIds.size === cadets.length) {
            setCheckedIds(new Set());
        } else {
            setCheckedIds(new Set(cadets.map(c => c.uid)));
        }
    };

    // ── Execute save
    const executeSave = async () => {
        setSaving(true);
        try {
            // Data Protection: Duplicate Session Check
            const dateStr = isoDate(selectedDate);
            const typeLabel = eventName.trim();
            const points = parseInt(pointsValue, 10) || 0;

            const dupQuery = query(
                collection(db, 'attendance'),
                where('date', '==', dateStr),
                where('eventName', '==', typeLabel)
            );
            const dupSnap = await getDocs(dupQuery);
            if (!dupSnap.empty) {
                Alert.alert('Duplicate Session', `Attendance for ${typeLabel} on ${dateStr} has already been recorded.`);
                setSaving(false);
                return;
            }

            const batch = writeBatch(db);
            const presentCadetIds = Array.from(checkedIds);

            // 1. Create attendance session document
            const sessionRef = doc(collection(db, 'attendance'));
            batch.set(sessionRef, {
                date: dateStr,
                eventName: typeLabel,
                points: points,
                type: 'custom',
                presentCadets: presentCadetIds,
                totalPresent: presentCadetIds.length,
                totalCadets: cadets.length,
                createdBy: userProfile?.uid ?? '',
                createdAt: serverTimestamp(),
            });

            // 2. For each present cadet: points_log + update totalPoints
            for (const cadetId of presentCadetIds) {
                const logRef = doc(collection(db, 'points_log'));
                batch.set(logRef, {
                    userId: cadetId,
                    points,
                    reason: `${typeLabel} on ${dateStr}`,
                    sessionId: sessionRef.id,
                    type: 'custom',
                    createdAt: serverTimestamp(),
                });

                const userRef = doc(db, 'users', cadetId);
                batch.set(userRef, {
                    totalPoints: increment(points),
                }, { merge: true });
            }

            await batch.commit();

            setShowSuccessToast(true);
            setTimeout(() => {
                setShowSuccessToast(false);
                setStep('config');
                setCadets([]);
                setCheckedIds(new Set());
                setSelectedDate(new Date());
                setEventName('');
                setPointsValue('');
            }, 2000);

        } catch (e: any) {
            Alert.alert('Save Failed', `Error: ${e?.message ?? 'Unknown error saving attendance. Please try again.'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        if (checkedIds.size === 0) {
            Alert.alert('No Cadets Selected', 'Please mark at least one cadet as present.');
            return;
        }

        await executeSave();
    };


    // ════════════════════════════════════════
    // STEP 1 — Session Config
    // ════════════════════════════════════════
    if (step === 'config') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={[styles.header, { justifyContent: 'space-between' }]}>
                    <Text style={styles.headerTitle}>Attendance</Text>
                    {/* @ts-ignore - rigid expo router types */}
                    <TouchableOpacity onPress={() => router.push('/(admin)/attendance-history')} style={styles.iconBtn}>
                        <Ionicons name="time-outline" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={styles.scroll}>

                    <Card style={{ marginBottom: 16 }}>
                        <Text style={styles.sectionTitle}>Session Date</Text>
                        <View style={styles.dateRow}>
                            <TouchableOpacity style={styles.dateArrow} onPress={() => shiftDate(-1)}>
                                <Ionicons name="chevron-back" size={22} color={COLORS.text} />
                            </TouchableOpacity>
                            <View style={styles.dateCenter}>
                                <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
                                {isoDate(selectedDate) === isoDate(new Date()) && (
                                    <Text style={styles.todayBadge}>TODAY</Text>
                                )}
                            </View>
                            <TouchableOpacity style={styles.dateArrow} onPress={() => shiftDate(1)}>
                                <Ionicons name="chevron-forward" size={22} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                    </Card>

                    <Card style={{ marginBottom: 16 }}>
                        <Text style={styles.sectionTitle}>Event Details</Text>

                        <Text style={styles.inputLabel}>Event Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Independence Day Parade"
                            placeholderTextColor={COLORS.textMuted}
                            value={eventName}
                            onChangeText={setEventName}
                        />

                        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Points Value</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter points (e.g. 5, 20)"
                            placeholderTextColor={COLORS.textMuted}
                            value={pointsValue}
                            onChangeText={setPointsValue}
                            keyboardType="numeric"
                        />
                    </Card>

                    {eventName !== '' && pointsValue !== '' && (
                        <View style={styles.summary}>
                            <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
                            <Text style={styles.summaryText}>
                                Each present cadet will receive <Text style={{ fontWeight: '700' }}>+{pointsValue} points</Text> for {eventName}.
                            </Text>
                        </View>
                    )}

                    <PrimaryButton
                        title="LOAD CADETS"
                        onPress={loadCadets}
                        loading={loadingCadets}
                    // icon="arrow-forward"
                    />
                </ScrollView>
            </SafeAreaView>
        );
    }

    // ════════════════════════════════════════
    // STEP 2 — Mark Present Cadets
    // ════════════════════════════════════════
    const typeColor = COLORS.primary;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setStep('config')} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Mark Attendance</Text>
                    <Text style={styles.headerSub}>{formatDate(selectedDate)} • {eventName}</Text>
                </View>
                <View style={styles.headerRight}>
                    <View style={styles.countBadge}>
                        <Text style={styles.checkedCount}>{checkedIds.size}/{cadets.length}</Text>
                    </View>
                </View>
            </View>

            {/* Session info bar */}
            <View style={[styles.sessionBar, { backgroundColor: COLORS.card }]}>
                <Text style={styles.sessionBarText}>
                    <Text style={{ color: COLORS.primary, fontWeight: '700' }}>+{pointsValue} pts</Text> each
                </Text>
                <TouchableOpacity onPress={toggleAll} style={styles.selectAllBtn}>
                    <Text style={styles.selectAllText}>
                        {checkedIds.size === cadets.length ? 'Deselect All' : 'Select All'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Cadet List */}
            <FlatList
                data={cadets}
                keyExtractor={item => item.uid}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                    const checked = checkedIds.has(item.uid);
                    return (
                        <TouchableOpacity
                            style={[styles.cadetRow, checked && styles.cadetRowChecked]}
                            onPress={() => toggleCadet(item.uid)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.checkbox, checked && { backgroundColor: typeColor, borderColor: typeColor }]}>
                                {checked && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
                            </View>
                            <View style={[styles.cadetAvatar, checked && { backgroundColor: typeColor }]}>
                                <Text style={[styles.cadetAvatarText, checked && { color: COLORS.white }]}>{item.fullName?.[0]?.toUpperCase() ?? 'C'}</Text>
                            </View>
                            <View style={styles.cadetInfo}>
                                <Text style={styles.cadetName}>{item.fullName}</Text>
                                <Text style={styles.cadetSub}>{item.registerNumber} • {item.department}</Text>
                            </View>
                            {checked && (
                                <View style={[styles.ptsBadge, { backgroundColor: typeColor + '20' }]}>
                                    <Text style={[styles.ptsText, { color: typeColor }]}>+{pointsValue}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No active cadets found.</Text>
                    </View>
                }
            />

            {/* Save Button */}
            <View style={styles.footer}>
                <PrimaryButton
                    title={`SAVE ATTENDANCE (${checkedIds.size})`}
                    onPress={handleSave}
                    loading={saving}
                    disabled={cadets.length === 0}
                />
            </View>
        </SafeAreaView>
    );
}

// ─── Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        backgroundColor: COLORS.card,
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backBtn: { padding: 4 },
    headerTitle: { color: COLORS.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    headerSub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2, fontWeight: '600' },
    headerRight: {},
    iconBtn: { padding: 8, backgroundColor: COLORS.primaryLight, borderRadius: 12 },
    countBadge: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    checkedCount: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
    scroll: { padding: 16, paddingBottom: 36 },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 16,
    },
    // Date picker
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateArrow: {
        padding: 10,
        backgroundColor: COLORS.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    dateCenter: { alignItems: 'center' },
    dateText: { fontSize: 22, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
    todayBadge: {
        marginTop: 4,
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.white,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        letterSpacing: 1,
    },
    // Input Fields
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: COLORS.text,
    },
    summary: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: COLORS.primaryLight,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    summaryText: { fontSize: 14, color: COLORS.primary, flex: 1, lineHeight: 22, fontWeight: '500' },
    // Step 2
    sessionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    sessionBarText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
    selectAllBtn: {
        backgroundColor: COLORS.background,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    selectAllText: { color: COLORS.text, fontSize: 12, fontWeight: '600' },
    listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 110 },
    cadetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    cadetRowChecked: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primaryLight,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    cadetAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cadetAvatarText: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '700' },
    cadetInfo: { flex: 1 },
    cadetName: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 2, letterSpacing: -0.2 },
    cadetSub: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
    ptsBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    ptsText: { fontSize: 13, fontWeight: '800' },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
    emptyText: { color: COLORS.textMuted, fontSize: 15 },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: 24,
        backgroundColor: COLORS.card,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 10,
    },
});

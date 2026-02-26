import { db } from '@/config/firebase';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/Colors';
import { UserProfile, useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    SafeAreaView, ScrollView,
    StyleSheet,
    
    TextInput,
    TouchableOpacity,
    View} from 'react-native';

import { Card } from '../../components/ui/Card';
import { PrimaryButton } from '../../components/ui/PrimaryButton';

const RANKS = ['CUO', 'Sergent', 'CPL', 'LCPL', 'Cadet'];

interface CadetDocument {
    id: string;
    fileName: string;
    fileURL: string;
    status: 'pending' | 'approved' | 'rejected';
    uploadedAt: any;
    uploadedBy?: string;
    type?: string;
    rejectionReason?: string;
    isDeleted?: boolean;
}

export default function CadetDetailScreen() {
    const { uid } = useLocalSearchParams<{ uid: string }>();
    const router = useRouter();
    const { userProfile } = useAuth();
    const [cadet, setCadet] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Document Add State
    const [showDocForm, setShowDocForm] = useState(false);
    const [savingDoc, setSavingDoc] = useState(false);
    const [formName, setFormName] = useState('');
    const [formLink, setFormLink] = useState('');

    // Cadet Documents List State
    const [documents, setDocuments] = useState<CadetDocument[]>([]);
    const [docsLoading, setDocsLoading] = useState(true);

    const [showRankForm, setShowRankForm] = useState(false);
    const [updatingRank, setUpdatingRank] = useState(false);

    useEffect(() => {
        if (!uid) return;

        // Fetch cadet profile
        const fetchCadet = async () => {
            try {
                const snap = await getDoc(doc(db, 'users', uid));
                if (snap.exists()) {
                    setCadet({ uid: snap.id, ...snap.data() } as UserProfile);
                }
            } catch (e) {
                Alert.alert('Error', 'Failed to load cadet details.');
            } finally {
                setLoading(false);
            }
        };
        fetchCadet();

        // Listen for cadet's documents
        const qDocs = query(
            collection(db, 'documents'),
            where('userId', '==', uid),
            orderBy('uploadedAt', 'desc')
        );

        const unsubDocs = onSnapshot(qDocs, (snap) => {
            if (snap.empty) {
                setDocuments([]);
                setDocsLoading(false);
                return;
            }
            let data = snap.docs
                .map(d => ({ id: d.id, ...d.data() } as CadetDocument))
                .filter(d => !d.isDeleted);

            setDocuments(data);
            setDocsLoading(false);
        }, (err) => {
            console.error(err);
            Alert.alert("Error", "Failed to load cadet documents.");
            setDocsLoading(false);
        });

        return () => unsubDocs();
    }, [uid]);

    const handleMarkPassedOut = () => {
        Alert.alert(
            'Mark as Passed Out',
            `Are you sure you want to mark ${cadet?.fullName} as passed out? They will be moved to Alumni.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    style: 'destructive',
                    onPress: async () => {
                        setUpdating(true);
                        try {
                            await updateDoc(doc(db, 'users', uid!), { status: 'passedOut' });
                            Alert.alert('Done', `${cadet?.fullName} marked as passed out.`, [
                                { text: 'OK', onPress: () => router.back() },
                            ]);
                        } catch (e) {
                            Alert.alert('Error', 'Update failed.');
                        } finally {
                            setUpdating(false);
                        }
                    },
                },
            ]
        );
    };

    const handleMarkActive = () => {
        Alert.alert(
            'Restore to Active',
            `Mark ${cadet?.fullName} as active again?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        setUpdating(true);
                        try {
                            await updateDoc(doc(db, 'users', uid!), { status: 'active' });
                            setCadet(prev => prev ? { ...prev, status: 'active' } : prev);
                            Alert.alert('Done', `${cadet?.fullName} restored to active.`);
                        } catch (e) {
                            Alert.alert('Error', 'Update failed.');
                        } finally {
                            setUpdating(false);
                        }
                    },
                },
            ]
        );
    };

    const handleUpdateRank = async (newRank: string) => {
        setUpdatingRank(true);
        try {
            await updateDoc(doc(db, 'users', uid), { cdtRank: newRank });
            Alert.alert('Rank Updated', `Cadet rank changed to ${newRank}.`);
            setShowRankForm(false);
        } catch (e) {
            Alert.alert('Error', 'Failed to update rank.');
        } finally {
            setUpdatingRank(false);
        }
    };

    const handleAddDocument = async () => {
        if (!formName.trim() || !formLink.trim()) {
            Alert.alert('Incomplete Form', 'Please provide both document name and link.');
            return;
        }

        if (!formLink.includes('drive.google.com')) {
            Alert.alert('Invalid Link', 'Must be a valid Google Drive URL.');
            return;
        }

        let formattedLink = formLink.trim();
        if (!/^https?:\/\//i.test(formattedLink)) {
            formattedLink = 'https://' + formattedLink;
        }

        setSavingDoc(true);
        try {
            await addDoc(collection(db, 'documents'), {
                userId: uid,
                fileName: formName.trim(),
                fileURL: formattedLink,
                status: 'approved', // Admin uploads are auto-approved
                uploadedBy: userProfile?.uid, // admin's UID
                reviewedBy: userProfile?.uid,
                reviewedAt: serverTimestamp(),
                uploadedAt: serverTimestamp(),
            });
            Alert.alert('Success', 'Document added successfully to cadet profile.');
            setShowDocForm(false);
            setFormName('');
            setFormLink('');
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to add document.');
        } finally {
            setSavingDoc(false);
        }
    };

    const handleDeleteDoc = (docId: string, fileName: string) => {
        const executeDelete = async () => {
            try {
                await updateDoc(doc(db, 'documents', docId), { isDeleted: true });
            } catch (e) {
                Alert.alert('Error', 'Could not delete document.');
            }
        };

        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`Delete "${fileName}"?`);
            if (confirmed) executeDelete();
        } else {
            Alert.alert(
                'Delete Document',
                `Delete "${fileName}"?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: executeDelete }
                ]
            );
        }
    };

    const handleStatusUpdate = async (docId: string, newStatus: 'approved' | 'rejected') => {
        const executeUpdate = async (reason?: string) => {
            try {
                const updateData: any = {
                    status: newStatus,
                    reviewedBy: userProfile?.uid,
                    reviewedAt: new Date(),
                };
                if (newStatus === 'rejected' && reason && reason.trim().length > 0) {
                    updateData.rejectionReason = reason.trim();
                }
                await updateDoc(doc(db, 'documents', docId), updateData);
            } catch (e) {
                Alert.alert('Error', 'Failed to update document status.');
            }
        };

        if (newStatus === 'rejected') {
            if (Platform.OS === 'web') {
                const confirmed = window.confirm(`Are you sure you want to REJECT this document?`);
                if (confirmed) {
                    const reason = window.prompt("Optional: Enter a reason for rejection:");
                    await executeUpdate(reason || undefined);
                }
            } else {
                Alert.prompt(
                    'Reject Document',
                    'Optional: Enter a reason for rejection.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Reject', style: 'destructive', onPress: (reason?: string) => executeUpdate(reason) }
                    ],
                    'plain-text'
                );
            }
        } else {
            if (Platform.OS === 'web') {
                const confirmed = window.confirm(`Are you sure you want to APPROVE this document?`);
                if (confirmed) await executeUpdate();
            } else {
                Alert.alert(
                    'Confirm Approval',
                    'Are you sure you want to mark this document as approved?',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Approve', style: 'default', onPress: () => executeUpdate() }
                    ]
                );
            }
        }
    };

    const formatDate = (date: any) => {
        if (!date?.toDate) return 'Just now';
        return date.toDate().toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!cadet) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <Text style={styles.errorText}>Cadet not found.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cadet Profile</Text>
                <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() =>
                        router.push({ pathname: '/(admin)/edit-cadet', params: { uid: cadet.uid } })
                    }
                >
                    <Ionicons name="create-outline" size={22} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Profile Hero */}
                <View style={styles.heroCard}>
                    <View style={styles.avatarLarge}>
                        <Text style={styles.avatarText}>{cadet.fullName?.[0]?.toUpperCase() ?? 'C'}</Text>
                    </View>
                    <Text style={styles.heroName}>{cadet.fullName}</Text>
                    <Text style={styles.heroSub}>{cadet.department} • {cadet.year}</Text>
                    <Text style={[styles.heroSub, { marginTop: 4, fontWeight: '700', color: COLORS.white }]}>
                        {cadet.wing} Wing • {cadet.squad} Squad
                    </Text>

                    <View style={styles.statusRow}>
                        <View style={[
                            styles.statusBadge,
                            { backgroundColor: cadet.status === 'active' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)' }
                        ]}>
                            <Text style={[
                                styles.statusText,
                                { color: cadet.status === 'active' ? '#81C784' : '#FFB74D' }
                            ]}>
                                {cadet.status === 'active' ? 'Active Cadet' : 'Alumni'}
                            </Text>
                        </View>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{cadet.totalPoints ?? 0}</Text>
                            <Text style={styles.statLabel}>Points</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{cadet.cdtRank || 'Cadet'}</Text>
                            <Text style={styles.statLabel}>Rank</Text>
                        </View>
                    </View>
                </View>

                {/* Details Card */}
                <Card style={{ marginBottom: 16 }}>
                    <Text style={styles.sectionTitle}>Details</Text>
                    <InfoRow icon="id-card-outline" label="Register No." value={cadet.registerNumber} />
                    <InfoRow icon="layers-outline" label="Enrollment No." value={cadet.enrollmentNumber} />
                    <InfoRow icon="mail-outline" label="Email" value={cadet.email} />
                    <InfoRow icon="call-outline" label="Phone" value={cadet.phone} />
                    <InfoRow icon="water-outline" label="Blood Group" value={cadet.bloodGroup} />
                </Card>

                {/* Actions */}
                <Card style={{ marginBottom: 16 }}>
                    <Text style={styles.sectionTitle}>Actions</Text>

                    {cadet.status === 'active' ? (
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#FFF3E0', borderColor: COLORS.warning }]}
                            onPress={handleMarkPassedOut}
                            disabled={updating}
                        >
                            <Ionicons name="archive-outline" size={18} color={COLORS.warning} />
                            <Text style={[styles.actionText, { color: COLORS.warning }]}>Mark as Passed Out</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#E8F5E9', borderColor: COLORS.success }]}
                            onPress={handleMarkActive}
                            disabled={updating}
                        >
                            <Ionicons name="refresh-outline" size={18} color={COLORS.success} />
                            <Text style={[styles.actionText, { color: COLORS.success }]}>Restore to Active</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#E3F2FD', borderColor: '#2196F3', marginTop: 8 }]}
                        onPress={() => setShowRankForm(!showRankForm)}
                    >
                        <Ionicons name="medal-outline" size={18} color="#2196F3" />
                        <Text style={[styles.actionText, { color: '#2196F3' }]}>Change Rank</Text>
                    </TouchableOpacity>

                    {showRankForm && (
                        <View style={{ marginTop: 12, padding: 12, backgroundColor: COLORS.background, borderRadius: 8 }}>
                            <Text style={styles.label}>Select Rank:</Text>
                            <View style={styles.chipRow}>
                                {RANKS.map(r => (
                                    <TouchableOpacity
                                        key={r}
                                        style={[styles.chip, cadet.cdtRank === r && styles.chipActive]}
                                        onPress={() => handleUpdateRank(r)}
                                        disabled={updatingRank}
                                    >
                                        <Text style={[styles.chipText, cadet.cdtRank === r && styles.chipTextActive]}>{r}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            {updatingRank && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 10 }} />}
                        </View>
                    )}

                    {updating && (
                        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 12 }} />
                    )}

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary, marginTop: 8 }]}
                        onPress={() => setShowDocForm(true)}
                    >
                        <Ionicons name="document-attach-outline" size={18} color={COLORS.primary} />
                        <Text style={[styles.actionText, { color: COLORS.primary }]}>Add Document</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#E8EAF6', borderColor: '#3F51B5', marginTop: 8 }]}
                        onPress={() => router.push({ pathname: '/(admin)/chat', params: { cadetId: uid, cadetName: cadet.fullName } })}
                    >
                        <Ionicons name="chatbubbles-outline" size={18} color="#3F51B5" />
                        <Text style={[styles.actionText, { color: '#3F51B5' }]}>Message Cadet</Text>
                    </TouchableOpacity>
                </Card>

                {/* Documents Section */}
                <Card noPadding style={{ marginBottom: 16 }}>
                    <View style={{ padding: 18, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Cadet Documents</Text>
                    </View>

                    {docsLoading ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <ActivityIndicator color={COLORS.primary} />
                        </View>
                    ) : documents.length === 0 ? (
                        <View style={{ padding: 30, alignItems: 'center' }}>
                            <Ionicons name="documents-outline" size={36} color={COLORS.textMuted} style={{ marginBottom: 10 }} />
                            <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>No documents linked yet.</Text>
                        </View>
                    ) : (
                        documents.map(item => {
                            let statusColor = COLORS.warning;
                            if (item.status === 'approved') statusColor = COLORS.success;
                            else if (item.status === 'rejected') statusColor = COLORS.error;

                            return (
                                <View key={item.id} style={styles.docItem}>
                                    <View style={styles.docItemHeader}>
                                        <View style={{ flex: 1 }}>
                                            <TouchableOpacity onPress={() => Linking.openURL(item.fileURL)}>
                                                <Text style={styles.docFileName} numberOfLines={1}>{item.fileName || item.type}</Text>
                                                <Text style={styles.docDate}>{item.type} • {formatDate(item.uploadedAt)}</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View style={[styles.docStatusBadge, { backgroundColor: statusColor + '15' }]}>
                                            <Text style={[styles.docStatusText, { color: statusColor }]}>{item.status}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.docActions}>
                                        {item.status === 'pending' && (
                                            <>
                                                <TouchableOpacity
                                                    style={[styles.smallBtn, { borderColor: COLORS.success }]}
                                                    onPress={() => handleStatusUpdate(item.id, 'approved')}
                                                >
                                                    <Text style={[styles.smallBtnText, { color: COLORS.success }]}>Approve</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.smallBtn, { borderColor: COLORS.error }]}
                                                    onPress={() => handleStatusUpdate(item.id, 'rejected')}
                                                >
                                                    <Text style={[styles.smallBtnText, { color: COLORS.error }]}>Reject</Text>
                                                </TouchableOpacity>
                                            </>
                                        )}
                                        <TouchableOpacity
                                            style={styles.deleteIconBtn}
                                            onPress={() => handleDeleteDoc(item.id, item.fileName || item.type || 'Document')}
                                        >
                                            <Ionicons name="trash-outline" size={18} color={COLORS.textMuted} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </Card>
            </ScrollView>

            <Modal
                visible={showDocForm}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDocForm(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Cadet Document</Text>
                            <TouchableOpacity onPress={() => setShowDocForm(false)} disabled={savingDoc}>
                                <Ionicons name="close" size={26} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Document Name *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Medical Certificate"
                                    placeholderTextColor={COLORS.textMuted}
                                    value={formName}
                                    onChangeText={setFormName}
                                    maxLength={50}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Google Drive Link *</Text>
                                <TextInput
                                    style={[styles.input, { height: 80 }]}
                                    placeholder="https://drive.google.com/file/d/..."
                                    placeholderTextColor={COLORS.textMuted}
                                    value={formLink}
                                    onChangeText={setFormLink}
                                    multiline
                                    autoCapitalize="none"
                                    keyboardType="url"
                                />
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <PrimaryButton
                                title="Save Document"
                                onPress={handleAddDocument}
                                loading={savingDoc}
                            />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value?: string }) {
    return (
        <View style={styles.infoRow}>
            <Ionicons name={icon} size={18} color={COLORS.textMuted} style={styles.infoIcon} />
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value || '—'}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: COLORS.textMuted, fontSize: 16 },
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
    backBtn: { padding: 4 },
    headerTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
    editBtn: { padding: 4, backgroundColor: COLORS.primaryLight, borderRadius: 8 },
    scroll: { padding: 16, paddingBottom: 40 },
    heroCard: {
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 10,
    },
    avatarLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: { color: COLORS.primary, fontSize: 32, fontWeight: '800' },
    heroName: { color: COLORS.white, fontSize: 24, fontWeight: '800', textAlign: 'center' },
    heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4, marginBottom: 8 },
    statusRow: { marginBottom: 20 },
    statusBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        width: '100%',
        padding: 16,
    },
    statBox: { flex: 1, alignItems: 'center' },
    statValue: { color: COLORS.white, fontSize: 24, fontWeight: '800' },
    statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4, fontWeight: '600' },
    statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    infoIcon: { marginRight: 12 },
    infoLabel: { flex: 1, fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
    infoValue: { fontSize: 14, color: COLORS.text, fontWeight: '600', flex: 1, textAlign: 'right' },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
    actionText: { fontSize: 15, fontWeight: '700' },

    // Modal forms
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: COLORS.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
    modalBody: { padding: 24 },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
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
    modalFooter: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },

    // Doc Items
    docItem: {
        padding: 18,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    docItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    docFileName: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
    docDate: { fontSize: 13, color: COLORS.textSecondary },
    docStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 10,
    },
    docStatusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    docActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 10,
    },
    smallBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    smallBtnText: { fontSize: 13, fontWeight: '700' },
    deleteIconBtn: {
        padding: 8,
        marginLeft: 4,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
    chip: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card
    },
    chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    chipText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
    chipTextActive: { color: COLORS.white, fontWeight: '700' }
});

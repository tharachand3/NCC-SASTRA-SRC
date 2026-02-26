import { db } from '@/config/firebase';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { collection, doc, getDoc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking, Platform,
    SafeAreaView, ScrollView,
    StyleSheet,
    
    TouchableOpacity,
    View
} from 'react-native';

interface AdminDocument {
    id: string;
    userId: string;
    fileName: string;
    fileURL: string;
    status: 'pending' | 'approved' | 'rejected';
    uploadedAt: any;
    cadetName?: string;
    cadetReg?: string;
    type?: string;
    isDeleted?: boolean;
}

export default function AdminDocumentsScreen() {
    const { userProfile } = useAuth();
    const [documents, setDocuments] = useState<AdminDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

    useEffect(() => {
        const q = query(collection(db, 'documents'), orderBy('uploadedAt', 'desc'));
        const unsub = onSnapshot(q, async (snap) => {
            const rawDocs = snap.docs
                .map(d => ({ id: d.id, ...d.data() } as AdminDocument))
                .filter(d => !d.isDeleted);

            const enrichedDocs = await Promise.all(
                rawDocs.map(async (docData) => {
                    try {
                        const userSnap = await getDoc(doc(db, 'users', docData.userId));
                        if (userSnap.exists()) {
                            docData.cadetName = userSnap.data().fullName;
                            docData.cadetReg = userSnap.data().registerNumber;
                        } else {
                            docData.cadetName = 'Unknown Cadet';
                        }
                    } catch {
                        docData.cadetName = 'Error Loading Name';
                    }
                    return docData;
                })
            );

            setDocuments(enrichedDocs);
            setLoading(false);
        }, (err) => {
            console.error(err);
            Alert.alert('Error', 'Failed to load documents.');
            setLoading(false);
        });
        return () => unsub();
    }, []);

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
                    const reason = window.prompt("Optional: Enter a reason for rejection (this will be shown to the cadet):");
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
            // Approved flow
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

    const handleDelete = async (docId: string, fileName: string) => {
        const executeDelete = async () => {
            try {
                await updateDoc(doc(db, 'documents', docId), { isDeleted: true });
            } catch (e) {
                Alert.alert('Error', 'Could not delete document.');
            }
        };

        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`Delete "${fileName}"?`);
            if (confirmed) await executeDelete();
        } else {
            Alert.alert(
                'Delete Document (Admin)',
                `Delete "${fileName}"?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: executeDelete }
                ]
            );
        }
    };

    const openLink = async (url: string) => {
        const supported = await Linking.canOpenURL(url);
        if (supported) Linking.openURL(url);
    };

    const formatDate = (date: any) => {
        if (!date?.toDate) return 'Just now';
        return date.toDate().toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const filteredDocs = filter === 'all'
        ? documents
        : documents.filter(d => d.status === filter);

    const renderItem = ({ item }: { item: AdminDocument }) => {
        let statusColor = COLORS.warning;
        let statusIcon = 'time';
        let statusLabel = 'Pending Review';

        if (item.status === 'approved') {
            statusColor = COLORS.success;
            statusIcon = 'checkmark-circle';
            statusLabel = 'Approved';
        } else if (item.status === 'rejected') {
            statusColor = COLORS.red;
            statusIcon = 'close-circle';
            statusLabel = 'Rejected';
        }

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.cadetInfo}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{(item.cadetName || 'C')[0].toUpperCase()}</Text>
                        </View>
                        <View>
                            <Text style={styles.cadetName}>{item.cadetName}</Text>
                            <Text style={styles.cadetReg}>{item.cadetReg || 'No Reg No.'}</Text>
                        </View>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                        <Ionicons name={statusIcon as any} size={12} color={statusColor} />
                        <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                    </View>
                </View>

                <View style={styles.docBox}>
                    <View style={styles.iconBox}>
                        <Ionicons name="document-text-outline" size={24} color={COLORS.navy} />
                    </View>
                    <View style={styles.docInfo}>
                        <Text style={styles.fileName} numberOfLines={1}>{item.fileName || item.type}</Text>
                        <Text style={styles.dateText}>{item.type} • {formatDate(item.uploadedAt)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => openLink(item.fileURL)} style={styles.viewBtn}>
                        <Ionicons name="eye-outline" size={20} color={COLORS.navy} />
                    </TouchableOpacity>
                </View>

                <View style={styles.actionsBar}>
                    {item.status === 'pending' && (
                        <View style={styles.approveRejectRow}>
                            <TouchableOpacity
                                style={[styles.actionButton, { borderColor: COLORS.success }]}
                                onPress={() => handleStatusUpdate(item.id, 'approved')}
                            >
                                <Ionicons name="checkmark" size={16} color={COLORS.success} />
                                <Text style={[styles.actionBtnText, { color: COLORS.success }]}>Approve</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, { borderColor: COLORS.red }]}
                                onPress={() => handleStatusUpdate(item.id, 'rejected')}
                            >
                                <Ionicons name="close" size={16} color={COLORS.red} />
                                <Text style={[styles.actionBtnText, { color: COLORS.red }]}>Reject</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDelete(item.id, item.fileName)}
                    >
                        <Ionicons name="trash-outline" size={18} color={COLORS.midGray} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Document Reviews</Text>
                <Ionicons name="documents-outline" size={24} color={COLORS.white} />
            </View>

            <View style={styles.tabContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
                    {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.tabBtn, filter === f && styles.tabBtnActive]}
                            onPress={() => setFilter(f)}
                        >
                            <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>
                                {f.charAt(0).toUpperCase() + f.slice(1)} {f === 'pending' ? 'Approvals' : ''}
                            </Text>
                            {f === 'pending' && (
                                <View style={[styles.badge, filter === 'pending' && styles.badgeActive]}>
                                    <Text style={[styles.badgeText, filter === 'pending' && styles.badgeTextActive]}>
                                        {documents.filter(d => d.status === 'pending').length}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.navy} />
                </View>
            ) : (
                <FlatList
                    data={filteredDocs}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="checkmark-done-circle-outline" size={48} color={COLORS.success} />
                            <Text style={styles.emptyText}>
                                {filter === 'pending' ? 'All caught up! No pending documents.' : 'No documents uploaded yet.'}
                            </Text>
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
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: { color: COLORS.white, fontSize: 22, fontWeight: '700' },
    tabContainer: {
        backgroundColor: COLORS.white,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    tabBtn: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: COLORS.offWhite,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    tabBtnActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
    tabText: { fontSize: 13, fontWeight: '600', color: COLORS.midGray },
    tabTextActive: { color: COLORS.white },
    badge: {
        backgroundColor: COLORS.offWhite,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 6,
    },
    badgeActive: { backgroundColor: COLORS.red },
    badgeText: { fontSize: 10, fontWeight: '800', color: COLORS.midGray },
    badgeTextActive: { color: COLORS.white },
    list: { padding: 16, paddingBottom: 40 },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 14,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.offWhite,
        backgroundColor: '#FCFCFC',
    },
    cadetInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: COLORS.navy,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
    cadetName: { fontSize: 14, fontWeight: '700', color: COLORS.darkText },
    cadetReg: { fontSize: 11, color: COLORS.midGray, marginTop: 1 },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    statusText: { fontSize: 10, fontWeight: '700' },
    docBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: COLORS.offWhite,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    docInfo: { flex: 1 },
    fileName: { fontSize: 14, fontWeight: '700', color: COLORS.darkText, marginBottom: 4 },
    dateText: { fontSize: 11, color: COLORS.midGray },
    viewBtn: { padding: 8, backgroundColor: COLORS.navy + '10', borderRadius: 8 },
    actionsBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingBottom: 14,
        paddingTop: 4,
    },
    approveRejectRow: { flexDirection: 'row', gap: 10, flex: 1 },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        gap: 4,
    },
    actionBtnText: { fontSize: 12, fontWeight: '600' },
    deleteBtn: { padding: 6 },
    empty: { alignItems: 'center', marginTop: 80 },
    emptyText: { color: COLORS.darkText, fontSize: 15, fontWeight: '600', marginTop: 16 },
});

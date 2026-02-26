import { db } from '@/config/firebase';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Linking, Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Card } from '../../components/ui/Card';
import { PrimaryButton } from '../../components/ui/PrimaryButton';

interface CadetDocument {
    id: string;
    fileName: string;
    fileURL: string;
    status: 'pending' | 'approved' | 'rejected';
    uploadedAt: any;
    type: string;
    rejectionReason?: string;
    isDeleted?: boolean;
}

export default function CadetDocumentsScreen() {
    const { userProfile } = useAuth();
    const [documents, setDocuments] = useState<CadetDocument[]>([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingDocId, setEditingDocId] = useState<string | null>(null);

    const [formName, setFormName] = useState('');
    const [formLink, setFormLink] = useState('');
    const [formType, setFormType] = useState('Other');

    const DOC_TYPES = ['Application', 'Bank Details', 'TC', 'Study Certificate', 'Other'];

    useEffect(() => {
        if (!userProfile?.uid) return;

        const q = query(
            collection(db, 'documents'),
            where('userId', '==', userProfile.uid),
            orderBy('uploadedAt', 'desc')
        );

        const unsub = onSnapshot(q, (snap) => {
            if (snap.empty) {
                setDocuments([]);
                setLoading(false);
                return;
            }
            const data = snap.docs
                .map(d => ({ id: d.id, ...d.data() } as CadetDocument))
                .filter(doc => !doc.isDeleted);

            setDocuments(data);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching documents:", err);
            Alert.alert("Error", "Failed to load documents.");
            setLoading(false);
        });

        return () => unsub();
    }, [userProfile?.uid]);

    const openForm = (docToEdit?: CadetDocument) => {
        if (docToEdit) {
            setEditingDocId(docToEdit.id);
            setFormName(docToEdit.fileName === 'Untitled Document' ? '' : docToEdit.fileName);
            setFormLink(docToEdit.fileURL);
            setFormType(docToEdit.type || 'Other');
        } else {
            setEditingDocId(null);
            setFormName('');
            setFormLink('');
            setFormType('Other');
        }
        setShowForm(true);
    };

    const handleSaveForm = async () => {
        if (!formName.trim()) {
            Alert.alert('Missing Field', 'Please provide a Document Name.');
            return;
        }

        if (!formLink.trim()) {
            Alert.alert('Missing Field', 'Please provide the Google Drive link.');
            return;
        }

        if (!formLink.includes('drive.google.com')) {
            Alert.alert('Invalid Link', 'The link must be a valid Google Drive URL.');
            return;
        }

        let formattedLink = formLink.trim();
        if (!/^https?:\/\//i.test(formattedLink)) {
            formattedLink = 'https://' + formattedLink;
        }

        // Data Protection: Prevent Duplicate Type Upload if already approved
        if (formType !== 'Other') {
            const isDuplicate = documents.some(
                doc => doc.type === formType && doc.status === 'approved' && doc.id !== editingDocId
            );
            if (isDuplicate) {
                Alert.alert('Duplicate Document', `You already have an approved document of type "${formType}". Please contact admin if you need to update it.`);
                return;
            }
        }

        setSaving(true);
        try {
            const finalName = formName.trim();

            if (editingDocId) {
                await updateDoc(doc(db, 'documents', editingDocId), {
                    fileName: finalName,
                    fileURL: formattedLink,
                    type: formType,
                    status: 'pending'
                });
                if (Platform.OS === 'web') alert('Document link updated successfully.');
                else Alert.alert('Updated', 'Document link updated successfully.');
            } else {
                await addDoc(collection(db, 'documents'), {
                    userId: userProfile?.uid,
                    fileName: finalName,
                    type: formType,
                    fileURL: formattedLink,
                    status: 'pending',
                    uploadedBy: userProfile?.uid,
                    uploadedAt: serverTimestamp(),
                });
                if (Platform.OS === 'web') alert('Document link submitted for approval.');
                else Alert.alert('Submitted', 'Document link submitted for approval.');
            }
            setShowForm(false);
        } catch (e: any) {
            console.error('Save error:', e);
            Alert.alert('Error', e.message || 'Could not save document.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (docId: string, fileName: string, status: string) => {
        if (status === 'approved') {
            Alert.alert('Not Allowed', 'You cannot delete an approved document. Contact admin.');
            return;
        }

        const executeDelete = async () => {
            try {
                // Soft Delete
                await updateDoc(doc(db, 'documents', docId), { isDeleted: true });
            } catch (e) {
                Alert.alert('Error', 'Could not delete document.');
            }
        };

        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`Permanently delete "${fileName}"?`);
            if (confirmed) executeDelete();
        } else {
            Alert.alert(
                'Delete Document',
                `Are you sure you want to remove "${fileName}"?`,
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
        else Alert.alert('Invalid URL', 'Cannot open this link on your device.');
    };

    const formatDate = (date: any) => {
        if (!date?.toDate) return 'Just now';
        return date.toDate().toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const renderItem = ({ item }: { item: CadetDocument }) => {
        let statusColor = COLORS.warning;
        let statusIcon = 'time-outline';
        let statusLabel = 'Pending Review';

        if (item.status === 'approved') {
            statusColor = COLORS.success;
            statusIcon = 'checkmark-circle-outline';
            statusLabel = 'Approved';
        } else if (item.status === 'rejected') {
            statusColor = COLORS.error;
            statusIcon = 'close-circle-outline';
            statusLabel = 'Rejected';
        }

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openLink(item.fileURL)}
            >
                <Card style={styles.card}>
                    <View style={styles.cardLeft}>
                        <View style={styles.iconBox}>
                            <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
                        </View>
                    </View>

                    <View style={styles.cardBody}>
                        <Text style={styles.fileName} numberOfLines={1}>{item.fileName || item.type}</Text>
                        <Text style={styles.dateText}>{item.type} • Added {formatDate(item.uploadedAt)}</Text>

                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                            <Ionicons name={statusIcon as any} size={14} color={statusColor} />
                            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                        </View>

                        {item.status === 'rejected' && item.rejectionReason && (
                            <Text style={styles.rejectionReasonText}>Reason: {item.rejectionReason}</Text>
                        )}
                    </View>

                    <View style={styles.cardRight}>
                        {item.status !== 'approved' && (
                            <TouchableOpacity onPress={() => openForm(item)} style={styles.actionBtn}>
                                <Ionicons name="pencil-outline" size={20} color={COLORS.primary} />
                            </TouchableOpacity>
                        )}
                        {item.status !== 'approved' && (
                            <TouchableOpacity onPress={() => handleDelete(item.id, item.fileName || item.type, item.status)} style={[styles.actionBtn, { backgroundColor: COLORS.errorBg }]}>
                                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                            </TouchableOpacity>
                        )}
                    </View>
                </Card>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Documents</Text>
                <Ionicons name="folder-open-outline" size={24} color={COLORS.text} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={documents}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="documents-outline" size={48} color={COLORS.midGray} />
                            <Text style={styles.emptyText}>No documents linked yet.</Text>
                            <Text style={styles.emptySub}>Tap the + button to add a Google Drive link.</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => openForm()}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={28} color={COLORS.textInverse} />
            </TouchableOpacity>

            <Modal
                visible={showForm}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowForm(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingDocId ? 'Edit Document' : 'Add Document'}</Text>
                            <TouchableOpacity onPress={() => setShowForm(false)} disabled={saving}>
                                <Ionicons name="close" size={26} color={COLORS.darkText} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <View style={styles.instructionsCard}>
                                <Ionicons name="information-circle" size={20} color={COLORS.info} style={styles.infoIcon} />
                                <View style={styles.instructionsTextContainer}>
                                    <Text style={styles.instructionsTitle}>How to link G-Drive document:</Text>
                                    <Text style={styles.instructionsStep}>1. Upload your file to Google Drive.</Text>
                                    <Text style={styles.instructionsStep}>2. Tap the 3 dots (...) next to the file.</Text>
                                    <Text style={styles.instructionsStep}>3. Go to <Text style={{ fontWeight: '700' }}>Manage access</Text> and change General access to <Text style={{ fontWeight: '700' }}>"Anyone with the link"</Text>.</Text>
                                    <Text style={styles.instructionsStep}>4. Copy the link and paste it below.</Text>
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Document Type *</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                                    {DOC_TYPES.map(type => (
                                        <TouchableOpacity
                                            key={type}
                                            style={[styles.chip, formType === type && styles.chipActive]}
                                            onPress={() => setFormType(type)}
                                        >
                                            <Text style={[styles.chipText, formType === type && styles.chipTextActive]}>
                                                {type}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Document Name *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. My Aadhar Card"
                                    placeholderTextColor={COLORS.midGray}
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
                                    placeholderTextColor={COLORS.midGray}
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
                                title={editingDocId ? 'Update Document' : 'Submit Document'}
                                onPress={handleSaveForm}
                                loading={saving}
                            />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
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
    list: { padding: 16, paddingBottom: 100 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
    },
    cardLeft: { marginRight: 16 },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardBody: { flex: 1 },
    fileName: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
    dateText: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    statusText: { fontSize: 11, fontWeight: '700' },
    cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 },
    actionBtn: { padding: 8, backgroundColor: COLORS.offWhite, borderRadius: 8 },
    empty: { alignItems: 'center', marginTop: 80 },
    emptyText: { color: COLORS.text, fontSize: 16, fontWeight: '600', marginTop: 12 },
    emptySub: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
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
    instructionsCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.infoBg,
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.info,
    },
    infoIcon: { marginRight: 10, marginTop: 2 },
    instructionsTextContainer: { flex: 1 },
    instructionsTitle: { fontSize: 14, fontWeight: '700', color: COLORS.info, marginBottom: 8 },
    instructionsStep: { fontSize: 13, color: COLORS.text, marginBottom: 4, lineHeight: 20 },
    rejectionReasonText: { fontSize: 12, color: COLORS.error, marginTop: 6, fontWeight: '500', fontStyle: 'italic' },
    formGroup: { marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 10 },
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
        backgroundColor: COLORS.card,
    },
    chipScroll: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: 10,
    },
    chipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    chipText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    chipTextActive: {
        color: COLORS.textInverse,
        fontWeight: '700',
    }
});

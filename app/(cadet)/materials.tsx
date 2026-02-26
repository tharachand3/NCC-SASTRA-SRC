import { db } from '@/config/firebase';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    
    TextInput,
    TouchableOpacity,
    View} from 'react-native';

const MATERIAL_TYPES = ['All', 'PDF', 'Doc', 'Image', 'YouTube', 'Other'];

export default function CadetMaterials() {
    const { userProfile } = useAuth();
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [typeFilter, setTypeFilter] = useState('All');

    // Add Form
    const [showForm, setShowForm] = useState(false);
    const [formTitle, setFormTitle] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formType, setFormType] = useState('PDF');
    const [formLink, setFormLink] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!userProfile?.uid) return;

        const q = query(
            collection(db, 'materials'),
            orderBy('createdAt', 'desc')
        );

        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

            // Client-side filtering: Cadet sees all approved + their own pending/rejected
            const visibleData = data.filter(doc =>
                doc.status === 'approved' || doc.uploadedBy === userProfile.uid
            );

            setMaterials(visibleData);
            setLoading(false);
        });

        return unsub;
    }, [userProfile?.uid]);

    const handleAddSubmit = async () => {
        if (!formTitle.trim() || !formLink.trim() || !formType) {
            Alert.alert('Incomplete', 'Please provide a title, type, and link.');
            return;
        }

        let link = formLink.trim();
        if (!/^https?:\/\//i.test(link)) {
            link = `https://${link}`;
        }

        setSaving(true);
        try {
            await addDoc(collection(db, 'materials'), {
                title: formTitle.trim(),
                description: formDesc.trim(),
                type: formType,
                link: link,
                status: 'pending', // Cadets need admin approval
                uploadedBy: userProfile?.uid,
                uploadedByName: userProfile?.fullName || 'Cadet',
                uploadedRole: 'cadet',
                createdAt: serverTimestamp(),
            });
            Alert.alert('Success', 'Material submitted for admin approval.');
            setShowForm(false);
            setFormTitle('');
            setFormDesc('');
            setFormLink('');
            setFormType('PDF');
        } catch (e) {
            Alert.alert('Error', 'Failed to submit material.');
        } finally {
            setSaving(false);
        }
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'PDF': return { name: 'document-text', color: '#D32F2F' };
            case 'Doc': return { name: 'document-attach', color: '#1976D2' };
            case 'Image': return { name: 'image', color: '#388E3C' };
            case 'YouTube': return { name: 'logo-youtube', color: '#FF0000' };
            default: return { name: 'link', color: COLORS.navy };
        }
    };

    const StatusBadge = ({ status, reason }: { status: string, reason?: string }) => {
        if (status === 'approved') return null; // Approved forms don't need a badge here

        let bgColor = COLORS.warning + '20';
        let color = COLORS.warning;
        let text = 'PENDING';

        if (status === 'rejected') {
            bgColor = COLORS.red + '20';
            color = COLORS.red;
            text = 'REJECTED';
        }

        return (
            <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
                <Text style={[styles.statusText, { color }]}>{text}</Text>
                {status === 'rejected' && reason && (
                    <Text style={{ fontSize: 10, color: COLORS.red, marginTop: 2 }}>{reason}</Text>
                )}
            </View>
        );
    };

    // Filtered list
    const filteredMaterials = materials.filter(m => typeFilter === 'All' || m.type === typeFilter);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Study Materials</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
                    <Ionicons name="add" size={20} color={COLORS.white} />
                    <Text style={styles.addBtnText}>Submit</Text>
                </TouchableOpacity>
            </View>

            {/* Filters */}
            <View style={{ paddingHorizontal: 16 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {MATERIAL_TYPES.map(t => (
                        <TouchableOpacity
                            key={t}
                            style={[styles.filterChip, typeFilter === t && styles.filterChipActive]}
                            onPress={() => setTypeFilter(t)}
                        >
                            <Text style={[styles.filterChipText, typeFilter === t && styles.filterChipTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.navy} />
                </View>
            ) : filteredMaterials.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="library-outline" size={48} color={COLORS.midGray} />
                    <Text style={styles.emptyText}>No materials found.</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredMaterials}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => {
                        const icon = getIconForType(item.type);
                        return (
                            <View style={styles.card}>
                                <TouchableOpacity
                                    style={styles.cardInfo}
                                    onPress={() => Linking.openURL(item.link)}
                                >
                                    <View style={[styles.iconBox, { backgroundColor: icon.color + '15' }]}>
                                        <Ionicons name={icon.name as any} size={24} color={icon.color} />
                                    </View>
                                    <View style={styles.textContainer}>
                                        <Text style={styles.itemTitle}>{item.title}</Text>
                                        {item.description ? (
                                            <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                                        ) : null}
                                        <Text style={styles.itemMeta}>Added by {item.uploadedByName} • {item.type}</Text>
                                    </View>
                                </TouchableOpacity>
                                {(item.status === 'pending' || item.status === 'rejected') && (
                                    <View style={styles.cardFooter}>
                                        <StatusBadge status={item.status} reason={item.rejectionReason} />
                                    </View>
                                )}
                            </View>
                        );
                    }}
                />
            )}

            {/* Submission Modal */}
            <Modal visible={showForm} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Submit Material</Text>
                            <TouchableOpacity onPress={() => setShowForm(false)}>
                                <Ionicons name="close" size={24} color={COLORS.darkText} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.modalBody}>
                            <Text style={styles.label}>Title*</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Unity and Discipline Manual"
                                value={formTitle}
                                onChangeText={setFormTitle}
                            />

                            <Text style={styles.label}>Description (Optional)</Text>
                            <TextInput
                                style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                                placeholder="Brief description of the material..."
                                multiline
                                value={formDesc}
                                onChangeText={setFormDesc}
                            />

                            <Text style={styles.label}>Material Type*</Text>
                            <View style={styles.typeGrid}>
                                {MATERIAL_TYPES.slice(1).map(type => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[styles.typeBtn, formType === type && styles.typeBtnActive]}
                                        onPress={() => setFormType(type)}
                                    >
                                        <Text style={[styles.typeBtnText, formType === type && styles.typeBtnTextActive]}>{type}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.label, { marginTop: 12 }]}>External Link (Google Drive / YouTube)*</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="https://..."
                                value={formLink}
                                onChangeText={setFormLink}
                                autoCapitalize="none"
                            />

                            <TouchableOpacity
                                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                                onPress={handleAddSubmit}
                                disabled={saving}
                            >
                                {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>Submit for Approval</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.offWhite },
    header: {
        backgroundColor: COLORS.navy,
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: { color: COLORS.white, fontSize: 22, fontWeight: '700' },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4
    },
    addBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: COLORS.midGray, fontSize: 15, marginTop: 12 },
    filterScroll: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    filterChip: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
        marginRight: 8
    },
    filterChipActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
    filterChipText: { fontSize: 13, color: COLORS.midGray, fontWeight: '600' },
    filterChipTextActive: { color: COLORS.white },
    list: { padding: 16, paddingBottom: 40 },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        marginBottom: 12,
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    cardInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    textContainer: { flex: 1 },
    itemTitle: { fontSize: 16, fontWeight: '700', color: COLORS.darkText, marginBottom: 4 },
    itemDesc: { fontSize: 13, color: COLORS.midGray, marginBottom: 6, lineHeight: 18 },
    itemMeta: { fontSize: 11, color: COLORS.darkGray, fontWeight: '600' },
    cardFooter: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.offWhite,
    },
    statusBadge: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.offWhite,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.navy },
    modalBody: { padding: 20, paddingBottom: 40 },
    label: { fontSize: 13, fontWeight: '700', color: COLORS.darkText, marginBottom: 8 },
    input: {
        backgroundColor: COLORS.offWhite,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: COLORS.darkText,
        marginBottom: 16,
    },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    typeBtn: {
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8,
        borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white
    },
    typeBtnActive: { backgroundColor: '#E3F2FD', borderColor: '#2196F3' },
    typeBtnText: { color: COLORS.darkGray, fontWeight: '600', fontSize: 14 },
    typeBtnTextActive: { color: '#2196F3' },
    saveBtn: {
        backgroundColor: COLORS.navy,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});

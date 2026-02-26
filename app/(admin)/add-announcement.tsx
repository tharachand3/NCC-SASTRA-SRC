import { db } from '@/config/firebase';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import {
    ActivityIndicator, Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function AddAnnouncementScreen() {
    const router = useRouter();
    const { userProfile } = useAuth();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [link, setLink] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!title.trim() || !description.trim()) {
            Alert.alert('Missing Info', 'Please provide both title and description.');
            return;
        }

        let formattedLink = link.trim();
        if (formattedLink && !/^https?:\/\//i.test(formattedLink)) {
            formattedLink = 'https://' + formattedLink;
        }

        setSaving(true);
        try {
            await addDoc(collection(db, 'announcements'), {
                title: title.trim(),
                description: description.trim(),
                link: formattedLink,
                createdBy: userProfile?.uid,
                createdAt: serverTimestamp(),
            });
            Alert.alert('Success', 'Announcement posted successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (e: any) {
            console.error('Add announcement error:', e);
            Alert.alert('Error', e.message || 'Could not post announcement.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Announcement</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <Text style={styles.intro}>
                    Post a new notice or announcement. All cadets will be able to see this immediately.
                </Text>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Tomorrow's Parade Timing"
                        value={title}
                        onChangeText={setTitle}
                        placeholderTextColor={COLORS.midGray}
                        maxLength={100}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Provide the full details here..."
                        value={description}
                        onChangeText={setDescription}
                        placeholderTextColor={COLORS.midGray}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>External Link (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="https://example.com/form"
                        value={link}
                        onChangeText={setLink}
                        keyboardType="url"
                        autoCapitalize="none"
                        placeholderTextColor={COLORS.midGray}
                    />
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={saving}
                    activeOpacity={0.8}
                >
                    {saving ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <>
                            <Ionicons name="send" size={18} color={COLORS.white} style={{ marginRight: 8 }} />
                            <Text style={styles.saveBtnText}>POST ANNOUNCEMENT</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.offWhite },
    header: {
        backgroundColor: COLORS.navy,
        paddingHorizontal: 16,
        paddingTop: 28,
        paddingBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: { padding: 4 },
    headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
    scroll: { padding: 20, paddingBottom: 100 },
    intro: { fontSize: 13, color: COLORS.midGray, marginBottom: 24, lineHeight: 20 },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '700', color: COLORS.navy, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    required: { color: COLORS.red },
    input: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: COLORS.darkText,
    },
    textArea: { height: 140, paddingTop: 14 },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    saveBtn: {
        backgroundColor: COLORS.navy,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
    },
    saveBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '700', letterSpacing: 1 },
});

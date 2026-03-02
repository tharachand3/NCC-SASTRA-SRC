import { Text } from '@/components/ui/Text';
import { db, firebaseConfig } from '@/config/firebase';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView, Platform,
    SafeAreaView, ScrollView,
    StyleSheet,
    TextInput, TouchableOpacity,
    View
} from 'react-native';
import { Card } from '../../components/ui/Card';
import { PrimaryButton } from '../../components/ui/PrimaryButton';

const WINGS = ['SD', 'SW'];
const SQUADS = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'None'];

export default function AddAdminScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        fullName: '',
        email: '',
        password: '',
        wing: 'SD',
        squad: 'None',
    });

    const update = (key: keyof typeof form, val: string) =>
        setForm(prev => ({ ...prev, [key]: val }));

    const handleSave = async () => {
        const required: (keyof typeof form)[] = ['fullName', 'email', 'password'];
        for (const f of required) {
            if (!form[f].trim()) {
                Alert.alert('Missing Field', `Please fill in ${f.replace(/([A-Z])/g, ' $1').toLowerCase()}.`);
                return;
            }
        }

        if (form.password.length < 6) {
            Alert.alert('Invalid Password', 'Password must be at least 6 characters.');
            return;
        }

        setSaving(true);
        try {
            // Use secondary app to avoid logging out the current admin
            const apps = getApps();
            let secondaryApp;
            if (!apps.find(a => a.name === 'Secondary')) {
                secondaryApp = initializeApp(firebaseConfig, 'Secondary');
            } else {
                secondaryApp = getApp('Secondary');
            }

            const secondaryAuth = getAuth(secondaryApp);

            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, form.email.trim(), form.password.trim());
            const newUid = userCredential.user.uid;

            await setDoc(doc(db, 'users', newUid), {
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                wing: form.wing,
                squad: form.squad === 'None' ? '' : form.squad,
                role: 'admin',
                status: 'active',
                totalPoints: 0,
                createdBy: user?.uid || '',
                createdAt: serverTimestamp(),
            });

            Alert.alert('Success', `${form.fullName} has been added as an admin.`, [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (e: any) {
            console.error(e);
            console.log("Admin Creation Error:", e.code, e.message);
            Alert.alert('Error', e?.message || 'Failed to add admin. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Admin</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <Card style={{ padding: 20 }}>
                        <Text style={styles.sectionTitle}>Admin Credentials</Text>

                        <Field label="Full Name *" value={form.fullName} onChange={v => update('fullName', v)} placeholder="e.g. Admin User" />
                        <Field label="Email Address *" value={form.email} onChange={v => update('email', v)} placeholder="admin email" keyboardType="email-address" autoCapitalize="none" />
                        <Field label="Temporary Password *" value={form.password} onChange={v => update('password', v)} placeholder="min. 6 characters" autoCapitalize="none" />

                        <Text style={styles.label}>Wing</Text>
                        <View style={styles.chipRow}>
                            {WINGS.map(w => (
                                <TouchableOpacity
                                    key={w}
                                    style={[styles.chip, form.wing === w && styles.chipActive]}
                                    onPress={() => update('wing', w)}
                                >
                                    <Text style={[styles.chipText, form.wing === w && styles.chipTextActive]}>{w}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Squad (Optional)</Text>
                        <View style={styles.chipRow}>
                            {SQUADS.map(sq => (
                                <TouchableOpacity
                                    key={sq}
                                    style={[styles.chip, form.squad === sq && styles.chipActive]}
                                    onPress={() => update('squad', sq)}
                                >
                                    <Text style={[styles.chipText, form.squad === sq && styles.chipTextActive]}>{sq}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Card>

                    <View style={styles.noteBox}>
                        <Ionicons name="shield-checkmark" size={20} color={COLORS.success} style={{ marginRight: 8 }} />
                        <Text style={styles.noteText}>
                            The new user will have full administrative access securely.
                        </Text>
                    </View>

                    <PrimaryButton
                        title="CREATE ADMIN"
                        onPress={handleSave}
                        loading={saving}
                        style={{ marginTop: 8 }}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function Field({
    label, value, onChange, placeholder, keyboardType = 'default', autoCapitalize = 'words',
}: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder: string; keyboardType?: any; autoCapitalize?: any;
}) {
    return (
        <>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor={COLORS.textMuted}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                autoCorrect={false}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        backgroundColor: COLORS.card,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 48,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backBtn: { padding: 8, backgroundColor: COLORS.primaryLight, borderRadius: 12 },
    headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
    scroll: { padding: 16, paddingBottom: 40 },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.primary,
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 12 },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: COLORS.text,
        backgroundColor: COLORS.background,
        marginBottom: 4,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    chipText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
    chipTextActive: { color: COLORS.textInverse, fontWeight: '700' },
    noteBox: {
        backgroundColor: COLORS.successBg,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.success,
        flexDirection: 'row',
        alignItems: 'center',
    },
    noteText: { fontSize: 13, color: COLORS.success, fontWeight: '600', flex: 1 },
});

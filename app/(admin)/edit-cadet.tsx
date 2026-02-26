import { db } from '@/config/firebase';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/Colors';
import { UserProfile } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView, Platform,
    SafeAreaView, ScrollView,
    StyleSheet,
    
    TextInput, TouchableOpacity,
    View} from 'react-native';

const YEARS = ['1st Year', '2nd Year', '3rd Year'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const WINGS = ['SD', 'SW'];
const SQUADS = ['Alpha', 'Bravo', 'Charlie', 'Delta'];

export default function EditCadetScreen() {
    const { uid } = useLocalSearchParams<{ uid: string }>();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        fullName: '',
        registerNumber: '',
        year: '',
        department: '',
        phone: '',
        email: '',
        bloodGroup: '',
        enrollmentNumber: '',
        wing: '',
        squad: '',
    });

    useEffect(() => {
        if (!uid) return;
        const load = async () => {
            const snap = await getDoc(doc(db, 'users', uid));
            if (snap.exists()) {
                const d = snap.data() as UserProfile;
                setForm({
                    fullName: d.fullName ?? '',
                    registerNumber: d.registerNumber ?? '',
                    year: d.year ?? '',
                    department: d.department ?? '',
                    phone: d.phone ?? '',
                    email: d.email ?? '',
                    bloodGroup: d.bloodGroup ?? '',
                    enrollmentNumber: d.enrollmentNumber ?? '',
                    wing: d.wing ?? '',
                    squad: d.squad ?? '',
                });
            }
            setLoading(false);
        };
        load();
    }, [uid]);

    const update = (key: keyof typeof form, val: string) =>
        setForm(prev => ({ ...prev, [key]: val }));

    const handleSave = async () => {
        if (!form.fullName.trim()) {
            Alert.alert('Error', 'Full name is required.');
            return;
        }
        setSaving(true);
        try {
            await updateDoc(doc(db, 'users', uid!), {
                ...form,
                registerNumber: form.registerNumber.trim().toUpperCase(),
            });
            Alert.alert('Saved', 'Cadet profile updated successfully.', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (e) {
            Alert.alert('Error', 'Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.navy} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Cadet</Text>
                <View style={{ width: 30 }} />
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Personal Information</Text>

                        <Field label="Full Name *" value={form.fullName} onChange={v => update('fullName', v)} placeholder="Full Name" />
                        <Field label="Register Number" value={form.registerNumber} onChange={v => update('registerNumber', v)} placeholder="Register Number" autoCapitalize="characters" />
                        <Field label="Enrollment Number" value={form.enrollmentNumber} onChange={v => update('enrollmentNumber', v)} placeholder="Enrollment Number" />
                        <Field label="Phone Number" value={form.phone} onChange={v => update('phone', v)} placeholder="Phone Number" keyboardType="phone-pad" />
                        <Field label="Email Address" value={form.email} onChange={v => update('email', v)} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />
                        <Field label="Department" value={form.department} onChange={v => update('department', v)} placeholder="Department" />

                        <Text style={styles.label}>Year</Text>
                        <View style={styles.chipRow}>
                            {YEARS.map(y => (
                                <TouchableOpacity
                                    key={y}
                                    style={[styles.chip, form.year === y && styles.chipActive]}
                                    onPress={() => update('year', y)}
                                >
                                    <Text style={[styles.chipText, form.year === y && styles.chipTextActive]}>{y}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

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

                        <Text style={styles.label}>Squad</Text>
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

                        <Text style={styles.label}>Blood Group</Text>
                        <View style={styles.chipRow}>
                            {BLOOD_GROUPS.map(bg => (
                                <TouchableOpacity
                                    key={bg}
                                    style={[styles.chip, form.bloodGroup === bg && styles.chipActive]}
                                    onPress={() => update('bloodGroup', bg)}
                                >
                                    <Text style={[styles.chipText, form.bloodGroup === bg && styles.chipTextActive]}>{bg}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                        onPress={handleSave}
                        disabled={saving}
                        activeOpacity={0.85}
                    >
                        {saving ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
                        )}
                    </TouchableOpacity>
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
                placeholderTextColor={COLORS.midGray}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                autoCorrect={false}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.offWhite },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: COLORS.navy,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 28,
        paddingBottom: 16,
    },
    backBtn: { padding: 4 },
    headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
    scroll: { padding: 16, paddingBottom: 40 },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 18,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.navy,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 14,
    },
    label: { fontSize: 13, fontWeight: '600', color: COLORS.darkText, marginBottom: 6, marginTop: 8 },
    input: {
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 11,
        fontSize: 14,
        color: COLORS.darkText,
        backgroundColor: COLORS.offWhite,
        marginBottom: 4,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        backgroundColor: COLORS.offWhite,
    },
    chipActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
    chipText: { fontSize: 13, color: COLORS.darkGray, fontWeight: '500' },
    chipTextActive: { color: COLORS.white, fontWeight: '600' },
    saveBtn: {
        backgroundColor: COLORS.navy,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 4,
    },
    saveBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700', letterSpacing: 1 },
});

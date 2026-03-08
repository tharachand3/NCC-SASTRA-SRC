import { Text } from '@/components/ui/Text';
import { auth, db } from '@/config/firebase';
import { COLORS } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Card } from '../../components/ui/Card';
import { PrimaryButton } from '../../components/ui/PrimaryButton';

const YEARS = ['1st Year', '2nd Year', '3rd Year'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const WINGS = ['SD', 'SW'];
const SQUADS = ['Alpha', 'Bravo', 'Charlie', 'Delta'];

export default function CadetSignupScreen() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        fullName: '',
        registerNumber: '',
        year: '',
        department: '',
        phone: '',
        email: '',
        password: '',
        bloodGroup: '',
        enrollmentNumber: '',
        wing: 'SD',
        squad: 'Alpha',
    });

    const update = (key: keyof typeof form, val: string) =>
        setForm(prev => ({ ...prev, [key]: val }));

    const handleSubmit = async () => {
        const required: (keyof typeof form)[] = ['fullName', 'registerNumber', 'year', 'department', 'phone', 'email', 'password'];
        for (const f of required) {
            if (!form[f].trim()) {
                Alert.alert('Missing Field', `Please fill in ${f.replace(/([A-Z])/g, ' $1').toLowerCase()}.`);
                return;
            }
        }
        if (form.password.length < 6) {
            Alert.alert('Password Too Short', 'Please choose a password of at least 6 characters.');
            return;
        }

        setSaving(true);
        try {
            const userCred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
            const uid = userCred.user.uid;
            await setDoc(doc(db, 'cadet_requests', uid), {
                fullName: form.fullName.trim(),
                registerNumber: form.registerNumber.trim().toUpperCase(),
                year: form.year,
                department: form.department.trim(),
                phone: form.phone.trim(),
                email: form.email.trim(),
                wing: form.wing,
                squad: form.squad,
                bloodGroup: form.bloodGroup,
                enrollmentNumber: form.enrollmentNumber.trim(),
                status: 'pending',
                createdAt: serverTimestamp(),
            });
            // user is already signed in by createUserWithEmailAndPassword
            Alert.alert('Signup Successful', 'Your request is pending approval.');
            router.replace('/(cadet)/pending');
        } catch (e: any) {
            console.error('Signup error', e);
            let msg = e.message || 'Failed to create account.';
            if (e.code === 'auth/email-already-in-use') {
                msg = 'Email is already in use.';
            } else if (e.code === 'auth/invalid-email') {
                msg = 'Invalid email address.';
            } else if (e.code === 'auth/weak-password') {
                msg = 'Password is too weak.';
            }
            Alert.alert('Error', msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cadet Signup</Text>
                <View style={{ width: 40 }} />
            </View>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <Card style={{ padding: 20 }}>
                        <Text style={styles.sectionTitle}>Account Details</Text>
                        <Field label="Email Address *" value={form.email} onChange={v => update('email', v)} placeholder="college email" keyboardType="email-address" autoCapitalize="none" />
                        <Field label="Password *" value={form.password} onChange={v => update('password', v)} placeholder="Choose a password" secureTextEntry />

                        <Text style={styles.sectionTitle}>Personal Information</Text>
                        <Field label="Full Name *" value={form.fullName} onChange={v => update('fullName', v)} placeholder="e.g. Arjun Kumar" />
                        <Field label="Register Number *" value={form.registerNumber} onChange={v => update('registerNumber', v)} placeholder="e.g. 119011001" autoCapitalize="characters" />
                        <Field label="Enrollment Number" value={form.enrollmentNumber} onChange={v => update('enrollmentNumber', v)} placeholder="NCC enrollment no." />
                        <Field label="Phone Number *" value={form.phone} onChange={v => update('phone', v)} placeholder="10-digit mobile number" keyboardType="phone-pad" />
                        <Field label="Department *" value={form.department} onChange={v => update('department', v)} placeholder="e.g. Computer Science" />

                        <Text style={styles.label}>Year *</Text>
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

                        <Text style={styles.label}>Wing *</Text>
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

                        <Text style={styles.label}>Squad *</Text>
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
                    </Card>

                    <PrimaryButton
                        title="SIGN UP"
                        onPress={handleSubmit}
                        loading={saving}
                        style={{ marginTop: 8 }}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function Field({
    label, value, onChange, placeholder, keyboardType = 'default', autoCapitalize = 'words', secureTextEntry = false,
}: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder: string; keyboardType?: any; autoCapitalize?: any; secureTextEntry?: boolean;
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
                secureTextEntry={secureTextEntry}
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
    backBtn: { padding: 8 },
    backText: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },
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
});
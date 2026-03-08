import { Text } from '@/components/ui/Text';
import { db } from '@/config/firebase';
import { COLORS } from '@/constants/Colors';
import { CadetRequest, useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
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

export default function CadetRegisterScreen() {
    const router = useRouter();
    const { user, cadetRequest } = useAuth();
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        fullName: '',
        registerNumber: '',
        year: '',
        department: '',
        phone: '',
        email: user?.email || '',
        bloodGroup: '',
        enrollmentNumber: '',
        wing: 'SD',
        squad: 'Alpha',
    });

    const update = (key: keyof typeof form, val: string) =>
        setForm(prev => ({ ...prev, [key]: val }));

    useEffect(() => {
        if (cadetRequest) {
            if (cadetRequest.status === 'pending') {
                router.replace('/(cadet)/pending');
                return;
            }
            if (cadetRequest.status === 'approved') {
                // should soon have a profile, let guard handle redirect
                return;
            }
            if (cadetRequest.status === 'rejected') {
                // allow user to edit previous values
                setForm(prev => ({
                    ...prev,
                    fullName: cadetRequest.fullName,
                    registerNumber: cadetRequest.registerNumber,
                    year: cadetRequest.year,
                    department: cadetRequest.department || '',
                    phone: cadetRequest.phone,
                    email: cadetRequest.email,
                    bloodGroup: cadetRequest.bloodGroup || '',
                    enrollmentNumber: cadetRequest.enrollmentNumber || '',
                    wing: cadetRequest.wing || 'SD',
                    squad: cadetRequest.squad || 'Alpha',
                }));
            }
        }
    }, [cadetRequest]);

    const handleSubmit = async () => {
        const required: (keyof typeof form)[] = ['fullName', 'registerNumber', 'year', 'department', 'phone', 'email'];
        for (const f of required) {
            if (!form[f].trim()) {
                Alert.alert('Missing Field', `Please fill in ${f.replace(/([A-Z])/g, ' $1').toLowerCase()}.`);
                return;
            }
        }

        if (!user) return;

        setSaving(true);
        try {
            const req: Partial<CadetRequest> = {
                uid: user.uid,
                fullName: form.fullName.trim(),
                registerNumber: form.registerNumber.trim().toUpperCase(),
                year: form.year,
                department: form.department.trim(),
                phone: form.phone.trim(),
                email: form.email.trim(),
                bloodGroup: form.bloodGroup,
                enrollmentNumber: form.enrollmentNumber.trim(),
                wing: form.wing,
                squad: form.squad,
                status: 'pending',
                createdAt: serverTimestamp(),
            };
            await setDoc(doc(db, 'cadet_requests', user.uid), req);
            Alert.alert('Request submitted', 'Your registration request has been sent for admin approval.');
            router.replace('/(cadet)/pending');
        } catch (e: any) {
            console.error(e);
            Alert.alert('Error', e?.message || 'Failed to submit request. Please try again.');
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
                <Text style={styles.headerTitle}>Cadet Registration</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <Card style={{ padding: 20 }}>
                        <Text style={styles.sectionTitle}>Personal Information</Text>

                        <Field label="Full Name *" value={form.fullName} onChange={v => update('fullName', v)} placeholder="e.g. Arjun Kumar" />
                        <Field label="Register Number *" value={form.registerNumber} onChange={v => update('registerNumber', v)} placeholder="e.g. 119011001" autoCapitalize="characters" />
                        <Field label="Enrollment Number" value={form.enrollmentNumber} onChange={v => update('enrollmentNumber', v)} placeholder="NCC enrollment no." />
                        <Field label="Phone Number *" value={form.phone} onChange={v => update('phone', v)} placeholder="10-digit mobile number" keyboardType="phone-pad" />
                        <Field label="Email Address *" value={form.email} onChange={v => update('email', v)} placeholder="college email" keyboardType="email-address" autoCapitalize="none" />
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

                    <View style={styles.noteBox}>
                        <Ionicons name="information-circle" size={20} color={COLORS.info} style={{ marginRight: 8 }} />
                        <Text style={styles.noteText}>
                            Your information will be reviewed by an administrator before activation.
                        </Text>
                    </View>

                    <PrimaryButton
                        title="SUBMIT REQUEST"
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
        backgroundColor: COLORS.infoBg,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.info,
        flexDirection: 'row',
        alignItems: 'center',
    },
    noteText: { fontSize: 13, color: COLORS.info, fontWeight: '600', flex: 1 },
});
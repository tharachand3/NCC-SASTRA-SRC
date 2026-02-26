import { db } from '@/config/firebase';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    
    TextInput,
    TouchableOpacity,
    View} from 'react-native';

export default function ChangePasswordScreen() {
    const router = useRouter();
    const { user, userProfile } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);

    const handleUpdate = async () => {
        if (!password || !confirmPassword) {
            Alert.alert('Missing Fields', 'Please enter both fields.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Passwords Mismatch', 'New password and confirm password do not match.');
            return;
        }

        setSaving(true);
        try {
            if (user && userProfile?.uid) {
                await updatePassword(user, password);
                await updateDoc(doc(db, 'users', userProfile.uid), {
                    mustChangePassword: false
                });

                Alert.alert('Success', 'Password updated successfully.', [
                    { text: 'OK', onPress: () => router.replace('/(cadet)/dashboard') }
                ]);
            } else {
                Alert.alert('Error', 'User not found.');
            }
        } catch (e: any) {
            console.error(e);
            Alert.alert('Error', e?.message || 'Failed to update password. Please try again or re-login.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mandatory Password Change</Text>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={24} color={COLORS.navy} />
                        <Text style={styles.infoText}>
                            For your security, you must set a new password before accessing your dashboard.
                        </Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.label}>New Password *</Text>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="At least 6 characters"
                            placeholderTextColor={COLORS.midGray}
                            secureTextEntry
                        />

                        <Text style={styles.label}>Confirm New Password *</Text>
                        <TextInput
                            style={styles.input}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Re-enter new password"
                            placeholderTextColor={COLORS.midGray}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                        onPress={handleUpdate}
                        disabled={saving}
                        activeOpacity={0.85}
                    >
                        {saving ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.saveBtnText}>Update Password</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.offWhite },
    header: {
        backgroundColor: COLORS.navy,
        paddingHorizontal: 16,
        paddingTop: 48, // slightly more padding for no-back button header
        paddingBottom: 16,
        alignItems: 'center',
    },
    headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
    scroll: { padding: 16, paddingBottom: 40 },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#E8F0FE',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
        gap: 12,
    },
    infoText: { flex: 1, color: COLORS.navy, fontSize: 14, lineHeight: 20 },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 18,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    label: { fontSize: 13, fontWeight: '600', color: COLORS.darkText, marginBottom: 8, marginTop: 4 },
    input: {
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: COLORS.darkText,
        backgroundColor: COLORS.offWhite,
        marginBottom: 12,
    },
    saveBtn: {
        backgroundColor: COLORS.navy,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    saveBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700', letterSpacing: 1 },
});

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    
    TextInput,
    View
} from 'react-native';

export default function LoginScreen() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter your email and password.');
            return;
        }
        setLoading(true);
        try {
            await login(email.trim(), password);
            // Navigation handled by RouteGuard in _layout.tsx
        } catch (error: any) {
            let msg = 'Login failed. Please try again.';
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                msg = 'Invalid email or password.';
            } else if (error.code === 'auth/user-not-found') {
                msg = 'No account found with this email.';
            } else if (error.code === 'auth/too-many-requests') {
                msg = 'Too many attempts. Please try again later.';
            }
            Alert.alert('Login Failed', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                {/* Header Banner */}
                <View style={styles.header}>
                    <View style={styles.emblemCircle}>
                        <Text style={styles.emblemText}>NCC</Text>
                    </View>
                    <Text style={styles.appTitle}>NCC SASTRA SRC</Text>
                    <Text style={styles.appSubtitle}>Cadet Management System</Text>
                </View>

                {/* Login Card */}
                <Card style={styles.card}>
                    <Text style={styles.cardTitle}>Welcome Back</Text>
                    <Text style={styles.cardSubtitle}>Sign in to your account</Text>

                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor={COLORS.textMuted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={email}
                        onChangeText={setEmail}
                    />

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor={COLORS.textMuted}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <PrimaryButton
                        title="LOGIN"
                        onPress={handleLogin}
                        loading={loading}
                        style={styles.loginBtn}
                    />
                </Card>

                {/* Footer */}
                <Text style={styles.footer}>
                    NCC SASTRA SRC • For official use only
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    emblemCircle: {
        width: 72,
        height: 72,
        borderRadius: 20, // Squircle shape instead of perfect circle for pure modern feel
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    emblemText: {
        color: COLORS.white,
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 2,
    },
    appTitle: {
        color: COLORS.text,
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    appSubtitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginTop: 6,
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    card: {
        padding: 24,
        paddingTop: 32,
    },
    cardTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 6,
        letterSpacing: -0.5,
    },
    cardSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 32,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: COLORS.text,
        backgroundColor: COLORS.card,
        marginBottom: 20,
    },
    loginBtn: {
        marginTop: 12,
        height: 52,
    },
    footer: {
        textAlign: 'center',
        color: COLORS.textMuted,
        fontSize: 13,
        marginTop: 40,
    },
});

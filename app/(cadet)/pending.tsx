import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { signOut } from "firebase/auth";
import { auth } from "../../config/firebase";
import { SafeAreaView, StyleSheet, View, TouchableOpacity } from 'react-native';

export default function CadetPendingScreen() {
    const { cadetRequest } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // if request was approved and profile will soon exist, redirect to dashboard automatically
        if (cadetRequest?.status === 'approved') {
            router.replace('/(cadet)/dashboard');
        }
        // if no request maybe send back to register
        if (!cadetRequest) {
            router.replace('/(cadet)/register');
        }
    }, [cadetRequest]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.inner}>
                {cadetRequest?.status === 'pending' && (
                    <>
                        <Text style={styles.title}>Registration Pending</Text>
                        <Text style={styles.message}>
                            Your details have been submitted and are awaiting admin approval. Once approved you will be able to access the app.
                        </Text>

                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={async () => {
                                await signOut(auth);
                                router.replace('/(auth)/login');
                            }}
                        >
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </>
                )}
                {cadetRequest?.status === 'rejected' && (
                    <>
                        <Text style={styles.title}>Request Rejected</Text>
                        <Text style={styles.message}>
                            {cadetRequest.reviewComments || 'Your registration request was rejected by the administrator.'}
                        </Text>
                        <Text style={styles.note} onPress={() => router.replace('/(cadet)/register')}>
                            Tap here to edit your information and resubmit.
                        </Text>
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    inner: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    title: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 12, textAlign: 'center' },
    message: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
    note: { fontSize: 14, color: COLORS.primary, marginTop: 24, textDecorationLine: 'underline' },

    logoutButton: {
        marginTop: 30,
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 28,
        borderRadius: 8
    },

    logoutText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16
    }
});
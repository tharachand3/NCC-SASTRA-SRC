import { Text } from '@/components/ui/Text';
import { db } from '@/config/firebase';
import { COLORS } from '@/constants/Colors';
import { CadetRequest, useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import { Card } from '../../components/ui/Card';
import { PrimaryButton } from '../../components/ui/PrimaryButton';

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}:</Text>
            <Text style={styles.detailValue}>{value}</Text>
        </View>
    );
}

export default function CadetRequestsScreen() {
    const { userProfile } = useAuth();
    const router = useRouter();
    const [requests, setRequests] = useState<CadetRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'cadet_requests'), where('status', '==', 'pending'));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ uid: d.id, ...d.data() } as CadetRequest));
            setRequests(data);
            setLoading(false);
        }, (err) => {
            console.error('Error fetching cadet requests', err);
            setLoading(false);
        });
        return unsub;
    }, []);

    const approve = async (req: CadetRequest) => {
        try {
            // create user profile record
            await setDoc(doc(db, 'users', req.uid), {
                fullName: req.fullName,
                registerNumber: req.registerNumber,
                year: req.year,
                department: req.department || '',
                phone: req.phone,
                email: req.email,
                wing: req.wing || '',
                squad: req.squad || '',
                bloodGroup: req.bloodGroup || '',
                enrollmentNumber: req.enrollmentNumber || '',
                role: 'cadet',
                status: 'active',
                totalPoints: 0,
                cdtRank: 'Cadet',
                mustChangePassword: true,
                createdAt: serverTimestamp(),
            });
            await updateDoc(doc(db, 'cadet_requests', req.uid), {
                status: 'approved',
                reviewedAt: serverTimestamp(),
                reviewedBy: userProfile?.uid || null,
            });
            Alert.alert('Approved', `${req.fullName} has been approved and added as a cadet.`);
        } catch (err: any) {
            console.error(err);
            Alert.alert('Error', 'Unable to approve request.');
        }
    };

    const handleRejectRequest = async (req: CadetRequest) => {
        try {
            await updateDoc(doc(db, 'cadet_requests', req.uid), {
                status: 'rejected',
                reviewedAt: serverTimestamp(),
                reviewedBy: userProfile?.uid || null,
            });
            Alert.alert('Rejected', `${req.fullName}'s request has been rejected.`);
        } catch (err: any) {
            console.error(err);
            Alert.alert('Error', 'Could not update request.');
        }
    };

    const renderReq = ({ item }: { item: CadetRequest }) => (
        <Card style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.fullName?.[0]?.toUpperCase() ?? '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.fullName}</Text>
                    <Text style={styles.sub}>{item.registerNumber}</Text>
                </View>
            </View>

            <View style={styles.detailsContainer}>
                <DetailRow label="Email" value={item.email} />
                <DetailRow label="NCC Company" value={item.wing || 'Not specified'} />
                <DetailRow label="Year" value={item.year} />
                <DetailRow label="Phone Number" value={item.phone} />
                {item.department && <DetailRow label="Department" value={item.department} />}
                {item.squad && <DetailRow label="Squad" value={item.squad} />}
                {item.bloodGroup && <DetailRow label="Blood Group" value={item.bloodGroup} />}
                {item.enrollmentNumber && <DetailRow label="Enrollment Number" value={item.enrollmentNumber} />}
            </View>

            <View style={styles.actionRow}>
                <PrimaryButton title="Approve" onPress={() => approve(item)} style={{ flex: 1, marginRight: 4 }} />
                <PrimaryButton title="Reject" onPress={() => handleRejectRequest(item)} style={[{ flex: 1, backgroundColor: COLORS.error }]} />
            </View>
        </Card>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cadet Requests</Text>
                <View style={{ width: 40 }} />
            </View>
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : requests.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="checkmark-circle-outline" size={64} color={COLORS.success} />
                    <Text style={styles.emptyText}>No pending requests</Text>
                </View>
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={r => r.uid}
                    renderItem={renderReq}
                    contentContainerStyle={{ padding: 16 }}
                />
            )}
        </SafeAreaView>
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
    card: { marginBottom: 12, padding: 16 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: { color: COLORS.white, fontSize: 20, fontWeight: '800' },
    name: { fontSize: 18, fontWeight: '700', color: COLORS.text },
    sub: { fontSize: 14, color: COLORS.textSecondary },
    detailsContainer: { marginBottom: 16 },
    detailRow: { flexDirection: 'row', marginBottom: 4 },
    detailLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, width: 120 },
    detailValue: { fontSize: 14, color: COLORS.text, flex: 1 },
    actionRow: { flexDirection: 'row' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { marginTop: 12, color: COLORS.textSecondary, fontSize: 15 },
});
import { db } from '@/config/firebase';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet,  TextInput, TouchableOpacity, View } from 'react-native';

export default function AdminChat() {
    const { userProfile } = useAuth();
    const router = useRouter();
    const { cadetId, cadetName } = useLocalSearchParams<{ cadetId: string, cadetName: string }>();
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (!cadetId) return;

        const chatRoomRef = doc(db, 'messages', cadetId);
        const q = query(collection(chatRoomRef, 'thread'), orderBy('createdAt', 'asc'));

        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setMessages(data);
            setLoading(false);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        });

        // Mark as read by admin
        setDoc(chatRoomRef, { unreadByAdmin: false }, { merge: true });

        return unsub;
    }, [cadetId]);

    const handleSend = async () => {
        const text = inputText.trim();
        if (!text || !cadetId) return;

        setInputText('');
        const chatRoomRef = doc(db, 'messages', cadetId);

        try {
            await addDoc(collection(chatRoomRef, 'thread'), {
                text,
                senderId: userProfile?.uid,
                senderRole: 'admin',
                createdAt: serverTimestamp()
            });

            await setDoc(chatRoomRef, {
                lastMessage: text,
                lastUpdated: serverTimestamp(),
                unreadByCadet: true,
                unreadByAdmin: false
            }, { merge: true });
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>{cadetName || 'Cadet User'}</Text>
                    <Text style={styles.subtitle}>Direct Message</Text>
                </View>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {loading ? (
                    <View style={styles.center}><ActivityIndicator color={COLORS.navy} /></View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        renderItem={({ item }) => {
                            const isMe = item.senderRole === 'admin';
                            return (
                                <View style={[styles.msgWrapper, isMe ? styles.msgRight : styles.msgLeft]}>
                                    <View style={[styles.msgBubble, isMe ? styles.myBubble : styles.theirBubble]}>
                                        <Text style={[styles.msgText, isMe ? styles.myText : styles.theirText]}>
                                            {item.text}
                                        </Text>
                                    </View>
                                </View>
                            );
                        }}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <Text style={styles.emptyText}>No messages yet.</Text>
                            </View>
                        }
                    />
                )}

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a reply..."
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity onPress={handleSend} style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]} disabled={!inputText.trim()}>
                        <Ionicons name="send" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.offWhite },
    header: {
        backgroundColor: COLORS.navy, paddingHorizontal: 16, paddingTop: 28, paddingBottom: 16,
        flexDirection: 'row', alignItems: 'center', gap: 12
    },
    backBtn: { padding: 4 },
    title: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
    subtitle: { color: COLORS.lightGray, fontSize: 12, marginTop: 2 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16, paddingBottom: 24, gap: 12 },
    msgWrapper: { flexDirection: 'row', width: '100%', marginVertical: 4 },
    msgRight: { justifyContent: 'flex-end' },
    msgLeft: { justifyContent: 'flex-start' },
    msgBubble: { maxWidth: '80%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16 },
    myBubble: { backgroundColor: COLORS.navy, borderBottomRightRadius: 4 },
    theirBubble: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderBottomLeftRadius: 4 },
    msgText: { fontSize: 14, lineHeight: 20 },
    myText: { color: COLORS.white },
    theirText: { color: COLORS.darkText },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: COLORS.midGray, fontSize: 15, marginTop: 12 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'flex-end', padding: 12,
        backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border
    },
    input: {
        flex: 1, backgroundColor: COLORS.offWhite, borderWidth: 1, borderColor: COLORS.border,
        borderRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
        maxHeight: 100, fontSize: 15, color: COLORS.darkText, marginRight: 10
    },
    sendBtn: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.navy,
        justifyContent: 'center', alignItems: 'center'
    }
});

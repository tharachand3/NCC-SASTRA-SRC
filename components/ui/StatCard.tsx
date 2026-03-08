import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card } from './Card';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: any;
    color?: string;
    onPress?: () => void;
}

export const StatCard = ({ title, value, icon, color = COLORS.primary, onPress }: StatCardProps) => {
    const Container: any = onPress ? TouchableOpacity : Card;
    const containerProps = onPress ? { onPress } : {};

    return (
        <Container style={styles.container} {...containerProps}>
            <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View style={styles.content}>
                <Text style={styles.value} numberOfLines={1}>{value}</Text>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
            </View>
        </Container>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 8, // Slightly wider for grid spacing
        marginBottom: 16,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12, // Sharp corner
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    value: {
        fontSize: 22,
        fontWeight: '800', // Ultra bold value
        color: COLORS.text,
        letterSpacing: -0.5, // tighter tracking for numbers looks premium
        marginBottom: 2,
    },
    title: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: '600',
        letterSpacing: 0.2,
    }
});

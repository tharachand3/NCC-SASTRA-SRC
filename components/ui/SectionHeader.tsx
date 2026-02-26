import { COLORS } from '@/constants/Colors';
import { Text } from '@/components/ui/Text';
import React from 'react';
import { StyleSheet,  TouchableOpacity, View } from 'react-native';

interface SectionHeaderProps {
    title: string;
    actionLabel?: string;
    onAction?: () => void;
}

export const SectionHeader = ({ title, actionLabel, onAction }: SectionHeaderProps) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            {actionLabel && onAction && (
                <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
                    <Text style={styles.action}>{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        marginTop: 32, // More breathing room above sections
        paddingHorizontal: 8, // Align with typical card margins
    },
    title: {
        fontSize: 16, // Slightly smaller but bolder is more premium
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: 0.5,
        textTransform: 'uppercase', // Very professional
    },
    action: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.primary,
    }
});

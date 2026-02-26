import { COLORS } from '@/constants/Colors';
import { Text } from '@/components/ui/Text';
import React from 'react';
import { StyleSheet,  View, ViewProps } from 'react-native';

interface BadgeProps extends ViewProps {
    label: string;
    status?: 'success' | 'warning' | 'error' | 'info' | 'default';
}

export const Badge = ({ label, status = 'default', style, ...props }: BadgeProps) => {
    let bgColor = COLORS.border;
    let textColor = COLORS.textSecondary;

    switch (status) {
        case 'success':
            bgColor = COLORS.successBg;
            textColor = COLORS.success;
            break;
        case 'warning':
            bgColor = COLORS.warningBg;
            textColor = COLORS.warning;
            break;
        case 'error':
            bgColor = COLORS.errorBg;
            textColor = COLORS.error;
            break;
        case 'info':
            bgColor = COLORS.infoBg;
            textColor = COLORS.info;
            break;
        case 'default':
            bgColor = COLORS.primaryLight;
            textColor = COLORS.primary;
            break;
    }

    return (
        <View style={[styles.badge, { backgroundColor: bgColor }, style]} {...props}>
            <Text style={[styles.text, { color: textColor }]}>{label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    text: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    }
});

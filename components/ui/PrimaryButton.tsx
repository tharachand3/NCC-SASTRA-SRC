import { COLORS } from '@/constants/Colors';
import { Text } from '@/components/ui/Text';
import React from 'react';
import { ActivityIndicator, StyleSheet,  TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface PrimaryButtonProps extends TouchableOpacityProps {
    title: string;
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
}

export const PrimaryButton = ({
    title,
    loading = false,
    variant = 'primary',
    style,
    disabled,
    ...props
}: PrimaryButtonProps) => {

    let bgColor = COLORS.primary;
    let textColor = COLORS.white;
    let borderColor = 'transparent';
    let borderWidth = 0;

    switch (variant) {
        case 'secondary':
            bgColor = COLORS.primaryLight;
            textColor = COLORS.primary;
            break;
        case 'outline':
            bgColor = 'transparent';
            textColor = COLORS.primary;
            borderColor = COLORS.primary;
            borderWidth = 1.5;
            break;
        case 'danger':
            bgColor = COLORS.error;
            textColor = COLORS.white;
            break;
    }

    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            style={[
                styles.button,
                { backgroundColor: bgColor, borderColor, borderWidth },
                isDisabled && styles.disabled,
                style
            ]}
            disabled={isDisabled}
            activeOpacity={0.8}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'outline' ? COLORS.primary : COLORS.white} />
            ) : (
                <Text style={[styles.text, { color: textColor }]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 56,
        borderRadius: 12, // Sharp but approachable border radius
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginVertical: 12,
    },
    text: {
        fontSize: 16,
        fontWeight: '700', // Bolder for high contrast readability
        letterSpacing: 0.4,
    },
    disabled: {
        opacity: 0.6,
    }
});

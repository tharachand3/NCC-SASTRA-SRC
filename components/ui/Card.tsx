import { COLORS } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
    children: React.ReactNode;
    style?: any;
    noPadding?: boolean;
}

export const Card = ({ children, style, noPadding = false, ...props }: CardProps) => {
    return (
        <View style={[styles.card, !noPadding && styles.padding, style]} {...props}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        // Extremely subtle shadow just for depth separation from background, not for primary card definition
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    padding: {
        padding: 24, // Increased padding for premium breathing room
    }
});

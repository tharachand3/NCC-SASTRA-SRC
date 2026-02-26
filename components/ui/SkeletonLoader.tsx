import { COLORS } from '@/constants/Colors';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewProps } from 'react-native';

interface SkeletonProps extends ViewProps {
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
    style?: any;
}

export const Skeleton = ({ width = '100%', height = 20, borderRadius = 8, style, ...props }: SkeletonProps) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.skeleton,
                { width: width as any, height: height as any, borderRadius, opacity },
                style
            ]}
            {...props}
        />
    );
};

export const CardSkeleton = () => (
    <View style={styles.cardSkeleton}>
        <Skeleton width="40%" height={24} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="80%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height={14} />
    </View>
);

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: COLORS.border,
    },
    cardSkeleton: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    }
});

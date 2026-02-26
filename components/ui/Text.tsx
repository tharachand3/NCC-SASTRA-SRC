import { FONTS } from '@/constants/Colors';
import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';

export interface TextProps extends RNTextProps {
    weight?: 'regular' | 'medium' | 'semiBold' | 'bold' | 'extraBold';
}

export function Text({ style, weight, ...props }: TextProps) {
    let fontFamily = FONTS.regular;

    if (weight === 'medium') fontFamily = FONTS.medium;
    else if (weight === 'semiBold') fontFamily = FONTS.semiBold;
    else if (weight === 'bold') fontFamily = FONTS.bold;
    else if (weight === 'extraBold') fontFamily = FONTS.extraBold;
    else if (style) {
        const flatStyle = StyleSheet.flatten(style) || {};
        if (flatStyle.fontWeight) {
            const fw = String(flatStyle.fontWeight);
            if (fw === '500') fontFamily = FONTS.medium;
            else if (fw === '600') fontFamily = FONTS.semiBold;
            else if (fw === '700' || fw === 'bold') fontFamily = FONTS.bold;
            else if (fw === '800' || fw === '900') fontFamily = FONTS.extraBold;
        }
    }

    return <RNText style={[{ fontFamily }, style]} {...props} />;
}
/**
 * FINN v2.5 — Pure Visual Flat Accent Surface (kompatibel lintas tahap)
 * Diperbarui ke gaya Light-Mode Fintech flat tanpa neon/glow agar tombol & bar
 * pada layar lain tetap bersih dan kontras tinggi sebelum tahap lanjutannya.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS } from '../../constants/theme.js';

export default function NeonGradientSurface({
  variant = 'button', // 'hero' | 'button' | 'xpBar' | 'subtle' | 'magentaBar'
  style,
}) {
  let backgroundColor = COLORS.ink;
  if (variant === 'hero') {
    backgroundColor = COLORS.lime;
  } else if (variant === 'xpBar' || variant === 'magentaBar') {
    backgroundColor = COLORS.limeStrong;
  } else if (variant === 'subtle') {
    backgroundColor = COLORS.surface;
  }

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor }, style]}
    />
  );
}

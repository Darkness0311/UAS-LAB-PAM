/**
 * FINN v2.5 — Pure Visual Mini Sparkline (react-native-svg)
 * Menggambar garis tren tipis dari data numerik asli tanpa angka hardcode.
 * Menghormati prefers-reduced-motion melalui useReducedMotion.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { COLORS } from '../../constants/theme.js';
import useReducedMotion from './useReducedMotion.js';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function MiniSparkline({
  values,
  color = COLORS.ink,
  width = 68,
  height = 28,
  strokeWidth = 2,
}) {
  const reduceMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  const geometry = useMemo(() => {
    if (!Array.isArray(values) || values.length < 2) {
      return null;
    }

    const padX = 4;
    const padY = 4;
    const usableW = Math.max(1, width - padX * 2);
    const usableH = Math.max(1, height - padY * 2);

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal;

    const points = values.map((val, idx) => {
      const x = padX + (idx / (values.length - 1)) * usableW;
      const normalized = range > 0 ? (val - minVal) / range : 0.5;
      const y = padY + (1 - normalized) * usableH;
      return { x, y };
    });

    // Smooth quadratic polyline path
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    let approxLength = 0;

    for (let i = 1; i < points.length; i += 1) {
      const prev = points[i - 1];
      const curr = points[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      d += ` Q ${prev.x.toFixed(1)} ${prev.y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`;
      approxLength += Math.hypot(curr.x - prev.x, curr.y - prev.y);
    }

    const last = points[points.length - 1];
    d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;

    return {
      d,
      lastPoint: last,
      pathLength: Math.max(40, Math.ceil(approxLength * 1.25)),
    };
  }, [values, width, height]);

  const seriesSignature = useMemo(
    () => (Array.isArray(values) ? values.join(',') : ''),
    [values]
  );

  useEffect(() => {
    if (!geometry) {
      return;
    }
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [seriesSignature, reduceMotion, geometry, progress]);

  if (!geometry) {
    return null;
  }

  const dashOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [geometry.pathLength, 0],
  });

  return (
    <View style={{ width, height }} pointerEvents="none">
      <Svg width={width} height={height}>
        <AnimatedPath
          d={geometry.d}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${geometry.pathLength}`}
          strokeDashoffset={dashOffset}
        />
        <Circle
          cx={geometry.lastPoint.x}
          cy={geometry.lastPoint.y}
          r={2.5}
          fill={color}
        />
      </Svg>
    </View>
  );
}

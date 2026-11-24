/**
 * FINN v2.5 — Pure UI Accessibility Hook (prefers-reduced-motion)
 * Membaca preferensi Reduce Motion sistem agar seluruh animasi UI menghormati aksesibilitas.
 */

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export default function useReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMounted) {
          setReduceMotion(Boolean(enabled));
        }
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        if (isMounted) {
          setReduceMotion(Boolean(enabled));
        }
      }
    );

    return () => {
      isMounted = false;
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
    };
  }, []);

  return reduceMotion;
}

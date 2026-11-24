/**
 * FINN v2.5 — Application Entry Point (App.js)
 * Mengintegrasikan SafeAreaProvider, StatusBar gelap untuk Light-Mode Fintech Dashboard (#EEECE6),
 * FinnProvider (Central State & Storage Orchestrator), dan AppNavigator.
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from './src/constants/theme.js';
import { FinnProvider } from './src/context/FinnContext.js';
import AppNavigator from './src/navigation/AppNavigator.js';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={COLORS.background} />
      <FinnProvider>
        <AppNavigator />
      </FinnProvider>
    </SafeAreaProvider>
  );
}

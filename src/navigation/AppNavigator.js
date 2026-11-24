/**
 * FINN v2.5 — Root App Navigator & Status Gate
 * Visual Redesign: Light-Mode Fintech Dashboard (Bento Grid & Lime Accent)
 * - Pill putih melayang (#FFFFFF, rounded-full) dengan item aktif pill hitam (#111111) bertulisan putih.
 * - Seluruh alur status gate (loading / corrupt / ready), TAB_ROUTES, dan ToastBanner 100% tetap sama.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CorruptDataView from '../components/common/CorruptDataView.js';
import LoadingView from '../components/common/LoadingView.js';
import ToastBanner from '../components/common/ToastBanner.js';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme.js';
import { useFinn } from '../context/FinnContext.js';
import AnalyticsScreen from '../screens/AnalyticsScreen.js';
import CategoryDataScreen from '../screens/CategoryDataScreen.js';
import HomeScreen from '../screens/HomeScreen.js';

export const TAB_ROUTES = Object.freeze({
  HOME: 'Beranda',
  ANALYTICS: 'Analisis',
  CATEGORIES_DATA: 'Kategori & Data',
});

const Tab = createBottomTabNavigator();

const FINN_NAVIGATION_THEME = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.textPrimary,
    border: COLORS.border,
    primary: COLORS.ink,
  },
};

function FintechPillTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 12);

  return (
    <View
      style={[styles.floatingBarWrapper, { paddingBottom: bottomOffset }]}
      pointerEvents="box-none"
    >
      <View style={styles.pillContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          let iconName = 'home-outline';
          if (route.name === TAB_ROUTES.HOME) {
            iconName = isFocused ? 'home' : 'home-outline';
          } else if (route.name === TAB_ROUTES.ANALYTICS) {
            iconName = isFocused ? 'pie-chart' : 'pie-chart-outline';
          } else if (route.name === TAB_ROUTES.CATEGORIES_DATA) {
            iconName = isFocused ? 'grid' : 'grid-outline';
          }

          const shortLabel =
            route.name === TAB_ROUTES.CATEGORIES_DATA
              ? 'Kategori'
              : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel || route.name}
              activeOpacity={0.82}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tabPill, isFocused && styles.tabPillActive]}
            >
              <Ionicons
                name={iconName}
                size={18}
                color={isFocused ? COLORS.white : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isFocused && styles.tabLabelActive,
                ]}
                numberOfLines={1}
              >
                {shortLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function AppNavigator() {
  const { appStatus } = useFinn();

  // Gate 1: Status Loading
  if (appStatus === 'loading') {
    return <LoadingView />;
  }

  // Gate 2: Status Corrupt
  if (appStatus === 'corrupt') {
    return <CorruptDataView />;
  }

  // Gate 3: Status Ready -> Render Bottom Tabs & ToastBanner
  return (
    <View style={styles.rootContainer}>
      <NavigationContainer theme={FINN_NAVIGATION_THEME}>
        <Tab.Navigator
          initialRouteName={TAB_ROUTES.HOME}
          tabBar={(props) => <FintechPillTabBar {...props} />}
          screenOptions={{
            headerShown: false,
          }}
        >
          <Tab.Screen name={TAB_ROUTES.HOME} component={HomeScreen} />
          <Tab.Screen name={TAB_ROUTES.ANALYTICS} component={AnalyticsScreen} />
          <Tab.Screen
            name={TAB_ROUTES.CATEGORIES_DATA}
            component={CategoryDataScreen}
          />
        </Tab.Navigator>
      </NavigationContainer>

      {/* Banner Toast (Simpan di luar filter 2,5 detik) & Error Penyimpanan */}
      <ToastBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  floatingBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    padding: 6,
    gap: 4,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.pillBar,
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
  },
  tabPillActive: {
    backgroundColor: COLORS.ink,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabLabelActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
});

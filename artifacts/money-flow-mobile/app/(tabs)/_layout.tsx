import React from 'react';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import { ColorValue, Platform, StyleSheet, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

function NativeTabLayout() {
  return <NativeTabs>
    <NativeTabs.Trigger name="index">
      <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      <NativeTabs.Trigger.Label>Tổng quan</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="transactions">
      <NativeTabs.Trigger.Icon sf={{ default: 'arrow.left.arrow.right', selected: 'arrow.left.arrow.right' }} md="swap_horiz" />
      <NativeTabs.Trigger.Label>Giao dịch</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="assets">
      <NativeTabs.Trigger.Icon sf={{ default: 'building.columns', selected: 'building.columns.fill' }} md="account_balance_wallet" />
      <NativeTabs.Trigger.Label>Tài sản</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="analysis">
      <NativeTabs.Trigger.Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} md="bar_chart" />
      <NativeTabs.Trigger.Label>Phân tích</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
  </NativeTabs>;
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  const icon = (name: keyof typeof Feather.glyphMap) => ({ color }: { color: ColorValue }) =>
    <Feather name={name} size={20} color={color} />;

  return <Tabs screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.mutedForeground,
    tabBarLabelStyle: { fontFamily: 'Inter_500Medium', fontSize: 10 },
    tabBarStyle: {
      position: 'absolute',
      backgroundColor: isIOS ? 'transparent' : colors.background,
      borderTopWidth: isWeb ? 1 : StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      elevation: 0,
      paddingBottom: isWeb ? 0 : insets.bottom,
      height: isWeb ? 84 : 58 + insets.bottom,
    },
    tabBarBackground: () => isIOS
      ? <BlurView intensity={100} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      : isWeb ? <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} /> : null,
  }}>
    <Tabs.Screen name="index" options={{ title: 'Tổng quan', tabBarIcon: icon('home') }} />
    <Tabs.Screen name="transactions" options={{ title: 'Giao dịch', tabBarIcon: icon('repeat') }} />
    <Tabs.Screen name="assets" options={{ title: 'Tài sản', tabBarIcon: icon('briefcase') }} />
    <Tabs.Screen name="analysis" options={{ title: 'Phân tích', tabBarIcon: icon('bar-chart-2') }} />
  </Tabs>;
}

export default function TabLayout() {
  return isLiquidGlassAvailable() ? <NativeTabLayout /> : <ClassicTabLayout />;
}

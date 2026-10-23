import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FinanceProvider } from '@/context/FinanceContext';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { setBaseUrl } from '@workspace/api-client-react';
import { useFinance } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
if (process.env.EXPO_PUBLIC_DOMAIN) {
  setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
}
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
    </Stack>
  );
}

function FinanceAppShell() {
  const finance = useFinance();
  const colors = useColors();

  if (!finance.ready) {
    return (
      <View style={[styles.storageScreen, { backgroundColor: colors.background }]}>
        {finance.loadError ? (
          <>
            <Text style={[styles.storageTitle, { color: colors.foreground }]}>Chưa mở được dữ liệu</Text>
            <Text style={[styles.storageMessage, { color: colors.mutedForeground }]}>{finance.loadError}</Text>
            <Pressable
              onPress={() => { void finance.retryLoad(); }}
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              accessibilityRole="button"
            >
              <Text style={styles.retryButtonText}>Thử đọc lại</Text>
            </Pressable>
          </>
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}
      </View>
    );
  }

  return <RootLayoutNav />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <FinanceProvider>
                <FinanceAppShell />
              </FinanceProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  storageScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  storageTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, textAlign: 'center' },
  storageMessage: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 10 },
  retryButton: { minHeight: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, borderRadius: 12, marginTop: 20 },
  retryButtonText: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 13 },
});

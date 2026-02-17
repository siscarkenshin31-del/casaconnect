import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { getTenantLoggedIn } from '../_auth/session';

export default function TenantLayout() {
  const segments = useSegments();
  const router = useRouter();
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean | null>(null);

  const inAuthGroup = useMemo(() => {
    return segments[1] === 'login' || segments[1] === 'register';
  }, [segments]);

  useEffect(() => {
    // Web refresh loses JS memory; read from localStorage instead.
    setIsUserLoggedIn(getTenantLoggedIn());
  }, []);

  useEffect(() => {
    // Don't redirect until we know the stored auth state.
    if (isUserLoggedIn === null) return;
    if (!isUserLoggedIn && !inAuthGroup) {
      router.replace('/tenant/login');
    }
  }, [isUserLoggedIn, inAuthGroup, router]);

  if (isUserLoggedIn === null && !inAuthGroup) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="map" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="search" />
      {/* auth routes */}
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
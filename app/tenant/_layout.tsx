import { Tabs } from 'expo-router';
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

const isUserLoggedIn = false; 

export default function TenantLayout() {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[1] === 'login' || segments[1] === 'register';

    if (!isUserLoggedIn && !inAuthGroup) {
      router.replace('/tenant/login');
    }
  }, [isUserLoggedIn, segments]);

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#2f95dc' }}>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="map" options={{ title: 'Map' }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      {/* Hide these from the actual Tab Bar bottom menu */}
      <Tabs.Screen name="login" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="register" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
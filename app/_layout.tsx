import { COLORS } from '@/constants/Colors';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts
} from '@expo-google-fonts/inter';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

SplashScreen.preventAutoHideAsync();

// Route guard: redirect based on auth state and role
function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === '(admin)';
    const inCadetGroup = segments[0] === '(cadet)';

    if (!user) {
      // Not signed in — always go to login
      if (!inAuthGroup) router.replace('/(auth)/login');
    } else if (userProfile?.role === 'admin') {
      // Admin — redirect to admin dashboard
      if (!inAdminGroup) router.replace('/(admin)/dashboard');
    } else if (userProfile) {
      // Non-admin logic (cadet or unassigned)
      if (inAdminGroup) {
        // Guard against non-admins trying to access admin routes
        router.replace('/(cadet)/dashboard');
      } else if (userProfile.mustChangePassword) {
        // Cadet — check for mandatory password change
        if (segments[1] !== 'change-password') {
          router.replace('/(cadet)/change-password');
        }
      } else {
        // Redirect to dashboard if they are outside cadet group or on the change-password screen
        if (!inCadetGroup || segments[1] === 'change-password') {
          router.replace('/(cadet)/dashboard');
        }
      }
    }
  }, [user, userProfile, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.navy }}>
        <ActivityIndicator size="large" color={COLORS.white} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || error) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  if (!fontsLoaded && !error) {
    return null; // Keep splash screen visible while fonts load
  }

  return (
    <AuthProvider>
      <RouteGuard>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(admin)" options={{ headerShown: false }} />
          <Stack.Screen name="(cadet)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="light" backgroundColor={COLORS.navy} />
      </RouteGuard>
    </AuthProvider>
  );
}

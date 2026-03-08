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
  const { user, userProfile, cadetRequest, loading, loadingRequest } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading || loadingRequest) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === '(admin)';
    const inCadetGroup = segments[0] === '(cadet)';

    if (!user) {
      // Not signed in — allow signup page but nothing else
      const isSignup = inCadetGroup && segments[1] === 'signup';
      if (!inAuthGroup && !isSignup) router.replace('/(auth)/login');
    } else if (userProfile?.role === 'admin') {
      // Admin — redirect to admin dashboard
      if (!inAdminGroup) router.replace('/(admin)/dashboard');
    } else {
      // User is not admin (possibly cadet or just created auth account)
      // determine next screen based on profile/request state

      // if there's a pending or rejected registration request, show pending screen
      if ((!userProfile || userProfile.status !== 'active') && cadetRequest) {
        // user has submitted a request
        if (cadetRequest.status === 'pending') {
          if (!(inCadetGroup && segments[1] === 'pending')) {
            router.replace('/(cadet)/pending');
          }
          return;
        } else if (cadetRequest.status === 'rejected') {
          // let them edit/submit again
          if (!(inCadetGroup && segments[1] === 'register')) {
            router.replace('/(cadet)/register');
          }
          return;
        }
      }

      // if profile does not exist or is incomplete, send to registration
      if (!userProfile || (userProfile.role === 'cadet' && (!userProfile.fullName || !userProfile.registerNumber))) {
        if (!(inCadetGroup && segments[1] === 'register')) {
          router.replace('/(cadet)/register');
        }
        return;
      }

      // finally do the normal cadet routing logic
      if (inAdminGroup) {
        router.replace('/(cadet)/dashboard');
      } else if (userProfile.mustChangePassword) {
        if (segments[1] !== 'change-password') {
          router.replace('/(cadet)/change-password');
        }
      } else {
        if (!inCadetGroup || segments[1] === 'change-password') {
          router.replace('/(cadet)/dashboard');
        }
      }
    }
  }, [user, userProfile, cadetRequest, loading, loadingRequest, segments]);
  if (loading || loadingRequest) {
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

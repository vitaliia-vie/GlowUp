import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

function RootNavigation() {
  const { firebaseUser, profile, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!firebaseUser && !inAuthGroup) {
      // Not logged in — send to login
      router.replace("/(auth)/login");
    } else if (firebaseUser && profile && inAuthGroup) {
      // Logged in but sitting on an auth screen — send to the right home
      router.replace(profile.role === "master" ? "/(master)" : "/(client)");
    }
  }, [firebaseUser, profile, isLoading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RootNavigation />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

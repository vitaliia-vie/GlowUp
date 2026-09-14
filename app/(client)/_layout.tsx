import { Stack } from "expo-router";

export default function ClientLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="index" />
      <Stack.Screen name="bookings" />
      <Stack.Screen
        name="master/[id]"
        options={{ headerShown: true, headerTitle: "" }}
      />
      <Stack.Screen
        name="booking/[masterId]"
        options={{ headerShown: true, headerTitle: "" }}
      />
    </Stack>
  );
}

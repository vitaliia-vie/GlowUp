import { Stack } from "expo-router";

export default function MasterLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="services" />
      <Stack.Screen name="bookings" />
      <Stack.Screen name="availability" />
      <Stack.Screen
        name="portfolio"
        options={{ headerShown: true, headerTitle: "" }}
      />
      <Stack.Screen
        name="profile"
        options={{ headerShown: true, headerTitle: "" }}
      />
    </Stack>
  );
}

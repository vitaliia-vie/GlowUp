import { Stack } from "expo-router";

export default function MasterChatLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="[clientId]" />
    </Stack>
  );
}

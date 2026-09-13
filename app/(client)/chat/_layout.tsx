import { Stack } from "expo-router";

export default function ClientChatLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="[masterId]" />
    </Stack>
  );
}

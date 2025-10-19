import { Stack } from "expo-router";

export default function TrackStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="symptom-log" options={{ headerShown: false }} />
      <Stack.Screen name="kick-counter" options={{ headerShown: false }} />
      <Stack.Screen name="nutrition-coach" options={{ headerShown: false }} />
      <Stack.Screen name="goals" options={{ headerShown: false }} />
      <Stack.Screen name="alerts" options={{ headerShown: false }} />
    </Stack>
  );
}

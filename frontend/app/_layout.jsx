import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    >
      {/* Splash screen */}
      <Stack.Screen name="index" />

      {/* Auth screens */}
      <Stack.Screen name="Login" />

      {/* Dashboard screens */}
      <Stack.Screen name="Student" />
      <Stack.Screen name="Driver" />
      <Stack.Screen name="Admin" />
      
      {/* Map screen */}
      <Stack.Screen name="Map" />
    </Stack>
  );
}
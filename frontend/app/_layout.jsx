
import { Stack } from "expo-router";

export default function RootLayout() {

  return (
    <Stack
      screenOptions={{
        headerShown: false, // hide headers globally
        animation: "fade",   // smoother transitions
      }}
    >
      {/* Splash screen */}
      <Stack.Screen name="index" />

      {/* Auth and main screens */}
      {/* <Stack.Screen name="login" /> */}
      <Stack.Screen name="Home" />
      <Stack.Screen name="Map" />
    </Stack>
  );
}

import { Stack } from "expo-router";

// This file wraps EVERY screen in the app.
// headerShown: false just removes that default blue title bar
// so we can design our own look on each screen.
export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
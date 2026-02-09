import { Stack } from "expo-router";

export default function LandownerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#f4511e" },
        headerTintColor: "#fff",
      }}
    >
      <Stack.Screen
        name="login"
        options={{ title: "Landowner Sign In", headerShown: false }}
      />
      <Stack.Screen name="dashboard" options={{ title: "My Properties" }} />
      <Stack.Screen name="verify" options={{ title: "Account Verification" }} />
      <Stack.Screen name="edit-listing" options={{ title: "Edit Property" }} />
    </Stack>
  );
}

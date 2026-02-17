import { Stack } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function TenantChatScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Chat" }} />
      <Text style={styles.text}>Chat screen (coming soon)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 16, color: "#444" },
});


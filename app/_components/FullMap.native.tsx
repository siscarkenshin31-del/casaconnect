import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  center: { lat: number; lon: number };
  zoom?: number;
};

export default function FullMap(_props: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Map view (native) not wired yet.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#2f95dc",
    fontWeight: "700",
  },
});


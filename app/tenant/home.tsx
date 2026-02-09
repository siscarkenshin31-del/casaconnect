import { Text, View } from "react-native";

export default function TenantHome() {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 23, fontWeight: "bold" }}>
        Available Rentals
      </Text>
      {/* List of properties would go here */}
    </View>
  );
}

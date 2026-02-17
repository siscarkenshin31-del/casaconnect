import React from "react";
import { StyleSheet, View } from "react-native";
import FullMap from "./FullMap.native";
import type { MapMarker, MarkerPosition } from "./InteractiveMap.types";

type Props = {
  center: { lat: number; lon: number };
  zoom?: number;
  markers: MapMarker[];
  selectedMarkerId?: string | null;
  userLocation?: { lat: number; lon: number } | null;
  onMarkerPress?: (id: string, position: MarkerPosition) => void;
  onMapMove?: (center: { lat: number; lon: number }) => void;
};

export default function InteractiveMap(props: Props) {
  return (
    <View style={styles.container}>
      <FullMap center={props.center} zoom={props.zoom} />
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
  text: { color: "#2f95dc", fontWeight: "700" },
});


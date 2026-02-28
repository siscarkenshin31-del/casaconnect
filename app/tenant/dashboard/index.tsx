import { View, StyleSheet, TextInput, FlatList, Text, TouchableOpacity, Platform } from "react-native";
import { useState, useMemo } from "react";
import InteractiveMap from "../../_components/InteractiveMap";

// Sample markers
const allMarkers = [
  { id: "1", lat: 14.5995, lon: 120.9842, title: "Manila Apartments" },
  { id: "2", lat: 14.6095, lon: 120.9952, title: "Makati Condo" },
  { id: "3", lat: 14.5895, lon: 120.9742, title: "Quezon City House" },
  { id: "4", lat: 14.5795, lon: 120.9642, title: "Pasig Townhome" },
];

export default function Home() {
  const [center, setCenter] = useState({ lat: 14.5995, lon: 120.9842 });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  // Filter markers dynamically based on search
  const filteredMarkers = useMemo(() => {
    if (!searchQuery) return allMarkers;
    return allMarkers.filter(marker =>
      marker.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // When a suggestion is pressed
  const handleSelectMarker = (marker: typeof allMarkers[0]) => {
    setSelectedMarkerId(marker.id);
    setCenter({ lat: marker.lat, lon: marker.lon });
    setSearchQuery(marker.title); // optional: show selected name in search
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <InteractiveMap
        center={center}
        zoom={14}
        markers={filteredMarkers}
        selectedMarkerId={selectedMarkerId}
        userLocation={null}
        onMapMove={(newCenter) => setCenter(newCenter)}
        onMarkerPress={(id) => setSelectedMarkerId(id)}
      />

      {/* Floating Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search places..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Floating Suggestions */}
        {searchQuery.length > 0 && filteredMarkers.length > 0 && (
          <FlatList
            data={filteredMarkers}
            keyExtractor={(item) => item.id}
            style={styles.suggestionList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelectMarker(item)}
              >
                <Text style={styles.suggestionText}>{item.title}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  searchInput: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  suggestionList: {
    marginTop: 5,
    maxHeight: 200,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 16,
    color: "#333",
  },
});
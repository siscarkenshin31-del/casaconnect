import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import InteractiveMap from "../_components/InteractiveMap";
import type { MapMarker, MarkerPosition } from "../_components/InteractiveMap.types";
import { RENTALS } from "../_data/rentals";

type Coords = { lat: number; lon: number };

type PlaceSuggestion = {
  display_name: string;
  lat: string;
  lon: string;
};

const AREAS = ["Nearby", "Tondo Manila", "Quezon City", "Laguna", "Boracay", "Cebu", "Bataan"] as const;
type Area = (typeof AREAS)[number];

const DEFAULT_RADIUS_KM = 20; // Show pins within 20km radius

/** Infer area filter from search text so "Tondo" shows all Tondo Manila pins. */
function inferAreaFromQuery(q: string): Area {
  const lower = q.trim().toLowerCase();
  if (/tondo/.test(lower)) return "Tondo Manila";
  if (/quezon/.test(lower)) return "Quezon City";
  if (/laguna/.test(lower)) return "Laguna";
  if (/boracay|aklan/.test(lower)) return "Boracay";
  if (/cebu/.test(lower)) return "Cebu";
  if (/bataan/.test(lower)) return "Bataan";
  return "Nearby";
}

function haversineKm(a: Coords, b: Coords) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

async function geocodeWhere(query: string): Promise<Coords | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    trimmed,
  )}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "CasaConnect/1.0 (Rental map)" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { lat: string; lon: string }[];

  if (!data?.length) return null;
  const lat = Number(data[0].lat);
  const lon = Number(data[0].lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return { lat, lon };
}

/** Google-like address autocomplete via Nominatim (debounce in caller). */
async function fetchPlaceSuggestions(
  query: string,
): Promise<PlaceSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=8&q=${encodeURIComponent(
    trimmed,
  )}`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "CasaConnect/1.0 (Rental map)",
    },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as PlaceSuggestion[];
  return Array.isArray(data) ? data : [];
}

const AUTOCOMPLETE_DEBOUNCE_MS = 350;

export default function TenantMapScreen() {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState<Area>("Nearby");
  const [userLocation, setUserLocation] = useState<Coords | null>(null);
  const [mapCenter, setMapCenter] = useState<Coords>({
    lat: 14.5995,
    lon: 120.9842,
  });
  const [mapZoom, setMapZoom] = useState(13); // Default zoom level
  const [isLocating, setIsLocating] = useState(Platform.OS === "web");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<MarkerPosition | null>(null);

  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<TextInput | null>(null);

  const locateMe = () => {
    if (Platform.OS !== "web") return;

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      Alert.alert("Location unavailable", "Geolocation is not supported here.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setUserLocation(next); // Store user's actual location
        setMapCenter(next);
        setMapZoom(13); // Good zoom for 20km radius view
        setArea("Nearby"); // Reset to nearby mode
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        // Don't alert on first load, just use default center
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 },
    );
  };

  useEffect(() => {
    if (Platform.OS === "web") locateMe();
    
    // Cleanup debounce timer on unmount
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Google-like autocomplete: debounced suggestions as user types
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      debounceRef.current = null;
      setIsLoadingSuggestions(true);
      try {
        const list = await fetchPlaceSuggestions(q);
        setSuggestions(list);
        setShowSuggestions(list.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, AUTOCOMPLETE_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;

    setShowSuggestions(false);
    try {
      setIsSearching(true);
      const found = await geocodeWhere(q);
      if (!found) {
        Alert.alert("Not found", "Try a more specific place name.");
        return;
      }
      setMapCenter(found);
      setMapZoom(12); // Good zoom for searched area
      setArea(inferAreaFromQuery(q));
    } catch {
      Alert.alert("Search failed", "Please try again.");
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  const handleSelectSuggestion = useCallback((s: PlaceSuggestion) => {
    const lat = Number(s.lat);
    const lon = Number(s.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    setQuery(s.display_name);
    setMapCenter({ lat, lon });
    setMapZoom(12); // Good zoom for searched location
    setArea(inferAreaFromQuery(s.display_name));
    setShowSuggestions(false);
    setSuggestions([]);
    searchInputRef.current?.blur();
  }, []);

  const rentalsWithDistance = useMemo(() => {
    // Always calculate distance from current map center (changes as user drags)
    return RENTALS.map((r) => {
      const d = haversineKm(mapCenter, { lat: r.latitude, lon: r.longitude });
      return { rental: r, distanceKm: d };
    });
  }, [mapCenter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (area !== "Nearby") {
      // Show pins in the selected area within 20km of map center
      return rentalsWithDistance
        .filter(({ rental, distanceKm }) => rental.area === area && distanceKm <= DEFAULT_RADIUS_KM)
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }

    // "Nearby" mode: show pins within 20km radius of current map center
    const byText = rentalsWithDistance.filter(({ rental }) => {
      if (!q) return true;
      return (
        rental.title.toLowerCase().includes(q) ||
        rental.address.toLowerCase().includes(q) ||
        rental.area.toLowerCase().includes(q)
      );
    });

    return byText
      .filter(({ distanceKm }) => distanceKm <= DEFAULT_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [area, query, rentalsWithDistance]);

  const markers: MapMarker[] = useMemo(() => {
    return filtered.map(({ rental }) => ({
      id: rental.id,
      lat: rental.latitude,
      lon: rental.longitude,
      title: rental.title,
    }));
  }, [filtered]);

  const selectedRental = useMemo(() => {
    if (!selectedId) return null;
    const rental = RENTALS.find((r) => r.id === selectedId) ?? null;
    if (!rental) return null;

    const distanceKm = haversineKm(mapCenter, {
      lat: rental.latitude,
      lon: rental.longitude,
    });
    return { rental, distanceKm };
  }, [selectedId, mapCenter]);

  const handleSelect = (id: string, position?: MarkerPosition) => {
    setSelectedId(id);
    if (position) setPopupPosition(position);
    // Don't change zoom when selecting a pin, just center it
  };

  const handleMapMove = useCallback((newCenter: { lat: number; lon: number }) => {
    // Update map center immediately for smooth experience
    // The map component already debounces this callback
    setMapCenter(newCenter);
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.body}>
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Available rentals</Text>
            <Text style={styles.sidebarSubtitle}>
              {area === "Nearby"
                ? `${filtered.length} rentals within ${DEFAULT_RADIUS_KM}km`
                : `${filtered.length} in ${area} (within ${DEFAULT_RADIUS_KM}km)`}
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.sidebarList}>
            {filtered.map(({ rental, distanceKm }) => {
              const active = selectedId === rental.id;
              return (
                <Pressable
                  key={rental.id}
                  onPress={() => handleSelect(rental.id)}
                  style={[styles.listCard, active && styles.listCardActive]}
                >
                  <Image
                    source={{ uri: rental.photo }}
                    style={styles.cardPhoto}
                    resizeMode="cover"
                  />
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {rental.title}
                    </Text>
                    <Text style={styles.cardAddress} numberOfLines={2}>
                      {rental.address}
                    </Text>
                    <View style={styles.cardMetaRow}>
                      <Text style={styles.cardMeta}>
                        {rental.area}
                        {"  "}·{"  "}
                        {distanceKm.toFixed(1)} km
                      </Text>
                    </View>
                    <Text style={styles.cardMeta} numberOfLines={1}>
                      Available: {rental.availability_date}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.mapPane}>
          <InteractiveMap
            center={mapCenter}
            zoom={mapZoom}
            markers={markers}
            selectedMarkerId={selectedId}
            userLocation={userLocation}
            onMarkerPress={(id: string, pos: MarkerPosition) => handleSelect(id, pos)}
            onMapMove={handleMapMove}
          />

          {selectedRental ? (
            <View
              style={[
                styles.quickView,
                popupPosition && typeof window !== "undefined"
                  ? {
                      left: Math.max(
                        18,
                        Math.min(popupPosition.x - 180, window.innerWidth - 378)
                      ),
                      bottom: window.innerHeight - popupPosition.y + 50,
                    }
                  : {},
              ]}
            >
              <TouchableOpacity
                style={styles.quickClose}
                onPress={() => {
                  setSelectedId(null);
                  setPopupPosition(null);
                }}
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>

              <View style={styles.quickViewRow}>
                <Image
                  source={{ uri: selectedRental.rental.photo }}
                  style={styles.quickPhoto}
                  resizeMode="cover"
                />
                <View style={styles.quickDetails}>
                  <Text style={styles.quickTitle} numberOfLines={1}>
                    {selectedRental.rental.title}
                  </Text>
                  <Text style={styles.quickDistance}>
                    {selectedRental.distanceKm.toFixed(2)} km
                  </Text>
                  <Text style={styles.quickAddress} numberOfLines={2}>
                    {selectedRental.rental.address}
                  </Text>
                  <View style={styles.quickMetaRow}>
                    <View style={styles.quickBadge}>
                      <Text style={styles.quickBadgeText}>
                        Available: {selectedRental.rental.availability_date}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.quickContact} numberOfLines={1}>
                    📞 {selectedRental.rental.contact_name} -{" "}
                    {selectedRental.rental.contact_number}
                  </Text>
                </View>
                <View style={styles.quickPriceSection}>
                  <Text style={styles.quickPriceLabel}>Inquire for</Text>
                  <Text style={styles.quickPriceValue}>Price</Text>
                  <Text style={styles.quickPricePer}>per month</Text>
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </View>

      {/* Top search bar with Google-like autocomplete */}
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <Text style={styles.brandText}>CasaConnect</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color="#666" />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search address, neighborhood, or city"
              value={query}
              onChangeText={setQuery}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              autoCorrect={false}
            />
            {isLoadingSuggestions ? (
              <ActivityIndicator
                size="small"
                style={styles.suggestionSpinner}
              />
            ) : null}
            <TouchableOpacity
              onPress={handleSearch}
              disabled={isSearching || !query.trim()}
              style={styles.topIconButton}
            >
              {isSearching ? (
                <ActivityIndicator size="small" />
              ) : (
                <Ionicons name="arrow-forward" size={18} color="#111" />
              )}
            </TouchableOpacity>
          </View>

          {showSuggestions && suggestions.length > 0 ? (
            <View style={styles.suggestionsDropdown}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                style={styles.suggestionsScroll}
                nestedScrollEnabled
              >
                {suggestions.map((s, i) => (
                  <Pressable
                    key={`${s.lat}-${s.lon}-${i}`}
                    style={({ pressed }) => [
                      styles.suggestionItem,
                      pressed && styles.suggestionItemPressed,
                    ]}
                    onPress={() => handleSelectSuggestion(s)}
                  >
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color="#666"
                      style={styles.suggestionIcon}
                    />
                    <Text style={styles.suggestionText} numberOfLines={2}>
                      {s.display_name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={locateMe}
          disabled={Platform.OS !== "web" || isLocating}
          style={styles.topRightButton}
        >
          <Ionicons name="locate-outline" size={18} color="#111" />
        </TouchableOpacity>
      </View>

      <View style={styles.filtersRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {AREAS.map((k) => (
            <Pressable
              key={k}
              onPress={() => setArea(k)}
              style={[styles.chip, area === k && styles.chipActive]}
            >
              <Text
                style={[styles.chipText, area === k && styles.chipTextActive]}
              >
                {k}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {Platform.OS !== "web" ? (
        <View style={styles.nativeBanner}>
          <Text style={styles.nativeBannerText}>
            This interactive map UI is currently enabled for web only.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  body: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: 380,
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderRightColor: "#e9e9e9",
  },
  sidebarHeader: {
    paddingTop: 96,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },
  sidebarSubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: "#666",
  },
  sidebarList: {
    padding: 12,
    gap: 10,
    paddingBottom: 28,
  },
  listCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e7e7e7",
    borderRadius: 12,
    padding: 10,
  },
  listCardActive: {
    borderColor: "#2f95dc",
    backgroundColor: "#f4fbff",
  },
  cardPhoto: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: "#f2f2f2",
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111",
  },
  cardAddress: {
    marginTop: 4,
    fontSize: 12,
    color: "#555",
  },
  cardMetaRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  cardMeta: {
    fontSize: 12,
    color: "#666",
  },
  mapPane: {
    flex: 1,
  },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 62,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9e9e9",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 12,
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 6px 14px rgba(0,0,0,0.08)" }
      : {}),
    zIndex: 10,
  },
  brand: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#eaf6ff",
  },
  brandText: {
    fontWeight: "900",
    color: "#2f95dc",
  },
  searchContainer: {
    flex: 1,
    position: "relative",
  },
  searchWrap: {
    flex: 1,
    height: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e7e7e7",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
  },
  suggestionSpinner: {
    marginRight: 4,
  },
  suggestionsDropdown: {
    position: "absolute",
    top: 46,
    left: 0,
    right: 0,
    maxHeight: 280,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e7e7e7",
    zIndex: 20,
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 8px 24px rgba(0,0,0,0.12)" }
      : { elevation: 8 }),
  },
  suggestionsScroll: {
    maxHeight: 276,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  suggestionItemPressed: {
    backgroundColor: "#f0f8ff",
  },
  suggestionIcon: {
    marginLeft: 4,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: "#111",
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 14,
    color: "#111",
  },
  topIconButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f4f4",
  },
  topRightButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e7e7e7",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  filtersRow: {
    position: "absolute",
    top: 64,
    left: 12 + 380 + 2, // Start after sidebar
    right: 12,
    height: 44,
    zIndex: 9,
  },
  filtersContent: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e7e7e7",
    backgroundColor: "#fff",
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 4px 10px rgba(0,0,0,0.08)" }
      : {}),
  },
  chipActive: {
    borderColor: "#2f95dc",
    backgroundColor: "#eaf6ff",
  },
  chipText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "700",
  },
  chipTextActive: {
    color: "#2f95dc",
  },

  quickView: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
    maxWidth: 720,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 16,
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 8px 24px rgba(0,0,0,0.15)" }
      : { elevation: 8 }),
  },
  quickViewRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 14,
  },
  quickPhoto: {
    width: 140,
    height: 120,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
  },
  quickDetails: {
    flex: 1,
    justifyContent: "space-between",
    minWidth: 0,
  },
  quickTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#111",
    lineHeight: 22,
  },
  quickDistance: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  quickAddress: {
    marginTop: 6,
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
  },
  quickMetaRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  quickBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#f0f8ff",
    borderWidth: 1,
    borderColor: "#d0e8ff",
  },
  quickBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2f95dc",
  },
  quickContact: {
    marginTop: 8,
    fontSize: 12,
    color: "#666",
  },
  quickPriceSection: {
    alignItems: "flex-end",
    justifyContent: "center",
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: "#e9e9e9",
  },
  quickPriceLabel: {
    fontSize: 11,
    color: "#888",
    textTransform: "uppercase",
  },
  quickPriceValue: {
    marginTop: 4,
    fontSize: 28,
    fontWeight: "900",
    color: "#111",
  },
  quickPricePer: {
    fontSize: 12,
    color: "#666",
  },
  quickClose: {
    position: "absolute",
    top: -12,
    right: -12,
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
    borderWidth: 2,
    borderColor: "#fff",
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 4px 12px rgba(0,0,0,0.2)" }
      : { elevation: 4 }),
  },

  nativeBanner: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 12,
  },
  nativeBannerText: { color: "#fff", fontWeight: "700" },
});

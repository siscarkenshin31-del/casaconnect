import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { setTenantLoggedIn } from "../_auth/session";
import InteractiveMap from "../_components/InteractiveMap";
import type {
  MapMarker,
  MarkerPosition,
} from "../_components/InteractiveMap.types";
import { RENTALS } from "../_data/rentals";

type Coords = { lat: number; lon: number };

type PlaceSuggestion = {
  display_name: string;
  lat: string;
  lon: string;
};

type Area =
  | "Nearby"
  | "Tondo Manila"
  | "Quezon City"
  | "Laguna"
  | "Boracay"
  | "Cebu"
  | "Bataan";

const DEFAULT_RADIUS_KM = 20; // Show pins within 20km radius

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

async function fetchPlaceSuggestions(
  query: string,
): Promise<PlaceSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(
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

export default function TenantLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- EXISTING STATES ---
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // --- DAGDAG NA STATE PARA SA PANGALAWANG POPUP ---
  const [showDashboardPreview, setShowDashboardPreview] = useState(false);

  // --- MAP / SEARCH STATE (dashboard preview) ---
  const [dashboardWhere, setDashboardWhere] = useState("");
  const [dashboardUserLocation, setDashboardUserLocation] =
    useState<Coords | null>(null);
  const [dashboardCoords, setDashboardCoords] = useState<Coords | null>(null);
  const [dashboardZoom, setDashboardZoom] = useState(13); // Default zoom level
  const [dashboardArea, setDashboardArea] = useState<Area>("Nearby");
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [dashboardPopupPos, setDashboardPopupPos] =
    useState<MarkerPosition | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dashboardInputRef = useRef<TextInput | null>(null);

  // Validation: Email format at minimum password length
  const isEmailValid = /\S+@\S+\.\S+/.test(email);
  const canLogin = isEmailValid && password.length >= 6;

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      console.log("Logging in with:", { email, password });

      // Simulating API Call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setShowSuccessModal(true);
    } catch {
      Alert.alert("Error", "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- BINAGONG PROCEED PARA LUMABAS YUNG PANGALAWANG MODAL ---
  const handleProceed = () => {
    setShowSuccessModal(false);
    setTimeout(() => {
      setShowDashboardPreview(true); // Lalabas yung screen na may mga logos
    }, 500);
  };

  // --- LAST STEP: PAPUNTA NA SA REAL HOME ---
  const handleFinalHome = () => {
    setShowDashboardPreview(false);
    setTenantLoggedIn(true);
    router.replace("/tenant/map");
  };

  const dashboardCenter = useMemo(
    () => dashboardCoords ?? { lat: 14.5995, lon: 120.9842 },
    [dashboardCoords],
  );

  // Filter rentals based on area and distance (for dashboard preview)
  const dashboardFilteredRentals = useMemo(() => {
    const withDistance = RENTALS.map((r) => {
      const d = haversineKm(dashboardCenter, {
        lat: r.latitude,
        lon: r.longitude,
      });
      return { rental: r, distanceKm: d };
    });

    if (dashboardArea !== "Nearby") {
      // Show pins in the selected area within 20km
      return withDistance
        .filter(
          ({ rental, distanceKm }) =>
            rental.area === dashboardArea && distanceKm <= DEFAULT_RADIUS_KM,
        )
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }

    // Nearby: show rentals within 20km radius of current map center
    return withDistance
      .filter(({ distanceKm }) => distanceKm <= DEFAULT_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [dashboardCenter, dashboardArea]);

  const dashboardMarkers: MapMarker[] = useMemo(() => {
    return dashboardFilteredRentals.map(({ rental }) => ({
      id: rental.id,
      lat: rental.latitude,
      lon: rental.longitude,
      title: rental.title,
    }));
  }, [dashboardFilteredRentals]);

  const locateMe = () => {
    if (Platform.OS !== "web") return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userPos = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };
        setDashboardUserLocation(userPos); // Store user's actual location for blue pin
        setDashboardCoords(userPos); // Center map on user
        setDashboardZoom(13); // Good zoom for user location
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 },
    );
  };

  const handleWhereSearch = async () => {
    const q = dashboardWhere.trim();
    if (!q) return;

    setShowSuggestions(false);
    try {
      setIsSearching(true);
      const found = await geocodeWhere(q);
      if (found) {
        setDashboardCoords(found);
        setDashboardZoom(12); // Good zoom for searched area
        setDashboardArea(inferAreaFromQuery(q));
      }
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (showDashboardPreview) locateMe();
  }, [showDashboardPreview]);

  // Autocomplete suggestions (debounced)
  useEffect(() => {
    const q = dashboardWhere.trim();
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
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [dashboardWhere]);

  const handleSelectSuggestion = (s: PlaceSuggestion) => {
    const lat = Number(s.lat);
    const lon = Number(s.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    setDashboardWhere(s.display_name);
    setDashboardCoords({ lat, lon });
    setDashboardZoom(12); // Good zoom for searched location
    setDashboardArea(inferAreaFromQuery(s.display_name));
    setShowSuggestions(false);
    setSuggestions([]);
    dashboardInputRef.current?.blur();
  };

  const handleDashboardMapMove = (newCenter: { lat: number; lon: number }) => {
    setDashboardCoords(newCenter);
  };

  return (
    <View style={styles.container}>
      {/* --- FIRST MODAL (SUCCESS) --- */}
      <Modal animationType="fade" transparent={true} visible={showSuccessModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Login Successful!</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleProceed}
            >
              <Text style={styles.buttonText}>Proceed to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- SECOND MODAL (DASHBOARD PREVIEW NA KATULAD NG IMAGE) --- */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showDashboardPreview}
      >
        <View style={styles.dashboardPopup}>
          <View style={styles.previewMapContainer}>
            <InteractiveMap
              center={dashboardCenter}
              zoom={dashboardZoom}
              markers={dashboardMarkers}
              selectedMarkerId={selectedPinId}
              userLocation={dashboardUserLocation}
              onMarkerPress={(id: string, pos: MarkerPosition) => {
                setSelectedPinId(id);
                setDashboardPopupPos(pos);
              }}
              onMapMove={handleDashboardMapMove}
            />
          </View>

          <View style={styles.dashboardHeader}>
            <Text style={styles.title}>Tenant Dashboard</Text>
            <Text style={styles.subtitle}>
              {dashboardArea === "Nearby"
                ? `${dashboardFilteredRentals.length} rentals within ${DEFAULT_RADIUS_KM}km`
                : `${dashboardFilteredRentals.length} in ${dashboardArea} (within ${DEFAULT_RADIUS_KM}km)`}
            </Text>
          </View>

          <View style={styles.dashboardSearchCard}>
            <Text style={styles.dashboardSearchLabel}>Where?</Text>
            <View style={styles.dashboardSearchRow}>
              <Ionicons name="location-outline" size={18} color="#444" />
              <TextInput
                ref={dashboardInputRef}
                style={styles.dashboardSearchInput}
                placeholder="Search address (e.g. Tondo, Manila)"
                value={dashboardWhere}
                onChangeText={setDashboardWhere}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                returnKeyType="search"
                onSubmitEditing={handleWhereSearch}
                autoCorrect={false}
                autoCapitalize="none"
              />

              {isLoadingSuggestions ? (
                <ActivityIndicator
                  size="small"
                  color="#2f95dc"
                  style={{ marginRight: 6 }}
                />
              ) : null}

              <TouchableOpacity
                onPress={handleWhereSearch}
                disabled={isSearching || !dashboardWhere.trim()}
                style={[
                  styles.dashboardIconButton,
                  (isSearching || !dashboardWhere.trim()) &&
                    styles.dashboardIconButtonDisabled,
                ]}
              >
                {isSearching ? (
                  <ActivityIndicator size="small" color="#2f95dc" />
                ) : (
                  <Ionicons name="search-outline" size={18} color="#2f95dc" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={locateMe}
                disabled={Platform.OS !== "web" || isLocating}
                style={[
                  styles.dashboardIconButton,
                  (Platform.OS !== "web" || isLocating) &&
                    styles.dashboardIconButtonDisabled,
                ]}
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color="#2f95dc" />
                ) : (
                  <Ionicons name="navigate-outline" size={18} color="#2f95dc" />
                )}
              </TouchableOpacity>
            </View>

            {showSuggestions && suggestions.length > 0 ? (
              <View style={styles.dashboardSuggestionsDropdown}>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  style={styles.dashboardSuggestionsScroll}
                  nestedScrollEnabled
                >
                  {suggestions.map((s, i) => (
                    <Pressable
                      key={`${s.lat}-${s.lon}-${i}`}
                      style={({ pressed }) => [
                        styles.dashboardSuggestionItem,
                        pressed && styles.dashboardSuggestionPressed,
                      ]}
                      onPress={() => handleSelectSuggestion(s)}
                    >
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color="#666"
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={styles.dashboardSuggestionText}
                        numberOfLines={2}
                      >
                        {s.display_name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>

          {selectedPinId && dashboardFilteredRentals.length > 0 ? (
            <View
              style={[
                styles.dashboardQuickView,
                dashboardPopupPos && typeof window !== "undefined"
                  ? {
                      left: Math.max(
                        18,
                        Math.min(
                          dashboardPopupPos.x - 150,
                          window.innerWidth - 318,
                        ),
                      ),
                      bottom: window.innerHeight - dashboardPopupPos.y + 50,
                    }
                  : {},
              ]}
            >
              <TouchableOpacity
                style={styles.dashboardQuickClose}
                onPress={() => {
                  setSelectedPinId(null);
                  setDashboardPopupPos(null);
                }}
              >
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
              {(() => {
                const item = dashboardFilteredRentals.find(
                  ({ rental }) => rental.id === selectedPinId,
                );
                if (!item) return null;
                return (
                  <View style={styles.dashboardQuickRow}>
                    <Image
                      source={{ uri: item.rental.photo }}
                      style={styles.dashboardQuickPhoto}
                      resizeMode="cover"
                    />
                    <View style={styles.dashboardQuickDetails}>
                      <Text
                        style={styles.dashboardQuickTitle}
                        numberOfLines={1}
                      >
                        {item.rental.title}
                      </Text>
                      <Text style={styles.dashboardQuickDistance}>
                        {item.distanceKm.toFixed(2)} km
                      </Text>
                      <Text
                        style={styles.dashboardQuickAddress}
                        numberOfLines={2}
                      >
                        {item.rental.address}
                      </Text>
                    </View>
                    <View style={styles.dashboardQuickPrice}>
                      <Text style={styles.dashboardQuickPriceLabel}>
                        Inquire
                      </Text>
                      <Text style={styles.dashboardQuickPriceValue}>Price</Text>
                    </View>
                  </View>
                );
              })()}
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.dashboardContinue}
            onPress={handleFinalHome}
          >
            <Text style={styles.dashboardContinueText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Text style={styles.title}>Welcome Back</Text>

      <TextInput
        style={styles.input}
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, !canLogin && styles.disabledButton]}
        onPress={handleLogin}
        disabled={!canLogin || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Log In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/tenant/register")}
        style={styles.footer}
      >
        <Text style={styles.footerText}>
          Don&apos;t have an account?{" "}
          <Text style={styles.linkText}>Register</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2f95dc",
    textAlign: "center",
  },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 30 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2f95dc",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  disabledButton: { backgroundColor: "#a0ccf0" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  footer: { marginTop: 25, alignItems: "center" },
  footerText: { color: "#666" },
  linkText: { color: "#2f95dc", fontWeight: "bold" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2f95dc",
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: "#2f95dc",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },

  dashboardPopup: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 80,
    position: "relative",
  },
  dashboardHeader: {
    alignItems: "center",
    position: "absolute",
    top: 42,
    left: 0,
    right: 0,
    pointerEvents: "none",
  },
  // bottom nav removed

  previewMapContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },

  dashboardSearchCard: {
    position: "absolute",
    top: 120,
    left: 18,
    right: 18,
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e7e7e7",
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 6px 10px rgba(0,0,0,0.12)" }
      : {
          shadowColor: "#000",
          shadowOpacity: 0.12,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
        }),
    elevation: 6,
  },
  dashboardSearchLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
    color: "#111",
  },
  dashboardSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dashboardSearchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111",
  },
  dashboardIconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d8ecfb",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4fbff",
  },
  dashboardIconButtonDisabled: {
    opacity: 0.55,
  },

  dashboardSuggestionsDropdown: {
    marginTop: 12,
    maxHeight: 220,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e7e7e7",
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 6px 18px rgba(0,0,0,0.12)" }
      : { elevation: 6 }),
  },
  dashboardSuggestionsScroll: {
    maxHeight: 216,
  },
  dashboardSuggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  dashboardSuggestionPressed: {
    backgroundColor: "#f0f8ff",
  },
  dashboardSuggestionText: {
    flex: 1,
    fontSize: 13,
    color: "#111",
  },

  dashboardQuickView: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 90,
    maxWidth: 600,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 14,
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 8px 20px rgba(0,0,0,0.15)" }
      : { elevation: 8 }),
  },
  dashboardQuickRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
  },
  dashboardQuickPhoto: {
    width: 110,
    height: 100,
    borderRadius: 10,
    backgroundColor: "#f2f2f2",
  },
  dashboardQuickDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  dashboardQuickTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111",
  },
  dashboardQuickDistance: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  dashboardQuickAddress: {
    marginTop: 4,
    fontSize: 12,
    color: "#555",
    lineHeight: 16,
  },
  dashboardQuickPrice: {
    alignItems: "flex-end",
    justifyContent: "center",
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: "#e9e9e9",
  },
  dashboardQuickPriceLabel: {
    fontSize: 10,
    color: "#888",
    textTransform: "uppercase",
  },
  dashboardQuickPriceValue: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: "900",
    color: "#111",
  },
  dashboardQuickClose: {
    position: "absolute",
    top: -10,
    right: -10,
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
    borderWidth: 2,
    borderColor: "#fff",
    zIndex: 10,
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 4px 10px rgba(0,0,0,0.2)" }
      : { elevation: 4 }),
  },

  dashboardContinue: {
    position: "absolute",
    right: 18,
    bottom: 24,
    backgroundColor: "#2f95dc",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 8px 18px rgba(0,0,0,0.16)" }
      : {}),
  },
  dashboardContinueText: {
    color: "#fff",
    fontWeight: "800",
  },
});

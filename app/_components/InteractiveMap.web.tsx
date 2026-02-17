import React, { useEffect, useRef } from "react";
import { View } from "react-native";

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

function ensureLeafletCss() {
  if (typeof document === "undefined") return;
  const id = "leaflet-css";
  if (document.getElementById(id)) return;

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(link);
}

export default function InteractiveMap({
  center,
  zoom = 14,
  markers,
  selectedMarkerId,
  userLocation,
  onMarkerPress,
  onMapMove,
}: Props) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const isUserInteractingRef = useRef(false);
  const moveEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    ensureLeafletCss();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (typeof window === "undefined") return;
      if (!mapDivRef.current) return;
      if (mapRef.current) return;

      ensureLeafletCss();
      const L = await import("leaflet");
      if (cancelled) return;

      const map = L.map(mapDivRef.current, {
        zoomControl: true,
        attributionControl: true,
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
        zoomSnap: 1, // Standard zoom increments (fixes zoom issues)
        zoomDelta: 1,
        wheelPxPerZoomLevel: 60, // Standard mouse wheel zoom
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
      }).setView([center.lat, center.lon], zoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      }).addTo(map);

      const layer = L.layerGroup().addTo(map);
      mapRef.current = map;
      markersLayerRef.current = layer;

      // Track user interaction
      map.on("movestart", () => {
        isUserInteractingRef.current = true;
      });

      // Listen for map movement (drag/zoom) - debounced
      map.on("moveend", () => {
        if (moveEndTimeoutRef.current) clearTimeout(moveEndTimeoutRef.current);
        
        moveEndTimeoutRef.current = setTimeout(() => {
          isUserInteractingRef.current = false;
          if (onMapMove) {
            const center = map.getCenter();
            onMapMove({ lat: center.lat, lon: center.lng });
          }
        }, 500); // Wait 500ms after user stops moving
      });
    }

    init();
    return () => {
      cancelled = true;
      if (moveEndTimeoutRef.current) clearTimeout(moveEndTimeoutRef.current);
    };
  }, [center.lat, center.lon, zoom, onMapMove]);

  useEffect(() => {
    async function syncMarkers() {
      if (typeof window === "undefined") return;
      if (!mapRef.current || !markersLayerRef.current) return;

      const L = await import("leaflet");

      const layer = markersLayerRef.current;
      layer.clearLayers();

      const makeIcon = (isSelected: boolean) => {
        const size = isSelected ? 36 : 32;
        const iconColor = isSelected ? "#fff" : "#2f95dc";
        const bgColor = isSelected ? "#2f95dc" : "#fff";
        const borderColor = isSelected ? "#fff" : "#2f95dc";
        
        return L.divIcon({
          className: "",
          html: `<div style="
            width:${size}px;
            height:${size}px;
            display:flex;
            align-items:center;
            justify-content:center;
            background:${bgColor};
            border:2.5px solid ${borderColor};
            border-radius:50%;
            box-shadow:0px 4px 14px rgba(0,0,0,0.35);
            cursor:pointer;
          ">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${iconColor}" style="width:${size * 0.6}px;height:${size * 0.6}px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size],
        });
      };

      markers.forEach((m) => {
        const isSelected = selectedMarkerId === m.id;
        const marker = L.marker([m.lat, m.lon], {
          icon: makeIcon(isSelected),
          keyboard: true,
          title: m.title,
        });
        marker.on("click", (e) => {
          if (!mapRef.current || !onMarkerPress) return;
          const point = mapRef.current.latLngToContainerPoint(e.latlng);
          onMarkerPress(m.id, { x: point.x, y: point.y });
        });
        marker.addTo(layer);
      });
    }

    syncMarkers();
  }, [markers, onMarkerPress, selectedMarkerId]);

  // Sync user location marker
  useEffect(() => {
    async function syncUserMarker() {
      if (typeof window === "undefined") return;
      if (!mapRef.current) return;

      const L = await import("leaflet");

      // Remove old user marker if exists
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }

      if (!userLocation) return;

      const userIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:44px;
          height:44px;
          display:flex;
          align-items:center;
          justify-content:center;
          position:relative;
        ">
          <div style="
            width:44px;
            height:44px;
            display:flex;
            align-items:center;
            justify-content:center;
            background:#4285f4;
            border:3px solid #fff;
            border-radius:50%;
            box-shadow:0px 4px 16px rgba(66,133,244,0.4);
          ">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="#fff" style="width:26px;height:26px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          </div>
        </div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 44],
      });

      const marker = L.marker([userLocation.lat, userLocation.lon], {
        icon: userIcon,
        title: "Your location",
        interactive: false,
      });

      marker.addTo(mapRef.current);
      userMarkerRef.current = marker;
    }

    syncUserMarker();
  }, [userLocation]);

  useEffect(() => {
    if (!mapRef.current) return;
    
    // Don't interrupt user interaction with programmatic moves
    if (isUserInteractingRef.current) return;
    
    const currentCenter = mapRef.current.getCenter();
    const currentZoom = mapRef.current.getZoom();
    
    // Only update if there's a meaningful change
    const centerChanged = 
      Math.abs(currentCenter.lat - center.lat) > 0.0001 ||
      Math.abs(currentCenter.lng - center.lon) > 0.0001;
    const zoomChanged = Math.abs(currentZoom - zoom) > 0.1;
    
    if (centerChanged || zoomChanged) {
      mapRef.current.setView([center.lat, center.lon], zoom, {
        animate: true,
        duration: 0.5,
      });
    }
  }, [center.lat, center.lon, zoom]);

  return (
    <View style={{ flex: 1 }}>
      <div
        ref={(el) => {
          mapDivRef.current = el;
        }}
        style={{ width: "100%", height: "100%" }}
      />
    </View>
  );
}


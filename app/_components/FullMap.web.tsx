import React, { useMemo } from "react";

type Props = {
  center: { lat: number; lon: number };
  zoom?: number;
};

function buildOsmEmbedUrl(center: { lat: number; lon: number }, zoom: number) {
  // OSM embed uses bbox (lon/lat order). We'll derive a bbox from zoom.
  // This is intentionally simple; it doesn't need to be perfect for UI prototyping.
  const { lat, lon } = center;
  const span =
    zoom >= 16 ? 0.01 : zoom >= 14 ? 0.03 : zoom >= 12 ? 0.06 : 0.12;

  const minLat = lat - span;
  const maxLat = lat + span;
  const minLon = lon - span;
  const maxLon = lon + span;

  const bbox = `${minLon},${minLat},${maxLon},${maxLat}`;
  const marker = `${lat},${lon}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    bbox
  )}&layer=mapnik&marker=${encodeURIComponent(marker)}`;
}

export default function FullMap({ center, zoom = 14 }: Props) {
  const src = useMemo(() => buildOsmEmbedUrl(center, zoom), [center, zoom]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <iframe
        title="Map"
        src={src}
        style={{
          border: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
        loading="eager"
        referrerPolicy="no-referrer-when-downgrade"
        allow="geolocation"
      />
    </div>
  );
}


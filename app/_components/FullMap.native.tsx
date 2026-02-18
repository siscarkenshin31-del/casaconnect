import React from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from 'react-native-webview';

type Props = {
  center: { lat: number; lon: number };
  zoom?: number;
};

export default function FullMap({ center, zoom = 13 }: Props) {
  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>html, body, #map { height: 100%; margin: 0; }</style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([${center.lat}, ${center.lon}], ${zoom});
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
          L.marker([${center.lat}, ${center.lon}]).addTo(map);
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView 
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={{ flex: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
});


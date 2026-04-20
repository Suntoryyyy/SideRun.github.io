import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MapRooter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => {
      map.invalidateSize();
      if (center && center.latitude && center.longitude) {
        map.setView([center.latitude, center.longitude], map.getZoom());
      }
    }, 400);
    return () => clearTimeout(t);
  }, [center, map]);
  return null;
};

export default function WebBackgroundMap({ region }) {
  const defaultCenter = [37.78825, -122.4324];
  const center = region && region.latitude && region.longitude 
    ? [region.latitude, region.longitude] 
    : defaultCenter;

  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: -1 }]} pointerEvents="none">
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1, width: '100vw', height: '100vh', backgroundColor: '#EAEAEA' }}>
        <MapContainer 
          center={center} 
          zoom={14} 
          style={{ width: '100%', height: '100%', filter: 'brightness(0.9) grayscale(0.8)' }}
          zoomControl={false}
          scrollWheelZoom={false}
          dragging={false}
          doubleClickZoom={false}
          keyboard={false}
          attributionControl={false}
        >
          <MapRooter center={region} />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
        </MapContainer>
      </div>
    </View>
  );
}

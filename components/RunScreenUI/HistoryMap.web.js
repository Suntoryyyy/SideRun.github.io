import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const HistoryMap = ({ coordinates }) => {
  if (!coordinates || coordinates.length === 0) return null;
  const center = [coordinates[0].latitude, coordinates[0].longitude];
  const polylinePositions = coordinates.map(c => [c.latitude, c.longitude]);

  return (
    <View style={styles.container}>
      <MapContainer 
        center={center} 
        zoom={14} 
        style={{ width: '100%', height: '100%', borderRadius: 12 }}
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={polylinePositions} color="#24C789" weight={5} />
        <Marker position={center} />
        {coordinates.length > 1 && (
          <Marker position={[coordinates[coordinates.length - 1].latitude, coordinates[coordinates.length - 1].longitude]} />
        )}
      </MapContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 250,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#eee',
    marginBottom: 20
  }
});

export default HistoryMap;

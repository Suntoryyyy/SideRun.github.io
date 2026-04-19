import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import MapStyle from '../../screens/MapStyle.json';

const HistoryMap = ({ coordinates }) => {
  if (!coordinates || coordinates.length === 0) return null;

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: coordinates[0].latitude,
        longitude: coordinates[0].longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }}
      scrollEnabled={false}
      zoomEnabled={false}
      customMapStyle={MapStyle}
    >
      <Polyline
        coordinates={coordinates}
        strokeColor="#24C789"
        strokeWidth={5}
      />
      <Marker coordinate={coordinates[0]} title="Start" />
      {coordinates.length > 1 && (
        <Marker
          coordinate={coordinates[coordinates.length - 1]}
          title="End"
        />
      )}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 250,
    borderRadius: 15,
    marginBottom: 20,
  }
});

export default HistoryMap;

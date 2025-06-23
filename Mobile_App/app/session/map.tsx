import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { getDistance } from 'geolib';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RADIUS_METERS = 10;

const calculateAverage = (points: { lat: number, lon: number, value: number }[]) => {
  const clusters = [];
  const visited = new Set();

  for (let i = 0; i < points.length; i++) {
    if (visited.has(i)) continue;

    const cluster = [points[i]];
    visited.add(i);

    for (let j = i + 1; j < points.length; j++) {
      const dist = getDistance(
        { latitude: points[i].lat, longitude: points[i].lon },
        { latitude: points[j].lat, longitude: points[j].lon }
      );

      if (dist <= RADIUS_METERS) {
        cluster.push(points[j]);
        visited.add(j);
      }
    }

    const avgLat = cluster.reduce((sum, p) => sum + p.lat, 0) / cluster.length;
    const avgLon = cluster.reduce((sum, p) => sum + p.lon, 0) / cluster.length;
    const avgValue = cluster.reduce((sum, p) => sum + p.value, 0) / cluster.length;

    clusters.push({ lat: avgLat, lon: avgLon, avg: avgValue });
  }

  return clusters;
};

const MapScreen = () => {
  const [clusters, setClusters] = useState<{ lat: number; lon: number; avg: number }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const allKeys = await AsyncStorage.getAllKeys();
      const dataKeys = allKeys.filter(key => key.startsWith("bleData-"));
      let points: { lat: number; lon: number; value: number }[] = [];

      for (const key of dataKeys) {
        const raw = await AsyncStorage.getItem(key);
        if (!raw) continue;
        try {
          const rows = JSON.parse(raw);
          for (const row of rows) {
            const lat = parseFloat(row[9]);
            const lon = parseFloat(row[10]);
            const pm25 = parseFloat(row[7]); // pm25_env
            if (!isNaN(lat) && !isNaN(lon) && !isNaN(pm25)) {
              points.push({ lat, lon, value: pm25 });
            }
          }
        } catch (e) {
          console.warn(`Failed to parse data for ${key}`, e);
        }
      }

      const clustered = calculateAverage(points);
      setClusters(clustered);
    };

    loadData();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 51.498926,
          longitude: -0.175716,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {clusters.map((c, index) => (
          <Marker
            key={index}
            coordinate={{ latitude: c.lat, longitude: c.lon }}
            title={`PM2.5: ${c.avg.toFixed(1)}`}
            description={`Avg in ${RADIUS_METERS}m radius`}
            pinColor={c.avg > 35 ? 'red' : c.avg > 15 ? 'orange' : 'green'}
          />
        ))}
      </MapView>
    </View>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});

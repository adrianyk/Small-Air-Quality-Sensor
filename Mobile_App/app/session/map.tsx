import { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import MapView, { Circle } from 'react-native-maps';
import { getDistance } from 'geolib';
import firestore from '@react-native-firebase/firestore';

const RADIUS_METERS = 14;

const calculateAverage = (points: { lat: number, lon: number, value: number }[]) => {
  const clusters = [];
  const visited = new Set<number>();

  for (let i = 0; i < points.length; i++) {
    if (visited.has(i)) continue;

    const queue = [i];
    const cluster = [];

    while (queue.length > 0) {
      const idx = queue.pop()!;
      if (visited.has(idx)) continue;

      visited.add(idx);
      cluster.push(points[idx]);

      for (let j = 0; j < points.length; j++) {
        if (visited.has(j)) continue;

        const dist = getDistance(
          { latitude: points[idx].lat, longitude: points[idx].lon },
          { latitude: points[j].lat, longitude: points[j].lon }
        );

        if (dist <= RADIUS_METERS) {
          queue.push(j);
        }
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
    const loadFirestoreData = async () => {
      try {
        const snapshot = await firestore().collection('publicSessions').get();
        let points: { lat: number; lon: number; value: number }[] = [];

        snapshot.forEach(doc => {
          console.log("Fetched session from Firebase:", doc.id, doc.data());
          const session = doc.data();
          const rows = session.data || [];
          for (const row of rows) {
            const lat = parseFloat(row.lat);
            const lon = parseFloat(row.lon);
            const pm25 = parseFloat(row.pm25_env);
            if (!isNaN(lat) && !isNaN(lon) && !isNaN(pm25)) {
              points.push({ lat, lon, value: pm25 });
            }
          }
        });
        console.log('points: ', points);

        const clustered = calculateAverage(points);
        setClusters(clustered);
      } catch (e) {
        console.error("Failed to fetch data from Firestore", e);
      }
    };

    loadFirestoreData();
  }, []);

  return (
    <View className='flex-1'>
      <MapView
        style={styles.map}
        initialRegion={{  // Imperial College London
          latitude: 51.498926,
          longitude: -0.175716,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {clusters.map((c, index) => {
          const color =
            c.avg > 35 ? 'rgba(255,0,0,0.3)' :
            c.avg > 15 ? 'rgba(255,165,0,0.3)' :
            'rgba(0,128,0,0.3)'; // red, orange, green with fade

          const stroke =
            c.avg > 35 ? 'rgba(255,0,0,0.6)' :
            c.avg > 15 ? 'rgba(255,165,0,0.6)' :
            'rgba(0,128,0,0.6)';

          return (
            <Circle
              key={index}
              center={{ latitude: c.lat, longitude: c.lon }}
              radius={25} // meters, adjust for size
              fillColor={color}
              strokeColor={stroke}
              strokeWidth={1}
            />
          );
        })}
      </MapView>
    </View>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});

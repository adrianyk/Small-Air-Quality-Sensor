import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, SafeAreaView, Text, ScrollView, Dimensions, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';
import { useBLEContext } from "@/contexts/BLEContext";
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const data = () => {
  const [selectedPM, setSelectedPM] = useState<'pm1' | 'pm25' | 'pm10'>('pm25');
  const { expectedKeys } = useBLEContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [environments, setEnvironments] = useState<string[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string | null>(null);
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: { data: number[]; color: () => string; strokeWidth: number }[];
    environments: string[]; 
  } | null>(null);


  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem(`bleData-${id}`);
        const parsed: string[][] = stored ? JSON.parse(stored) : [];

        const timeIndex = expectedKeys.indexOf('time');
        const pm1Index = expectedKeys.indexOf('pm1_std');
        const pm25Index = expectedKeys.indexOf('pm25_std');
        const pm10Index = expectedKeys.indexOf('pm10_std');
        const envIndex = expectedKeys.length;
        const foundEnvs = new Set<string>();

        const filteredPM1: number[] = [];
        const filteredPM25: number[] = [];
        const filteredPM10: number[] = [];
        const environmentsFromData: string[] = [];

        parsed.forEach((row) => {
          const env = row[envIndex] || 'unknown';
          foundEnvs.add(env);
          environmentsFromData.push(env);

          const time = row[timeIndex];
          const parts = time.split('\n');
          const timePart = parts[1] || parts[0]; // e.g., "14:52:08"
          const timeParts = timePart.split(':'); // ['14', '52', '08']
          const label = `${timeParts[0]}:${timeParts[1]}`; // '14:52'

          filteredLabels.push(label);
          filteredPM1.push(parseFloat(row[pm1Index]));
          filteredPM25.push(parseFloat(row[pm25Index]));
          filteredPM10.push(parseFloat(row[pm10Index]));
        });

        setEnvironments(Array.from(foundEnvs));

      setChartData({
        labels: filteredLabels,
        datasets: [
          {
            data: filteredPM1,
            color: () => '#FF5722',
            strokeWidth: 2,
          },
          {
            data: filteredPM25,
            color: () => '#2196F3',
            strokeWidth: 2,
          },
          {
            data: filteredPM10,
            color: () => '#4CAF50',
            strokeWidth: 2,
          },
        ],
        environments: environmentsFromData, // save per point
      });
      } catch (e) {
        console.error('Failed to load chart data:', e);
      }
    };

    if (id) loadData();
  }, [id]);

  let filteredLabels: string[] = [];
  let filteredData: number[] = [];

  if (chartData) {
    filteredLabels = chartData.labels;

    const selectedDatasetIndex = selectedPM === 'pm1' ? 0 : selectedPM === 'pm25' ? 1 : 2;
    filteredData = chartData.datasets[selectedDatasetIndex].data.map((value, i) =>
      selectedEnvironment === null || chartData.environments[i] === selectedEnvironment
        ? value
        : 0
    );
  }


  return (
    <SafeAreaView style={styles.safeArea}> 
      <View
        style={{
          width: screenHeight,
          height: screenHeight,
          transform: [{ rotate: '90deg' }],
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 500,
        }}
      >
        <ScrollView style={styles.container}>
          <Text style={styles.title}>Session {id} Chart</Text>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#FF5722' }]} />
              <Text style={styles.legendText}>PM1</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
              <Text style={styles.legendText}>PM2.5</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>PM10</Text>
            </View>
          </View>

          <View style={styles.buttonGroup}>
            {['pm1', 'pm25', 'pm10'].map((pm) => (
              <Text
                key={pm}
                onPress={() => setSelectedPM(pm as 'pm1' | 'pm25' | 'pm10')}
                style={[
                  styles.button,
                  selectedPM === pm && styles.buttonSelected,
                ]}
              >
                {pm.toUpperCase()}
              </Text>
            ))}
          </View>
          <View style={styles.buttonGroup}>
            {environments.map((env) => (
              <Text
                key={env}
                onPress={() => setSelectedEnvironment(env === selectedEnvironment ? null : env)}
                style={[
                  styles.button,
                  selectedEnvironment === env && styles.buttonSelected,
                ]}
              >
                {env.toUpperCase()}
              </Text>
            ))}
          </View>
          {chartData ? (
          <ScrollView horizontal>
            <LineChart
              data={{
                labels: filteredLabels,
                datasets: [{ data: filteredData }],
              }}
              width={chartData.labels.length * 50}
              height={320}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                propsForDots: { r: '3', strokeWidth: '1', stroke: '#333' },
              }}
              bezier
              style={styles.chart}
            />
          </ScrollView>
          ) : (
            <Text>Loading chart data...</Text>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default data;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 15,
  },
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 8,
    marginVertical: 12,
  },
  legendContainer: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 8,
},
legendItem: {
  flexDirection: 'row',
  alignItems: 'center',
  marginHorizontal: 8,
},
legendColor: {
  width: 12,
  height: 12,
  borderRadius: 6,
  marginRight: 4,
},
legendText: {
  fontSize: 12,
  color: '#333',
},
buttonGroup: {
  flexDirection: 'row',
  justifyContent: 'center',
  marginVertical: 10,
},
button: {
  paddingVertical: 6,
  paddingHorizontal: 14,
  marginHorizontal: 5,
  borderRadius: 6,
  backgroundColor: '#e0e0e0',
  fontSize: 14,
  color: '#000',
},
buttonSelected: {
  backgroundColor: '#2196F3',
  color: '#fff',
},

});

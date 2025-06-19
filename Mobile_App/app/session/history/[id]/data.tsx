import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Dimensions, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';
import { expectedKeys } from '@/hooks/useBLEDataHandler';

const screenWidth = Dimensions.get('window').width;

const data = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: { data: number[]; color: () => string; strokeWidth: number }[];
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

        const labels: string[] = [];
        const pm1Data: number[] = [];
        const pm25Data: number[] = [];
        const pm10Data: number[] = [];

        parsed.forEach((row) => {
          const time = row[timeIndex];
          const label = new Date(parseInt(time) * 1000)
            .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          labels.push(label);
          pm1Data.push(parseFloat(row[pm1Index]));
          pm25Data.push(parseFloat(row[pm25Index]));
          pm10Data.push(parseFloat(row[pm10Index]));
        });

        setChartData({
          labels,
          datasets: [
            {
              data: pm1Data,
              color: () => '#FF5722',
              strokeWidth: 2,
            },
            {
              data: pm25Data,
              color: () => '#2196F3',
              strokeWidth: 2,
            },
            {
              data: pm10Data,
              color: () => '#4CAF50',
              strokeWidth: 2,
            },
          ],
        });
      } catch (e) {
        console.error('Failed to load chart data:', e);
      }
    };

    if (id) loadData();
  }, [id]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Session {id} Chart</Text>
      {chartData ? (
        <LineChart
          data={{
            labels: chartData.labels,
            datasets: chartData.datasets,
            legend: ['PM1', 'PM2.5', 'PM10'],
          }}
          width={screenWidth - 24}
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
      ) : (
        <Text>Loading chart data...</Text>
      )}
    </ScrollView>
  );
};

export default data;

const styles = StyleSheet.create({
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
});

import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { expectedKeys } from '@/hooks/useBLEDataHandler';

const cellWidth = Dimensions.get('window').width / expectedKeys.length;

const SessionHistoryScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [rows, setRows] = useState<string[][]>([]);

useEffect(() => {
  const loadSessionData = async () => {
    try {
      const storageKey = `bleData-${id}`;
      console.log('Loading data from:', storageKey);

      const stored = await AsyncStorage.getItem(storageKey);
      if (!stored) {
        console.warn('No data found in storage for:', storageKey);
      }

      const parsed = stored ? JSON.parse(stored) : [];
      console.log('Parsed rows:', parsed.length);

      if (Array.isArray(parsed)) {
        setRows(parsed);
      } else {
        console.warn('Parsed data is not an array');
      }
    } catch (e) {
      console.error('Failed to load session data:', e);
    }
  };

  loadSessionData();
}, [id]);


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Session: {id}</Text>

      {rows.length > 0 ? (
        <View style={styles.tableContainer}>
          {/* Header */}
          <View style={styles.tableRow}>
            {expectedKeys.map((key) => (
              <View key={key} style={styles.headerCell}>
                <Text style={styles.headerText}>{key}</Text>
              </View>
            ))}
          </View>

          {/* Rows */}
          <ScrollView style={styles.tableBody}>
            {rows.map((row, i) => (
              <View key={i} style={styles.tableRow}>
                {row.map((cell, j) => (
                  <View key={j} style={styles.cell}>
                    <Text style={styles.cellText}>{cell}</Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      ) : (
        <Text style={styles.noData}>No data found for this session.</Text>
      )}
    </View>
  );
};

export default SessionHistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  tableContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
  },
  tableBody: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  headerCell: {
    width: cellWidth,
    padding: 6,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  cell: {
    width: cellWidth,
    padding: 6,
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cellText: {
    fontSize: 12,
    color: '#333',
  },
  noData: {
    marginTop: 20,
    textAlign: 'center',
    color: '#777',
    fontStyle: 'italic',
  },
});

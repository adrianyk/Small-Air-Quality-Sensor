import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import expectedKeys from '@/hooks/useBLE';
import { useBLEContext } from "@/contexts/BLEContext";
import { useAuth } from '@/contexts/AuthContext';
import { uploadSessionToFirestore } from '@/utils/uploadSessionToFirestore';
import Spacer from '@/components/Spacer';

const cellWidth = Dimensions.get('window').width / (expectedKeys.length + 1); // +1 for environment
const width = 80;
type RowWithEnv = string[]; // data + last element is environment

const SessionHistoryScreen = () => {
  const { expectedKeys } = useBLEContext();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [rows, setRows] = useState<RowWithEnv[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [bulkEnvInput, setBulkEnvInput] = useState('');

  useEffect(() => {
    const loadSessionData = async () => {
      try {
        const storageKey = `bleData-${id}`;
        const stored = await AsyncStorage.getItem(storageKey);
        const parsed: string[][] = stored ? JSON.parse(stored) : [];

        if (Array.isArray(parsed)) {
          // Ensure each row has environment placeholder if not present
          const withEnv = parsed.map((row) =>
            row.length === expectedKeys.length ? [...row, ''] : row
          );
          setRows(withEnv);
        } else {
          console.warn('Parsed data is not an array');
        }
      } catch (e) {
        console.error('Failed to load session data:', e);
      }
    };

    loadSessionData();
  }, [id]);

  const updateEnvironment = async (rowIndex: number, value: string) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex] = [...updatedRows[rowIndex]];
    updatedRows[rowIndex][expectedKeys.length] = value;
    setRows(updatedRows);

    try {
      await AsyncStorage.setItem(`bleData-${id}`, JSON.stringify(updatedRows));
    } catch (e) {
      console.error('Failed to save updated row:', e);
    }
  };

  const toggleRowSelection = (index: number) => {
    setSelectedRows(prev => {
      const updated = new Set(prev);
      updated.has(index) ? updated.delete(index) : updated.add(index);
      return updated;
    });
  };

  const applyBulkEnvironment = async () => {
    const updatedRows = rows.map((row, index) =>
      selectedRows.has(index)
        ? [...row.slice(0, expectedKeys.length), bulkEnvInput]
        : row
    );
    setRows(updatedRows);
    setSelectedRows(new Set());

    try {
      await AsyncStorage.setItem(`bleData-${id}`, JSON.stringify(updatedRows));
    } catch (e) {
      console.error('Failed to save bulk update:', e);
    }
    setBulkEnvInput('');
  };

  const handleUpload = async () => {
    console.log('Upload button pressed');
    Alert.alert('Debug', 'Upload triggered');
    
    if (!user) {
      console.log('Upload failed, User not logged in.');
      Alert.alert('Upload failed', 'User not logged in.');
      return;
    }
    try {
      await uploadSessionToFirestore(id, rows, user.uid, expectedKeys);
      console.log('Success, Session data uploaded to the cloud!');
      Alert.alert('Success', 'Session data uploaded to the cloud!');
      // Optionally navigate or disable the button
    } catch (e: any) {
      console.error('Upload error:', e);
      Alert.alert('Upload failed', 'Try again later.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Session: {id}</Text>

      <Spacer height={20} />
      <TouchableOpacity onPress={handleUpload} style={styles.uploadButton}>
        <Text style={styles.uploadButtonText}>Upload to Cloud</Text>
      </TouchableOpacity>
      <Spacer height={20} />

      {/* Bulk input UI */}
      <View style={styles.bulkUpdateContainer}>
        <TextInput
          style={styles.bulkInput}
          placeholder="Set environment for selected rows"
          value={bulkEnvInput}
          onChangeText={setBulkEnvInput}
        />
        <TouchableOpacity onPress={applyBulkEnvironment}>
          <Text style={styles.bulkApply}>Apply</Text>
        </TouchableOpacity>
      </View>

    {rows.length > 0 ? (
      <ScrollView horizontal>
        <View style={styles.tableContainer}>
          {/* Header */}
          <View style={styles.tableRow}>
            {[...expectedKeys, 'Environment'].map((key) => (
              <View key={key} style={styles.headerCell}>
                <Text style={styles.headerText}>{key}</Text>
              </View>
            ))}
          </View>

          {/* Rows */}
          <ScrollView style={styles.tableBody}>
            {rows.map((row, rowIndex) => (
              <TouchableOpacity
                key={rowIndex}
                onPress={() => toggleRowSelection(rowIndex)}
                style={[
                  styles.tableRow,
                  selectedRows.has(rowIndex) && styles.selectedRow,
                ]}
              >
                {row.slice(0, expectedKeys.length).map((cell, colIndex) => (
                  <View key={colIndex} style={styles.cell}>
                    <Text style={styles.cellText}>{cell}</Text>
                  </View>
                ))}
                <View style={styles.cell}>
                  <TextInput
                    style={styles.envInput}
                    value={row[expectedKeys.length] || ''}
                    onChangeText={(text) => updateEnvironment(rowIndex, text)}
                    placeholder="Enter note"
                  />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
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
  bulkUpdateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  bulkInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
  },
  bulkApply: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 12,
    paddingHorizontal: 10,
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
  selectedRow: {
    backgroundColor: '#e0f7fa',
  },
  headerCell: {
    width: width,
    padding: 6,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  cell: {
    width: width,
    flex: 1,
    padding: 6,
    alignItems: 'center',
  },
  headerText: {
    width: cellWidth,
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cellText: {
    fontSize: 12,
    color: '#333',
  },
  envInput: {
    width: '100%',
    fontSize: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  noData: {
    marginTop: 20,
    textAlign: 'center',
    color: '#777',
    fontStyle: 'italic',
  },
  uploadButton: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },  
});

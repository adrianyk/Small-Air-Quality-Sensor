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
  ActivityIndicator,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import firestore from '@react-native-firebase/firestore';

import expectedKeys from '@/hooks/useBLE';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

import { useBLEContext } from "@/contexts/BLEContext";
import { useAuth } from '@/contexts/AuthContext';

import Spacer from '@/components/Spacer';

import { uploadSessionToFirestore } from '@/utils/uploadSessionToFirestore';
import ThemedView from '@/components/ThemedView';
import ThemedText from '@/components/ThemedText';

const cellWidth = Dimensions.get('window').width / (expectedKeys.length + 1); // +1 for environment
const width = 80;
type RowWithEnv = string[]; // data + last element is environment

const SessionHistoryScreen = () => {
  const { expectedKeys } = useBLEContext();
  const { user } = useAuth();
  const isOnline = useNetworkStatus();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [rows, setRows] = useState<RowWithEnv[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [bulkEnvInput, setBulkEnvInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [sessionName, setSessionName] = useState<string>('Untitled Session');

  useEffect(() => {
    const loadSessionData = async () => {
      try {
        const storageKey = `bleData-${id}`;
        let stored = await AsyncStorage.getItem(storageKey);

        // If local session is missing, try loading from cloud
        if (!stored) {
          console.log(`No local data for ${id}, trying cloud...`);
          await loadSessionDataFromCloud();
          return;
        }
        const parsed: string[][] = stored ? JSON.parse(stored) : [];

        if (Array.isArray(parsed)) {
          // Ensure each row has environment placeholder if not present
          const withEnv = parsed.map((row) =>
            row.length === expectedKeys.length ? [...row, ''] : row
          );
          setRows(withEnv);

          const storedSessionName = await AsyncStorage.getItem('sessionLabels');
          if (storedSessionName) {
            const parsedLabels = JSON.parse(storedSessionName);
            setSessionName(parsedLabels[id] || 'Untitled Session');
          }
        } else {
          console.warn('Parsed data is not an array');
        }
      } catch (e) {
        console.error('Failed to load session data:', e);
      }
    };

    loadSessionData();
  }, [id]);

  const loadSessionDataFromCloud = async () => {
    try {
      if (!user?.uid) return;

      const doc = await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('sessions')
        .doc(id)
        .get();

      if (!doc.exists) {
        console.warn(`No session found in cloud for id: ${id}`);
        return;
      }

      const data = doc.data();

      const cloudRows: string[][] = Array.isArray(data?.data)
      ? data.data.map((entry: Record<string, any>) =>
          expectedKeys.map((key) => String(entry[key] ?? '')).concat(entry.environment ?? '')
        )
      : [];
      const cloudLabel: string = data?.label ?? 'Untitled Session';

      if (Array.isArray(cloudRows)) {
        const withEnv = cloudRows.map((row) =>
          row.length === expectedKeys.length ? [...row, ''] : row
        );
        setRows(withEnv);
        setSessionName(cloudLabel);

        // Also update local label store
        const labelStoreRaw = await AsyncStorage.getItem('sessionLabels');
        const labelStore = labelStoreRaw ? JSON.parse(labelStoreRaw) : {};
        labelStore[id] = cloudLabel;
        await AsyncStorage.setItem('sessionLabels', JSON.stringify(labelStore));
      } else {
        console.warn('Cloud data is not a valid array');
      }
    } catch (e) {
      console.error('Failed to load session from cloud:', e);
    }
  };

  const updateEnvironment = async (rowIndex: number, value: string) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex] = [...updatedRows[rowIndex]];
    updatedRows[rowIndex][expectedKeys.length] = value;
    setRows(updatedRows);

    try {
      await AsyncStorage.setItem(`bleData-${id}`, JSON.stringify(updatedRows));

      const timestamp = Date.now();
      const localTime = new Date(timestamp).toLocaleString();
      await AsyncStorage.setItem(`lastUpdated-${id}`, JSON.stringify({
        timestamp: timestamp,     // for comparison
        localTime: localTime          // for readable display
      }));
      console.log(`updateEnvironment: Stored timestamp for ${id}`)
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

      const timestamp = Date.now();
      const localTime = new Date(timestamp).toLocaleString();
      await AsyncStorage.setItem(`lastUpdated-${id}`, JSON.stringify({
        timestamp: timestamp,
        localTime: localTime
      }));
      console.log(`applyBulkEnvironment: Stored timestamp for ${id}`)
    } catch (e) {
      console.error('Failed to save bulk update:', e);
    }
    setBulkEnvInput('');
  };

  const handleUpload = async () => {
    if (isUploading) return; // Prevent double-taps

    setIsUploading(true);
    console.log('Upload button pressed, uploading...');
    // Alert.alert('Debug', 'Upload triggered');  
    
    try {
      if (!user) {
        console.log('Upload failed, User not logged in.');
        Alert.alert('Upload failed', 'User not logged in.');
        return;
      }

      // Safety net
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        console.log('No internet connection');
        Alert.alert('No Internet', 'Please connect to the internet before uploading.');
        return;
      }

      const stored = await AsyncStorage.getItem(`lastUpdated-${id}`);
      const localLastUpdated = stored ? JSON.parse(stored) : {timestamp: null, localTime: null};

      await uploadSessionToFirestore(
        id,                 // session ID
        rows,               // session data
        user.uid, 
        expectedKeys,
        sessionName,
        user.email ?? '',
        localLastUpdated
      );
      console.log('Success, Session data uploaded to the cloud!');
      Alert.alert('Success', 'Session data uploaded to the cloud!');
      // Optionally navigate or disable the button
    } catch (e: any) {
      console.error('Upload error:', e);
      Alert.alert('Upload failed', 'Try again later.');
    } finally {
      setIsUploading(false);
      console.log('Upload done!');
    }
  };

  return (
    <ThemedView className="flex-1 p-3">
      <ThemedText className="text-[18px] font-bold mb-4 text-center" title={true}>
        Session: {sessionName}
      </ThemedText>
      <ThemedText className='text-center'>Session ID: {id}</ThemedText>

      <Spacer height={20} />
      {!isOnline && (
        <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>
          No internet connection. Please connect to upload.
        </Text>
      )}
      <TouchableOpacity
        onPress={handleUpload}
        disabled={!isOnline || isUploading}
        style={[
          styles.uploadButton,
          { 
            backgroundColor: isOnline ? '#4CAF50' : '#aaa',
            opacity: isUploading ? 0.6 : 1,
          },
        ]}
      >
        {isUploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-bold">Upload to Cloud</Text>
        )}
      </TouchableOpacity>
      <Spacer height={20} />

      {/* Bulk input UI */}
      <View style={styles.bulkUpdateContainer}>
        <TextInput
          className="flex-1 border border-[#ccc] rounded px-2 py-1 text-[12px]"
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
        <View>
          {/* Header */}
          <View style={{ flexDirection: 'row' }}>
            {[...expectedKeys, 'Environment'].map((key, i) => (
              <View key={i} style={styles.cell}>
                <ThemedText className="font-bold text-center" title={true}>{key}</ThemedText>
              </View>
            ))}
          </View>
          <ScrollView>
            {/* Rows */}
            {rows.map((row, rowIndex) => (
              <TouchableOpacity
                key={rowIndex}
                onPress={() => toggleRowSelection(rowIndex)}
                style={[
                  { flexDirection: 'row' },
                  selectedRows.has(rowIndex) && styles.selectedRow,
                ]}
              >
                {row.slice(0, expectedKeys.length).map((cell, colIndex) => (
                  <View key={colIndex} style={styles.cell}>
                    <ThemedText className="text-xs text-center">{cell}</ThemedText>
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
    </ThemedView>
  );
};

export default SessionHistoryScreen;

const styles = StyleSheet.create({
  bulkUpdateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  bulkApply: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 12,
    paddingHorizontal: 10,
  },
  selectedRow: {
    backgroundColor: '#e0f7fa',
  },
  cell: {
    width: 120,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
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
  }
});

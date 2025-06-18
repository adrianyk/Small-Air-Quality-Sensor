import { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  ScrollView,
  Dimensions,
  Alert,
  TextInput,
  Button
} from "react-native";
import { useBLEDataHandler, expectedKeys } from '../hooks/useBLEDataHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceModal from "@/components/DeviceConnectionModal";
import useBLE from "@/hooks/useBLE";
import { router } from "expo-router";
import Spacer from "@/components/Spacer";

const App = () => {
  const {
    requestPermissions,
    scanForPeripherals,
    allDevices,
    connectToDevice,
    connectedDevice,
    heartRate,
    disconnectFromDevice,
    stopScan,
    startRecordingData,
    stopRecordingData, 
    sessionState,
  } = useBLE();

  const [sessionId, setSessionId] = useState<string>(() => `session-${Date.now()}`);


  const {
    rows,
    handleBLEField,
    loadSavedData,
    clearSavedData,
    registerSession
  } = useBLEDataHandler(sessionId);

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [sessionLabel, setSessionLabel] = useState<string>("Untitled Session");
  const [navigating, setNavigating] = useState(false);


  useEffect(() => {
    if (sessionState === "STARTED") {
      setIsRecording(true);
      console.log("useEffect isRecording: ", isRecording)
    } else if (sessionState === "STOPPED") {
      setIsRecording(false);
      console.log("useEffect isRecording: ", isRecording)
    }
  }, [sessionState]);

  const scanForDevices = async () => {
    const isPermissionsEnabled = await requestPermissions();
    if (isPermissionsEnabled) {
      scanForPeripherals();
    }
  };

  const hideModal = () => {
    stopScan();
    setIsModalVisible(false);
  };

  const openModal = async () => {
    scanForDevices();
    setIsModalVisible(true);
  };

  <View style={{ flex: 2, paddingHorizontal: 20, marginTop: 10 }}>
  <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>
    Recorded BLE Data:
  </Text>

  {rows.length > 0 ? (
    <FlatList
      data={rows}
      keyExtractor={(_, index) => index.toString()}
      renderItem={({ item }) => (
        <Text style={{ paddingVertical: 4, color: "#333" }}>
          {item.join(", ")}
        </Text>
      )}
    />
    ) : (
      <Text>No recorded data yet.</Text>
    )}
  </View>
  


  const toggleRecording = async () => {
    if (isRecording) {
      stopRecordingData();
      setIsRecording(false);
      console.log("toggleRecodring isRecording: ", isRecording)
    } else {
      const newSessionId = `session-${Date.now()}`;
      setSessionId(newSessionId);

      await AsyncStorage.setItem('sessionLabels', JSON.stringify({
        ...(JSON.parse(await AsyncStorage.getItem('sessionLabels') || '{}')),
        [newSessionId]: sessionLabel.trim() || "Untitled Session",
      }));

      startRecordingData();
      setIsRecording(true);
      console.log("toggleRecodring isRecording: ", isRecording)
    }
  };




 const debugCheckStorage = async () => {
    try {
      if (!sessionId) {
        Alert.alert('Error', 'No session ID available');
        return;
      }

      // 1. Check what's in AsyncStorage
      const storedData = await AsyncStorage.getItem(sessionId);
      console.log('Raw AsyncStorage data:', storedData);
      
      // 2. Check the parsed data
      const parsedData = storedData ? JSON.parse(storedData) : [];
      console.log('Parsed data:', parsedData);
      console.log('Number of records:', parsedData.length);
      console.log('Session ID:', sessionId);
      // 3. Check the rows state
      console.log('Current rows state:', rows);
      
      // 4. Show an alert with basic info
      Alert.alert(
        'Debug Info',
        `Records in storage: ${parsedData.length}\n` +
        `Records in state: ${rows.length}\n` +
        `Last record: ${parsedData.length > 0 ? parsedData[parsedData.length-1].join(', ') : 'N/A'}`,
        [{ text: 'OK' }]
      );
      
      // 5. Force reload from storage
      await loadSavedData();
      console.log('Reloaded data from storage');
      
    } catch (e) {
      console.error('Debug check failed:', e);
      Alert.alert('Error', 'Failed to read storage data');
    }
  };

  const handleBackToHome = () => {
    if (navigating) return;
    setNavigating(true);
    console.log("back home triggered", connectedDevice)
    router.replace('/');
    setTimeout(() => setNavigating(false), 1000); // reset after 1 second
  };
 
  return (
    <SafeAreaView style={styles.container}>
      <Spacer height={20} />
      <Button title="Back to home" onPress={handleBackToHome} />
      
      <View style={styles.heartRateTitleWrapper}>
        {connectedDevice ? (
          <>
            <Text style={styles.heartRateTitleText}>Data from Beacon:</Text>
            <Text style={styles.heartRateText}>{heartRate}</Text>
          </>
        ) : (
          <Text style={styles.heartRateTitleText}>
            Please Connect to a Beacon
          </Text>
        )}
      </View>

      <TouchableOpacity
        onPress={debugCheckStorage}
        style={[styles.ctaButton, { backgroundColor: '#6e48aa' }]}
      >
        <Text style={styles.ctaButtonText}>Debug Data</Text>
      </TouchableOpacity>

      <View style={styles.dataContainer}>
        <Text style={styles.sectionTitle}>Recorded BLE Data:</Text>
        
        {rows.length > 0 ? (
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableRow}>
              {expectedKeys.map((key) => (
                <View key={key} style={styles.tableHeaderCell}>
                  <Text style={styles.headerText}>{key}</Text>
                </View>
              ))}
            </View>
            
            {/* Table Body */}
            <ScrollView style={styles.tableBody}>
              {rows.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.tableRow}>
                  {row.map((cell, cellIndex) => (
                    <View key={cellIndex} style={styles.tableCell}>
                      <Text style={styles.cellText}>{cell}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        ) : (
          <Text style={styles.noDataText}>No recorded data yet.</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={connectedDevice ? disconnectFromDevice : openModal}
          style={styles.ctaButton}
        >
          <Text style={styles.ctaButtonText}>
            {connectedDevice ? "Disconnect" : "Connect"}
          </Text>
        </TouchableOpacity>

        {connectedDevice && (
          <TouchableOpacity
            onPress={toggleRecording}
            style={[
              styles.ctaButton,
              { backgroundColor: isRecording ? "#F44336" : "#4CAF50" },
            ]}
          >
            <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Session Name:</Text>
              <TextInput
                placeholder="Enter session name"
                value={sessionLabel}
                onChangeText={setSessionLabel}
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 5,
                  padding: 10,
                  backgroundColor: 'white',
                }}
              />
            </View>
            <Text style={styles.ctaButtonText}>
              {isRecording ? "Stop Recording" : "Start Recording"}
              
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <DeviceModal
        closeModal={hideModal}
        visible={isModalVisible}
        connectToPeripheral={(device) => connectToDevice(device, handleBLEField)}
        devices={allDevices}
        refreshDevices={scanForPeripherals}
      />
    </SafeAreaView>
  );
};

const windowWidth = Dimensions.get('window').width;
const cellWidth = windowWidth / 8; // Adjust based on number of columns

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  heartRateTitleWrapper: {
    paddingVertical: 20,
    alignItems: "center",
  },
  heartRateTitleText: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginHorizontal: 20,
    color: "black",
  },
  heartRateText: {
    fontSize: 25,
    marginTop: 15,
  },
  dataContainer: {
    flex: 1,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  tableContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
  },
  tableBody: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableHeaderCell: {
    width: cellWidth,
    padding: 8,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableCell: {
    width: cellWidth,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 12,
  },
  cellText: {
    fontSize: 12,
    color: '#333',
  },
  noDataText: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: "#FF6060",
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    marginBottom: 10,
    borderRadius: 8,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
});

export default App;

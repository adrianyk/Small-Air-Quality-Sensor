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
  Button,
  ActivityIndicator
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceModal from "@/components/DeviceConnectionModal";
import { useBLEContext } from "@/contexts/BLEContext";
import expectedKeys from "@/hooks/useBLE";
import { router } from "expo-router";
import Spacer from "@/components/Spacer";
import { useAuth } from '@/contexts/AuthContext';

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
    rows,
    // handleBLEField,
    loadSavedData,
    clearSavedData,
    registerSession,
    expectedKeys,
    sessionId, 
    setSessionId,
    isTransitioning,
    initiateSessionTransition,
  } = useBLEContext();
  
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [sessionLabel, setSessionLabel] = useState<string>("Untitled Session");
  const [navigating, setNavigating] = useState(false);
  const { user } = useAuth();

  const isRecording = sessionState === 'BUSY';

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
    if (isTransitioning) return;

    if (isRecording) {
      initiateSessionTransition('IDLE');
      stopRecordingData();
      console.log("toggleRecodring isRecording: ", isRecording)
    } else {
      const newSessionId = `session-${Date.now()}`;
      setSessionId(newSessionId);
      console.log("setSessionId: ", sessionId)
      
      await AsyncStorage.setItem('sessionLabels', JSON.stringify({
        ...(JSON.parse(await AsyncStorage.getItem('sessionLabels') || '{}')),
        [newSessionId]: sessionLabel.trim() || "Untitled Session",
      }));

      if (user?.uid) { 
        const existingUserIds = JSON.parse(await AsyncStorage.getItem('sessionUserIds') || '{}');
        await AsyncStorage.setItem('sessionUserIds', JSON.stringify({
          ...existingUserIds,
          [newSessionId]: user.uid,
        }));
      }
      
      initiateSessionTransition('BUSY');
      startRecordingData();
      console.log("toggleRecodring isRecording: ", isRecording)
    }
    console.log('toggleRecording session state: ', sessionState)
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
      {connectedDevice && (
        <View style={styles.sessionNameContainer}>
          <Text style={styles.sessionNameLabel}>Session Name:</Text>
          <TextInput
            placeholder="Enter session name"
            value={sessionLabel}
            onChangeText={setSessionLabel}
            style={styles.sessionNameInput}
          />
        </View>
      )}
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
      
      <View style={styles.dataContainer}>
        <Text style={styles.sectionTitle}>Recorded BLE Data:</Text>
        {rows.length > 0 ? (
          <ScrollView horizontal>
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
                {rows.map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.tableRow}>
                    {row.map((cell, cellIndex) => (
                      <View key={cellIndex} style={styles.cell}>
                        <Text style={styles.cellText}>{cell}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        ) : (
          <Text style={styles.noDataText}>No recorded data yet.</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={connectedDevice ? disconnectFromDevice : openModal}
          disabled={isTransitioning}
          style={[
            styles.ctaButton,
            isTransitioning && { opacity: 0.5 }
          ]}
        >
          <Text style={styles.ctaButtonText}>
            {connectedDevice ? "Disconnect" : "Connect"}
          </Text>
        </TouchableOpacity>

        {connectedDevice && (
          <TouchableOpacity
            onPress={toggleRecording}
            disabled={isTransitioning}
            style={[
              styles.ctaButton,
              { backgroundColor: isRecording ? "#F44336" : "#4CAF50" },
              isTransitioning && { opacity: 0.6 }
            ]}
          >
            {isTransitioning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaButtonText}>
                {isRecording ? "Stop Recording" : "Start Recording"}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <DeviceModal
        closeModal={hideModal}
        visible={isModalVisible}
        connectToPeripheral={(device) => connectToDevice(device)}
        devices={allDevices}
        refreshDevices={scanForPeripherals}
      />
    </SafeAreaView>
  );
};

const windowWidth = Dimensions.get('window').width;
const cellWidth = windowWidth / expectedKeys.length; // Adjust based on number of columns

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
  
  sessionNameContainer: {
  paddingHorizontal: 20,
  marginTop: 10,
  },
  sessionNameLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 16,
  },
  sessionNameInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    backgroundColor: 'white',
  },

  bottomButtons: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  headerCell: {
    width: 80,
    padding: 6,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  cell: {
    width: 80,
    padding: 6,
    alignItems: 'center',
  },
});

export default App;

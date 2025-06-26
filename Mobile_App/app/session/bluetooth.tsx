import { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Dimensions,
  TextInput,
  Button,
  ActivityIndicator
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

import expectedKeys from "@/hooks/useBLE";

import { useBLEContext } from "@/contexts/BLEContext";
import { useAuth } from '@/contexts/AuthContext';

import Spacer from "@/components/Spacer";
import DeviceModal from "@/components/DeviceConnectionModal";
import ThemedView from "@/components/ThemedView";
import ThemedText from "@/components/ThemedText";

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
  
  // Recording button creates a new session and assigns an ID based on the current UNIX time, 
  // also toggles between the "START" and "STOP" signals 
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
    <ThemedView className="flex-1">
      <Spacer height={40} />
      <Button title="Back to home" onPress={handleBackToHome} />
      {connectedDevice && (
        <View className="px-5 mt-2.5">
          <ThemedText className="font-bold mb-1.5 text-[18px]">Session Name:</ThemedText>
          <TextInput
            placeholder="Enter session name"
            value={sessionLabel}
            onChangeText={setSessionLabel}
            className="border border-[#ccc] rounded p-2.5 bg-white"
          />
        </View>
      )}
      <View className="py-6 items-center">
        {connectedDevice ? (
          <>
            <ThemedText className="text-[30px] font-bold text-center mx-5" title={true}>Raw Data from ParticuLog:</ThemedText>
            <ThemedText className="text-[25px] mt-4">{heartRate}</ThemedText>
          </>
        ) : (
          <ThemedText className="text-[30px] font-bold text-center mx-5" title={true}>
            Please Connect to a ParticuLog
          </ThemedText>
        )}
      </View>
      
      <View className="flex-1 px-2.5 mt-2.5">
        <ThemedText className="font-bold text-[18px] mb-2.5 text-center" title={true}>Recorded BLE Data:</ThemedText>
        {rows.length > 0 ? (
          <ScrollView horizontal>
            <View className="flex-1 border border-[#ddd] rounded overflow-hidden">
              {/* Header */}
              <View className="flex-row border-b border-[#eee]">
                {expectedKeys.map((key) => (
                  <View key={key} className="w-[80px] p-1.5 bg-[#4CAF50] items-center">
                    <ThemedText className="font-bold text-white text-xs">{key}</ThemedText>
                  </View>
                ))}
              </View>

              {/* Rows */}
              <ScrollView className="flex-1">
                {rows.map((row, rowIndex) => (
                  <View key={rowIndex} className="flex-row border-b border-[#eee]">
                    {row.map((cell, cellIndex) => (
                      <View key={cellIndex} className="w-[80px] p-1.5 items-center">
                        <ThemedText className="text-xs text-[#333]">{cell}</ThemedText>
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        ) : (
          <ThemedText className="italic text-center mt-5">No recorded data yet.</ThemedText>
        )}
      </View>

      <View className="px-5 mb-5">
        <TouchableOpacity
          onPress={connectedDevice ? disconnectFromDevice : openModal}
          disabled={isTransitioning}
          style={[
            styles.ctaButton,
            isTransitioning && { opacity: 0.5 }
          ]}
        >
          <Text className="text-[18px] font-bold text-white">
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
              <Text className="text-[18px] font-bold text-white">
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
    </ThemedView>
  );
};

const windowWidth = Dimensions.get('window').width;
const cellWidth = windowWidth / expectedKeys.length; // Adjust based on number of columns

const styles = StyleSheet.create({
  ctaButton: {
    backgroundColor: "#FF6060",
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    marginBottom: 10,
    borderRadius: 8,
  }
});

export default App;

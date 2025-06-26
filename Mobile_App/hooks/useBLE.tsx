// Debugging purposes
console.log("useBLE hook mounted");

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Alert, PermissionsAndroid, Platform } from "react-native";
import { Buffer } from "buffer";
import * as ExpoDevice from "expo-device";
import {
  BleError,
  BleManager,
  Characteristic,
  Device,
} from "react-native-ble-plx";
import base64 from "react-native-base64";
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage'

// Make sure these are consistent with the ESP32 code
const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHARACTERISTC_DATA_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
const CHARACTERISTIC_COMMAND_UUID = "12345678-1234-5678-1234-56789abcdef0";
const SESSION_STATE_UUID = "1b76c3ce-d232-4796-9d85-cf1a68ecff05";
const TIMESTAMP_UUID = "a66324f1-8fc4-44a6-9be5-a481922ef754";

interface BluetoothLowEnergyApi {
  requestPermissions(): Promise<boolean>;
  scanForPeripherals(): void;
  connectToDevice: (device: Device) => Promise<void>;
  disconnectFromDevice: () => void;
  stopScan: () => void;
  connectedDevice: Device | null;
  allDevices: Device[];
  heartRate: string;
  startRecordingData: () => Promise<void>;
  stopRecordingData: () => Promise<void>;
  sessionState: string;
  expectedState: "BUSY" | "IDLE" | null;
  isTransitioning: boolean;
  initiateSessionTransition: (target: "BUSY" | "IDLE") => void;
  rows: string[][];
  loadSavedData(): Promise<void>;
  clearSavedData(): Promise<void>;
  registerSession(label: string): Promise<void>;
  expectedKeys: string[];
  sessionId: string;
  setSessionId: (id: string) => void;
}

function useBLE(): BluetoothLowEnergyApi {
  const bleManager = useMemo(() => new BleManager(), []);
  const [sessionId, setSessionId] = useState<string>(() => `session-${Date.now()}`);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [heartRate, setHeartRate] = useState("null");
  const [rows, setRows] = useState<string[][]>([]);
  const [sessionState, setSessionState] = useState<string>("UNKNOWN");
  const [expectedState, setExpectedState] = useState<"BUSY" | "IDLE" | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevSessionStateRef = useRef<string>("UNKNOWN");
  const bufferRef = useRef<Record<string, string>>({});
  const storageKey = `bleData-${sessionId || 'default-session'}`;
  const storageKeyRef = useRef(storageKey);
  const lastUpdatedKeyRef = useRef(`lastUpdated-${sessionId || 'default-session'}`);
  const expectedKeys = [
    "time", "temp", "humidity",
    "pm1_std", "pm25_std", "pm10_std",
    "pm1_env", "pm25_env", "pm10_env",
    "lat", "lon" 
  ];
  
  useEffect(() => {
    storageKeyRef.current = `bleData-${sessionId || 'default-session'}`;
  }, [sessionId]);

  useEffect(() => {
    lastUpdatedKeyRef.current = `lastUpdated-${sessionId || 'default-session'}`;
  }, [sessionId]);

  useEffect(() => {
    console.log("Connected device updated:", connectedDevice);
  }, [connectedDevice]);

  useEffect(() => {
    if (expectedState && sessionState === expectedState) {
      setIsTransitioning(false);
      setExpectedState(null);
    }

    // Detect transitions and show toast
    if (prevSessionStateRef.current === "IDLE" && sessionState === "BUSY") {
      Toast.show({ type: "success", text1: "Session started!" });
    } else if (prevSessionStateRef.current === "BUSY" && sessionState === "IDLE") {
      Toast.show({ type: "info", text1: "Session terminated!" });
    }

    prevSessionStateRef.current = sessionState;
  }, [sessionState]);

  const initiateSessionTransition = (target: "BUSY" | "IDLE") => {
    setExpectedState(target);
    console.log("next expectedState: ", target);
    setIsTransitioning(true);
    console.log("isTransitioning");
  };

  const requestAndroid31Permissions = async () => {
    const bluetoothScanPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    const bluetoothConnectPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    const fineLocationPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    
    console.log("Android31Permissions granted")
    return (
      bluetoothScanPermission === "granted" &&
      bluetoothConnectPermission === "granted" &&
      fineLocationPermission === "granted"
    );
  };

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires Location",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const isAndroid31PermissionsGranted =
          await requestAndroid31Permissions();

        return isAndroid31PermissionsGranted;
      }
    } else {
      return true;
    }
  };

  const isDuplicteDevice = (devices: Device[], nextDevice: Device) =>
    devices.findIndex((device) => nextDevice.id === device.id) > -1;

  const scanForPeripherals = () => {
    bleManager.stopDeviceScan(); // Stop previous scan if any
    console.log("scanForPeripherals stopping previous scan (if any)...");
    setAllDevices([]); // Clear existing list
    console.log("list of devices: ", allDevices)
    // console.log("bleManager instance:", bleManager);
    console.log("Starting scan...");
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log("scanForPeripherals: ", error);
        const message = error instanceof Error ? error.message : String(error);
        Alert.alert("Error scanning for peripherals", `Error: ${message}. Please try again. If issue persists, turn off and on Bluetooth.`);
      }
      // else {
      //   console.log("no errors")
      // }
      if (device && device.name?.includes("ESP32")) {
        // console.log("Discovered device:", {
        //   id: device.id,
        //   name: device.name,
        // });
        setAllDevices((prevState: Device[]) => {
          if (!isDuplicteDevice(prevState, device)) {
            return [...prevState, device];
          }
          return prevState;
        });
      }
    });
  }

  const connectToDevice = async (device: Device) => {
    try {
      bleManager.cancelDeviceConnection(device.id);
      const deviceConnection = await bleManager.connectToDevice(device.id);
      setConnectedDevice(deviceConnection);
      console.log("connectToDevice connected device: ", deviceConnection);

      await deviceConnection.discoverAllServicesAndCharacteristics();
      bleManager.stopDeviceScan();

      // Read SESSION_STATE once on connect for immediate value
      const sessionStateChar = await deviceConnection.readCharacteristicForService(
        SERVICE_UUID,
        SESSION_STATE_UUID
      );
      const initialSessionState = base64.decode(sessionStateChar.value ?? "");
      console.log("Initial SESSION_STATE: ", initialSessionState);
      setSessionState(initialSessionState);

      // Monitor session state for ongoing changes
      monitorSessionState(deviceConnection);

      startStreamingData(deviceConnection);   
    } catch (error) {
      console.log("connectToDevice: FAILED TO CONNECT", error);
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert("BLE FAILED TO CONNECT", `Error: ${message}. Please try again.`);
    }
  };

  const monitorSessionState = (device: Device) => {
    device.monitorCharacteristicForService(
      SERVICE_UUID,
      SESSION_STATE_UUID,
      (error, characteristic) => {
        if (error) {
          console.log("SESSION_STATE monitor error:", error);
          return;
        }
        const sessionState = base64.decode(characteristic?.value ?? "");
        console.log("SESSION_STATE updated:", sessionState);
        setSessionState(sessionState);
      }
    );
  };

  const startRecordingData = async () => {
    if (connectedDevice) {
      try {
        // 1. Get current timestamp as ISO string (you could also use UNIX time)
        const unixTime = Math.floor(Date.now() / 1000);  // e.g., 1750263765
        const value = Buffer.from(unixTime.toString(), 'utf-8').toString('base64');

        // 2. Send timestamp to ESP32 via TIMESTAMP_UUID characteristic
        await connectedDevice.writeCharacteristicWithResponseForService(
          SERVICE_UUID,
          TIMESTAMP_UUID,
          value
        );
        console.log("Sent TIMESTAMP to ESP32:", value);

        // 3. Send START command
        const encodedStartCommand = Buffer.from("START").toString("base64");
        await connectedDevice.writeCharacteristicWithResponseForService(
          SERVICE_UUID,
          CHARACTERISTIC_COMMAND_UUID,
          encodedStartCommand
        );
        console.log("Sent START command to ESP32");
      } catch (error) {
        console.error("Failed to send START command: ", error);
        const message = error instanceof Error ? error.message : String(error);
        Alert.alert("Failed to send START command", message);
      }
    }
  };

  const stopRecordingData = async () => {
    if (connectedDevice) {
      try {
        const stopCommand = "STOP";

        await connectedDevice.writeCharacteristicWithResponseForService(
          SERVICE_UUID,
          CHARACTERISTIC_COMMAND_UUID,
          Buffer.from(stopCommand).toString("base64")
        );

        console.log("Sent STOP command to ESP32");
        // await startStreamingData(connectedDevice);

      } catch (error) {
        console.error("Failed to send STOP command: ", error);
        const message = error instanceof Error ? error.message : String(error);
        Alert.alert("Failed to send STOP command", message);
      }
    }
  };

  const disconnectFromDevice = () => {
    if (connectedDevice) {
      // bleManager.cancelDeviceConnection(connectedDevice.id);
      // console.log("disconnectFromDevice success: ", connectedDevice)
      // setConnectedDevice(null);
      // setHeartRate("null");
      try {
        console.log("Disconnecting from device...");
        bleManager.cancelDeviceConnection(connectedDevice.id);
      } catch (error) {
        console.warn("Error while disconnecting:", error);
        const message = error instanceof Error ? error.message : String(error);
        Alert.alert("Error disconnecting", `Error: ${message}. Please try again.`);
      } finally {
        console.log("disconnectFromDevice success: ", connectedDevice)
        setConnectedDevice(null);
        setHeartRate("null");
      }
    }
  };

  const onHeartRateUpdate = (
    error: BleError | null,
    characteristic: Characteristic | null,
  ) => {
    if (error) {
      console.log("onHeartRateUpdate: ", error);
      return -1;
    } else if (!characteristic?.value) {
      console.log("No Data was recieved");
      return -1;
    }

    const rawData = base64.decode(characteristic.value);
    setHeartRate(rawData);
    handleBLEField(rawData);
  };

  const startStreamingData = async (device: Device) => {
    if (device) {
      device.monitorCharacteristicForService(
        SERVICE_UUID,
        CHARACTERISTC_DATA_UUID,
        onHeartRateUpdate
      );
    } else {
      console.log("No Device Connected");
    }
  };

  const stopScan = () => {
    bleManager.stopDeviceScan();
    console.log("stopScan: modal closed, scanning stopped")
  };

  const handleBLEField = useCallback(async (fieldString: string) => {
    const [key, value] = fieldString.trim().split(':');
    if (!key || value === undefined) return;

    bufferRef.current[key] = value;
    const buffer = bufferRef.current;
    const isComplete = expectedKeys.every(k => k in buffer);
    if (isComplete) {
      const row = expectedKeys.map(k => {
        if (k == 'time') {
          const timestamp = parseInt(buffer[k], 10);
          if (!isNaN(timestamp)){
            return new Date(timestamp * 1000)
              .toLocaleString(undefined, {
                hour12: false,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })
              .replace(',', '\n');
          }
        }
        return buffer[k] ?? 'NA';
      });
      console.log("Saving row to:", storageKeyRef.current);
      setRows(prev => [...prev, row]);

      try {
        const stored = await AsyncStorage.getItem(storageKeyRef.current);
        const parsed = stored ? JSON.parse(stored) : [];
        parsed.push(row);
        await AsyncStorage.setItem(storageKeyRef.current, JSON.stringify(parsed));
        
        const timestamp = Date.now();
        const localTime = new Date(timestamp).toLocaleString();
        await AsyncStorage.setItem(lastUpdatedKeyRef.current, JSON.stringify({
          timestamp: timestamp,
          localTime: localTime
        }));

      } catch (error) {
        console.error("Error saving row to storage: ", error);
        const message = error instanceof Error ? error.message : String(error);
        Alert.alert("Error saving data to storage", message);
      }

      bufferRef.current = {};
    }
  }, []);

  const loadSavedData = useCallback(async () => {
    console.log("Loading data from:", storageKeyRef.current);
    try {
      const storedData = await AsyncStorage.getItem(storageKeyRef.current);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        setRows(Array.isArray(parsed) ? parsed : []);
      } else {
        setRows([]);
      }
    } catch (error) {
      console.error("Failed to load saved data:", error);
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert("Failed to load saved data", message);
    }
  }, []);

  const clearSavedData = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(storageKeyRef.current);
      setRows([]);
      bufferRef.current = {};
    } catch (error) {
      console.error("Failed to clear data: ", error);
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert("Failed to clear data", message);
    }
  }, []);

  const registerSession = useCallback(async (label: string) => {
    if (!sessionId) return;
    try {
      const all = await AsyncStorage.getItem('sessionLabels');
      const parsed = all ? JSON.parse(all) : {};
      parsed[sessionId] = label;
      await AsyncStorage.setItem('sessionLabels', JSON.stringify(parsed));
    } catch (error) {
      console.error("Failed to register session label:", error);
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert("Failed to register session label", message);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      loadSavedData();
      bufferRef.current = {}; // clear buffer on session change
    } else {
      setRows([]);
      bufferRef.current = {};
    }
  }, [sessionId, loadSavedData]);

  return {
    allDevices,
    connectedDevice,
    heartRate,
    sessionState,
    rows,
    scanForPeripherals,
    connectToDevice,
    disconnectFromDevice,
    startRecordingData,
    stopRecordingData,
    loadSavedData,
    clearSavedData,
    registerSession,
    requestPermissions,
    stopScan,
    expectedKeys,
    sessionId,
    setSessionId,
    expectedState,
    isTransitioning,
    initiateSessionTransition,
  };
}

export default useBLE;

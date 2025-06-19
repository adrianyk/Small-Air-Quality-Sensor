// Debugging purposes
console.log("useBLE hook mounted");

/* eslint-disable no-bitwise */
import { useMemo, useState, useEffect } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  BleError,
  BleManager,
  Characteristic,
  Device,
} from "react-native-ble-plx";
import { Buffer } from "buffer";
import { useBLEDataHandler } from './useBLEDataHandler';
import * as ExpoDevice from "expo-device";

import base64 from "react-native-base64";

// Make sure these are consistent with the ESP32 code
const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHARACTERISTC_DATA_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
const CHARACTERISTIC_COMMAND_UUID = "12345678-1234-5678-1234-56789abcdef0";
const SESSION_STATE_UUID = "1b76c3ce-d232-4796-9d85-cf1a68ecff05";
const TIMESTAMP_UUID = "a66324f1-8fc4-44a6-9be5-a481922ef754";

interface BluetoothLowEnergyApi {
  requestPermissions(): Promise<boolean>;
  scanForPeripherals(): void;
  connectToDevice: (device: Device, handleBLEField?: (data: string) => void) => Promise<void>;
  disconnectFromDevice: () => void;
  stopScan: () => void;
  connectedDevice: Device | null;
  allDevices: Device[];
  heartRate: string;
  startRecordingData: () => Promise<void>;
  stopRecordingData: () => Promise<void>;
  sessionState: string;
}

function useBLE(handleBLEField?: (data: string) => void): BluetoothLowEnergyApi {
  const bleManager = useMemo(() => new BleManager(), []);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [heartRate, setHeartRate] = useState("null");
  const [sessionState, setSessionState] = useState<string>("UNKNOWN");

  useEffect(() => {
    console.log("Connected device updated:", connectedDevice);
  }, [connectedDevice]);

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

  const connectToDevice = async (device: Device, handleBLEField?: (data: string) => void) => {
    try {
      bleManager.cancelDeviceConnection(device.id);
      const deviceConnection = await bleManager.connectToDevice(device.id);
      setConnectedDevice(deviceConnection);
      console.log("connectToDevice connected device: ", deviceConnection);

      await deviceConnection.discoverAllServicesAndCharacteristics();
      bleManager.stopDeviceScan();

      // Read SESSION_STATE after connection
      const sessionStateChar = await deviceConnection.readCharacteristicForService(
        SERVICE_UUID,
        SESSION_STATE_UUID
      );
      const sessionStateRaw = base64.decode(sessionStateChar.value ?? "");
      console.log("SESSION_STATE:", sessionStateRaw);

      setSessionState(sessionStateRaw); // <-- Store in hook state

      if (handleBLEField) {
        handleBLEField(`SESSION_STATE:${sessionStateRaw}`);
      }

      startStreamingData(deviceConnection, handleBLEField);
    } catch (e) {
      console.log("connectToDevice: FAILED TO CONNECT", e);
    }
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
        console.error("Failed to start recording data:", error);
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
      } catch (error) {
        console.error("Failed to send STOP command:", error);
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
    handleBLEField?: (data: string) => void
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

    if (handleBLEField) handleBLEField(rawData);
  };

  const startStreamingData = async (device: Device, handleBLEField?: (data: string) => void) => {
    if (device) {
      device.monitorCharacteristicForService(
        SERVICE_UUID,
        CHARACTERISTC_DATA_UUID,
        (error, characteristic) => onHeartRateUpdate(error, characteristic, handleBLEField)
      );
    } else {
      console.log("No Device Connected");
    }
  };



  const stopScan = () => {
    bleManager.stopDeviceScan();
    console.log("stopScan: modal closed, scanning stopped")
  };

return {
  scanForPeripherals,
  requestPermissions,
  connectToDevice, 
  allDevices,
  connectedDevice,
  disconnectFromDevice,
  heartRate,
  stopScan,
  startRecordingData,
  stopRecordingData,
  sessionState,
};
}

export default useBLE;

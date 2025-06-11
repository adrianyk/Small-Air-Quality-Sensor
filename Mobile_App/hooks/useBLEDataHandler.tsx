import { useState, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const expectedKeys = [
  "temp", "humidity",
  "pm1_std", "pm25_std", "pm10_std",
  "pm1_env", "pm25_env", "pm10_env"
];

export function useBLEDataHandler() {
  const [rows, setRows] = useState<string[][]>([]);
  const bufferRef = useRef<Record<string, string>>({});

  const handleBLEField = useCallback(async (fieldString: string) => {
    const [key, value] = fieldString.trim().split(':');
    if (!key || value === undefined) return;

    // Update bufferRef without triggering re-renders
    bufferRef.current[key] = value;

    const buffer = bufferRef.current;
    const isComplete = expectedKeys.every(k => k in buffer);

    if (isComplete) {
      const row = expectedKeys.map(k => buffer[k] ?? 'NA');

      // Update state
      setRows(prev => [...prev, row]);

      // Persist to AsyncStorage
      try {
        const stored = await AsyncStorage.getItem('bleData');
        const parsed = stored ? JSON.parse(stored) : [];
        parsed.push(row);
        await AsyncStorage.setItem('bleData', JSON.stringify(parsed));
      } catch (e) {
        console.error("Error saving row to storage:", e);
      }

      // Clear buffer
      bufferRef.current = {};
    }
  }, []);

  const loadSavedData = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('bleData');
      if (stored) {
        const parsed = JSON.parse(stored);
        setRows(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {
      console.error("Failed to load saved data:", e);
    }
  }, []);

  const clearSavedData = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('bleData');
      setRows([]);
      bufferRef.current = {};
    } catch (e) {
      console.error("Failed to clear data:", e);
    }
  }, []);

  return {
    expectedKeys,
    rows,              // Array of completed data rows
    handleBLEField,    // Call with each field like "temp:23.5"
    loadSavedData,     // Call on app start to restore
    clearSavedData     // Optional clear/reset method
  };
}

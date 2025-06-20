import { useState, useRef, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const expectedKeys = [
  "time", "temp", "humidity",
  "pm1_std", "pm25_std", "pm10_std",
  "pm1_env", "pm25_env", "pm10_env",
  "lat", "lon" 
];

export function useBLEDataHandler(externalSessionId: string | null) {
  const [rows, setRows] = useState<string[][]>([]);
  const storageKey = `bleData-${externalSessionId || 'default-session'}`;
  const bufferRef = useRef<Record<string, string>>({});

  const storageKeyRef = useRef(storageKey);
  useEffect(() => {
    storageKeyRef.current = storageKey;
  }, [storageKey]);

  const handleBLEField = useCallback(async (fieldString: string) => {
    const [key, value] = fieldString.trim().split(':');
    if (!key || value === undefined) return;

    bufferRef.current[key] = value;
    const buffer = bufferRef.current;
    const isComplete = expectedKeys.every(k => k in buffer);
    if (isComplete) {
      const row = expectedKeys.map(k => {
        if (k === 'time') {
          const timestamp = parseInt(buffer[k], 10);
          if (!isNaN(timestamp)) {
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
      } catch (e) {
        console.error("Error saving row to storage:", e);
      }

      bufferRef.current = {}; // Clear buffer
    }
  }, []);

  const loadSavedData = useCallback(async () => {
    console.log("Loading data from:", storageKeyRef.current);
    try {
      const stored = await AsyncStorage.getItem(storageKeyRef.current);
      if (stored) {
        const parsed = JSON.parse(stored);
        setRows(Array.isArray(parsed) ? parsed : []);
      } else {
        setRows([]);
      }
    } catch (e) {
      console.error("Failed to load saved data:", e);
    }
  }, []);

  useEffect(() => {
    if (externalSessionId) {
      loadSavedData();
      bufferRef.current = {}; // Clear buffer on session change
    } else {
      setRows([]);
      bufferRef.current = {};
    }
  }, [externalSessionId, loadSavedData]);

  const clearSavedData = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(storageKeyRef.current);
      setRows([]);
      bufferRef.current = {};
    } catch (e) {
      console.error("Failed to clear data:", e);
    }
  }, []);

  const registerSession = useCallback(async (label: string) => {
    if (!externalSessionId) return;
    try {
      const all = await AsyncStorage.getItem('sessionLabels');
      const parsed = all ? JSON.parse(all) : {};
      parsed[externalSessionId] = label;
      await AsyncStorage.setItem('sessionLabels', JSON.stringify(parsed));
    } catch (e) {
      console.error("Failed to register session label:", e);
    }
  }, [externalSessionId]);

  return {
    expectedKeys,
    rows,
    handleBLEField,
    loadSavedData,
    clearSavedData,
    registerSession,
  };
}

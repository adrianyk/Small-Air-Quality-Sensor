import { useState, useRef, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const expectedKeys = [
  "temp", "humidity",
  "pm1_std", "pm25_std", "pm10_std",
  "pm1_env", "pm25_env", "pm10_env"
];



export function useBLEDataHandler(externalSessionId: string | null) {
  const [rows, setRows] = useState<string[][]>([]);
  const [storageKey, setStorageKey] = useState<string>('bleData-default-session');
  const bufferRef = useRef<Record<string, string>>({});
  
  useEffect(() => {
    const effectiveSessionId = externalSessionId || 'default-session';
    setStorageKey(`bleData-${effectiveSessionId}`);
  }, [externalSessionId]);

  const handleBLEField = useCallback(async (fieldString: string) => {
    const [key, value] = fieldString.trim().split(':');
    if (!key || value === undefined) return;
    
    bufferRef.current[key] = value;
    const buffer = bufferRef.current;
    const isComplete = expectedKeys.every(k => k in buffer);
    if (isComplete) {
      const row = expectedKeys.map(k => buffer[k] ?? 'NA');
      setRows(prev => [...prev, row]);
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        const parsed = stored ? JSON.parse(stored) : [];
        parsed.push(row);
        await AsyncStorage.setItem(storageKey, JSON.stringify(parsed));

      } catch (e) {
        console.error("Error saving row to storage:", e);
      }

      bufferRef.current = {};
    }
  }, [storageKey]);  // storageKey now updates correctly when sessionId changes

  const loadSavedData = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setRows(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {
      console.error("Failed to load saved data:", e);
    }
  }, [storageKey]);

  const clearSavedData = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(storageKey);
      setRows([]);
      bufferRef.current = {};
    } catch (e) {
      console.error("Failed to clear data:", e);
    }
  }, [storageKey]);

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

import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Button } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Spacer from '@/components/Spacer';

import { useBLEContext } from "@/contexts/BLEContext";

export default function DebugAsyncStorageScreen() {
  const { connectedDevice } = useBLEContext();
  const [data, setData] = useState<{ key: string, value: string }[]>([]);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const keys = await AsyncStorage.getAllKeys();
      const stores = await AsyncStorage.multiGet(keys);
      const parsed = stores.map(([key, value]) => ({ key, value: value || '' }));
      setData(parsed);
    };
    fetchData();
  }, []);

  const exportCSV = () => {
    const csv = data.map(item => `"${item.key}","${item.value}"`).join('\n');
    console.log(csv);
    // you can write this to a file with expo-file-system or share it with expo-sharing
  };

  const handleBackToHome = () => {
    if (navigating) return;
    setNavigating(true);
    console.log("back home triggered", connectedDevice)
    router.replace('/');
    setTimeout(() => setNavigating(false), 1000); // reset after 1 second
  };

  return (
    <SafeAreaView>
      <Spacer height={20} />
      <Button title="Back to home" onPress={handleBackToHome} />
      
      <Spacer height={20} />
      <ScrollView className="p-4">
      {data.map(item => (
          <View key={item.key} className="mb-2">
          <Text className="font-bold">{item.key}</Text>
          <Text>{item.value}</Text>
          </View>
      ))}
      <Button title="Export as CSV (console log)" onPress={exportCSV} />
      <Spacer height={20} />

      </ScrollView>
    </SafeAreaView>
  );
}

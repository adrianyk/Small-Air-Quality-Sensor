import AsyncStorage from '@react-native-async-storage/async-storage';

export const deleteSession = async (sessionId: string) => {
  try {
    // Remove the BLE data
    await AsyncStorage.removeItem(`bleData-${sessionId}`);

    // Remove the label from sessionLabels
    const labels = await AsyncStorage.getItem('sessionLabels');
    const parsed = labels ? JSON.parse(labels) : {};
    delete parsed[sessionId];
    await AsyncStorage.setItem('sessionLabels', JSON.stringify(parsed));

    console.log(`Deleted session: ${sessionId}`);
  } catch (e) {
    console.error('Failed to delete session:', e);
  }
};

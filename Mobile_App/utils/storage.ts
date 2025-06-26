import AsyncStorage from '@react-native-async-storage/async-storage';

export const deleteSession = async (sessionId: string) => {
  try {
    // Remove the BLE data
    await AsyncStorage.removeItem(`bleData-${sessionId}`);

    // Remove the label from sessionLabels
    const labels = await AsyncStorage.getItem('sessionLabels');
    const parsedLabels = labels ? JSON.parse(labels) : {};
    delete parsedLabels[sessionId];
    await AsyncStorage.setItem('sessionLabels', JSON.stringify(parsedLabels));

    // Remove from sessionUserIds
    const userIds = await AsyncStorage.getItem('sessionUserIds');
    const parsedUserIds = userIds ? JSON.parse(userIds) : {};
    delete parsedUserIds[sessionId];
    await AsyncStorage.setItem('sessionUserIds', JSON.stringify(parsedUserIds));

    console.log(`Deleted session: ${sessionId}`);
  } catch (e) {
    console.error('Failed to delete session:', e);
  }
};

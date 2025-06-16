import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Button, FlatList, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ThemedView from '@/components/ThemedView';
import ThemedText from '@/components/ThemedText';
import { useRouter } from 'expo-router'; 
import Spacer from '@/components/Spacer';

type SessionLabels = Record<string, string>;

const PastSessionList = () => {
  const [sessions, setSessions] = useState<SessionLabels>({});
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchSessions = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('sessionLabels');
      if (stored) {
        const parsed: SessionLabels = JSON.parse(stored);
        setSessions(parsed);
      } else {
        setSessions({});
      }
    } catch (e) {
      console.error('Failed to load session labels:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSessions();
    }, [fetchSessions])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSessions();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: [string, string] }) => {
    const [sessionId, label] = item;
    return (
      <TouchableOpacity
        onPress={() => router.push({
          pathname: "/session/history/[id]",
          params: { id: sessionId },
        })}
        style={{ padding: 16, borderBottomWidth: 1, borderColor: '#ccc' }}
      >
        <ThemedText className="text-lg font-semibold">{label}</ThemedText>
        <ThemedText className="text-sm text-gray-500">{sessionId}</ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView className="flex-1 p-4">
      <Spacer height={20} />
      <Button title="Back to home" onPress={() => router.push('/')} />
      
      <Spacer height={20} />
      <ThemedText className="text-center font-bold text-xl mb-4" title>
        All past sessions:
      </ThemedText>

      <FlatList
        data={Object.entries(sessions)}
        keyExtractor={([sessionId]) => sessionId}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <ThemedText className="text-center">No sessions found.</ThemedText>
        }
      />
    </ThemedView>
  );
};

export default PastSessionList;

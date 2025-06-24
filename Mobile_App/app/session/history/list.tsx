import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Button, FlatList, TouchableOpacity, View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ThemedView from '@/components/ThemedView';
import ThemedText from '@/components/ThemedText';
import { useRouter } from 'expo-router'; 
import Spacer from '@/components/Spacer';
import { deleteSession } from '@/utils/storage';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import firestore from '@react-native-firebase/firestore';

type SessionLabels = Record<string, string>;

const PastSessionList = () => {
  const [sessions, setSessions] = useState<SessionLabels>({});
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const { user } = useAuth();

  const fetchSessions = useCallback(async () => {
    try {
      if (!user?.uid) {
        setSessions({});
        return;
      }

      const storedLabels = await AsyncStorage.getItem('sessionLabels');
      const storedUserIds = await AsyncStorage.getItem('sessionUserIds');

      const localLabels: SessionLabels = storedLabels ? JSON.parse(storedLabels) : {};
      const userIds: Record<string, string> = storedUserIds ? JSON.parse(storedUserIds) : {};

      // Filter local sessions by user ID
      const localFiltered: SessionLabels = {};
      for (const [id, label] of Object.entries(localLabels)) {
        if (userIds[id] === user.uid) {
          localFiltered[id] = label;
        }
      }

      // Fetch sessions from Firebase
      const snapshot = await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('sessions')
        .get();

      const cloudSessions: SessionLabels = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        const label = data.label || 'Unnamed Session';
        cloudSessions[doc.id] = label;
      });

      // Merge local and cloud sessions (cloud wins if conflict)
      const mergedSessions: SessionLabels = {
        ...localFiltered,
        ...cloudSessions,
      };

      setSessions(mergedSessions);
    } catch (e) {
      console.error('Failed to load session labels:', e);
      setSessions({});
    }
  }, [user?.uid]);

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

  const handleDelete = async (sessionId: string) => {
    Alert.alert(
      "Delete Session",
      "Are you sure you want to delete this session?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteSession(sessionId);
            await fetchSessions(); // refresh list
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: [string, string] }) => {
    const [sessionId, label] = item;

    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 16,
          paddingHorizontal: 12,
          borderBottomWidth: 1,
          borderColor: '#ccc',
        }}
      >
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/session/history/[id]",
              params: { id: sessionId },
            })
          }
          style={{ flex: 1 }}
        >
          <ThemedText className="text-lg font-semibold">{label}</ThemedText>
          <ThemedText className="text-sm text-gray-500">{sessionId}</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/session/history/[id]/data",
              params: { id: sessionId },
            })
          }
          style={{ marginHorizontal: 8 }}
        >
          <Feather name="activity" size={20} color="#007AFF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleDelete(sessionId)}>
          <Feather name="trash-2" size={20} color="red" />
        </TouchableOpacity>
      </View>
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

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

  type SessionMeta = {
    label: string;
    lastUpdated: number;
  };

  const fetchSessions = useCallback(async () => {
  try {
    if (!user?.uid) {
      setSessions({});
      return;
    }

    const storedLabelsRaw = await AsyncStorage.getItem('sessionLabels');
    const storedUserIdsRaw = await AsyncStorage.getItem('sessionUserIds');

    const localLabels: Record<string, string> = storedLabelsRaw ? JSON.parse(storedLabelsRaw) : {};
    const userIds: Record<string, string> = storedUserIdsRaw ? JSON.parse(storedUserIdsRaw) : {};

    // Prepare local sessions with label + lastUpdated
    const localSessions: Record<string, SessionMeta> = {};

    for (const [id, label] of Object.entries(localLabels)) {
      if (userIds[id] === user.uid) {
        // Read lastUpdated for each local session
        const lastUpdatedRaw = await AsyncStorage.getItem(`lastUpdated-${id}`);
        const lastUpdatedObj = lastUpdatedRaw ? JSON.parse(lastUpdatedRaw) : null;
        const lastUpdated = lastUpdatedObj?.timestamp || 0;
        localSessions[id] = { label, lastUpdated };
      }
    }

    // Fetch cloud sessions
    const snapshot = await firestore()
      .collection('users')
      .doc(user.uid)
      .collection('sessions')
      .get();

    const cloudSessions: Record<string, SessionMeta> = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      cloudSessions[doc.id] = {
        label: data.label || 'Unnamed Session',
        lastUpdated: data.lastUpdated || 0,
      };
    });

    // Merge sessions by picking the latest lastUpdated
    const mergedSessions: Record<string, string> = {};
    const allSessionIds = new Set([...Object.keys(localSessions), ...Object.keys(cloudSessions)]);

    allSessionIds.forEach(id => {
      const localSession = localSessions[id];
      const cloudSession = cloudSessions[id];

      if ((cloudSession?.lastUpdated ?? 0) >= (localSession?.lastUpdated ?? 0)) {
        console.log('Cloud')
        mergedSessions[id] = cloudSession?.label ?? 'Unnamed Session';
      } else {
        console.log('async')
        mergedSessions[id] = localSession?.label ?? 'Unnamed Session';
      }
    });

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
      <Button title="Back to sessions" onPress={() => router.push('/session')} />
      
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

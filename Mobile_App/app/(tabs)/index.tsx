// Home screen
import { Button, Image, Pressable, ScrollView, View, Text } from "react-native";
import { Link, useRouter } from "expo-router";

import { images } from "@/constants/images";
import { icons } from "@/constants/icons";

import SearchBar from "@/components/SearchBar";
import ThemedView from "@/components/ThemedView";
import ThemedText from "@/components/ThemedText";
import Spacer from "@/components/Spacer";

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export default function Index() {
  const router = useRouter();

  const uploadDummyData = async () => {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('User not logged in');

      const userId = user.uid;
      const sessionId = Date.now().toString(); // or use UUID

      const dummyData = {
        timestamp: firestore.FieldValue.serverTimestamp(),
        values: [7], // Replace with actual data structure
        environment: 'Test environment',
      };

      // Write to a test collection
      await firestore()
        .collection('users')
        .doc(userId)
        .collection('sessions')
        .doc(sessionId)
        .set(dummyData);

      console.log('✅ Dummy data uploaded for user:', userId);
    } catch (error) {
      console.error('❌ Failed to upload dummy data:', error);
    }
  };

  const fetchDummyData = async () => {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('User not logged in');

      const userId = user.uid;

      const snapshot = await firestore()
        .collection('users')
        .doc(userId)
        .collection('sessions')
        .orderBy('timestamp', 'desc') // optional
        .get();

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log('✅ Fetched sessions for user:', userId,' ', data);
    } catch (error) {
      console.error('❌ Failed to fetch dummy data:', error);
    }
  };

  return (
    <ThemedView className="flex-1">
      <Image source={images.bg} className="absolute w-full z-0 " />

      <View className="flex-1 justify-center items-center">
        <ThemedText className='font-bold text-[50px] text-center' title={true}>
          Welcome!
        </ThemedText>
        <ThemedText className='font-bold text-[20px] text-center' title={true}>
          Tap the buttons below to start.
        </ThemedText>

        <Spacer height={10} />
        {/* <Button title="Start a Session" onPress={() => router.push('/test-bluetooth')} /> */}
        <Pressable
            onPress={() => router.push('/test-bluetooth')}
            className="justify-center mt-6 bg-blue-500 px-6 py-3 rounded-full"
        >
            <Text className="text-center text-white font-semibold">Start a Session</Text>
        </Pressable>

        <Pressable
            onPress={() => router.push('/profile')}
            className="justify-center mt-6 bg-blue-500 px-6 py-3 rounded-full"
        >
            <Text className="text-center text-white font-semibold">Profile</Text>
        </Pressable>

        {/* <Spacer height={30} />
        <Button title="Upload Dummy Data" onPress={uploadDummyData} />

        <Spacer height={20} />
        <Button title="Fetch Dummy Data" onPress={fetchDummyData} />

        <Spacer height={20} />
        <Button title="View AsyncStorage" onPress={() => router.push('/debug-asyncstorage')} /> */}
      </View>

    </ThemedView>
  );
}

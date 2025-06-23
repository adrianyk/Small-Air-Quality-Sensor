// Home screen
import { Button, Image, ScrollView, View } from "react-native";
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
      <Image source={images.bg} className="absolute w-full z-0" />
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{minHeight: '100%', paddingBottom: 10 }}>
        <Image source={icons.logo} className="w-12 h-10 mt-20 mb-5 mx-auto" />

        <ThemedText className='font-bold text-[18px] text-center' title={true}>
          Dashboard
        </ThemedText>

        <Spacer height={20} />
        <Link href='/test-bluetooth'>
          <ThemedText className='text-center'>
            Bluetooth (testing)
          </ThemedText>
        </Link>

        <Spacer height={30} />
        <Button title="Upload Dummy Data" onPress={uploadDummyData} />

        <Spacer height={20} />
        <Button title="Fetch Dummy Data" onPress={fetchDummyData} />

        <View className="flex-1 mt-5">
          <SearchBar 
            onPress={() => router.push("/session")} // redirect to the `/session` screen
            placeholder="Search for a session"
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

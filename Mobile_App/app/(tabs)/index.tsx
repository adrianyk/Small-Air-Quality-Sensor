// Home screen
import { Image, ScrollView, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";

import { images } from "@/constants/images";
import { icons } from "@/constants/icons";

import SearchBar from "@/components/SearchBar";
import ThemedView from "@/components/ThemedView";
import ThemedText from "@/components/ThemedText";
import Spacer from "@/components/Spacer";

export default function Index() {
  const router = useRouter();

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

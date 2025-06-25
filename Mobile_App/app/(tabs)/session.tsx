import { Button, Image, Pressable, ScrollView, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";

import ThemedView from "@/components/ThemedView";
import ThemedText from "@/components/ThemedText";
import { images } from "@/constants/images";
import Spacer from "@/components/Spacer";

const Session = () => {
    const router = useRouter();
    
    return (
        <ThemedView className='flex-1'>
            <Image source={images.bg} className="absolute w-full z-0 " />
            
            <View className="flex-1 justify-center items-center">
                <ThemedText className='font-bold text-[50px] text-center' title={true}>
                    Sessions
                </ThemedText>

                {/* <Spacer height={20} /> */}
                {/* <Button title="Session History" onPress={() => router.push('/session/history/list')} /> */}
                <Pressable
                    onPress={() => router.push('/session/history/list')}
                    className="justify-center mt-6 bg-blue-500 px-6 py-3 rounded-full"
                >
                    <Text className="text-center text-white font-semibold">Session History</Text>
                </Pressable>

                {/* <Spacer height={20} /> */}
                {/* <Button title="Map" onPress={() => router.push('/session/map')} /> */}
                <Pressable
                    onPress={() => router.push('/session/map')}
                    className="justify-center mt-6 bg-blue-500 px-6 py-3 rounded-full"
                >
                    <Text className="text-center text-white font-semibold">Map</Text>
                </Pressable>
            </View>
            
        </ThemedView>
    )
}

export default Session

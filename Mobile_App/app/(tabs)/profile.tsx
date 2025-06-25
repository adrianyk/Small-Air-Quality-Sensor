import { View, Pressable, Text, Image } from "react-native";

import ThemedView from "@/components/ThemedView";
import ThemedText from "@/components/ThemedText";
import Spacer from "@/components/Spacer";

import { useAuth } from '@/contexts/AuthContext';
import { images } from "@/constants/images";

const Profile = () => {
    const { signOut } = useAuth();

    return (
        <ThemedView className='flex-1'>
            <Image source={images.bg} className="absolute w-full z-0 " />

            <View className="flex-1 justify-center items-center">
                <ThemedText className='font-bold text-[50px] text-center' title={true}>
                    Profile
                </ThemedText>
                
                <Pressable
                    onPress={signOut}
                    className="justify-center mt-6 bg-red-500 px-6 py-3 rounded-full"
                >
                    <Text className="text-center text-white font-semibold">Sign Out</Text>
                </Pressable>
            </View>

        </ThemedView>
    )
}

export default Profile
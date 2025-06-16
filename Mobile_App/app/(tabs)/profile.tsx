import { View, Pressable, Text } from "react-native";

import ThemedView from "@/components/ThemedView";
import ThemedText from "@/components/ThemedText";
import Spacer from "@/components/Spacer";

import { useAuth } from '@/contexts/AuthContext';

const Profile = () => {
    const { signOut } = useAuth();

    return (
        <ThemedView className='flex-1 justify-center item-center'>
            <ThemedText className='font-bold text-[18px] text-center' title={false}>
                Profile Page
            </ThemedText>

            <Pressable
                onPress={signOut}
                className="justify-center mt-6 bg-red-500 px-6 py-3 rounded-full"
            >
                <Text className="text-center text-white font-semibold">Sign Out</Text>
            </Pressable>
        </ThemedView>
    )
}

export default Profile
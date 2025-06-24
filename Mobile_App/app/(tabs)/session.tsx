import { Button, Image, ScrollView, Text, View } from "react-native";
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
            
            <Spacer height={300} />
            <ThemedText className='font-bold text-[18px] text-center' title={false}>
                Session Page
            </ThemedText>

            <ThemedView className="justify-center items-center">
                <Spacer height={20} />
                <Button title="Session History" onPress={() => router.push('/session/history/list')} />

                <Spacer height={20} />
                <Button title="Map" onPress={() => router.push('/session/map')} />
            </ThemedView>
            
        </ThemedView>
    )
}

export default Session

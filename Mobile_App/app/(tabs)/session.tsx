import { Image, ScrollView, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";

import ThemedView from "@/components/ThemedView";
import ThemedText from "@/components/ThemedText";

const Session = () => {
    const router = useRouter();
    
    return (
        <ThemedView className='flex-1 justify-center item-center'>
            <ThemedText className='font-bold text-[18px] text-center' title={false}>
                Session Page
            </ThemedText>

            <Link href='/session/history/list'>
                <ThemedText className='text-center'>
                    Session History
                </ThemedText>
            </Link>

        </ThemedView>



    )
}

export default Session

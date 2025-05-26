import React from "react";
import ThemedView from "@/components/ThemedView";
import ThemedText from "@/components/ThemedText";

const Profile = () => {
    return (
        <ThemedView className='flex-1 justify-center item-center'>
            <ThemedText className='font-bold text-[18px] text-center' title={false}>
                Profile Page
            </ThemedText>
        </ThemedView>
    )
}

export default Profile
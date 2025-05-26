import ThemedView from "@/components/ThemedView";
import ThemedText from "@/components/ThemedText";

const Session = () => {
    return (
        <ThemedView className='flex-1 justify-center item-center'>
            <ThemedText className='font-bold text-[18px] text-center' title={false}>
                Session Page
            </ThemedText>
        </ThemedView>
    )
}

export default Session
import ThemedView from '@/components/ThemedView'
import ThemedText from '@/components/ThemedText'

const Connecting = () => {
  return (
    <ThemedView className='flex-1 justify-center item-center'>
        <ThemedText className='font-bold text-[18px] text-center' title={true}>
            Connecting to your device...
        </ThemedText>
    </ThemedView>
  )
}

export default Connecting
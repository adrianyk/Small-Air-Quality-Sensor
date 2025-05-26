import ThemedView from '@/components/ThemedView'
import ThemedText from '@/components/ThemedText'

const AvailableDevices = () => {
  return (
    <ThemedView className='flex-1 justify-center item-center'>
        <ThemedText className='font-bold text-[18px] text-center' title={true}>
            Please select your device to connect
        </ThemedText>
    </ThemedView>
  )
}

export default AvailableDevices
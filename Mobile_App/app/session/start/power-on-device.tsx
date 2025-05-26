import ThemedView from '@/components/ThemedView'
import ThemedText from '@/components/ThemedText'

const PowerOnDevice = () => {
  return (
    <ThemedView className='flex-1 justify-center item-center'>
        <ThemedText className='font-bold text-[18px] text-center' title={true}>
            Please power on the sensor device
        </ThemedText>
    </ThemedView>
  )
}

export default PowerOnDevice
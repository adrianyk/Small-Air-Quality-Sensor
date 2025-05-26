import ThemedView from '@/components/ThemedView'
import ThemedText from '@/components/ThemedText'

const TurnOnBluetooth = () => {
  return (
    <ThemedView className='flex-1 justify-center item-center'>
        <ThemedText className='font-bold text-[18px] text-center' title={true}>
            Please turn on Bluetooth on your phone
        </ThemedText>
    </ThemedView>
  )
}

export default TurnOnBluetooth
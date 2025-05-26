import ThemedView from '@/components/ThemedView'
import ThemedText from '@/components/ThemedText'

const ActiveSessionDetails = () => {
  return (
    <ThemedView className='flex-1 justify-center item-center'>
        <ThemedText className='font-bold text-[18px] text-center' title={true}>
            Active session details screen
        </ThemedText>
    </ThemedView>
  )
}

export default ActiveSessionDetails
import ThemedView from '@/components/ThemedView'
import ThemedText from '@/components/ThemedText'

const RecordingStarted = () => {
  return (
    <ThemedView className='flex-1 justify-center item-center'>
        <ThemedText className='font-bold text-[18px] text-center' title={true}>
            Recording started!
        </ThemedText>
    </ThemedView>
  )
}

export default RecordingStarted
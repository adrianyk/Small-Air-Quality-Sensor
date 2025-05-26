import ThemedView from '@/components/ThemedView'
import ThemedText from '@/components/ThemedText'

const Connected = () => {
  return (
    <ThemedView className='flex-1 justify-center item-center'>
        <ThemedText className='font-bold text-[18px] text-center' title={true}>
            Connected!
        </ThemedText>
    </ThemedView>
  )
}

export default Connected
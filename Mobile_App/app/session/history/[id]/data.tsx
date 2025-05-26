import ThemedView from '@/components/ThemedView'
import ThemedText from '@/components/ThemedText'

const Data = () => {
  return (
    <ThemedView className='flex-1 justify-center item-center'>
        <ThemedText className='font-bold text-[18px] text-center' title={true}>
            View data (graph/map)
        </ThemedText>
    </ThemedView>
  )
}

export default Data
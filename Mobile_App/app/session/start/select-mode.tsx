import ThemedView from '@/components/ThemedView'
import ThemedText from '@/components/ThemedText'

const SelectMode = () => {
  return (
    <ThemedView className='flex-1 justify-center item-center'>
        <ThemedText className='font-bold text-[18px] text-center' title={true}>
            Select Mode
        </ThemedText>
    </ThemedView>
  )
}

export default SelectMode
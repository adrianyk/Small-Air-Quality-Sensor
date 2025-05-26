import ThemedView from '@/components/ThemedView'
import ThemedText from '@/components/ThemedText'

const NewSession = () => {
  return (
    <ThemedView className='flex-1 justify-center item-center'>
        <ThemedText className='font-bold text-[18px] text-center' title={true}>
            Please enter the details of this recording session
        </ThemedText>
    </ThemedView>
  )
}

export default NewSession
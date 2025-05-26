import ThemedView from '@/components/ThemedView'
import ThemedText from '@/components/ThemedText'

const RetrieveData = () => {
  return (
    <ThemedView className='flex-1 justify-center item-center'>
        <ThemedText className='font-bold text-[18px] text-center' title={true}>
            Retrieving data from device...
            Data retrieval complete
            Uploading data to cloud...
            Uploading complete
        </ThemedText>
    </ThemedView>
  )
}

export default RetrieveData
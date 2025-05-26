import { View, useColorScheme } from 'react-native'

const ThemedCard = ({ className = '', ...props }) => {
    const colorScheme = useColorScheme() // checks the display mode of the phone (light/dark/null)
    const theme = colorScheme === 'dark' ? 'dark' : 'light' // set default theme to light
    // console.log("Theme:", colorScheme)

    return (
        <View 
            className={`bg-${theme}-uiBackground rounded p-5 ${className}`} {...props} 
        />
    )
}

export default ThemedCard
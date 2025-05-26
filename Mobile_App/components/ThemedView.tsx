import { View, useColorScheme } from 'react-native'

const ThemedView = ({ className = '', ...props }) => {
    const colorScheme = useColorScheme() // checks the display mode of the phone (light/dark/null)
    const theme = colorScheme === 'dark' ? 'dark' : 'light' // set default theme to light
    // console.log("Theme:", colorScheme)

    return (
        <View 
            className={`bg-${theme}-background ${className}`} {...props} 
        />
    )
}

export default ThemedView
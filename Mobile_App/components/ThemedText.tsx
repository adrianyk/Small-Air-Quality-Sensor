import { Text, useColorScheme } from 'react-native'
import React from 'react'

const ThemedText = ({ title=false, className = '', ...props }) => {
    const colorScheme = useColorScheme() // checks the display mode of the phone (light/dark/null)
    const theme = colorScheme === 'dark' ? 'dark' : 'light' // set default theme to light
    // console.log("Theme:", colorScheme)

    const textColor = title ? `text-${theme}-title` : `text-${theme}-text`

    return (
        <Text 
            className={`${textColor} ${className}`} {...props} 
        />
    )
}

export default ThemedText
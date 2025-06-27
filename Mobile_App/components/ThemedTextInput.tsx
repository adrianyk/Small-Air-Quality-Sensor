import { TextInput, TextInputProps, useColorScheme } from 'react-native'

type ThemedTextInputProps = TextInputProps & {
  className?: string;
};

const ThemedTextInput = ({ className = '', placeholderTextColor, ...props }: ThemedTextInputProps) => {
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? 'dark' : 'light';
    // console.log("Theme:", colorScheme)

    const textColor = `text-${theme}-text`;
    const borderColor = `border-${theme}-border`;
    const defaultPlaceholderColor = theme === 'dark' ? '#aaa' : '#666';

    return (
        <TextInput 
            className={`${textColor} ${borderColor} ${className}`}
            placeholderTextColor={placeholderTextColor || defaultPlaceholderColor}
            {...props} 
        />
    )
}

export default ThemedTextInput
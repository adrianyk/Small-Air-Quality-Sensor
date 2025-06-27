import { TouchableOpacity, TouchableOpacityProps, useColorScheme } from 'react-native';

type ThemedTouchableOpacityProps = TouchableOpacityProps & {
  selected?: boolean;
  className?: string; // if you use this
};

const ThemedTouchableOpacity = ({ className = '', selected = false, style, ...props }: ThemedTouchableOpacityProps) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';

  const highlightColor = theme === 'dark' ? '#264653' : '#7aa9d9';

  return (
    <TouchableOpacity
      {...props}
      style={[
        style,
        selected && { backgroundColor: highlightColor },
      ]}
    />
  );
};

export default ThemedTouchableOpacity;

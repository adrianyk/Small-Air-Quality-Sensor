import { Image, View, TextInput } from "react-native";

import { icons } from "@/constants/icons";

// This `interface Props` is a type def that tells react native what types placeholder and onPress are
interface Props {
    placeholder: string;
    onPress?: () => void;
}

// props are like function arguments
// We define the function arguments as type `Props`, which is defined above
const SearchBar = ({ placeholder, onPress }: Props) => {
    return (
        <View className="flex-row items-center bg-dark-200 rounded-full px-5 py-4">
            <Image source={icons.search} className="size-5" resizeMode="contain" tintColor="#AB8BFF" />
            <TextInput
                onPress={onPress}
                placeholder={placeholder}
                value=""
                onChangeText={() => {}}
                placeholderTextColor="#A8B5DB"
                className="flex-1 ml-2 text-white"
            />
        </View>
    )
}
export default SearchBar
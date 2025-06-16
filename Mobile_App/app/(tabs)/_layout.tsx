import { Tabs, Redirect } from "expo-router";
import { View, Text, ImageBackground, Image } from "react-native";

import { images } from "@/constants/images";
import { icons } from "@/constants/icons";

import { useAuth } from '@/contexts/AuthContext';

const TabIcon = ({ focused, icon, title }: any) => {
    // This `TabIcon` defines the styling for each tab button on the bottom navigation bar
    
    // when focused (when you press this tab button)
    if(focused) {
        return (
            <ImageBackground
                source={images.highlight}
                className="flex flex-row w-full flex-1 min-w-[120px] min-h-16 mt-4 justify-center items-center rounded-full overflow-hidden"
            >
                <Image source={icon} tintColor="#151312" className="size-5"/>
                <Text className="text-secondary text-base font-semibold ml-2">{title}</Text>
            </ImageBackground>
        )
    }

    // else when not focused (when this tab button is not pressed)
    return (
        <View className="size-full justify center items-center mt-4 rounded-full">
            <Image source={icon} tintColor="#A8B5D8" className="size-5" />
        </View>
    )
}

export default function TabsLayout() {
    const { user, loading } = useAuth();

    if (loading) return null;
    if (!user) return <Redirect href="/login" />;

    return (
        <Tabs
            // This is the styling for the bottom black navigation bar
            screenOptions={{
                tabBarShowLabel: false,
                tabBarItemStyle: {
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center'
                },
                tabBarStyle: {
                    backgroundColor: '#0F0D23',
                    borderRadius: 50,
                    marginHorizontal: 20,
                    marginBottom: 36,
                    height: 52,
                    position: 'absolute',
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: '#0F0D23'
                },
            }}
        >
            <Tabs.Screen
                // These are the styling for each tab button in the bottom nav bar
                name="index"
                options={{
                    title: 'Home',
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        // `focused` means "when you click this tab"
                        <TabIcon
                            focused={focused} 
                            icon={icons.home} 
                            title="Home"
                        />
                    )
                }}
            />
            <Tabs.Screen
                name="session"
                options={{
                    title: 'Session',
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon
                            focused={focused} 
                            icon={icons.search} 
                            title="Session"
                        />
                    )
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon
                            focused={focused} 
                            icon={icons.person} 
                            title="Profile"
                        />
                    )
                }}
            />
        </Tabs>
    )
}
import { TextInput, Text, TouchableOpacity, ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { useAuthForm } from '@/hooks/useAuthForm';

import Spacer from "@/components/Spacer";
import ThemedView from '@/components/ThemedView';
import ThemedText from '@/components/ThemedText';

export default function LoginScreen() {
  const {
    email, setEmail,
    password, setPassword,
    errorMessage,
    handleLogin,
  } = useAuthForm();

  const loginAndRedirect = async () => {
    const success = await handleLogin();
    if (success) {
      router.replace('/'); // navigate to home
    }
  };

  return (
    <ThemedView className="flex-1 justify-center px-6">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6">
          <ThemedText className="text-center text-[50px] font-bold mb-6" title>
            Login
          </ThemedText>

          <ThemedText className="mb-1 font-medium">Email</ThemedText>
          <TextInput 
            className="border border-gray-300 rounded-md p-3 mb-4 bg-white dark:bg-dark-uiBackground text-black dark:text-white" 
            value={email} 
            onChangeText={setEmail} 
          />

          <ThemedText className="mb-1 font-medium">Password</ThemedText>
          <TextInput
            className="border border-gray-300 rounded-md p-3 mb-2 bg-white dark:bg-dark-uiBackground text-black dark:text-white"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Spacer height={20}/>
          <TouchableOpacity
            className="bg-accent py-3 rounded-xl mb-2"
            onPress={loginAndRedirect}
          >
            <ThemedText className="text-center font-bold text-white">Login</ThemedText>
          </TouchableOpacity>
          {errorMessage && <Text className="text-red-500 mt-2">{errorMessage}</Text>}

          <TouchableOpacity
            onPress={() => router.replace('/register')}
            className="mt-4"
          >
            <ThemedText className="text-center text-accent font-medium">
              Don't have an account? Register
            </ThemedText>
          </TouchableOpacity>
          
        </View>
      </ScrollView>
    </ThemedView>
  );
}

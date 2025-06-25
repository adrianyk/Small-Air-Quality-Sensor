import { TextInput, Button, Text, TouchableOpacity, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import Spacer from "@/components/Spacer";
import { useAuthForm } from '@/hooks/useAuthForm';
import ThemedView from '@/components/ThemedView';
import ThemedText from '@/components/ThemedText';

export default function LoginScreen() {
  const {
    email, setEmail,
    password, setPassword,
    errorMessage,
    handleRegister,
  } = useAuthForm();

  const registerAndRedirect = async () => {
    const success = await handleRegister();
    if (success) {
      router.replace('/'); // redirect after successful registration
    }
  };

  return (
    <ThemedView className="flex-1 justify-center px-6">
      {/* <KeyboardAvoidingView
        className="flex-1 justify-center"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={60} // adjust if you have headers
      > */}
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-6">
            <ThemedText className="text-center text-[50px] font-bold mb-6" title>
              Register
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
            {/* <Button title="Register" onPress={registerAndRedirect} /> */}
            <TouchableOpacity
              className="bg-accent py-3 rounded-xl mb-2"
              onPress={registerAndRedirect}
            >
              <ThemedText className="text-center font-bold text-white">Login</ThemedText>
            </TouchableOpacity>
            {errorMessage && <Text className="text-red-500 mt-2">{errorMessage}</Text>}

            {/* <Spacer height={20} />
            <Button title="Already have an account? Login" onPress={() => router.push('/login')} /> */}
              <TouchableOpacity
              onPress={() => router.replace('/login')}
              className="mt-4"
            >
              <ThemedText className="text-center text-accent font-medium">
                Already have an account? Log in
              </ThemedText>
            </TouchableOpacity>
          </View>

        </ScrollView>
        
      {/* </KeyboardAvoidingView> */}

    </ThemedView>
  );
}

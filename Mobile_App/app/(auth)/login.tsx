import { TextInput, Button, Text } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import Spacer from "@/components/Spacer";
import { useAuthForm } from '@/hooks/useAuthForm';

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
    <SafeAreaView className="p-4">
      <TextInput 
        className="border p-2 mb-2" 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
      />
      <TextInput
        className="border p-2 mb-2"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={loginAndRedirect} />
      {errorMessage && <Text className="text-red-500 mt-2">{errorMessage}</Text>}

      <Spacer height={20} />
      <Button title="Don't have an account? Register" onPress={() => router.push('/register')} />
    </SafeAreaView>
  );
}

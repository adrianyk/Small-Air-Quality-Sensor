import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import auth from '@react-native-firebase/auth';
import { router } from 'expo-router';

import Spacer from "@/components/Spacer";

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = async () => {
    try {
      await auth().createUserWithEmailAndPassword(email, password);
      console.log(auth().currentUser?.email);
      router.replace('/');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View className="p-4">
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Register" onPress={login} />

      <Spacer height={20} />
      <Button title="Already have an account? Login" onPress={() => router.push('/login')} />
    </View>
  );
}

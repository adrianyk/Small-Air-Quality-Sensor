import Toast from 'react-native-toast-message';
import { Stack } from "expo-router";
import { AuthProvider } from '@/contexts/AuthContext';
import { BLEProvider } from "@/contexts/BLEContext";
import './globals.css';

export default function RootLayout() {
  return (
    <BLEProvider>
      <AuthProvider>
        <>
          <Stack screenOptions={{ headerShown: false }} />
          <Toast />
        </>
      </AuthProvider>
    </BLEProvider>
  );
}

import { useAuth } from '@/contexts/AuthContext';
import { Stack, Redirect } from 'expo-router';

export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) {
    console.log('Already signed in! Redirecting to Home tab...')
    return <Redirect href="/" />;
  }

  return (
    <Stack 
      screenOptions={{ 
        headerShown: false, 
        animation: "slide_from_right"
      }} 
    />
  )
}
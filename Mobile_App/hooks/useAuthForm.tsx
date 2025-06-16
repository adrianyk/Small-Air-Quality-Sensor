import { useState } from 'react';
import auth from '@react-native-firebase/auth';

export const useAuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    setErrorMessage(null);
    try {
      await auth().signInWithEmailAndPassword(email, password);
      console.log('User signed in: ', auth().currentUser?.email);
      return true;
    } catch (error: unknown) {
      handleError(error);
      return false;
    }
  };

  const handleRegister = async () => {
    setErrorMessage(null);
    try {
      await auth().createUserWithEmailAndPassword(email, password);
      console.log('New user account created & signed in: ', auth().currentUser?.email);
      return true;
    } catch (error: unknown) {
      handleError(error);
      return false;
    }
  };

  const handleError = (error: unknown) => {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = (error as { code: string }).code;
      switch (code) {
        case 'auth/email-already-in-use':
          setErrorMessage('Email is already in use.');
          break;
        case 'auth/invalid-email':
          setErrorMessage('Invalid email address.');
          break;
        case 'auth/user-not-found':
          setErrorMessage('User not found.');
          break;
        case 'auth/wrong-password':
          setErrorMessage('Incorrect password.');
          break;
        case 'auth/weak-password':
          setErrorMessage('Password is too weak.');
          break;
        default:
          setErrorMessage('Authentication failed. Please try again.');
      }
    } else {
      setErrorMessage('Unexpected error occurred.');
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    errorMessage,
    handleLogin,
    handleRegister,
  };
};

import { LoginScreen, YStack, SizableText, toast, Image } from '@blinkdotnew/mobile-ui';
import { blink } from '@/lib/blink';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      await blink.auth.signInWithEmail(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      if (error.message.includes('Invalid credentials')) {
        // Try to sign up if it's a new user for demo purposes
        try {
          await blink.auth.signUp({ email, password, displayName: email.split('@')[0] });
          toast('Account Created', { message: 'Welcome to Velora!', variant: 'success' });
          router.replace('/(tabs)');
          return;
        } catch (signupError: any) {
          toast('Login Failed', { message: error.message, variant: 'error' });
        }
      } else {
        toast('Login Failed', { message: error.message, variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProviderLogin = async (id: string) => {
    try {
      if (id === 'google') await blink.auth.signInWithGoogle();
      router.replace('/(tabs)');
    } catch (error: any) {
      toast('Login Failed', { message: error.message, variant: 'error' });
    }
  };

  return (
    <LoginScreen
      variant="centered-card"
      title="Welcome back"
      subtitle="Sign in to your business dashboard."
      logo={
        <Image 
          source={require('@/assets/images/velora-logo.png')} 
          style={{ width: 180, height: 80, resizeMode: 'contain' }} 
        />
      }
      providerButtonStyle="brand"
      providers={[
        { id: 'google', name: 'Continue with Google', brand: 'google' }
      ]}
      onProviderPress={handleProviderLogin}
      showEmailForm
      onEmailSubmit={handleEmailLogin}
      onTerms={() => {}}
      onPrivacy={() => {}}
    />
  );
}

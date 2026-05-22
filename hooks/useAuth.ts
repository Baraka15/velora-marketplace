import { useState, useEffect } from 'react';
import { blink } from '@/lib/blink';
import { type BlinkUser } from '@blinkdotnew/sdk';

export function useAuth() {
  const [user, setUser] = useState<BlinkUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user);
      if (!state.isLoading) {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return { user, loading, isAuthenticated: !!user };
}

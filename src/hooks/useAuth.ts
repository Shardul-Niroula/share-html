import { useState, useEffect, useCallback } from 'react';
import { UserAccount } from '../types/types';
import { authClient } from '../services/authClient';

interface NeonAuthUser {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  createdAt?: string | Date;
}

function mapSessionUser(sessionUser: NeonAuthUser): UserAccount {
  return {
    id: sessionUser.id,
    name: sessionUser.name || 'Developer',
    email: sessionUser.email,
    avatarUrl:
      sessionUser.image ||
      `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(sessionUser.email)}`,
    createdAt: sessionUser.createdAt ? new Date(sessionUser.createdAt).getTime() : Date.now(),
  };
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
    return (error as any).message;
  }
  return fallback;
}

export function useAuth() {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const { data } = await authClient.getSession();
      setUser(data?.user ? mapSessionUser(data.user as NeonAuthUser) : null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const { error } = await authClient.signUp.email({
        name: name.trim() || 'Developer',
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw new Error(extractErrorMessage(error, 'Could not create account.'));
      await refreshSession();
    },
    [refreshSession]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw new Error(extractErrorMessage(error, 'Invalid email or password.'));
      await refreshSession();
    },
    [refreshSession]
  );

  const logout = useCallback(async () => {
    await authClient.signOut();
    setUser(null);
  }, []);

  return {
    user,
    isLoggedIn: !!user,
    isLoading,
    signUp,
    signIn,
    logout,
  };
}

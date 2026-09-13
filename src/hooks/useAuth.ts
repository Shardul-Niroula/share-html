import { useState, useEffect, useCallback } from 'react';
import { UserAccount } from '../types/types';
import { StorageService } from '../services/storage';

export function useAuth() {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = StorageService.getUser();
    if (savedUser) {
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((name: string, email: string) => {
    const newUser: UserAccount = {
      id: 'user_' + Math.random().toString(36).substring(2, 9),
      name: name.trim() || 'Developer',
      email: email.trim().toLowerCase(),
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(email || name)}`,
      createdAt: Date.now(),
    };
    StorageService.setUser(newUser);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    StorageService.setUser(null);
    setUser(null);
  }, []);

  return {
    user,
    isLoggedIn: !!user,
    isLoading,
    login,
    logout,
  };
}

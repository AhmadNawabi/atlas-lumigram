import React, { createContext, useState, useEffect, useContext } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { authService } from '../services/auth.service';
import { profileService } from '../services/profile.service';
import { UserProfile } from '../types';
import { showMessage } from 'react-native-flash-message';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username?: string) => Promise<void>; // Updated signature
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        setUser(user);
        if (user) {
          try {
            const profile = await profileService.getUserProfile(user.uid);
            setUserProfile(profile);
          } catch (err) {
            console.error('Error loading profile:', err);
          }
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const refreshProfile = async () => {
    if (user) {
      try {
        const profile = await profileService.getUserProfile(user.uid);
        setUserProfile(profile);
      } catch (error) {
        console.error('Error refreshing profile:', error);
      }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      await authService.login(email, password);
      showMessage({
        message: 'Welcome back!',
        description: 'Successfully logged in',
        type: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      showMessage({
        message: 'Login Failed',
        description: error.message,
        type: 'danger',
        duration: 4000,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Updated register function to accept optional username
  const register = async (email: string, password: string, username?: string) => {
    try {
      setLoading(true);
      await authService.register(email, password, username);
      showMessage({
        message: 'Welcome to Lumigram!',
        description: 'Your account has been created',
        type: 'success',
        duration: 4000,
      });
    } catch (error: any) {
      showMessage({
        message: 'Registration Failed',
        description: error.message,
        type: 'danger',
        duration: 4000,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      showMessage({
        message: 'Goodbye!',
        description: 'You have been logged out',
        type: 'info',
        duration: 3000,
      });
    } catch (error: any) {
      showMessage({
        message: 'Logout Failed',
        description: error.message,
        type: 'danger',
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    error,
    login,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { showMessage } from 'react-native-flash-message';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  // Wrap the context functions with messages
  const login = async (email: string, password: string) => {
    try {
      await context.login(email, password);
      showMessage({
        message: 'Success!',
        description: 'Logged in successfully',
        type: 'success',
      });
    } catch (error: any) {
      showMessage({
        message: 'Error',
        description: error.message,
        type: 'danger',
      });
      throw error;
    }
  };

  const register = async (email: string, password: string, username?: string) => {
    try {
      await context.register(email, password, username);
      showMessage({
        message: 'Success!',
        description: 'Account created successfully',
        type: 'success',
      });
    } catch (error: any) {
      showMessage({
        message: 'Error',
        description: error.message,
        type: 'danger',
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await context.logout();
      showMessage({
        message: 'Success!',
        description: 'Logged out successfully',
        type: 'success',
      });
    } catch (error: any) {
      showMessage({
        message: 'Error',
        description: error.message,
        type: 'danger',
      });
    }
  };

  return {
    user: context.user,
    userProfile: context.userProfile,
    loading: context.loading,
    error: context.error,
    login,
    register,
    logout,
    refreshProfile: context.refreshProfile,
  };
};

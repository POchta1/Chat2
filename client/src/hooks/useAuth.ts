import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

export interface User {
  id: number;
  username: string;
  avatar: string | null;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setAuthState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await apiRequest('POST', '/api/auth/login', {
        username,
        password,
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuthState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true,
        });
        // Принудительно обновляем состояние приложения
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
        return { success: true, message: data.message };
      } else {
        const errorData = await response.json();
        return { success: false, message: errorData.message };
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  const register = async (username: string, password: string, confirmPassword: string, secretKey: string) => {
    try {
      const response = await apiRequest('POST', '/api/auth/register', {
        username,
        password,
        confirmPassword,
        secretKey,
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuthState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true,
        });
        // Принудительно обновляем состояние приложения
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
        return { success: true, message: data.message };
      } else {
        const errorData = await response.json();
        return { success: false, message: errorData.message };
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout', {});
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (data: { username?: string; password?: string; avatar?: string }) => {
    try {
      const response = await apiRequest('PUT', '/api/users/profile', data);
      
      if (response.ok) {
        const result = await response.json();
        setAuthState(prev => ({
          ...prev,
          user: result.user,
        }));
        return { success: true, message: result.message };
      } else {
        const errorData = await response.json();
        return { success: false, message: errorData.message };
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  return {
    ...authState,
    login,
    register,
    logout,
    updateProfile,
  };
}

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginData, RegisterData } from '@/types';
import apiClient from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Calculate isAuthenticated based on state, not by calling apiClient.getToken() every render
  const isAuthenticated = !!user && !!token;

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentToken = apiClient.getToken();
        
        // Set token state to sync with API client
        setToken(currentToken);
        
        if (currentToken) {
          const response = await apiClient.verifyToken();
          
          if (response.success && response.data?.user) {
            setUser(response.data.user);
          } else {
            // Token is invalid, clear it
            apiClient.clearToken();
            setToken(null);
          }
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        apiClient.clearToken();
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (data: LoginData): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const response = await apiClient.login(data);
      
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        
        // Sync token state with API client
        const currentToken = apiClient.getToken();
        setToken(currentToken);
        
        return { success: true };
      } else {
        const errorMessage = response.error?.message || 'Invalid email or password. Please check your credentials and try again.';
        return { success: false, error: errorMessage };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'An error occurred during login. Please try again.';
      
      // Handle specific error types
      if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please wait a moment and try again.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const response = await apiClient.register(data);
      
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        // Sync token state with API client
        const currentToken = apiClient.getToken();
        setToken(currentToken);
        return { success: true };
      } else {
        const errorMessage = response.error?.message || 'Registration failed. Please check your information and try again.';
        console.error('Registration failed:', errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = 'An error occurred during registration. Please try again.';
      
      // Handle specific error types
      if (error.response?.status === 409) {
        errorMessage = 'An account with this email already exists. Please try logging in instead.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Please check your information and try again. Make sure all required fields are filled correctly.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many registration attempts. Please wait a moment and try again.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      apiClient.clearToken();
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await apiClient.getUserProfile();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiUser, api } from '../services/api';

interface AuthContextType {
  user: ApiUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<ApiUser | null>;
  register: (data: { name: string; email: string; password: string; mobile?: string; country?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<ApiUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => null,
  register: async () => {},
  logout: async () => {},
  updateUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('globalvista_mobile_token');
      const storedUser = await AsyncStorage.getItem('globalvista_mobile_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.warn('Error reading auth from storage', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, pass: string): Promise<ApiUser | null> => {
    const res = await api.login(email, pass);
    if (!res.token) {
      throw new Error('Authentication token missing from response');
    }
    setToken(res.token);
    setUser(res.user);
    await AsyncStorage.setItem('globalvista_mobile_token', res.token);
    if (res.user) {
      await AsyncStorage.setItem('globalvista_mobile_user', JSON.stringify(res.user));
    }
    return res.user;
  };

  const register = async (data: { name: string; email: string; password: string; mobile?: string; country?: string }) => {
    const res = await api.register(data);
    if (res.token) {
      setToken(res.token);
      setUser(res.user);
      await AsyncStorage.setItem('globalvista_mobile_token', res.token);
      if (res.user) {
        await AsyncStorage.setItem('globalvista_mobile_user', JSON.stringify(res.user));
      }
    } else {
      await login(data.email, data.password);
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem('globalvista_mobile_token');
    await AsyncStorage.removeItem('globalvista_mobile_user');
  };

  const updateUser = async (updated: Partial<ApiUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const merged = { ...prev, ...updated };
      AsyncStorage.setItem('globalvista_mobile_user', JSON.stringify(merged)).catch(() => {});
      return merged;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

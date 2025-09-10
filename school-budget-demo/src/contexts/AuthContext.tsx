import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import apiService from '../services/api';

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
  const [token, setToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('accessToken');
      if (storedToken) {
        try {
          const response = await apiService.getCurrentUser();
          if (response.success && response.data) {
            const mockUser: User = {
              id: 1,
              email: response.data.email,
              firstName: 'John',
              lastName: 'Doe',
              roles: response.data.email.includes('admin') ? ['ADMIN'] : 
                     response.data.email.includes('head') ? ['DEPARTMENT_HEAD'] : 
                     response.data.email.includes('teacher') ? ['TEACHER'] : ['USER'],
              isActive: true,
              emailVerified: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            setUser(mockUser);
            setToken(storedToken);
          } else {
            // Invalid token, clear storage
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setToken(null);
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.login({ email, password });
      
      if (response.success && response.data) {
        const { accessToken, refreshToken, user: userData } = response.data;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        setToken(accessToken);
        setUser(userData);
        
        return true;
      } else {
        console.error('Login failed:', response.error);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setToken(null);
      setUser(null);
    }
  };

  const isAuthenticated = !!token && !!user;

  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) || false;
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated,
    hasRole,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useTenant } from './TenantContext';

export interface UserSession {
  id: number;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'teacher' | 'student' | 'parent';
  profilePhoto?: string;
  phone?: string;
}

interface AuthContextProps {
  user: UserSession | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { tenantSlug, setTenantSlug } = useTenant();

  // Load session from stored tokens or run initial token refresh
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('access_token');
        if (storedToken) {
          setAccessToken(storedToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // Verify with /api/auth/me
          const response = await axios.get('/api/auth/me', {
            headers: tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}
          });
          setUser(response.data.user);
          if (response.data.tenant) {
            setTenantSlug(response.data.tenant.slug);
          }
        }
      } catch (err) {
        // Token might have expired, try refresh
        try {
          const refreshResponse = await axios.post('/api/auth/refresh');
          const { accessToken: token } = refreshResponse.data;
          setAccessToken(token);
          localStorage.setItem('access_token', token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          const meResponse = await axios.get('/api/auth/me');
          setUser(meResponse.data.user);
        } catch (refreshErr) {
          // Both failed - user is not authenticated
          logout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [tenantSlug]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/auth/login', 
        { email, password },
        { headers: tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {} }
      );

      const { accessToken: token, user: userRecord, tenant } = response.data;
      setAccessToken(token);
      setUser(userRecord);
      localStorage.setItem('access_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      if (tenant) {
        setTenantSlug(tenant.slug);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await axios.post('/api/auth/logout');
    } catch (err) {
      // Ignore errors on logout request
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('access_token');
      delete axios.defaults.headers.common['Authorization'];
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export interface TenantInfo {
  id: number;
  name: string;
  slug: string;
  primaryColor: string;
  logoUrl?: string;
  plan: 'basic' | 'pro' | 'enterprise';
}

interface TenantContextProps {
  tenantSlug: string | null;
  tenantInfo: TenantInfo | null;
  setTenantSlug: (slug: string) => void;
  isLoading: boolean;
  clearTenant: () => void;
}

const TenantContext = createContext<TenantContextProps | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenantSlug, setTenantSlugState] = useState<string | null>(null);
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Extract slug from URL or LocalStorage fallback
  const getSubdomain = (): string | null => {
    const hostname = window.location.hostname;
    // e.g. school-a.edtech.example.com -> school-a
    if (hostname && !hostname.includes('localhost') && !/^[0-9.]+$/.test(hostname)) {
      const parts = hostname.split('.');
      if (parts.length > 2) {
        return parts[0];
      }
    }
    // Dev fallback
    return localStorage.getItem('tenant_slug');
  };

  const setTenantSlug = (slug: string) => {
    localStorage.setItem('tenant_slug', slug);
    setTenantSlugState(slug);
  };

  const clearTenant = () => {
    localStorage.removeItem('tenant_slug');
    setTenantSlugState(null);
    setTenantInfo(null);
  };

  useEffect(() => {
    const resolvedSlug = getSubdomain();
    if (resolvedSlug) {
      setTenantSlugState(resolvedSlug);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Fetch tenant configuration when tenantSlug changes
  useEffect(() => {
    if (!tenantSlug) {
      setIsLoading(false);
      return;
    }

    const fetchTenantDetails = async () => {
      setIsLoading(true);
      try {
        // Resolve settings using the custom request header
        const response = await axios.get('/api/auth/me', {
          headers: { 'X-Tenant-Slug': tenantSlug }
        });
        if (response.data.tenant) {
          setTenantInfo(response.data.tenant);
        }
      } catch (err) {
        // If login hasn't occurred yet, we query standard settings or mock
        // Since /api/auth/me is protected, we can mock or construct default parameters
        // to render login page styled with Springfield Academy or Greenwood Institute.
        if (tenantSlug === 'school-a') {
          setTenantInfo({
            id: 1,
            slug: 'school-a',
            name: 'Springfield Academy',
            primaryColor: '#3B82F6',
            logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=100',
            plan: 'pro'
          });
        } else if (tenantSlug === 'school-b') {
          setTenantInfo({
            id: 2,
            slug: 'school-b',
            name: 'Greenwood Institute',
            primaryColor: '#10B981',
            logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=100',
            plan: 'enterprise'
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantDetails();
  }, [tenantSlug]);

  // Apply custom CSS Variable branding
  useEffect(() => {
    if (tenantInfo) {
      const root = document.documentElement;
      root.style.setProperty('--primary-color', tenantInfo.primaryColor);
      
      // Calculate light color (adding transparency or using hsl representation)
      // For simplicity, we just use a generic light variant or append alpha channel
      root.style.setProperty('--primary-light', `${tenantInfo.primaryColor}15`);
      root.style.setProperty('--primary-hover', `${tenantInfo.primaryColor}cc`);
    }
  }, [tenantInfo]);

  return (
    <TenantContext.Provider value={{ tenantSlug, tenantInfo, setTenantSlug, isLoading, clearTenant }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

import { Request, Response, NextFunction } from 'express';
import { Tenant } from '../models';

export const resolveTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Check if tenant is already resolved (e.g. from JWT auth middleware)
    if (req.tenantId) {
      return next();
    }

    // 2. Identify tenant slug from domain or header
    // Subdomain resolution: e.g., school-a.edtech.example.com -> school-a
    let slug: string | undefined;
    const hostname = req.hostname;
    
    // Simple subdomain extraction (excludes 'localhost' or raw IPs)
    if (hostname && !hostname.includes('localhost') && !/^[0-9.]+$/.test(hostname)) {
      const parts = hostname.split('.');
      if (parts.length > 2) {
        slug = parts[0];
      }
    }

    // Fallback/Override: check custom headers (useful for API testing/development)
    if (!slug && req.headers['x-tenant-slug']) {
      slug = req.headers['x-tenant-slug'] as string;
    }

    // If no slug is resolved and this is not a public or superadmin route, error
    // For now, if we can't resolve, we'll check if it's a path that does not require tenant resolving
    const publicPaths = ['/health', '/ready', '/api/auth/login', '/api/auth/refresh', '/api/tenants'];
    const isPublic = publicPaths.some(p => req.path.startsWith(p));

    if (!slug) {
      if (isPublic) {
        return next();
      }
      return res.status(400).json({ message: 'X-Tenant-Slug header or tenant subdomain is required' });
    }

    // Resolve tenant from database
    const tenant = await Tenant.findOne({ where: { slug } });
    if (!tenant) {
      return res.status(404).json({ message: `School tenant '${slug}' not found` });
    }

    req.tenantId = tenant.id;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Error resolving tenant context', error: String(error) });
  }
};

// Helper middleware to verify that DB operations are tenant isolated
// In controllers, we will use query options containing: { where: { tenantId: req.tenantId } }
export const enforceTenantScope = (modelQuery: any, req: Request) => {
  if (!req.tenantId) {
    throw new Error('Tenant context is not initialized on this request');
  }
  return {
    ...modelQuery,
    where: {
      ...(modelQuery.where || {}),
      tenantId: req.tenantId
    }
  };
};

import { Request, Response, NextFunction } from 'express';

export const authorizeRoles = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized - User not authenticated' });
    }

    const { role } = req.user;

    // Superadmin has absolute access to all endpoints
    if (role === 'superadmin') {
      return next();
    }

    if (allowedRoles.includes(role)) {
      return next();
    }

    return res.status(403).json({ message: 'Forbidden - Insufficient permissions' });
  };
};

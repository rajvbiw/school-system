import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.utils';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      tenantId?: number;
    }
  }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    
    // Auto-inject tenantId from JWT to enforce isolation
    req.tenantId = decoded.tenantId;

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token is invalid or expired' });
  }
};

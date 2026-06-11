import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User, Tenant } from '../models';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, TokenPayload } from '../utils/jwt.utils';
import { logAudit } from '../utils/audit.utils';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const tenantId = req.tenantId;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Determine query conditions
    // Superadmins can log in without a tenant scope, other roles must match tenantId
    let user;
    if (!tenantId) {
      // Look for superadmin globally
      user = await User.findOne({ where: { email, role: 'superadmin', isActive: true } });
    } else {
      user = await User.findOne({ where: { email, tenantId, isActive: true } });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Resolve tenant details
    let tenant = null;
    if (user.tenantId) {
      tenant = await Tenant.findByPk(user.tenantId);
    }

    const payload: TokenPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save refresh token to HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Audit log
    await logAudit({
      userId: user.id,
      action: 'LOGIN',
      tableName: 'users',
      recordId: user.id,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto,
        phone: user.phone,
      },
      tenant: tenant ? {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        primaryColor: tenant.primaryColor,
        logoUrl: tenant.logoUrl,
        plan: tenant.plan,
      } : null,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: String(error) });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({ message: 'Refresh token missing' });
    }

    const decoded = verifyRefreshToken(token);
    
    // Check if user is active
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User is inactive or deleted' });
    }

    const payload: TokenPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    };

    const accessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ accessToken });
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (userId) {
      await logAudit({
        userId,
        action: 'LOGOUT',
        tableName: 'users',
        recordId: userId,
        ipAddress: req.ip,
      });
    }

    res.clearCookie('refreshToken');
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Logout failed', error: String(error) });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ['passwordHash'] },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let tenant = null;
    if (user.tenantId) {
      tenant = await Tenant.findByPk(user.tenantId);
    }

    return res.status(200).json({ user, tenant });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch user session', error: String(error) });
  }
};

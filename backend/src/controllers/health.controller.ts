import { Request, Response } from 'express';
import { sequelize } from '../models';
import { isRedisConnected } from '../utils/redis.utils';

export const livenessCheck = (req: Request, res: Response) => {
  return res.status(200).json({ status: 'OK', uptime: process.uptime() });
};

export const readinessCheck = async (req: Request, res: Response) => {
  const checks: Record<string, string> = {
    database: 'UP',
    redis: 'UP',
  };

  let isHealthy = true;

  try {
    await sequelize.authenticate();
  } catch (error) {
    checks.database = `DOWN - ${String(error)}`;
    isHealthy = false;
  }

  try {
    const redisOk = await isRedisConnected();
    if (!redisOk) {
      checks.redis = 'DOWN (Falling back to in-memory)';
      // We don't fail readiness for Redis, since we have transparent in-memory fallback
    }
  } catch (error) {
    checks.redis = `DOWN - ${String(error)}`;
  }

  if (isHealthy) {
    return res.status(200).json({ status: 'READY', services: checks });
  } else {
    return res.status(503).json({ status: 'NOT_READY', services: checks });
  }
};

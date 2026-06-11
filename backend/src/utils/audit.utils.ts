import { AuditLog } from '../models';

interface AuditLogOptions {
  userId?: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  tableName: string;
  recordId?: number;
  ipAddress?: string;
}

export const logAudit = async (options: AuditLogOptions): Promise<void> => {
  try {
    await AuditLog.create({
      userId: options.userId,
      action: options.action,
      tableName: options.tableName,
      recordId: options.recordId,
      ipAddress: options.ipAddress || 'unknown',
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

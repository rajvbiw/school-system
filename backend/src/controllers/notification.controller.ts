import { Request, Response } from 'express';
import { Notification, Announcement } from '../models';
import { broadcastTenantAnnouncement } from '../services/notification.service';
import { logAudit } from '../utils/audit.utils';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'User session not found' });
    }

    const list = await Notification.findAll({
      where: { tenantId, userId },
      order: [['id', 'DESC']]
    });

    return res.status(200).json(list);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve notifications', error: String(error) });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'User session not found' });
    }

    const notification = await Notification.findOne({
      where: { id, tenantId, userId }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.update({ isRead: true });

    return res.status(200).json(notification);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to mark notification', error: String(error) });
  }
};

export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.user?.userId;
    const { title, content, targetRole, classId } = req.body;

    if (!title || !content || !targetRole) {
      return res.status(400).json({ message: 'title, content, and targetRole are required' });
    }

    // Save Announcement record
    const announcement = await Announcement.create({
      tenantId,
      title,
      content,
      targetRole,
      classId: classId ? parseInt(classId) : undefined,
      createdBy: userId || 1
    });

    // Broadcast notifications and sockets
    await broadcastTenantAnnouncement(tenantId, title, content, targetRole);

    await logAudit({
      userId,
      action: 'CREATE',
      tableName: 'announcements',
      recordId: announcement.id,
      ipAddress: req.ip,
    });

    return res.status(201).json(announcement);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to broadcast announcement', error: String(error) });
  }
};

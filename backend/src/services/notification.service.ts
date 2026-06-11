import { Notification, Student, User } from '../models';
import { emitToUser, emitToTenant } from './socket.service';

interface CreateNotificationDto {
  tenantId: number;
  userId: number;
  title: string;
  message: string;
  type: string; // e.g. 'attendance' | 'fee' | 'announcement' | 'message'
}

export const createNotification = async (dto: CreateNotificationDto): Promise<Notification> => {
  const notification = await Notification.create({
    tenantId: dto.tenantId,
    userId: dto.userId,
    title: dto.title,
    message: dto.message,
    type: dto.type,
    isRead: false,
  });

  // Emit real-time notification
  emitToUser(dto.userId, 'new_notification', {
    id: notification.id,
    title: dto.title,
    message: dto.message,
    type: dto.type,
    createdAt: notification.createdAt,
  });

  return notification;
};

export const createBulkClassNotification = async (
  tenantId: number,
  classId: number,
  title: string,
  message: string,
  type: string
): Promise<void> => {
  // Find all students in class
  const students = await Student.findAll({ where: { tenantId, classId } });
  const userIds = students.map(s => s.userId);

  // Find class teacher if any
  // We can fetch the class teacher, but class notifications are mainly directed to students
  const notificationPromises = userIds.map(userId =>
    createNotification({
      tenantId,
      userId,
      title,
      message,
      type,
    })
  );

  await Promise.all(notificationPromises);
};

export const broadcastTenantAnnouncement = async (
  tenantId: number,
  title: string,
  message: string,
  targetRole: string
): Promise<void> => {
  // Broadly notify via Sockets in the tenant room
  emitToTenant(tenantId, 'announcement', { title, message, targetRole });

  // Resolve users of the target role
  const whereClause: any = { tenantId, isActive: true };
  if (targetRole !== 'all') {
    whereClause.role = targetRole;
  }

  const targetUsers = await User.findAll({ where: whereClause });
  const notificationPromises = targetUsers.map(user =>
    createNotification({
      tenantId,
      userId: user.id,
      title,
      message,
      type: 'announcement',
    })
  );

  await Promise.all(notificationPromises);
};

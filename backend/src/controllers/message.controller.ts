import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Message, User } from '../models';
import { emitToUser } from '../services/socket.service';

export const getMessages = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const senderId = req.user?.userId;
    const { contactId } = req.params;

    if (!senderId || !contactId) {
      return res.status(400).json({ message: 'User session and contactId are required' });
    }

    const chats = await Message.findAll({
      where: {
        tenantId,
        [Op.or]: [
          { senderId, receiverId: parseInt(contactId) },
          { senderId: parseInt(contactId), receiverId: senderId }
        ]
      },
      order: [['createdAt', 'ASC']]
    });

    return res.status(200).json(chats);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve messages', error: String(error) });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const senderId = req.user?.userId;
    const { receiverId, content } = req.body;

    if (!senderId || !receiverId || !content) {
      return res.status(400).json({ message: 'Missing message parameters' });
    }

    const message = await Message.create({
      tenantId,
      senderId,
      receiverId: parseInt(receiverId),
      content,
      isRead: false
    });

    // Resolve sender details to send socket preview
    const sender = await User.findByPk(senderId, { attributes: ['name'] });

    // Emit real-time notification
    emitToUser(receiverId, 'new_message', {
      senderName: sender?.name || 'Someone',
      preview: content.length > 30 ? content.substring(0, 30) + '...' : content,
      message
    });

    return res.status(201).json(message);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to send message', error: String(error) });
  }
};

export const getContacts = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const senderId = req.user?.userId;
    const senderRole = req.user?.role;

    if (!senderId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Filter contacts based on user role
    // Teachers chat with Admin and Students, Students/Parents chat with Admin and Teachers
    let contacts = [];
    if (senderRole === 'teacher') {
      contacts = await User.findAll({
        where: {
          tenantId,
          role: { [Op.in]: ['admin', 'student'] },
          isActive: true
        },
        attributes: ['id', 'name', 'email', 'role', 'profilePhoto']
      });
    } else {
      contacts = await User.findAll({
        where: {
          tenantId,
          role: { [Op.in]: ['admin', 'teacher'] },
          isActive: true
        },
        attributes: ['id', 'name', 'email', 'role', 'profilePhoto']
      });
    }

    return res.status(200).json(contacts);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch contacts', error: String(error) });
  }
};

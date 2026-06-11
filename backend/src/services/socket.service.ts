import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

let io: Server | null = null;

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_access_key_32_characters_minimum';

interface SocketUser {
  userId: number;
  tenantId: number;
  role: string;
}

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication Middleware for Socket.io
  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication error - Token missing'));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as SocketUser;
      socket.data.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error - Invalid Token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as SocketUser;
    
    // Join tenant room
    const tenantRoom = `tenant_${user.tenantId}`;
    socket.join(tenantRoom);

    // Join user-specific room
    const userRoom = `user_${user.userId}`;
    socket.join(userRoom);

    // Join class room if client provides it (e.g. for student/teacher chat or board)
    socket.on('join_class', (classId: number) => {
      const classRoom = `class_${classId}`;
      socket.join(classRoom);
    });

    socket.on('leave_class', (classId: number) => {
      const classRoom = `class_${classId}`;
      socket.leave(classRoom);
    });

    socket.on('disconnect', () => {
      // Clean up rooms automatically done by Socket.io
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
};

// Event Emitting Helpers

export const emitToTenant = (tenantId: number, event: string, data: any) => {
  if (io) {
    io.to(`tenant_${tenantId}`).emit(event, data);
  }
};

export const emitToClass = (classId: number, event: string, data: any) => {
  if (io) {
    io.to(`class_${classId}`).emit(event, data);
  }
};

export const emitToUser = (userId: number, event: string, data: any) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

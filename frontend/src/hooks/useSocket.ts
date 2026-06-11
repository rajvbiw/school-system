import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import useAuth from './useAuth';

export const useSocket = (onEventReceived?: (event: string, data: any) => void) => {
  const { accessToken } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Connect to local dev server (proxied or absolute address)
    const socket = io('/', {
      auth: {
        token: accessToken
      },
      transports: ['websocket']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket.io connected successfully');
    });

    const events = ['attendance_marked', 'new_notification', 'new_message', 'fee_reminder', 'announcement'];
    
    if (onEventReceived) {
      events.forEach(event => {
        socket.on(event, (data) => {
          onEventReceived(event, data);
        });
      });
    }

    return () => {
      socket.disconnect();
    };
  }, [accessToken, onEventReceived]);

  return socketRef.current;
};

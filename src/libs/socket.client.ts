import { io } from 'socket.io-client';

// Connect directly to your NestJS backend socket namespace
export const socket = io('https://ingeri-api.onrender.com/ws', {
  withCredentials: true,
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log('⚡ Connected to real-time socket server:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected from Socket.io server:', reason);
});
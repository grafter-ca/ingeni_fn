import { io } from 'socket.io-client';

const LOCAL_BASE = "http://localhost:8000";


// Connect directly to your NestJS backend socket namespace
export const socket = io(LOCAL_BASE + '/ws', {
  withCredentials: true,
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log('⚡ Connected to real-time socket server:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected from Socket.io server:', reason);
});
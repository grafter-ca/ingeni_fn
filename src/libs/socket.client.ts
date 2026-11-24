import { io } from 'socket.io-client';

const RAW_API_URL = (import.meta.env.VITE_API_URL || '').trim();
const RAW_SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || '').trim();

const resolveSocketOrigin = (rawUrl: string, rawSocketUrl: string): string => {
  const isDeployedSite =
    Boolean(import.meta.env.PROD) ||
    (typeof window !== 'undefined' &&
      window.location.hostname === 'ingeni.onrender.com');

  if (isDeployedSite && typeof window !== 'undefined') {
    return window.location.origin;
  }

  const preferred = rawSocketUrl || rawUrl;
  if (!preferred) {
    return 'https://ingeri-api.onrender.com';
  }

  return preferred
    .replace(/\/+$/, '')
    .replace(/\/api$/, '')
    .replace(/\/ws$/, '');
};

const SOCKET_ORIGIN = resolveSocketOrigin(RAW_API_URL, RAW_SOCKET_URL);

// Connect to your NestJS backend socket namespace (/ws)
export const socket = io(`${SOCKET_ORIGIN}/ws`, {
  withCredentials: true,
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log('⚡ Connected to real-time socket server:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected from Socket.io server:', reason);
});

socket.on('connect_error', (err) => {
  console.error('⚠️ Socket.io connection error:', err.message);
});
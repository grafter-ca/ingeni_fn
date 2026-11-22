// Example frontend api.ts configuration
import axios from 'axios';

const RAW_VITE_API_URL = (import.meta.env.VITE_API_URL || '')
  .trim()
  .replace(/\/+$/, '');

const resolveApiBase = (rawUrl: string): string => {
  const isDeployedSite =
    import.meta.env.PROD ||
    (typeof window !== 'undefined' &&
      window.location.hostname === 'ingeni.onrender.com');

  if (isDeployedSite) {
    return '/api';
  }

  if (!rawUrl) {
    return 'https://ingeri-api.onrender.com/api';
  }

  return rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;
};

export const api = axios.create({
  baseURL: resolveApiBase(RAW_VITE_API_URL),
  withCredentials: true,
});
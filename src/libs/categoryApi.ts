import axios from 'axios';

const RAW_VITE_API_URL = (import.meta.env.VITE_API_URL || '')
  .trim()
  .replace(/\/+$/, '');

const resolveApiBase = (rawUrl: string): string => {
  if (!rawUrl) {
    return 'https://ingeri-api.onrender.com/api';
  }
  return rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;
};

const api = axios.create({
  baseURL: resolveApiBase(RAW_VITE_API_URL),
  withCredentials: true,
});

// Prevent /api/api/... if a call path already starts with /api/
api.interceptors.request.use((config) => {
  if (
    typeof config.url === 'string' &&
    api.defaults.baseURL?.endsWith('/api') &&
    config.url.startsWith('/api/')
  ) {
    config.url = config.url.slice(4);
  }
  return config;
});

export interface Category {
  id: string;
  name: string;
  image: string;
  slug?: string;
}

export const categoryApi = {
  findAll: () => api.get<Category[]>('/categories').then((res) => res.data),

  findOne: (id: string) =>
    api.get<Category>(`/categories/${id}`).then((res) => res.data),

  create: (formData: FormData) =>
    api
      .post<Category>('/categories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data),

  update: (id: string, formData: FormData) =>
    api
      .patch<Category>(`/categories/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data),

  delete: (id: string) =>
    api.delete(`/categories/${id}`).then((res) => res.data),
};
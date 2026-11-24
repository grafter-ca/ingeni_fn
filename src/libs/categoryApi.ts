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

export interface CategorySummary {
  id: string;
  name: string;
  slug?: string | null;
  image?: string;
}

export interface Category {
  id: string;
  name: string;
  slug?: string | null;
  image: string;
  parentId?: string | null;
  parent?: CategorySummary | null;
  children?: CategorySummary[];
  _count?: {
    products: number;
  };
}

export interface CreateCategoryInput {
  name: string;
  slug?: string | null;
  parentId?: string | null;
  image: File | string;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string | null;
  parentId?: string | null;
  image?: File | string;
}

function toCategoryFormData(
  input: FormData | CreateCategoryInput | UpdateCategoryInput,
): FormData {
  if (input instanceof FormData) {
    return input;
  }

  const formData = new FormData();
  if (input.name !== undefined) {
    formData.append('name', input.name);
  }
  if (input.slug !== undefined) {
    formData.append('slug', input.slug ?? '');
  }
  if (input.parentId !== undefined) {
    formData.append('parentId', input.parentId ?? '');
  }
  if (input.image !== undefined) {
    if (input.image instanceof File) {
      formData.append('image', input.image);
    } else {
      formData.append('image', input.image);
    }
  }

  return formData;
}

export const categoryApi = {
  findAll: () => api.get<Category[]>('/categories').then((res) => res.data),

  findOne: (id: string) =>
    api.get<Category>(`/categories/${id}`).then((res) => res.data),

  create: (payload: FormData | CreateCategoryInput) =>
    api
      .post<Category>('/categories', toCategoryFormData(payload), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data),

  update: (id: string, payload: FormData | UpdateCategoryInput) =>
    api
      .patch<Category>(`/categories/${id}`, toCategoryFormData(payload), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data),

  delete: (id: string) =>
    api.delete(`/categories/${id}`).then((res) => res.data),
};
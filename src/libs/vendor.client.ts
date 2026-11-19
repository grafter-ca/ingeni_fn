// src/api/client.ts
import axios from "axios";

const RAW_VITE_API_URL = (import.meta.env.VITE_API_URL || "")
  .trim()
  .replace(/\/+$/, "");

const resolveApiBase = (rawUrl: string): string => {
  if (!rawUrl) {
    return "http://localhost:8000/api";
  }
  return rawUrl.endsWith("/api") ? rawUrl : `${rawUrl}/api`;
};

const API_BASE_URL = resolveApiBase(RAW_VITE_API_URL);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  // Avoid /api/api/... when callers pass paths starting with /api/
  if (
    typeof config.url === "string" &&
    apiClient.defaults.baseURL?.endsWith("/api") &&
    config.url.startsWith("/api/")
  ) {
    config.url = config.url.slice(4);
  }

  // Let Axios/browser set multipart boundary automatically when sending FormData
  if (config.data instanceof FormData && config.headers) {
    delete config.headers["Content-Type"];
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Global 401/403 handling hook if needed
    return Promise.reject(error);
  }
);
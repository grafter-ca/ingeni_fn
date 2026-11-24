// src/api/vendor.client.ts
import axios from "axios";

const RAW_VITE_API_URL = (import.meta.env.VITE_API_URL || "")
  .trim()
  .replace(/\/+$/, "");

const resolveApiBase = (rawUrl: string): string => {
  const isDeployedSite =
    Boolean(import.meta.env.PROD) ||
    (typeof window !== "undefined" &&
      window.location.hostname === "ingeni.onrender.com");

  // In production on ingeni.onrender.com, always use same-origin /api
  // so Render's /api/* rewrite proxies requests with first-party cookies
  if (isDeployedSite) {
    return "/api";
  }

  if (!rawUrl) {
    return "https://ingeri-api.onrender.com/api";
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
  (response) => {
    // Catch cases where dev server fallback returns index.html instead of API JSON
    if (
      typeof response.data === "string" &&
      response.data.trim().toLowerCase().startsWith("<!doctype")
    ) {
      return Promise.reject(
        new Error(
          `Expected JSON from ${response.config?.url || "API"}, received HTML instead. Check VITE_API_URL or backend server port.`
        )
      );
    }
    return response;
  },
  (error) => {
    // Global 401/403 handling hook if needed
    return Promise.reject(error);
  }
);
// src/libs/api-base.ts

const DEFAULT_API_ORIGIN = "https://ingeri-api.onrender.com";

export const isDeployedFrontendOrigin = (): boolean => {
  if (import.meta.env.PROD) {
    return true;
  }

  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    return hostname === "ingeni.onrender.com" || hostname.endsWith(".onrender.com");
  }

  return false;
};

/**
 * Resolves the base origin (without a trailing `/api`) for auth and API calls.
 * On deployed builds, uses `window.location.origin` so Render's `/api/*` rewrite
 * keeps requests same-origin with session cookies intact.
 */
export const resolveApiOrigin = (rawEnvUrl?: string): string => {
  if (isDeployedFrontendOrigin() && typeof window !== "undefined") {
    return window.location.origin.replace(/\/+$/, "");
  }

  const cleanedEnv = (rawEnvUrl ?? import.meta.env.VITE_API_URL ?? "")
    .trim()
    .replace(/\/+$/, "");

  if (cleanedEnv) {
    return cleanedEnv.replace(/\/api$/, "");
  }

  if (typeof window !== "undefined") {
    const { hostname, port } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return port === "5173" || port === "3000"
        ? "http://localhost:8000"
        : window.location.origin.replace(/\/+$/, "");
    }
  }

  return DEFAULT_API_ORIGIN;
};

/**
 * Resolves the `/api` base URL (e.g. `https://ingeni.onrender.com/api` in prod
 * or `http://localhost:8000/api` locally).
 */
export const resolveApiBaseUrl = (rawEnvUrl?: string): string => {
  return `${resolveApiOrigin(rawEnvUrl)}/api`;
};
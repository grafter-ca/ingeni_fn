// src/services/auth.service.ts
import { authClient } from "../libs/auth-client";
import type { LoginPayload, RegisterPayloadProps } from "../types/api";

const resolveFrontendUrl = (): string => {
  const envUrl =
    import.meta.env.VITE_FRONTEND_URL ||
    import.meta.env.VITE_APP_URL;

  if (envUrl && String(envUrl).trim()) {
    return String(envUrl).trim().replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  return "http://localhost:5173";
};

export const authService = {
  // --- 1. CORE ---
  signUp: async (data: RegisterPayloadProps) => {
    return await authClient.signUp.email({
      email: data.email,
      password: data.password,
      name: data.name,
      phone: data.phone,
      country: data.country,
      image:
        data.image ??
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name}`,
    } as any);
  },

  signIn: async (data: LoginPayload, captchaToken?: string) => {
    return await authClient.signIn.email({
      email: data.email,
      password: data.password,
      fetchOptions: {
        headers: captchaToken ? { "x-captcha-response": captchaToken } : {},
      },
    });
  },

  signOut: async () => {
    return await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/login";
        },
      },
    });
  },

  // --- 2. MANAGEMENT ---
  updateUser: async (data: {
    name?: string;
    image?: string;
    phone?: string;
    country?: string;
  }) => await authClient.updateUser(data),

  listSessions: async () => await authClient.multiSession.listDeviceSessions(),

  // --- 3. ORGANIZATION / VENDOR ---
  createOrganization: async (name: string, slug: string) =>
    await authClient.organization.create({ name, slug }),

  setActiveOrg: async (organizationId: string) =>
    await authClient.organization.setActive({ organizationId }),

  // --- 4. ADMIN ---
  adminListUsers: async (query?: {
    searchValue?: string | undefined;
    searchField?: "email" | "name" | undefined;
    searchOperator?: "contains" | "starts_with" | "ends_with" | undefined;
    limit?: string | number | undefined;
    offset?: string | number | undefined;
    sortBy?: string | undefined;
    sortDirection?: "asc" | "desc" | undefined;
    filterField?: string | undefined;
    filterValue?: string | number | boolean | string[] | number[] | undefined;
    filterOperator?:
      | "in"
      | "contains"
      | "starts_with"
      | "ends_with"
      | "eq"
      | "ne"
      | "gt"
      | "gte"
      | "lt"
      | "lte"
      | "not_in"
      | undefined;
  }) =>
    await authClient.admin.listUsers({
      query: query || { limit: 10, offset: 0 },
    }),

 // --- 1B. PASSWORD RECOVERY ---
  requestPasswordReset: async (email: string, redirectTo?: string) => {
    const frontendBase = resolveFrontendUrl();
    const targetUrl =
      redirectTo || `${frontendBase}/reset-password`;

    return await authClient.requestPasswordReset({
      email: email.trim().toLowerCase(),
      redirectTo: targetUrl,
    });
  },

  resetPassword: async (newPassword: string, token: string) => {
    return await authClient.resetPassword({
      newPassword,
      token,
    });
  },

  adminSetRole: async (userId: string, role: string) =>
    await authClient.admin.setRole({ userId, role: role as "user" | "admin" }),

  adminBanUser: async (data: { userId: string; reason?: string }) =>
    await authClient.admin.banUser(data),

  adminUnbanUser: async (data: { userId: string }) =>
    await authClient.admin.unbanUser(data),

  adminRemoveUser: async (data: { userId: string }) =>
    await authClient.admin.removeUser(data),

  useSession: authClient.useSession,
};


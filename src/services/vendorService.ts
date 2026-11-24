// src/services/vendorService.ts
import { apiClient } from "../libs/vendor.client";
import type { ApiOrder, VendorMetrics, ApiVendor } from "../types";
import type { OnboardingRequest, VendorStats } from "../store/vendorStore";

export type VendorMutationPayload = Partial<ApiVendor> & {
  momoCode?: string | null;
};

export interface ApproveVendorRequestPayload {
  userId: string;
  storeName: string;
  description: string;
  address: string;
  phone: string;
  momoCode?: string;
}

export interface PublicVendorDirectoryItem {
  id: string;
  storeName: string;
  phone?: string | null;
  momoCode?: string | null;
  momoAccountName?: string | null;
  address?: string | null;
  isActive?: boolean;
}

const unwrapData = <T>(response: any, fallback?: T): T => {
  if (response && typeof response === "object") {
    if ("data" in response) {
      const inner = response.data;
      if (
        inner &&
        typeof inner === "object" &&
        !Array.isArray(inner) &&
        "data" in inner &&
        inner.data !== undefined
      ) {
        return (inner.data ?? fallback) as T;
      }
      return (inner ?? fallback) as T;
    }
  }
  return (response ?? fallback) as T;
};

const isForbiddenError = (err: any): boolean => {
  const status = err?.response?.status ?? err?.status;
  return status === 403;
};

const normalizeMomoCode = (
  value: string | null | undefined,
): string | null | undefined => {
  if (value === undefined) return undefined;
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const vendorService = {
  // Admin endpoint (@Roles(['admin']) on backend) — returns [] on 403 for non-admins
  getVendors: async (params?: Record<string, any>): Promise<ApiVendor[]> => {
    try {
      const response = await apiClient.get(`/vendors`, { params });
      const data = unwrapData<ApiVendor[]>(response, []);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      if (isForbiddenError(err)) {
        return [];
      }
      throw err;
    }
  },

  // Safe storefront/checkout vendor directory (no admin role required)
  getPublicDirectory: async (
    params?: Record<string, any>,
  ): Promise<PublicVendorDirectoryItem[]> => {
    try {
      const response = await apiClient.get(`/vendors/directory`, { params });
      const data = unwrapData<PublicVendorDirectoryItem[]>(response, []);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      if (isForbiddenError(err)) {
        return [];
      }
      throw err;
    }
  },

  getVendorById: async (id: string): Promise<ApiVendor> => {
    const response = await apiClient.get(`/vendors/${id}`);
    return unwrapData<ApiVendor>(response);
  },

  getVendorMetrics: async (id: string): Promise<VendorMetrics> => {
    const response = await apiClient.get(`/vendors/${id}/metrics`);
    return unwrapData<VendorMetrics>(response);
  },

  getVendorOrders: async (): Promise<ApiOrder[]> => {
    const response = await apiClient
      .get(`/vendors/orders`)
      .catch(() => ({ data: [] }));
    const data = unwrapData<ApiOrder[]>(response, []);
    return Array.isArray(data) ? data : [];
  },

  getStorefrontMetrics: async (): Promise<VendorStats> => {
    const response = await apiClient.get(`/vendors/metrics`).catch(() => ({
      data: { revenue: 0, activeOrders: 0, productCount: 0 },
    }));
    const data = unwrapData<VendorStats>(response, {
      revenue: 0,
      activeOrders: 0,
      productCount: 0,
    });
    return {
      revenue: Number(data?.revenue || 0),
      activeOrders: Number(data?.activeOrders || 0),
      productCount: Number(data?.productCount || 0),
    };
  },

  updateOrderStatus: async (
    orderId: string,
    status: ApiOrder["status"] | string,
  ): Promise<ApiOrder> => {
    const response = await apiClient.patch(`/vendors/orders/${orderId}/status`, {
      status,
    });
    return unwrapData<ApiOrder>(response);
  },

  createVendor: async (payload: VendorMutationPayload): Promise<ApiVendor> => {
    const normalizedPayload: VendorMutationPayload = {
      ...payload,
      momoCode: normalizeMomoCode(payload.momoCode),
    };
    const response = await apiClient.post(`/vendors`, normalizedPayload);
    return unwrapData<ApiVendor>(response);
  },

  updateVendor: async (
    id: string,
    payload: VendorMutationPayload,
  ): Promise<ApiVendor> => {
    const normalizedPayload: VendorMutationPayload = {
      ...payload,
      momoCode: normalizeMomoCode(payload.momoCode),
    };
    const response = await apiClient.patch(`/vendors/${id}`, normalizedPayload);
    return unwrapData<ApiVendor>(response);
  },

  requestOnboarding: async (description: string) => {
    const response = await apiClient.post(`/vendors/request-onboarding`, {
      businessDescription: description,
    });
    return unwrapData<any>(response);
  },

  deleteVendor: async (id: string): Promise<void> => {
    await apiClient.delete(`/vendors/${id}`);
  },

  toggleVendorStatus: async (
    id: string,
    currentStatus: boolean,
  ): Promise<ApiVendor> => {
    const response = await apiClient.patch(`/vendors/${id}/toggle-status`, {
      currentStatus,
    });
    return unwrapData<ApiVendor>(response);
  },

  // --- LIVE ONBOARDING REQUEST ENDPOINTS ---
  getPendingRequests: async (): Promise<OnboardingRequest[]> => {
    const response = await apiClient
      .get(`/vendors/requests`)
      .catch(() => ({ data: [] }));
    const data = unwrapData<OnboardingRequest[]>(response, []);
    return Array.isArray(data) ? data : [];
  },

  approveVendorRequest: async (
    requestData: ApproveVendorRequestPayload,
  ): Promise<ApiVendor> => {
    const normalizedCode = normalizeMomoCode(requestData.momoCode);
    const payload: ApproveVendorRequestPayload = {
      ...requestData,
      momoCode: normalizedCode ?? undefined,
    };
    const response = await apiClient.post(`/vendors/requests/approve`, payload);
    return unwrapData<ApiVendor>(response);
  },

  rejectVendorRequest: async (requestId: string): Promise<void> => {
    await apiClient.delete(`/vendors/requests/${requestId}`);
  },

  // --- VENDOR SETTINGS & ADMIN COMMUNICATION ENDPOINTS ---
  getVendorSettings: async (): Promise<any> => {
    const response = await apiClient.get(`/vendors/settings`);
    return unwrapData<any>(response, {});
  },

  updateVendorSettings: async (payload: any): Promise<any> => {
    const normalizedPayload = {
      ...payload,
      momoCode: normalizeMomoCode(payload?.momoCode),
    };
    const response = await apiClient.patch(
      `/vendors/settings`,
      normalizedPayload,
    );
    return unwrapData<any>(response, normalizedPayload);
  },

  submitCashoutRequest: async (
    vendorId: string,
    payload: { type: string; amount?: string; message: string },
  ): Promise<any> => {
    const response = await apiClient.post(
      `/vendors/${vendorId}/cashout-request`,
      payload,
    );
    return unwrapData<any>(response);
  },

  getFinancials: async (vendorId: string): Promise<any> => {
    const response = await apiClient.get(`/vendors/${vendorId}/financials`);
    const data = unwrapData<any>(response, {});
    return {
      totalRevenue: Number(data?.totalRevenue || 0),
      netBalance: Number(data?.netBalance || 0),
      requests: Array.isArray(data?.requests) ? data.requests : [],
    };
  },

  submitAdminRequest: async (payload: {
    type: string;
    amount?: string;
    message: string;
  }): Promise<any> => {
    const response = await apiClient.post(`/vendors/admin-request`, payload);
    return unwrapData<any>(response);
  },
};
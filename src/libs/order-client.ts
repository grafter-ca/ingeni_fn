import { localApi } from "../libs/api";
import type { Order, CreateOrderDto } from "../types/api";

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const err = error as {
      response?: { data?: { message?: string | string[] }; status?: number };
      data?: { message?: string | string[] };
      message?: string;
    };
    const rawMessage = err.response?.data?.message ?? err.data?.message;
    if (Array.isArray(rawMessage) && rawMessage.length > 0) {
      return rawMessage.join(", ");
    }
    if (typeof rawMessage === "string" && rawMessage.trim().length > 0) {
      return rawMessage;
    }
    if (err.message) {
      return err.message;
    }
  }
  return fallback;
}

function unwrapOrderResponse<T>(raw: any): T {
  if (raw && typeof raw === "object") {
    if ("data" in raw && raw.data && typeof raw.data === "object") {
      return ("order" in raw.data && raw.data.order
        ? raw.data.order
        : raw.data) as T;
    }
    if ("order" in raw && raw.order && typeof raw.order === "object") {
      return raw.order as T;
    }
  }
  return raw as T;
}

export const OrderClient = {
  // --- CREATE ORDER ---
  async create(orderData: CreateOrderDto): Promise<Order> {
    try {
      const res = await localApi.post<Order | { data: Order }>(
        "/orders",
        orderData,
      );
      return unwrapOrderResponse<Order>(res);
    } catch (error) {
      console.error("Order Creation Error:", error);
      throw new Error(
        extractErrorMessage(error, "Could not process your order."),
      );
    }
  },

  // --- USER ORDERS ---
  async getMyOrders(): Promise<Order[]> {
    try {
      const res = await localApi.get<Order[] | { data: Order[] }>(
        "/orders/my-orders",
      );
      const unwrapped = unwrapOrderResponse<Order[]>(res);
      return Array.isArray(unwrapped) ? unwrapped : [];
    } catch (error) {
      console.error("Fetch Orders Error:", error);
      return [];
    }
  },

  async getById(id: string): Promise<Order> {
    try {
      const res = await localApi.get<Order | { data: Order }>(
        `/orders/${encodeURIComponent(id)}`,
      );
      return unwrapOrderResponse<Order>(res);
    } catch (error) {
      console.error("Fetch Order Details Error:", error);
      throw new Error(
        extractErrorMessage(error, "Could not fetch order details."),
      );
    }
  },

  // --- SUBMIT PAYMENT PROOF ---
  async submitPaymentProof(
    orderId: string,
    proofUrl: string,
    transactionReference?: string,
  ): Promise<Order> {
    const cleanProofUrl = (proofUrl || "").trim();
    if (!cleanProofUrl) {
      throw new Error("A valid payment proof URL is required.");
    }

    try {
      const payload: { proofUrl: string; transactionReference?: string } = {
        proofUrl: cleanProofUrl,
      };
      if (transactionReference?.trim()) {
        payload.transactionReference = transactionReference.trim();
      }

      const res = await localApi.post<any>(
        `/orders/${encodeURIComponent(orderId)}/payment-proof`,
        payload,
      );
      return unwrapOrderResponse<Order>(res);
    } catch (error) {
      console.error("Payment Proof Submission Error:", error);
      throw new Error(
        extractErrorMessage(error, "Failed to submit payment proof."),
      );
    }
  },

  // --- VENDOR ORDERS ---
  async getVendorOrders(): Promise<Order[]> {
    try {
      const res = await localApi.get<Order[] | { data: Order[] }>(
        "/orders/vendor/dashboard",
      );
      const unwrapped = unwrapOrderResponse<Order[]>(res);
      return Array.isArray(unwrapped) ? unwrapped : [];
    } catch (error) {
      console.error("Fetch Vendor Orders Error:", error);
      throw new Error(
        extractErrorMessage(error, "Unauthorized: Vendor access only."),
      );
    }
  },

  // --- ADMIN ORDERS ---
  async getAllOrders(status?: string): Promise<Order[]> {
    try {
      const res = await localApi.get<Order[] | { data: Order[] }>(
        "/orders/admin/all",
        status ? { status } : {},
      );
      const unwrapped = unwrapOrderResponse<Order[]>(res);
      return Array.isArray(unwrapped) ? unwrapped : [];
    } catch (error) {
      console.error("Fetch All Orders Error:", error);
      throw new Error(
        extractErrorMessage(error, "Failed to fetch all orders."),
      );
    }
  },

  // --- UPDATE ORDER STATUS ---
  async updateStatus(orderId: string, status: string): Promise<Order> {
    try {
      const payload = { status: status.trim().toUpperCase() };
      const res = await localApi.patch<any>(
        `/orders/${encodeURIComponent(orderId)}/status`,
        payload,
      );
      return unwrapOrderResponse<Order>(res);
    } catch (error) {
      console.error("Status Update Error:", error);
      throw new Error(
        extractErrorMessage(error, "Failed to update order status."),
      );
    }
  },

  // --- UPDATE PAYMENT STATUS ---
  async updatePaymentStatus(
    orderId: string,
    paymentStatus: string,
  ): Promise<Order> {
    try {
      const payload = { paymentStatus: paymentStatus.trim().toUpperCase() };
      const res = await localApi.patch<any>(
        `/orders/${encodeURIComponent(orderId)}/payment-status`,
        payload,
      );
      return unwrapOrderResponse<Order>(res);
    } catch (error) {
      console.error("Payment Status Update Error:", error);
      throw new Error(
        extractErrorMessage(error, "Failed to update payment status."),
      );
    }
  },
};
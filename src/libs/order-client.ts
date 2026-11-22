import { localApi } from "../libs/api";
import type { Order, CreateOrderDto } from "../types/api";

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const err = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    if (err.response?.data?.message) {
      return err.response.data.message;
    }
    if (err.message) {
      return err.message;
    }
  }
  return fallback;
}

export const OrderClient = {
  // --- CREATE ORDER ---
  async create(orderData: CreateOrderDto): Promise<Order> {
    try {
      return await localApi.post<Order>("/orders", orderData);
    } catch (error) {
      console.error("Order Creation Error:", error);
      throw new Error(extractErrorMessage(error, "Could not process your order."));
    }
  },

  // --- USER ORDERS ---
  async getMyOrders(): Promise<Order[]> {
    try {
      return await localApi.get<Order[]>("/orders/my-orders");
    } catch (error) {
      console.error("Fetch Orders Error:", error);
      return [];
    }
  },

  async getById(id: string): Promise<Order> {
    try {
      return await localApi.get<Order>(`/orders/${id}`);
    } catch (error) {
      console.error("Fetch Order Details Error:", error);
      throw new Error("Could not fetch order details.");
    }
  },

  // --- SUBMIT PAYMENT PROOF (Added) ---
  async submitPaymentProof(
    orderId: string,
    proofUrl: string,
    transactionReference?: string
  ): Promise<Order> {
    try {
      const payload = { proofUrl, transactionReference };
      return await localApi.post<Order>(`/orders/${orderId}/payment-proof`, payload);
    } catch (error) {
      console.error("Payment Proof Submission Error:", error);
      throw new Error(extractErrorMessage(error, "Failed to submit payment proof."));
    }
  },

  // --- VENDOR ORDERS ---
  async getVendorOrders(): Promise<Order[]> {
    try {
      return await localApi.get<Order[]>("/orders/vendor/dashboard");
    } catch (error) {
      console.error("Fetch Vendor Orders Error:", error);
      throw new Error(extractErrorMessage(error, "Unauthorized: Vendor access only."));
    }
  },

  // --- ADMIN ORDERS ---
  async getAllOrders(status?: string): Promise<Order[]> {
    try {
      return await localApi.get<Order[]>(
        "/orders/admin/all",
        status ? { status } : {}
      );
    } catch (error) {
      console.error("Fetch All Orders Error:", error);
      throw new Error(extractErrorMessage(error, "Failed to fetch all orders."));
    }
  },

  // --- UPDATE ORDER STATUS ---
  async updateStatus(orderId: string, status: string): Promise<Order> {
    try {
      const payload = { status: status.toUpperCase() };
      return await localApi.patch<Order>(`/orders/${orderId}/status`, payload);
    } catch (error) {
      console.error("Status Update Error:", error);
      throw new Error(extractErrorMessage(error, "Failed to update order status."));
    }
  },

  // --- UPDATE PAYMENT STATUS ---
  async updatePaymentStatus(orderId: string, paymentStatus: string): Promise<Order> {
    try {
      const payload = { paymentStatus: paymentStatus.toUpperCase() };
      return await localApi.patch<Order>(`/orders/${orderId}/payment-status`, payload);
    } catch (error) {
      console.error("Payment Status Update Error:", error);
      throw new Error(extractErrorMessage(error, "Failed to update payment status."));
    }
  },
};
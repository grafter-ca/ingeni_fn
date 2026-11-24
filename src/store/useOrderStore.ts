// src/store/useOrderStore.ts
import { create } from "zustand";
import { OrderClient } from "../services/order.service";
import type { Order, CreateOrderDto } from "../types/api";
import { socket } from "../libs/socket";
import type { Socket } from "socket.io-client";

interface OrderState {
  loading: boolean;
  error: string | null;

  currentOrder: Order | null;
  orders: Order[];
  filteredOrders: Order[];
  statusFilter: string;
  socket: Socket | null;

  // --- SOCKET ACTIONS ---
  initSocket: () => void;
  disconnectSocket: () => void;

  // --- SETTERS / UTILITIES ---
  setStatusFilter: (status: string) => void;
  applyFilters: () => void;
  clearOrder: () => void;

  // --- USER ACTIONS ---
  createOrder: (payload: CreateOrderDto) => Promise<Order>;
  fetchMyOrders: () => Promise<void>;
  fetchOrderById: (id: string) => Promise<Order>;
  submitPaymentProof: (
    orderId: string,
    proofUrl: string,
    transactionReference?: string,
  ) => Promise<Order>;

  // --- VENDOR/ADMIN ACTIONS ---
  fetchVendorOrders: () => Promise<void>;
  fetchAllOrders: (status?: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string) => Promise<Order>;
  updatePaymentStatus: (
    orderId: string,
    paymentStatus: string,
  ) => Promise<Order>;
  deleteOrder: (orderId: string) => Promise<void>;

  // --- VENDOR FINANCIAL / ITEM HELPERS ---
  getVendorTotalRevenue: (vendorId?: string) => number;
  getVendorNetBalance: (vendorId?: string) => number;
}

function mergeOrderRecord(existing: Order | undefined | null, incoming: any): Order {
  const unwrapped =
    incoming && typeof incoming === "object" && "order" in incoming && incoming.order
      ? incoming.order
      : incoming;

  if (!existing) {
    return unwrapped as Order;
  }

  return {
    ...existing,
    ...unwrapped,
    items: Array.isArray(unwrapped?.items) ? unwrapped.items : existing.items,
  };
}

export const useOrderStore = create<OrderState>((set, get) => ({
  loading: false,
  error: null,
  currentOrder: null,
  orders: [],
  filteredOrders: [],
  statusFilter: "all",
  socket: socket,

  // --- INIT SOCKET ---
  initSocket: () => {
    if (socket.hasListeners && socket.hasListeners("orderCreated")) return;
    if (!socket.hasListeners && socket.connected) return;

    socket.on("connect", () => {
      console.log(
        "⚡ Order Store connected to real-time socket server:",
        socket.id,
      );
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Order Store disconnected from Socket.io server:", reason);
    });

    socket.on("orderCreated", (newOrder: Order) => {
      const normalized = mergeOrderRecord(null, newOrder);
      set((state) => {
        const exists = state.orders.some(
          (o) => String(o.id) === String(normalized.id),
        );
        const updatedOrders = exists
          ? state.orders.map((o) =>
              String(o.id) === String(normalized.id)
                ? mergeOrderRecord(o, normalized)
                : o,
            )
          : [normalized, ...state.orders];
        return { orders: updatedOrders };
      });
      get().applyFilters();
    });

    socket.on("orderUpdated", (updatedOrder: Order) => {
      set((state) => ({
        orders: state.orders.map((o) =>
          String(o.id) === String(updatedOrder.id)
            ? mergeOrderRecord(o, updatedOrder)
            : o,
        ),
        currentOrder:
          state.currentOrder &&
          String(state.currentOrder.id) === String(updatedOrder.id)
            ? mergeOrderRecord(state.currentOrder, updatedOrder)
            : state.currentOrder,
      }));
      get().applyFilters();
    });

    socket.on("orderDeleted", ({ id }: { id: string }) => {
      set((state) => ({
        orders: state.orders.filter((o) => String(o.id) !== String(id)),
        currentOrder:
          state.currentOrder && String(state.currentOrder.id) === String(id)
            ? null
            : state.currentOrder,
      }));
      get().applyFilters();
    });
  },

  disconnectSocket: () => {
    socket.off("connect");
    socket.off("disconnect");
    socket.off("orderCreated");
    socket.off("orderUpdated");
    socket.off("orderDeleted");
  },

  // --- SET FILTER STATE AND RECOMPUTE ---
  setStatusFilter: (status) => {
    set({ statusFilter: status });
    get().applyFilters();
  },

  // --- CORE FILTER COMPILER ---
  applyFilters: () => {
    const { orders, statusFilter } = get();

    if (!statusFilter || statusFilter.toLowerCase() === "all") {
      set({ filteredOrders: orders });
    } else {
      set({
        filteredOrders: orders.filter(
          (order) =>
            order.status?.trim().toUpperCase() ===
            statusFilter.trim().toUpperCase(),
        ),
      });
    }
  },

  // --- CLEAR CURRENT ORDER ---
  clearOrder: () => set({ currentOrder: null, error: null }),

  // --- CREATE ORDER ---
  createOrder: async (payload) => {
    try {
      set({ loading: true, error: null });
      const created = await OrderClient.create(payload);
      const order = mergeOrderRecord(null, created);
      set((state) => {
        const exists = state.orders.some(
          (o) => String(o.id) === String(order.id),
        );
        return {
          orders: exists
            ? state.orders.map((o) =>
                String(o.id) === String(order.id)
                  ? mergeOrderRecord(o, order)
                  : o,
              )
            : [order, ...state.orders],
          currentOrder: order,
          loading: false,
        };
      });
      get().applyFilters();
      return order;
    } catch (err: any) {
      set({
        error: err?.message || "Failed to create order",
        loading: false,
      });
      throw err;
    }
  },

  // --- FETCH USER ORDERS ---
  fetchMyOrders: async () => {
    try {
      set({ loading: true, error: null });
      const orders = await OrderClient.getMyOrders();
      set({ orders: Array.isArray(orders) ? orders : [], loading: false });
      get().applyFilters();
    } catch (err: any) {
      set({
        error: err?.message || "Failed to fetch orders",
        loading: false,
      });
    }
  },

  fetchOrderById: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const raw = await OrderClient.getById(id);
      const order = mergeOrderRecord(get().currentOrder, raw);
      set({ currentOrder: order, loading: false });
      return order;
    } catch (err: any) {
      set({ error: err?.message || "Failed to fetch order", loading: false });
      throw err;
    }
  },

  // --- SUBMIT PAYMENT PROOF ACTION ---
  submitPaymentProof: async (orderId, proofUrl, transactionReference) => {
    try {
      set({ loading: true, error: null });
      const rawUpdated = await OrderClient.submitPaymentProof(
        orderId,
        proofUrl,
        transactionReference,
      );

      set((state) => {
        const existingInList = state.orders.find(
          (o) => String(o.id) === String(orderId),
        );
        const merged = mergeOrderRecord(
          existingInList || state.currentOrder,
          rawUpdated,
        );

        return {
          orders: state.orders.map((o) =>
            String(o.id) === String(orderId) ? mergeOrderRecord(o, merged) : o,
          ),
          currentOrder:
            state.currentOrder &&
            String(state.currentOrder.id) === String(orderId)
              ? mergeOrderRecord(state.currentOrder, merged)
              : state.currentOrder,
          loading: false,
        };
      });

      get().applyFilters();
      return mergeOrderRecord(get().currentOrder, rawUpdated);
    } catch (err: any) {
      set({
        error: err?.message || "Failed to submit payment proof",
        loading: false,
      });
      throw err;
    }
  },

  // --- VENDOR ORDERS ---
  fetchVendorOrders: async () => {
    try {
      set({ loading: true, error: null });
      const orders = await OrderClient.getVendorOrders();
      set({ orders: Array.isArray(orders) ? orders : [], loading: false });
      get().applyFilters();
    } catch (err: any) {
      set({
        error: err?.message || "Failed to fetch vendor orders",
        loading: false,
      });
    }
  },

  // --- ADMIN ORDERS ---
  fetchAllOrders: async (status) => {
    try {
      set({ loading: true, error: null });
      const targetFilter = status || get().statusFilter;
      const queryParam = targetFilter === "all" ? undefined : targetFilter;

      const orders = await OrderClient.getAllOrders(queryParam);
      set({ orders: Array.isArray(orders) ? orders : [], loading: false });
      get().applyFilters();
    } catch (err: any) {
      set({
        error: err?.message || "Failed to fetch all orders",
        loading: false,
      });
    }
  },

  // --- UPDATE ORDER STATUS ---
  updateOrderStatus: async (orderId, status) => {
    try {
      set({ loading: true, error: null });
      const rawUpdated = await OrderClient.updateStatus(orderId, status);

      let resolvedOrder: Order | null = null;
      set((state) => {
        const existing =
          state.orders.find((o) => String(o.id) === String(orderId)) ||
          state.currentOrder;
        resolvedOrder = mergeOrderRecord(existing, rawUpdated);

        return {
          orders: state.orders.map((o) =>
            String(o.id) === String(orderId) ? resolvedOrder! : o,
          ),
          currentOrder:
            state.currentOrder &&
            String(state.currentOrder.id) === String(orderId)
              ? resolvedOrder
              : state.currentOrder,
          loading: false,
        };
      });

      get().applyFilters();
      if (!resolvedOrder) {
        throw new Error("Failed to resolve updated order");
      }
      return resolvedOrder;
    } catch (err: any) {
      set({
        error: err?.message || "Failed to update order status",
        loading: false,
      });
      throw err;
    }
  },

  // --- UPDATE PAYMENT STATUS ---
  updatePaymentStatus: async (orderId, paymentStatus) => {
    try {
      set({ loading: true, error: null });
      const rawUpdated = await OrderClient.updatePaymentStatus(
        orderId,
        paymentStatus,
      );

      let resolvedOrder: Order | null = null;
      set((state) => {
        const existing =
          state.orders.find((o) => String(o.id) === String(orderId)) ||
          state.currentOrder;
        resolvedOrder = mergeOrderRecord(existing, rawUpdated);

        return {
          orders: state.orders.map((o) =>
            String(o.id) === String(orderId) ? resolvedOrder! : o,
          ),
          currentOrder:
            state.currentOrder &&
            String(state.currentOrder.id) === String(orderId)
              ? resolvedOrder
              : state.currentOrder,
          loading: false,
        };
      });

      get().applyFilters();
      if (!resolvedOrder) {
        throw new Error("Failed to resolve updated order");
      }
      return resolvedOrder;
    } catch (err: any) {
      set({
        error: err?.message || "Failed to update payment status",
        loading: false,
      });
      throw err;
    }
  },

  // --- CANCEL ORDER ---
  deleteOrder: async (orderId) => {
    try {
      set({ loading: true, error: null });
      const rawUpdated = await OrderClient.updateStatus(orderId, "CANCELLED");

      set((state) => ({
        orders: state.orders.map((o) =>
          String(o.id) === String(orderId)
            ? mergeOrderRecord(o, rawUpdated)
            : o,
        ),
        currentOrder:
          state.currentOrder && String(state.currentOrder.id) === String(orderId)
            ? mergeOrderRecord(state.currentOrder, rawUpdated)
            : state.currentOrder,
        loading: false,
      }));

      get().applyFilters();
    } catch (err: any) {
      set({
        error: err?.message || "Failed to cancel order",
        loading: false,
      });
      throw err;
    }
  },

  // --- VENDOR FINANCIAL CALCULATORS ---
  getVendorTotalRevenue: (vendorId) => {
    const { orders } = get();
    return orders.reduce((acc, order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      const orderRev = items.reduce((itemAcc, item: any) => {
        if (
          vendorId &&
          item?.vendorId !== vendorId &&
          item?.vendor?.id !== vendorId
        ) {
          return itemAcc;
        }
        const price = Number(item?.priceAtPurchase) || 0;
        const qty = Number(item?.quantity) || 1;
        return itemAcc + price * qty;
      }, 0);
      return acc + orderRev;
    }, 0);
  },

  getVendorNetBalance: (vendorId) => {
    const { orders } = get();
    return orders.reduce((acc, order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      const orderEarnings = items.reduce((itemAcc, item: any) => {
        if (
          vendorId &&
          item?.vendorId !== vendorId &&
          item?.vendor?.id !== vendorId
        ) {
          return itemAcc;
        }
        const earnings = Number(item?.vendorEarnings) || 0;
        return itemAcc + earnings;
      }, 0);
      return acc + orderEarnings;
    }, 0);
  },
}));
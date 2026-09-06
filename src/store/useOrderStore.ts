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
  submitPaymentProof: (orderId: string, proofUrl: string, transactionReference?: string) => Promise<Order>;

  // --- VENDOR/ADMIN ACTIONS ---
  fetchVendorOrders: () => Promise<void>;
  fetchAllOrders: (status?: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string) => Promise<Order>;
  updatePaymentStatus: (orderId: string, paymentStatus: string) => Promise<Order>;
  deleteOrder: (orderId: string) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  loading: false,
  error: null,
  currentOrder: null,
  orders: [],
  filteredOrders: [],
  statusFilter: "all",
  socket: socket, // Reference the central socket instance from libs

  // --- INIT SOCKET ---
  initSocket: () => {
    // Prevent registering duplicate listeners if already initialized
    if (socket.hasListeners && socket.hasListeners("orderCreated")) return;

    if (!socket.hasListeners && socket.connected) return;

    socket.on("connect", () => {
      console.log("⚡ Order Store connected to real-time socket server:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Order Store disconnected from Socket.io server:", reason);
    });

    // Listen for order updates, creations, or deletions from the server
    socket.on("orderCreated", (newOrder: Order) => {
      set((state) => {
        const updatedOrders = [newOrder, ...state.orders];
        return { orders: updatedOrders };
      });
      get().applyFilters();
    });

    socket.on("orderUpdated", (updatedOrder: Order) => {
      set((state) => ({
        orders: state.orders.map((o) => (String(o.id) === String(updatedOrder.id) ? updatedOrder : o)),
        currentOrder: state.currentOrder && String(state.currentOrder.id) === String(updatedOrder.id) ? updatedOrder : state.currentOrder,
      }));
      get().applyFilters();
    });

    socket.on("orderDeleted", ({ id }: { id: string }) => {
      set((state) => ({
        orders: state.orders.filter((o) => String(o.id) !== String(id)),
        currentOrder: state.currentOrder && String(state.currentOrder.id) === String(id) ? null : state.currentOrder,
      }));
      get().applyFilters();
    });
  },

  disconnectSocket: () => {
    // Clean up store-specific listeners from the shared socket instance to prevent memory leaks
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
          (order) => order.status?.trim().toUpperCase() === statusFilter.trim().toUpperCase()
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
      const order = await OrderClient.create(payload);
      set((state) => ({
        orders: [order, ...state.orders],
        currentOrder: order,
        loading: false,
      }));
      get().applyFilters();
      return order;
    } catch (err: any) {
      set({ error: err?.message || "Failed to create order", loading: false });
      throw err;
    }
  },

  // --- FETCH USER ORDERS ---
  fetchMyOrders: async () => {
    try {
      set({ loading: true, error: null });
      const orders = await OrderClient.getMyOrders();
      set({ orders, loading: false });
      get().applyFilters(); 
    } catch (err: any) {
      set({ error: err?.message || "Failed to fetch orders", loading: false });
    }
  },

  fetchOrderById: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const order = await OrderClient.getById(id);
      set({ currentOrder: order, loading: false });
      return order;
    } catch (err: any) {
      set({ error: err?.message || "Failed to fetch order", loading: false });
      throw err;
    }
  },

  // --- SUBMIT PAYMENT PROOF ACTION (Delegating to OrderClient) ---
  submitPaymentProof: async (orderId, proofUrl, transactionReference) => {
    try {
      set({ loading: true, error: null });
      
      const updatedOrder = await OrderClient.submitPaymentProof(orderId, proofUrl, transactionReference);

      set((state) => ({
        orders: state.orders.map((o) => (String(o.id) === String(orderId) ? updatedOrder : o)),
        currentOrder: state.currentOrder && String(state.currentOrder.id) === String(orderId) ? updatedOrder : state.currentOrder,
        loading: false,
      }));

      get().applyFilters();
      return updatedOrder;
    } catch (err: any) {
      set({ error: err?.message || "Failed to submit payment proof", loading: false });
      throw err;
    }
  },

  // --- VENDOR ORDERS ---
  fetchVendorOrders: async () => {
    try {
      set({ loading: true, error: null });
      const orders = await OrderClient.getVendorOrders();
      set({ orders, loading: false });
      get().applyFilters(); 
    } catch (err: any) {
      set({ error: err?.message || "Failed to fetch vendor orders", loading: false });
    }
  },

  // --- ADMIN ORDERS ---
  fetchAllOrders: async (status) => {
    try {
      set({ loading: true, error: null });
      
      const targetFilter = status || get().statusFilter;
      const queryParam = targetFilter === "all" ? undefined : targetFilter;
      
      const orders = await OrderClient.getAllOrders(queryParam);
      set({ orders, loading: false });
      
      get().applyFilters();
    } catch (err: any) {
      set({ error: err?.message || "Failed to fetch all orders", loading: false });
    }
  },

  // --- UPDATE ORDER STATUS ---
  updateOrderStatus: async (orderId, status) => {
    try {
      set({ loading: true, error: null });
      const updatedOrder = await OrderClient.updateStatus(orderId, status);
      
      set((state) => ({
        orders: state.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
        currentOrder: state.currentOrder?.id === orderId ? updatedOrder : state.currentOrder,
        loading: false,
      }));
      
      get().applyFilters();
      return updatedOrder;
    } catch (err: any) {
      set({ error: err?.message || "Failed to update order status", loading: false });
      throw err;
    }
  },

  // --- UPDATE PAYMENT STATUS ---
  updatePaymentStatus: async (orderId, paymentStatus) => {
    try {
      set({ loading: true, error: null });
      const updatedOrder = OrderClient.updatePaymentStatus
        ? await OrderClient.updatePaymentStatus(orderId, paymentStatus)
        : await OrderClient.updateStatus(orderId, paymentStatus);
      
      set((state) => ({
        orders: state.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
        currentOrder: state.currentOrder?.id === orderId ? updatedOrder : state.currentOrder,
        loading: false,
      }));
      
      get().applyFilters();
      return updatedOrder;
    } catch (err: any) {
      set({ error: err?.message || "Failed to update payment status", loading: false });
      throw err;
    }
  },

  // --- CANCEL ORDER ---
  deleteOrder: async (orderId) => {
    try {
      set({ loading: true, error: null });
      
      const updatedOrder = await OrderClient.updateStatus(orderId, "CANCELLED");

      set((state) => ({
        orders: state.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
        loading: false,
      }));
      
      get().applyFilters();
    } catch (err: any) {
      set({ error: "Failed to cancel order", loading: false });
      throw err;
    }
  },
}));
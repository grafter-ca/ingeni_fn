// src/store/vendorStore.ts
import { create } from "zustand";
import { vendorService } from "../services/vendorService";
import type { ApiVendor, VendorMetrics, ApiOrder } from "../types";
import { socket } from "../libs/socket";
import type { Socket } from "socket.io-client";

export interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: 'PENDING' | 'DELIVERED' | 'SHIPPED' | 'CANCELLED';
  user?: {
    name: string;
  };
  createdAt: string;
}

export interface VendorStats {
  revenue: number;
  activeOrders: number;
  productCount: number;
}

export interface AdminRequest {
  id: string;
  vendorId?: string;
  type: string;
  amount: string | null;
  message: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
}

export interface OnboardingRequest {
  id: string;
  userId: string;
  storeName?: string;
  businessDescription?: string;
  description?: string;
  address?: string;
  phone?: string;
  user?: {
    id?: string;
    name?: string;
    email: string;
  };
  submittedAt?: string;
}

interface VendorState {
  vendors: ApiVendor[];
  filteredVendors: ApiVendor[];
  selectedVendor: ApiVendor | null;
  activeMetrics: VendorMetrics | null;
  isLoading: boolean;
  error: string | null;

  orders: Order[];
  stats: VendorStats | null;
  pendingRequests: OnboardingRequest[];
  isLoadingRequests: boolean;
  vendorSettings: any | null;

  // Financial Ledger state
  totalRevenue: number;
  netBalance: number;
  requests: AdminRequest[];

  searchQuery: string;
  statusFilter: "all" | "active" | "inactive";

  isEditing: ApiVendor | null;
  formData: Omit<ApiVendor, "id" | "createdAt" | "_count">;
  socket: Socket | null;

  // Actions
  fetchVendors: (params?: any) => Promise<void>;
  fetchVendorById: (id: string) => Promise<void>;
  fetchVendorDetails: (id: string) => Promise<void>;
  fetchPendingRequests: () => Promise<void>;
  fetchVendorDashboardData: () => Promise<void>;
  fetchStorefrontMetrics: () => Promise<void>;
  fetchVendorSettings: () => Promise<void>;
  updateVendorSettings: (payload: any) => Promise<void>;
  submitAdminRequest: (payload: { type: string; amount?: string; message: string }) => Promise<void>;
  fetchVendorFinancials: (vendorId: string) => Promise<void>;
  requestCashout: (vendorId: string, amount: string, phone: string) => Promise<void>;

  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: "all" | "active" | "inactive") => void;
  applyFilters: () => void;

  updateFormData: (data: Partial<VendorState["formData"]>) => void;
  setEditingVendor: (vendor: ApiVendor | null) => void;
  
  initSocketListeners: () => void;
  disconnectSocket: () => void;
   setSelectedVendor: (vendor: ApiVendor | null) => void;
  addVendor: () => Promise<void>;
  updateVendor: (id: string) => Promise<void>;
  removeVendor: (id: string) => Promise<void>;
  toggleVendorStatus: (id: string, currentStatus: boolean) => Promise<void>;
  approveVendorRequest: (requestData: { userId: string; storeName: string; description: string; address: string; phone: string }) => Promise<void>;
  rejectVendorRequest: (requestId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, nextStatus: Order['status'] | string) => Promise<void>;
  requestOnboarding: (description: string) => Promise<void>;
  clearFilters: () => void;
}

export const useVendorStore = create<VendorState>((set, get) => ({
  vendors: [],
  filteredVendors: [],
  selectedVendor: null,
  activeMetrics: null,
  isLoading: false,
  error: null,

  orders: [],
  stats: null,
  pendingRequests: [],
  isLoadingRequests: false,
  vendorSettings: null,

  totalRevenue: 0,
  netBalance: 0,
  requests: [],

  searchQuery: "",
  statusFilter: "all",

  isEditing: null,
  formData: {
    phone: "",
    storeName: "",
    description: "",
    address:"",
    logoUrl: "",
    isActive: true,
  },
  socket: socket,

  fetchVendors: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const data = await vendorService.getVendors(params);
      set({ vendors: data, isLoading: false });
      get().applyFilters();
    } catch (err: any) {
      set({ error: err.message || "Failed to load vendors catalog", isLoading: false });
    }
  },

  fetchVendorById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const vendor = await vendorService.getVendorById(id);
      set({ selectedVendor: vendor, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Failed to load vendor details", isLoading: false });
    }
  },

  fetchVendorDetails: async (id) => {
    set({ isLoading: true, error: null, activeMetrics: null });
    try {
      const [profile, metrics] = await Promise.all([
        vendorService.getVendorById(id),
        vendorService.getVendorMetrics(id)
      ]);
      set({ selectedVendor: profile, activeMetrics: metrics, isLoading: false });
    } catch (err: any) {
      set({ error: "Failed to pull detailed profile insights", isLoading: false });
    }
  },

  fetchPendingRequests: async () => {
    set({ isLoadingRequests: true });
    try {
      const data = await vendorService.getPendingRequests();
      set({ pendingRequests: data, isLoadingRequests: false });
    } catch (err) {
      console.error("Failed to fetch pending requests", err);
      set({ isLoadingRequests: false });
    }
  },

  fetchVendorDashboardData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [ordersData, metricsData] = await Promise.all([
        vendorService.getVendorOrders(),
        vendorService.getStorefrontMetrics()
      ]);

      const mappedStats: VendorStats = metricsData || {
        revenue: ordersData.reduce((acc: number, curr: any) => curr.status === 'DELIVERED' ? acc + Number(curr.totalAmount || 0) : acc, 0),
        activeOrders: ordersData.filter((o: any) => o.status === 'PENDING').length,
        productCount: get().vendors.length
      };

      set({ orders: ordersData, stats: mappedStats, isLoading: false });
    } catch (err: any) {
      set({ error: "Failed to pull transaction metrics telemetry", isLoading: false });
    }
  },

fetchStorefrontMetrics: async () => {
    try {
      const response = await vendorService.getStorefrontMetrics();
      // Handle Axios response wrappers or direct data payloads securely
      const metricsData = response;
      
      set({ 
        stats: {
          revenue: Number(metricsData?.revenue || 0),
          activeOrders: Number(metricsData?.activeOrders || 0),
          productCount: Number(metricsData?.productCount || get().vendors.length || 0),
        } 
      });
    } catch (error) {
      console.error("Failed to fetch storefront metrics", error);
    }
  },

  fetchVendorSettings: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await vendorService.getVendorSettings();
      set({ vendorSettings: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Failed to load store configurations", isLoading: false });
    }
  },

  updateVendorSettings: async (payload) => {
    try {
      set({ isLoading: true, error: null });
      const updated = await vendorService.updateVendorSettings(payload);
      set({ vendorSettings: updated, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Failed to update configurations", isLoading: false });
      throw err;
    }
  },

  submitAdminRequest: async (payload) => {
    try {
      await vendorService.submitAdminRequest(payload);
    } catch (err: any) {
      throw err;
    }
  },

  fetchVendorFinancials: async (vendorId: string) => {
    try {
      set({ isLoading: true, error: null });
      const data = await vendorService.getFinancials(vendorId);
      set({
        totalRevenue: data.totalRevenue,
        netBalance: data.netBalance,
        requests: data.requests,
        isLoading: false,
      });
    } catch (err: any) {
      console.error("Failed to fetch vendor financials:", err);
      set({ error: err.message || "Failed to load financial records", isLoading: false });
    }
  },

  requestCashout: async (vendorId: string, amount: string, phone: string) => {
    try {
      set({ isLoading: true, error: null });
      await vendorService.submitCashoutRequest(vendorId, {
        type: 'CASHOUT',
        amount,
        message: `Cashout request to MoMo number: ${phone}`,
      });
      // Refresh financials after submitting request
      const data = await vendorService.getFinancials(vendorId);
      set({
        totalRevenue: data.totalRevenue,
        netBalance: data.netBalance,
        requests: data.requests,
        isLoading: false,
      });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || "Failed to request cashout" });
      throw err;
    }
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().applyFilters();
  },

  setStatusFilter: (status) => {
    set({ statusFilter: status });
    get().applyFilters();
  },

  applyFilters: () => {
    const { vendors, searchQuery, statusFilter } = get();
    let updatedList = [...vendors];

    if (searchQuery.trim()) {
      const targetQuery = searchQuery.toLowerCase().trim();
      updatedList = updatedList.filter(
        (v) =>
          v.name.toLowerCase().includes(targetQuery) ||
          v.storeName.toLowerCase().includes(targetQuery) ||
          v.email.toLowerCase().includes(targetQuery)
      );
    }

    if (statusFilter !== "all") {
      const targetActiveState = statusFilter === "active";
      updatedList = updatedList.filter((v) => v.isActive === targetActiveState);
    }

    set({ filteredVendors: updatedList });
  },

  updateFormData: (data) =>
    set((state) => ({ formData: { ...state.formData, ...data } })),

  setEditingVendor: (vendor) => {
    if (vendor) {
      set({
        isEditing: vendor,
        formData: {
          phone: vendor.phone || "",
          description: vendor.description || "",
          address:vendor.address || "",
          storeName: vendor.storeName,
          logoUrl: vendor.logoUrl || "",
          isActive: vendor.isActive,
        }
      });
    } else {
      set({
        isEditing: null,
        formData: {
          phone: "",
          storeName: "",
          description: "",
          address:"",
          logoUrl: "",
          isActive: true,
        }
      });
    }
  },

  setSelectedVendor: (vendor) => set({ selectedVendor: vendor }),

  initSocketListeners: () => {
    if (socket.hasListeners && socket.hasListeners('vendor:request-created')) return;
    if (!socket.hasListeners && socket.connected) return;

    socket.on('connect', () => {
      console.log("⚡ Vendor Store connected to real-time socket server:", socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log("❌ Vendor Store disconnected from Socket.io server:", reason);
    });

    socket.on('vendor:request-created', (newRequest: OnboardingRequest) => {
      set((state) => ({
        pendingRequests: [newRequest, ...state.pendingRequests.filter((r) => r.id !== newRequest.id)]
      }));
    });

    socket.on('vendorUpdated', (updatedVendor: ApiVendor) => {
      set((state) => {
        const vendors = state.vendors.map((v) =>
          String(v.id) === String(updatedVendor.id) ? updatedVendor : v
        );
        return {
          vendors,
          selectedVendor: state.selectedVendor && String(state.selectedVendor.id) === String(updatedVendor.id) ? updatedVendor : state.selectedVendor,
        };
      });
      get().applyFilters();
    });

    socket.on('vendorDeleted', ({ id }: { id: string }) => {
      set((state) => {
        const vendors = state.vendors.filter((v) => String(v.id) !== String(id));
        return {
          vendors,
          selectedVendor: state.selectedVendor && String(state.selectedVendor.id) === String(id) ? null : state.selectedVendor,
        };
      });
      get().applyFilters();
    });

    socket.on('vendorCreated', (newVendor: ApiVendor) => {
      set((state) => ({
        vendors: [newVendor, ...state.vendors],
      }));
      get().applyFilters();
    });
  },

  disconnectSocket: () => {
    socket.off('connect');
    socket.off('disconnect');
    socket.off('vendor:request-created');
    socket.off('vendorUpdated');
    socket.off('vendorDeleted');
    socket.off('vendorCreated');
  },
addVendor: async () => {
    const { formData, fetchVendors } = get();
    if (!formData.storeName?.trim()) {
      throw new Error("Vendor Store name is strictly required parameters.");
    }

    set({ isLoading: true });
    try {
      await vendorService.createVendor(formData);
      set({ isEditing: null, formData: {} }); // Clear form data bundle on success if desired
      await fetchVendors();
    } catch (err: any) {
      throw err;
    } finally {
      set({ isLoading: false }); // Guarantees loading state is always cleared
    }
  },

 updateVendor: async (id) => {
    const { formData, fetchVendors } = get();
    set({ isLoading: true });
    try {
      await vendorService.updateVendor(id, formData);
      set({ 
        isEditing: null, 
        formData: { storeName: "", phone: "", address: "", description: "", isActive: true } // Reset to clean defaults
      });
      await fetchVendors();
    } catch (err: any) {
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  removeVendor: async (id) => {
    set({ isLoading: true });
    try {
      await vendorService.deleteVendor(id);
      set((state) => {
        const nextVendors = state.vendors.filter((v) => v.id !== id);
        return {
          vendors: nextVendors,
          filteredVendors: nextVendors.filter((v) => {
            if (state.statusFilter === "all") return true;
            return v.isActive === (state.statusFilter === "active");
          }),
          isLoading: false
        };
      });
    } catch (err: any) {
      set({ error: "Could not unboard profile record from data tables", isLoading: false });
      throw err;
    }
  },

  toggleVendorStatus: async (id, currentStatus) => {
    try {
      await vendorService.toggleVendorStatus(id, currentStatus);
      set((state) => {
        const updated = state.vendors.map((v) =>
          v.id === id ? { ...v, isActive: !currentStatus } : v
        );
        return { vendors: updated };
      });
      get().applyFilters();
    } catch (err: any) {
      console.error("Failed to alter remote state profile visibility flag context:", err);
    }
  },

  approveVendorRequest: async (requestData) => {
    set({ isLoading: true });
    try {
      await vendorService.approveVendorRequest(requestData);
      await get().fetchVendors();
      await get().fetchPendingRequests();
      set({ isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || "Failed to approve request" });
      throw err;
    }
  },

  rejectVendorRequest: async (requestId) => {
    try {
      await vendorService.rejectVendorRequest(requestId);
      set((state) => ({
        pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId)
      }));
    } catch (err) {
      console.error("Failed to reject request", err);
    }
  },

  updateOrderStatus: async (orderId, nextStatus) => {
    try {
      await vendorService.updateOrderStatus(orderId, nextStatus as ApiOrder['status']);

      set((state) => {
        const updatedOrders = state.orders.map((o) =>
          o.id === orderId ? { ...o, status: nextStatus as Order['status'] } : o
        );

        const updatedStats = state.stats ? {
          ...state.stats,
          revenue: updatedOrders.reduce((acc, curr) => curr.status === 'DELIVERED' ? acc + Number(curr.totalAmount || 0) : acc, 0),
          activeOrders: updatedOrders.filter(o => o.status === 'PENDING').length
        } : null;

        return {
          orders: updatedOrders,
          stats: updatedStats
        };
      });
    } catch (err) {
      console.error("Order adjustment handshake failure inside store module:", err);
      throw err;
    }
  },

  requestOnboarding: async (description) => {
    await vendorService.requestOnboarding(description);
  },

  clearFilters: () => {
    set({ searchQuery: "", statusFilter: "all" });
    get().applyFilters();
  }
}));
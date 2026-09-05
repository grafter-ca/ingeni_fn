import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { io, Socket } from "socket.io-client";

export type CartItem = {
  id: string; // The cart item unique ID
  name: string;
  price: number;
  image: string;
  quantity: number;
  vendorId: string;
  productId: string;
};

type CartStore = {
  items: CartItem[];
  socket: Socket | null;
  initSocket: () => void;
  disconnectSocket: () => void;
  addToCart: (product: {
    id: string; 
    name: string; 
    price: number; 
    image: string; 
    vendorId: string;
    productId: string;
  }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      socket: null,

      initSocket: () => {
        if (get().socket) return;

        const socketInstance = io("https://ingeri-api.onrender.com/ws", {
          withCredentials: true,
          transports: ["websocket", "polling"],
        });

        socketInstance.on("connect", () => {
          console.log("⚡ Cart Store connected to real-time socket server:", socketInstance.id);
        });

        socketInstance.on("disconnect", (reason) => {
          console.log("❌ Cart Store disconnected from Socket.io server:", reason);
        });

        // Listen for product updates that might affect cart items (e.g. price change or deletion)
        socketInstance.on("productUpdated", (updatedProduct) => {
          set((state) => ({
            items: state.items.map((item) =>
              String(item.productId) === String(updatedProduct.id)
                ? {
                    ...item,
                    name: updatedProduct.title || item.name,
                    price: updatedProduct.price !== undefined ? updatedProduct.price : item.price,
                  }
                : item
            ),
          }));
        });

        socketInstance.on("productDeleted", ({ id }) => {
          set((state) => ({
            items: state.items.filter((item) => String(item.productId) !== String(id)),
          }));
        });

        set({ socket: socketInstance });
      },

      disconnectSocket: () => {
        const { socket } = get();
        if (socket) {
          socket.disconnect();
          set({ socket: null });
        }
      },

      addToCart: (product) =>
        set((state) => {
          // Validation: Ensure required fields exist
          if (!product.vendorId || !product.productId) {
            console.error("Attempted to add item without vendorId or productId", product);
            return state;
          }

          const existing = state.items.find((i) => i.id === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === product.id 
                  ? { ...i, quantity: i.quantity + 1 } 
                  : i
              ),
            };
          }
          return { 
            items: [...state.items, { ...product, quantity: 1 }] 
          };
        }),

      removeFromCart: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: quantity <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        })),

      clearCart: () => set({ items: [] }),

      getTotalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      getTotalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: "ingeni_cart",
      storage: createJSONStorage(() => localStorage),
      // CRITICAL FIX: Only persist the 'items' array. Excludes 'socket' and other non-serializable properties.
      partialize: (state) => ({ items: state.items }),
      // MIGRATION: This runs when the stored version doesn't match
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Filter out any corrupted items that are missing critical identifiers
          const validItems = state.items.filter(item => item.vendorId && item.productId);
          if (validItems.length !== state.items.length) {
            console.warn("Cart migration: Removing items missing vendorId/productId");
            state.items = validItems;
          }
        }
      },
    }
  )
);
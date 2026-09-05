import { create } from "zustand";
import { categoryApi, type Category } from "../libs/categoryApi";
import { io, Socket } from "socket.io-client";

interface CategoryState {
  categories: Category[];
  loading: boolean;
  isEditing: Category | null;
  formData: { name: string; image: string | File };
  socket: Socket | null;
  
  // Actions
  initSocket: () => void;
  disconnectSocket: () => void;
  setFormData: (data: { name: string; image: string | File }) => void;
  setIsEditing: (category: Category | null) => void;
  
  // Async Actions (Side Effects)
  fetchCategories: () => Promise<void>;
  saveCategory: () => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: false,
  isEditing: null,
  formData: { name: "", image: "" },
  socket: null,

  initSocket: () => {
    if (get().socket) return;

    const socketInstance = io("https://ingeri-api.onrender.com/ws", {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      console.log("⚡ Category Store connected to real-time socket server:", socketInstance.id);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("❌ Category Store disconnected from Socket.io server:", reason);
    });

    // Listen for category updates or creations if emitted by backend
    socketInstance.on("categoryUpdated", (updatedCategory: Category) => {
      set((state) => ({
        categories: state.categories.map((cat) =>
          String(cat.id) === String(updatedCategory.id) ? updatedCategory : cat
        ),
      }));
    });

    socketInstance.on("categoryCreated", (newCategory: Category) => {
      set((state) => ({
        categories: [newCategory, ...state.categories],
      }));
    });

    socketInstance.on("categoryDeleted", ({ id }: { id: string }) => {
      set((state) => ({
        categories: state.categories.filter((cat) => String(cat.id) !== String(id)),
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

  setFormData: (data) => set({ formData: data }),
  
  setIsEditing: (category) => set({ 
    isEditing: category, 
    formData: category ? { name: category.name, image: category.image } : { name: "", image: "" } 
  }),

  fetchCategories: async () => {
    set({ loading: true });
    try {
      const data = await categoryApi.findAll();
      set({ categories: data });
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      set({ loading: false });
    }
  },

  saveCategory: async () => {
    const { isEditing, formData, fetchCategories } = get();
    try {
      const payload = new FormData();
      payload.append("name", formData.name);
      
      if (formData.image instanceof File) {
        payload.append("image", formData.image);
      } else if (typeof formData.image === "string") {
        payload.append("image", formData.image);
      }

      if (isEditing) {
        await categoryApi.update(isEditing.id, payload as any);
      } else {
        await categoryApi.create(payload as any);
      }
      
      set({ isEditing: null, formData: { name: "", image: "" } });
      await fetchCategories(); // Refresh list
    } catch (error) {
      throw error; // Let the component handle the alert
    }
  },

  deleteCategory: async (id: string) => {
    try {
      await categoryApi.delete(id);
      await get().fetchCategories();
    } catch (error) {
       throw error;
    }
  }
}));
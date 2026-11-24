import { create } from "zustand";
import { categoryApi, type Category } from "../libs/categoryApi";
import { socket } from "../libs/socket"; // Adjust this path if your libs folder has a different relative depth (e.g., "@/libs/socket")
import type { Socket } from "socket.io-client";

export interface CategoryFormData {
  name: string;
  slug?: string;
  parentId?: string | null;
  image: string | File;
}

const EMPTY_FORM_DATA: CategoryFormData = {
  name: "",
  slug: "",
  parentId: null,
  image: "",
};

interface CategoryState {
  categories: Category[];
  loading: boolean;
  isEditing: Category | null;
  formData: CategoryFormData;
  socket: Socket | null;

  // Actions
  initSocket: () => void;
  disconnectSocket: () => void;
  setFormData: (data: CategoryFormData) => void;
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
  formData: { ...EMPTY_FORM_DATA },
  socket: socket, // Reference the central socket instance from libs

  initSocket: () => {
    // Prevent registering duplicate listeners if already initialized
    if (socket.hasListeners && socket.hasListeners("categoryUpdated")) return;

    if (!socket.hasListeners && socket.connected) return;

    socket.on("connect", () => {
      console.log(
        "⚡ Category Store connected to real-time socket server:",
        socket.id,
      );
    });

    socket.on("disconnect", (reason) => {
      console.log(
        "❌ Category Store disconnected from Socket.io server:",
        reason,
      );
    });

    // Listen for category updates, creations, or deletions
    socket.on("categoryUpdated", (updatedCategory: Category) => {
      set((state) => ({
        categories: state.categories.map((cat) =>
          String(cat.id) === String(updatedCategory.id) ? updatedCategory : cat,
        ),
      }));
    });

    socket.on("categoryCreated", (newCategory: Category) => {
      set((state) => {
        const exists = state.categories.some(
          (cat) => String(cat.id) === String(newCategory.id),
        );
        return {
          categories: exists
            ? state.categories.map((cat) =>
                String(cat.id) === String(newCategory.id) ? newCategory : cat,
              )
            : [newCategory, ...state.categories],
        };
      });
    });

    socket.on("categoryDeleted", ({ id }: { id: string }) => {
      set((state) => ({
        categories: state.categories.filter(
          (cat) => String(cat.id) !== String(id),
        ),
      }));
    });
  },

  disconnectSocket: () => {
    // Clean up store-specific listeners from the shared socket instance to prevent memory leaks
    socket.off("connect");
    socket.off("disconnect");
    socket.off("categoryUpdated");
    socket.off("categoryCreated");
    socket.off("categoryDeleted");
  },

  setFormData: (data) => set({ formData: data }),

  setIsEditing: (category) =>
    set({
      isEditing: category,
      formData: category
        ? {
            name: category.name,
            slug: category.slug || "",
            parentId: category.parentId ?? category.parent?.id ?? null,
            image: category.image,
          }
        : { ...EMPTY_FORM_DATA },
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
      payload.append("name", formData.name.trim());

      if (formData.slug !== undefined) {
        payload.append("slug", formData.slug.trim());
      }

      if (formData.parentId !== undefined) {
        payload.append("parentId", formData.parentId ?? "");
      }

      if (formData.image instanceof File) {
        payload.append("image", formData.image);
      } else if (typeof formData.image === "string") {
        payload.append("image", formData.image);
      }

      if (isEditing) {
        await categoryApi.update(isEditing.id, payload);
      } else {
        await categoryApi.create(payload);
      }

      set({ isEditing: null, formData: { ...EMPTY_FORM_DATA } });
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
  },
}));
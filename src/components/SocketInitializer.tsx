// src/components/SocketInitializer.tsx
import { useEffect } from "react";
import { useCartStore } from "../store/cartStore";
import { useCategoryStore } from "../store/categoryStore";
import { useOrderStore } from "../store/useOrderStore";
import { useVendorStore } from "../store/vendorStore";

export const SocketInitializer = () => {
  const initCartSocket = useCartStore((state) => state.initSocket);
  const disconnectCartSocket = useCartStore((state) => state.disconnectSocket);

  const initCategorySocket = useCategoryStore((state) => state.initSocket);
  const disconnectCategorySocket = useCategoryStore((state) => state.disconnectSocket);

  const initOrderSocket = useOrderStore((state) => state.initSocket);
  const disconnectOrderSocket = useOrderStore((state) => state.disconnectSocket);

  const initVendorListeners = useVendorStore((state) => state.initSocketListeners);

  useEffect(() => {
    // Initialize all store sockets and listeners on mount
    initCartSocket();
    initCategorySocket();
    initOrderSocket();
    initVendorListeners();

    // Clean up socket connections when unmounting
    return () => {
      disconnectCartSocket();
      disconnectCategorySocket();
      disconnectOrderSocket();
    };
  }, []);

  return null; // This component handles side effects only
};
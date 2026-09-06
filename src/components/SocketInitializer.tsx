import { useEffect } from "react";
import { socketManager } from "../libs/socket";
import { useCartStore } from "../store/cartStore";
import { useCategoryStore } from "../store/categoryStore";
import { useOrderStore } from "../store/useOrderStore";
import { useVendorStore } from "../store/vendorStore";

export const SocketInitializer = () => {
  const initCartSocket = useCartStore((state) => state.initSocket);
  const initCategorySocket = useCategoryStore((state) => state.initSocket);
  const initOrderSocket = useOrderStore((state) => state.initSocket);
  const initVendorListeners = useVendorStore((state) => state.initSocketListeners);

  useEffect(() => {
    let isCancelled = false;

    const timer = setTimeout(() => {
      if (!isCancelled) {
        // 1. Establish one single shared connection
        socketManager.connect();

        // 2. Bind store listeners to the shared socket
        initCartSocket();
        initCategorySocket();
        initOrderSocket();
        initVendorListeners();
      }
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      // Disconnect the single shared connection on unmount
      socketManager.disconnect();
    };
  }, []);

  return null;
};
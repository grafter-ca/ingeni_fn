// src/components/layout/VendorLayout.tsx
import { useState, useEffect, useRef, useMemo } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  Menu,
  X,
  Store,
  Bell,
  Wallet,
  ChevronDown,
} from "lucide-react";
import { useOrderStore } from "../../store/useOrderStore";
import { useProductStore } from "../../store/productStore";
import { useVendorStore } from "../../store/vendorStore";
import { useAuthState } from "../../context/AuthContext";
import { socket } from "../../libs/socket";
import Logout from "../../components/ui/Logout";

const VendorLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const {
    orders,
    fetchVendorOrders,
    initSocket,
    getVendorNetBalance,
  } = useOrderStore();
  const { fetchCategories, fetchVendorProducts } = useProductStore();
  const { fetchVendorFinancials, requests } = useVendorStore();
  const { user } = useAuthState();

  const vendorId = user?.vendorId || user?.id;

  useEffect(() => {
    initSocket();
    void fetchVendorOrders();
    void fetchVendorProducts();
    void fetchCategories();
    if (vendorId) {
      void fetchVendorFinancials(vendorId);
    }
  }, [
    initSocket,
    fetchVendorOrders,
    fetchVendorProducts,
    fetchCategories,
    vendorId,
    fetchVendorFinancials,
  ]);

  // Refresh vendor orders & financials on live socket order/payment events
  useEffect(() => {
    const handleLiveVendorOrderEvent = () => {
      void fetchVendorOrders();
      if (vendorId) {
        void fetchVendorFinancials(vendorId);
      }
    };

    socket?.on?.("orderCreated", handleLiveVendorOrderEvent);
    socket?.on?.("orderUpdated", handleLiveVendorOrderEvent);
    socket?.on?.("orderDeleted", handleLiveVendorOrderEvent);
    socket?.on?.("payment:updated", handleLiveVendorOrderEvent);

    return () => {
      socket?.off?.("orderCreated", handleLiveVendorOrderEvent);
      socket?.off?.("orderUpdated", handleLiveVendorOrderEvent);
      socket?.off?.("orderDeleted", handleLiveVendorOrderEvent);
      socket?.off?.("payment:updated", handleLiveVendorOrderEvent);
    };
  }, [fetchVendorOrders, fetchVendorFinancials, vendorId]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const safeOrders = useMemo(
    () => (Array.isArray(orders) ? orders : []),
    [orders],
  );
  const safeRequests = useMemo(
    () => (Array.isArray(requests) ? requests : []),
    [requests],
  );

  // Use store net balance when vendorEarnings exists, falling back to item price * qty
  const totalVendorEarnings = useMemo(() => {
    const storeNet =
      typeof getVendorNetBalance === "function"
        ? Number(getVendorNetBalance(vendorId)) || 0
        : 0;

    if (storeNet > 0) {
      return storeNet;
    }

    return safeOrders.reduce((acc, order) => {
      const orderStatus = String(order?.status || "").toUpperCase();
      if (orderStatus === "CANCELLED" || orderStatus === "FAILED") {
        return acc;
      }

      const items = Array.isArray(order.items) ? order.items : [];
      const orderTotal = items.reduce((itemAcc, item: any) => {
        const price = Number(item?.priceAtPurchase ?? item?.price ?? 0);
        const qty = Number(item?.quantity ?? 1);
        return itemAcc + (Number.isFinite(price * qty) ? price * qty : 0);
      }, 0);

      return acc + orderTotal;
    }, 0);
  }, [safeOrders, vendorId, getVendorNetBalance]);

  const netBalance = totalVendorEarnings.toLocaleString();

  const pendingCount = useMemo(
    () =>
      safeOrders.filter(
        (o) => String(o.status || "").toUpperCase() === "PENDING",
      ).length,
    [safeOrders],
  );

  // Build Notification items from live orders & cashout tickets
  const notificationItems = useMemo(
    () => [
      ...safeOrders.slice(0, 4).map((o) => ({
        id: o.id,
        title: `Order #${o.orderNumber || String(o.id || "").slice(-6)}`,
        desc: `Status: ${o.status} • RWF ${Number(o.totalAmount || 0).toLocaleString()}`,
        time: o.createdAt
          ? new Date(o.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Just now",
        type:
          String(o.status || "").toUpperCase() === "PENDING"
            ? "warning"
            : "info",
        link: "/vendor/orders",
      })),
      ...safeRequests.slice(0, 3).map((r: any) => ({
        id: r.id,
        title: `Cashout / ${r.type}`,
        desc: `Status: ${r.status} ${r.amount ? `• RWF ${Number(r.amount).toLocaleString()}` : ""}`,
        time: "Recent",
        type:
          r.status === "APPROVED"
            ? "success"
            : r.status === "REJECTED"
              ? "error"
              : "warning",
        link: "/vendor/financials",
      })),
    ],
    [safeOrders, safeRequests],
  );

  const menuItems = [
    { name: "Overview", path: "/vendor", icon: <LayoutDashboard size={20} /> },
    {
      name: "Products & Inventory",
      path: "/vendor/products",
      icon: <Package size={20} />,
    },
    {
      name: "Customer Orders",
      path: "/vendor/orders",
      icon: <ShoppingCart size={20} />,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      name: "Financials & Cashouts",
      path: "/vendor/financials",
      icon: <Wallet size={20} />,
    },
    {
      name: "Store Settings",
      path: "/vendor/settings",
      icon: <Settings size={20} />,
    },
  ];

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex overflow-hidden font-poppins">
      {/* 1. MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeMenu}
        />
      )}

      {/* 2. SIDEBAR NAVIGATION */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#0c0c0e] border-r border-white/10 p-6 flex flex-col transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:fixed lg:h-screen
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Mobile Close Button */}
        <button
          type="button"
          aria-label="Close Mobile Menu"
          className="lg:hidden absolute top-6 right-6 p-2 text-gray-400 hover:text-white cursor-pointer"
          onClick={closeMenu}
        >
          <X size={20} />
        </button>

        {/* Brand Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
            <Store size={22} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400">
              Vendor Portal
            </span>
            <h2 className="font-bold text-base text-white tracking-tight">
              Ingeni Store
            </h2>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-2 overflow-y-auto">
          <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 px-3 mb-2">
            Workspace Menu
          </p>
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMenu}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl font-mono text-xs transition-all group ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 font-semibold"
                    : "text-gray-400 hover:text-white hover:bg-white/4"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={
                      isActive
                        ? "text-white"
                        : "text-gray-500 group-hover:text-blue-400 transition-colors"
                    }
                  >
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </div>
                {item.badge ? (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] ${
                      isActive
                        ? "bg-white text-blue-600"
                        : "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="pt-6 border-t border-white/10 space-y-3">
          <div className="px-3 py-2.5 rounded-xl bg-white/2 border border-white/5 font-mono text-xs">
            <span className="text-gray-500 block text-[10px] uppercase">
              Net Sales Earnings
            </span>
            <span className="text-blue-400 font-bold">RWF {netBalance}</span>
          </div>
          <div className="pt-1">
            <Logout />
          </div>
        </div>
      </aside>

      {/* 3. MAIN CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Header Bar */}
        <header className="h-20 bg-[#050505]/80 backdrop-blur-xl border-b border-white/10 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Open Mobile Menu"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="font-poppins font-bold text-lg text-white">
                Vendor Console Dashboard
              </h1>
              <p className="text-[11px] font-mono text-gray-400 hidden sm:block">
                Manage storefront inventory, view metrics, and fulfill customer
                orders.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* NOTIFICATIONS DROPDOWN */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsProfileOpen(false);
                }}
                className="p-2.5 rounded-xl bg-[#0c0c0e] border border-white/10 text-gray-400 hover:text-white relative cursor-pointer transition"
              >
                <Bell size={18} />
                {notificationItems.length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-[#0c0c0e] border border-white/10 shadow-2xl p-4 z-50 font-mono animate-fadeIn">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                    <span className="font-bold text-xs text-white uppercase tracking-wider">
                      Store Activity &amp; Alerts
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px]">
                      {notificationItems.length} New
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {notificationItems.length === 0 ? (
                      <p className="text-center py-6 text-gray-500 text-xs">
                        No new notifications.
                      </p>
                    ) : (
                      notificationItems.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            navigate(n.link);
                            setIsNotificationsOpen(false);
                          }}
                          className="p-3 rounded-xl bg-white/2 hover:bg-white/5 border border-white/5 cursor-pointer transition space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {n.time}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 leading-relaxed">
                            {n.desc}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* PROFILE DROPDOWN */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotificationsOpen(false);
                }}
                className="flex items-center gap-3 pl-3 pr-2 py-2 rounded-xl bg-[#0c0c0e] border border-white/10 hover:border-white/20 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "V"}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="block font-bold text-xs text-white truncate max-w-30">
                    {user?.name || "Vendor Partner"}
                  </span>
                  <span className="text-[10px] text-blue-400 font-mono capitalize">
                    {user?.role || "Vendor"}
                  </span>
                </div>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-[#0c0c0e] border border-white/10 shadow-2xl p-3 z-50 font-mono animate-fadeIn space-y-2">
                  <div className="p-3 rounded-xl bg-white/2 border border-white/5 space-y-1">
                    <span className="text-gray-400 text-[10px] uppercase block">
                      Signed in as
                    </span>
                    <span className="text-white text-xs font-bold block truncate">
                      {user?.email || "vendor@ingenistore.rw"}
                    </span>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] mt-1">
                      Active Storefront
                    </span>
                  </div>

                  <div className="space-y-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/vendor/settings");
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/4 text-xs transition text-left cursor-pointer"
                    >
                      <Settings size={15} className="text-blue-400" />
                      <span>Account Settings</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        navigate("/vendor/financials");
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/4 text-xs transition text-left cursor-pointer"
                    >
                      <Wallet size={15} className="text-emerald-400" />
                      <span>Financial Ledger</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-white/10">
                    <Logout />
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Panel */}
        <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default VendorLayout;
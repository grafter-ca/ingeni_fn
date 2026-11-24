// src/pages/MyOrders.tsx
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  ShoppingBag,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  PackageOpen,
  Calendar,
  CreditCard,
  ArrowRight,
  HelpCircle,
  Phone,
  MessageCircle,
  X,
  ExternalLink,
} from "lucide-react";
import { useOrderStore } from "../store/useOrderStore";
import OrderCard from "../components/common/OrderCard";
import { PaymentProofUpload } from "../components/common/PaymentProofUpload";
import type { Order } from "../types/api";
import { Link } from "react-router-dom";

const MyOrders = () => {
  const {
    orders,
    loading,
    error,
    initSocket,
    disconnectSocket,
    fetchMyOrders,
  } = useOrderStore();

  // Filtering & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("ALL");

  // Payment Proof Modal state
  const [selectedOrderIdForProof, setSelectedOrderIdForProof] = useState<
    string | null
  >(null);
  const [isPaymentProofModalOpen, setIsPaymentProofModalOpen] = useState(false);
  const hasFetchedRef = useRef(false);

  const supportTeam = {
    phone: "+250786015225",
    email: "team@ingenistore.com",
  };

  useEffect(() => {
    initSocket();
    return () => {
      disconnectSocket();
    };
  }, [initSocket, disconnectSocket]);

  useEffect(() => {
    if (!hasFetchedRef.current && typeof fetchMyOrders === "function") {
      hasFetchedRef.current = true;
      void fetchMyOrders();
    }
  }, [fetchMyOrders]);

  const closeProofModal = useCallback(() => {
    setIsPaymentProofModalOpen(false);
    setSelectedOrderIdForProof(null);
  }, []);

  useEffect(() => {
    if (!isPaymentProofModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeProofModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaymentProofModalOpen, closeProofModal]);

  const safeOrders = useMemo(
    () => (Array.isArray(orders) ? orders : []),
    [orders],
  );

  const selectedOrderForProof = useMemo(() => {
    if (!selectedOrderIdForProof) return null;
    return (
      safeOrders.find(
        (o) =>
          String(o.id) === String(selectedOrderIdForProof) ||
          String(o.orderNumber) === String(selectedOrderIdForProof),
      ) || null
    );
  }, [safeOrders, selectedOrderIdForProof]);

  // Comprehensive filter logic incorporating status, search, and time frames
  const filteredOrders = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return safeOrders.filter((order) => {
      const orderNumber = order.orderNumber || "";
      const orderId = order.id || "";
      const matchesSearch =
        !normalizedQuery ||
        orderNumber.toLowerCase().includes(normalizedQuery) ||
        orderId.toLowerCase().includes(normalizedQuery) ||
        Boolean(
          order.shippingAddress &&
            order.shippingAddress.toLowerCase().includes(normalizedQuery),
        );

      const matchesStatus =
        statusFilter === "ALL" ||
        order.status?.toUpperCase() === statusFilter ||
        order.paymentStatus?.toUpperCase() === statusFilter;

      let matchesDate = true;
      if (dateRangeFilter !== "ALL" && order.createdAt) {
        const orderDate = new Date(order.createdAt).getTime();
        if (!Number.isNaN(orderDate)) {
          const now = Date.now();
          const diffDays = (now - orderDate) / (1000 * 3600 * 24);
          if (dateRangeFilter === "30" && diffDays > 30) matchesDate = false;
          if (dateRangeFilter === "90" && diffDays > 90) matchesDate = false;
          if (dateRangeFilter === "365" && diffDays > 365) matchesDate = false;
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [safeOrders, searchQuery, statusFilter, dateRangeFilter]);

  // Statistics counters
  const stats = useMemo(() => {
    const totalCount = safeOrders.length;
    const pendingCount = safeOrders.filter(
      (o) =>
        o.status?.toUpperCase() === "PENDING" ||
        o.paymentStatus?.toUpperCase() === "PENDING",
    ).length;
    const activeCount = safeOrders.filter((o) =>
      ["PROCESSING", "SHIPPED"].includes(o.status?.toUpperCase() || ""),
    ).length;
    const deliveredCount = safeOrders.filter(
      (o) =>
        o.status?.toUpperCase() === "DELIVERED" ||
        o.paymentStatus?.toUpperCase() === "SUCCESS",
    ).length;
    return { totalCount, pendingCount, activeCount, deliveredCount };
  }, [safeOrders]);

  const handleRefreshOrders = () => {
    if (typeof fetchMyOrders === "function") {
      void fetchMyOrders();
    }
  };

  if (loading && safeOrders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center font-poppins transition-colors duration-200">
        <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 shadow-lg">
          <Loader2
            className="animate-spin text-blue-600 dark:text-blue-500"
            size={42}
          />
          <p className="text-gray-600 dark:text-gray-300 text-sm font-semibold tracking-wide animate-pulse">
            Synchronizing Secure Purchase Ledger...
          </p>
        </div>
      </div>
    );
  }

  const existingProofUrl =
    (selectedOrderForProof as any)?.paymentProofUrl ||
    (selectedOrderForProof as any)?.paymentProof ||
    (selectedOrderForProof as any)?.proofUrl ||
    null;

  const existingTransactionRef =
    (selectedOrderForProof as any)?.transactionReference ||
    (selectedOrderForProof as any)?.paymentReference ||
    null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white py-12 px-4 sm:px-6 font-poppins transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header & Quick Stats Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-[#0a0a0a] p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
              <PackageOpen size={14} /> Order Command Center
            </div>
            <h1 className="text-3xl font-black tracking-tight">
              Order Tracking &amp; History
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Real-time multi-vendor fulfillment logs, payment clearances, and
              shipment telemetry.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRefreshOrders}
              disabled={loading}
              className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 border border-gray-200 dark:border-white/10 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer shadow-2xs disabled:opacity-50"
              title="Refresh order history"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />{" "}
              Refresh Feed
            </button>
            <Link
              to="/products"
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider text-xs transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
            >
              Shop More <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Metrics Overview Cards */}
        {safeOrders.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#0a0a0a] p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
                Total Orders
              </p>
              <p className="text-2xl font-black mt-1 text-gray-900 dark:text-white">
                {stats.totalCount}
              </p>
            </div>
            <div className="bg-white dark:bg-[#0a0a0a] p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
              <p className="text-[10px] uppercase font-bold tracking-widest text-amber-500">
                Pending Review
              </p>
              <p className="text-2xl font-black mt-1 text-amber-600 dark:text-amber-400">
                {stats.pendingCount}
              </p>
            </div>
            <div className="bg-white dark:bg-[#0a0a0a] p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
              <p className="text-[10px] uppercase font-bold tracking-widest text-blue-500">
                Active / Shipped
              </p>
              <p className="text-2xl font-black mt-1 text-blue-600 dark:text-blue-400">
                {stats.activeCount}
              </p>
            </div>
            <div className="bg-white dark:bg-[#0a0a0a] p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
              <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-500">
                Cleared / Done
              </p>
              <p className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">
                {stats.deliveredCount}
              </p>
            </div>
          </div>
        )}

        {/* Search and Filters Advanced Bar */}
        {safeOrders.length > 0 && (
          <div className="bg-white dark:bg-[#0a0a0a] p-4 sm:p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm grid sm:grid-cols-12 gap-4">
            {/* Search Input */}
            <div className="sm:col-span-6 relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search by Order #, ID, or destination..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs sm:text-sm outline-none focus:border-blue-600 dark:focus:border-blue-500 transition-colors text-gray-900 dark:text-white placeholder:text-gray-400 font-medium"
              />
            </div>

            {/* Status Filter */}
            <div className="sm:col-span-3 relative">
              <Filter
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs sm:text-sm outline-none focus:border-blue-600 dark:focus:border-blue-500 transition-colors appearance-none text-gray-700 dark:text-gray-300 font-medium cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Payment</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="SUCCESS">Success Clearance</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Date Window Filter */}
            <div className="sm:col-span-3 relative">
              <Calendar
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
              />
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs sm:text-sm outline-none focus:border-blue-600 dark:focus:border-blue-500 transition-colors appearance-none text-gray-700 dark:text-gray-300 font-medium cursor-pointer"
              >
                <option value="ALL">All Time Frames</option>
                <option value="30">Past 30 Days</option>
                <option value="90">Past 3 Months</option>
                <option value="365">Past Year</option>
              </select>
            </div>
          </div>
        )}

        {/* Error Alert Box */}
        {error && (
          <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 shadow-sm">
            <AlertCircle size={22} className="shrink-0" />
            <div className="text-sm">
              <p className="font-bold uppercase tracking-wider text-xs">
                Connection Alert
              </p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Dynamic States & Order Cards Feed */}
        {safeOrders.length === 0 && !error ? (
          <div className="text-center py-20 bg-white dark:bg-[#0a0a0a] rounded-3xl border border-dashed border-gray-200 dark:border-white/10 p-8 shadow-sm space-y-4">
            <div className="bg-blue-600/10 text-blue-600 dark:text-blue-500 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto">
              <ShoppingBag size={34} />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                No Purchase Records Found
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                You haven&apos;t completed any checkouts on IngeniStore yet.
                Explore our multi-vendor catalog to place your first order.
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 mt-4 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-2xl font-bold uppercase tracking-wider text-xs transition-colors shadow-lg shadow-blue-600/20"
            >
              Browse Products <ArrowRight size={14} />
            </Link>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#0a0a0a] rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm space-y-2">
            <p className="text-gray-800 dark:text-gray-200 font-bold text-base">
              No matching orders found
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              Try adjusting your keyword filter or switching status parameters
              above.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
                setDateRangeFilter("ALL");
              }}
              className="mt-3 px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-xs font-bold uppercase transition cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order: Order) => (
              <div key={order.id || order.orderNumber} className="relative">
                <OrderCard order={order} />
                <div className="px-6 pb-4 pt-1 bg-white dark:bg-[#0a0a0a] border-x border-b border-gray-200 dark:border-white/10 rounded-b-3xl -mt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOrderIdForProof(
                        order.id || order.orderNumber || null,
                      );
                      setIsPaymentProofModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    <CreditCard size={14} /> Upload / View Payment Proof
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Support Help Box for Order Inquiries */}
        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-500 shrink-0">
              <HelpCircle size={26} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Need Assistance with a Delivery or Payment?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Our support team handles fulfillment delays, tracking disputes,
                and payment verifications 24/7.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            <a
              href={`tel:${supportTeam.phone}`}
              className="flex-1 md:flex-initial px-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 border border-gray-200 dark:border-white/10 transition flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider"
            >
              <Phone size={14} /> Call Support
            </a>
            <a
              href={`mailto:${supportTeam.email}`}
              className="flex-1 md:flex-initial px-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 border border-gray-200 dark:border-white/10 transition flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider"
            >
              <MessageCircle size={14} /> Email Us
            </a>
          </div>
        </div>
      </div>

      {/* Payment Proof Modal integration */}
      {isPaymentProofModalOpen && selectedOrderForProof && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={closeProofModal}
        >
          <div
            className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeProofModal}
              className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            {(existingProofUrl || existingTransactionRef) && (
              <div className="mx-6 mt-6 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-500/20 text-xs space-y-1.5">
                <p className="font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 text-[11px]">
                  Current Submitted Proof
                </p>
                {existingTransactionRef && (
                  <p className="text-gray-700 dark:text-gray-300 font-mono">
                    Ref: <strong>{existingTransactionRef}</strong>
                  </p>
                )}
                {existingProofUrl && (
                  <a
                    href={existingProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    View Uploaded Proof <ExternalLink size={12} />
                  </a>
                )}
              </div>
            )}

            <div className="p-2">
              <PaymentProofUpload
                orderId={selectedOrderForProof.id}
                orderNumber={
                  selectedOrderForProof.orderNumber || selectedOrderForProof.id
                }
                onSuccess={() => {
                  void fetchMyOrders();
                  closeProofModal();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
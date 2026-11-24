import { useEffect, useMemo, useState } from "react";
import { useOrderStore } from "../../../store/useOrderStore";
import { useAuthState } from "../../../context/AuthContext";
import {
  Loader2,
  ShieldAlert,
  FileText,
  ClipboardList,
  RefreshCw,
  Eye,
  Package,
  Store,
  DollarSign,
  CreditCard,
  CheckCircle2,
  Send,
  AlertCircle,
  Search,
  Download,
  Copy,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
  Wallet,
  Banknote,
  Smartphone,
  Trash2,
} from "lucide-react";
import type { Order, OrderItem } from "../../../types/api";
import toast from "react-hot-toast";

export type PaymentMethod =
  | "MOBILE_MONEY"
  | "CREDIT_CARD"
  | "CASH_ON_DELIVERY"
  | "WORKFORCE_WALLET";

interface EmailNotificationInfo {
  success: boolean;
  messageId: string | null;
  reason?: string;
}

const ADMIN_ALLOWED_ROLES = new Set(["admin", "super_admin"]);
const COMMISSION_RATE = 0.08;
const VENDOR_SHARE_RATE = 1 - COMMISSION_RATE; // 0.92

const PAYMENT_METHODS: PaymentMethod[] = [
  "MOBILE_MONEY",
  "CREDIT_CARD",
  "CASH_ON_DELIVERY",
  "WORKFORCE_WALLET",
];

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  MOBILE_MONEY: "Mobile Money",
  CREDIT_CARD: "Credit Card",
  CASH_ON_DELIVERY: "Cash on Delivery",
  WORKFORCE_WALLET: "Workforce Wallet",
};

const STATUS_OPTIONS = [
  "ALL",
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

const PAYMENT_STATUS_OPTIONS = [
  "INITIALIZED",
  "PENDING",
  "SUCCESS",
  "FAILED",
  "REFUNDED",
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const formatRwf = (amount: number) =>
  new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(amount);

const getPaymentMethodLabel = (method?: string) => {
  if (!method) return "Unknown";
  return (
    PAYMENT_METHOD_LABELS[method as PaymentMethod] || method.replaceAll("_", " ")
  );
};

export default function AdminOrders() {
  const {
    fetchAllOrders,
    filteredOrders,
    statusFilter,
    deleteOrder,
    setStatusFilter,
    loading,
    error,
    updateOrderStatus,
    updatePaymentStatus,
  } = useOrderStore();

  const authState = useAuthState() as {
    user?: { id?: string; role?: string } | null;
    isLoading?: boolean;
    loading?: boolean;
  };
  const user = authState?.user ?? null;
  const isAuthLoading = Boolean(authState?.isLoading ?? authState?.loading);
  const normalizedRole = String(user?.role || "").toLowerCase();
  const canAccessAdminOrders =
    Boolean(user?.id) && ADMIN_ALLOWED_ROLES.has(normalizedRole);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(
    null,
  );
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [lastEmailByOrderId, setLastEmailByOrderId] = useState<
    Record<string, EmailNotificationInfo>
  >({});

  // UX filters & pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (isAuthLoading || !canAccessAdminOrders) {
      return;
    }
    void fetchAllOrders();
  }, [isAuthLoading, canAccessAdminOrders, fetchAllOrders]);

  const getOrderCode = (order: Order) =>
    (order as any).orderNumber || `#${order.id.slice(-8).toUpperCase()}`;

  const getVendorLabel = (item: OrderItem) => {
    const vendorName = item.product?.vendor?.storeName;
    if (vendorName) return vendorName;
    if (item.vendorId) return `Vendor ${item.vendorId.slice(-4).toUpperCase()}`;
    return "Global Marketplace";
  };

  const resolveItemVendorDisplay = (
    item: any,
    order: any,
  ): { name: string; meta?: string } => {
    const orderVendors = Array.isArray(order?.vendors) ? order.vendors : [];
    const vendorId =
      item?.vendorId ||
      item?.product?.vendorId ||
      item?.vendor?.id ||
      item?.product?.vendor?.id;

    const matchedVendor = vendorId
      ? orderVendors.find((v: any) => v?.id === vendorId)
      : undefined;

    const vendorObj =
      item?.vendor || item?.product?.vendor || matchedVendor || undefined;

    const name =
      vendorObj?.businessName ||
      vendorObj?.storeName ||
      vendorObj?.name ||
      item?.vendorName ||
      item?.product?.vendorName ||
      order?.vendor?.businessName ||
      order?.vendor?.storeName ||
      order?.vendor?.name ||
      "Unassigned Vendor";

    const metaParts = [vendorObj?.phone, vendorObj?.email].filter(Boolean);
    const meta = metaParts.length > 0 ? metaParts.join(" · ") : undefined;

    return { name, meta };
  };

  const getOrderCommissionState = (order: Order) => {
    const total = Number(order.totalAmount || 0);
    const isReturned =
      order.status === "RETURNED" || order.paymentStatus === "REFUNDED";
    const isPaid = order.paymentStatus === "SUCCESS" && !isReturned;
    const isDelivered = order.status === "DELIVERED" && !isReturned;
    const isLocked = isPaid && isDelivered;

    const commission = isPaid ? total * COMMISSION_RATE : 0;
    const vendorPayout = isPaid ? total * VENDOR_SHARE_RATE : 0;

    return {
      total,
      isReturned,
      commission,
      vendorPayout,
      isPaid,
      isDelivered,
      isLocked,
    };
  };

  const searchedAndFilteredOrders = useMemo(() => {
    const base = Array.isArray(filteredOrders) ? filteredOrders : [];
    const q = searchQuery.trim().toLowerCase();

    return base.filter((order) => {
      if (paymentFilter !== "ALL" && order.paymentStatus !== paymentFilter) {
        return false;
      }

      if (
        paymentMethodFilter !== "ALL" &&
        (order as any).paymentMethod !== paymentMethodFilter
      ) {
        return false;
      }

      if (!q) return true;

      const orderCode = getOrderCode(order).toLowerCase();
      const idMatch = order.id.toLowerCase().includes(q);
      const customerName = (order.user?.name || "").toLowerCase();
      const email = (order.email || order.user?.email || "").toLowerCase();
      const phone = (order.phoneNumber || order.user?.phone || "").toLowerCase();
      const methodText = getPaymentMethodLabel(
        (order as any).paymentMethod,
      ).toLowerCase();
      const vendorNames = (order.items || [])
        .map((it) => getVendorLabel(it).toLowerCase())
        .join(" ");

      return (
        orderCode.includes(q) ||
        idMatch ||
        customerName.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        methodText.includes(q) ||
        vendorNames.includes(q)
      );
    });
  }, [
    filteredOrders,
    searchQuery,
    paymentFilter,
    paymentMethodFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, paymentFilter, paymentMethodFilter, statusFilter, pageSize]);

  const totalItems = searchedAndFilteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return searchedAndFilteredOrders.slice(startIndex, startIndex + pageSize);
  }, [searchedAndFilteredOrders, safeCurrentPage, pageSize]);

  const startItemNumber =
    totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItemNumber = Math.min(safeCurrentPage * pageSize, totalItems);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    }
    const pages: Array<number | "ellipsis"> = [1];
    const left = Math.max(2, safeCurrentPage - 1);
    const right = Math.min(totalPages - 1, safeCurrentPage + 1);

    if (left > 2) pages.push("ellipsis");
    for (let p = left; p <= right; p++) pages.push(p);
    if (right < totalPages - 1) pages.push("ellipsis");
    pages.push(totalPages);

    return pages;
  }, [safeCurrentPage, totalPages]);

  const notifyEmailResult = (
    orderId: string,
    emailNotification?: EmailNotificationInfo,
    customerEmail?: string | null,
  ) => {
    if (emailNotification) {
      setLastEmailByOrderId((prev) => ({
        ...prev,
        [orderId]: emailNotification,
      }));
    }

    if (emailNotification?.success) {
      toast.success(
        `Tracking email sent to ${customerEmail || "customer"}${
          emailNotification.messageId
            ? ` (${emailNotification.messageId.slice(0, 12)}...)`
            : ""
        }`,
      );
    } else if (!customerEmail) {
      toast("Updated (no customer email on order to notify).", { icon: "ℹ️" });
    } else if (emailNotification?.reason) {
      toast(`Updated (${emailNotification.reason}).`, { icon: "ℹ️" });
    }
  };

  const handleStatusChange = async (order: Order, nextStatus: string) => {
    setUpdatingId(order.id);
    try {
      const response: any = await updateOrderStatus(order.id, nextStatus);
      if (selectedOrder?.id === order.id) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, status: nextStatus as Order["status"] } : prev,
        );
      }
      toast.success(`Order fulfillment set to ${nextStatus}.`);
      notifyEmailResult(
        order.id,
        response?.emailNotification,
        order.email || order.user?.email,
      );
    } catch {
      toast.error(
        "Failed to modify dispatch execution status routing parameters.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePaymentStatusChange = async (
    order: Order,
    nextPaymentStatus: string,
  ) => {
    setUpdatingPaymentId(order.id);
    try {
      const response: any = await updatePaymentStatus(
        order.id,
        nextPaymentStatus,
      );
      if (selectedOrder?.id === order.id) {
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                paymentStatus: nextPaymentStatus as Order["paymentStatus"],
              }
            : prev,
        );
      }
      toast.success(`Payment status updated to ${nextPaymentStatus}.`);
      notifyEmailResult(
        order.id,
        response?.emailNotification,
        order.email || order.user?.email,
      );
    } catch {
      toast.error("Failed to modify payment state validation record.");
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to cancel/remove this order?")) {
      return;
    }
    setDeletingOrderId(orderId);
    try {
      await deleteOrder(orderId);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
      toast.success("Order record removed.");
    } catch {
      toast.error("Failed to remove order record.");
    } finally {
      setDeletingOrderId(null);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Copied ${code}`);
    } catch {
      toast.error("Unable to copy to clipboard.");
    }
  };

  const handleExportCsv = () => {
    if (searchedAndFilteredOrders.length === 0) {
      toast("No orders to export for the active filter.", { icon: "ℹ️" });
      return;
    }

    const escapeCell = (val: unknown) =>
      `"${String(val ?? "").replace(/"/g, '""')}"`;

    const headers = [
      "Order Code",
      "Customer",
      "Email",
      "Phone",
      "Payment Method",
      "Total (RWF)",
      "Returned / Refunded",
      "Paid Order",
      "Delivered",
      "Commission 8% (RWF)",
      "Vendor Net 92% (RWF)",
      "Payment Status",
      "Fulfillment Status",
    ];

    const rows = searchedAndFilteredOrders.map((order) => {
      const state = getOrderCommissionState(order);
      return [
        getOrderCode(order),
        order.user?.name || "Guest Checkout",
        order.email || order.user?.email || "N/A",
        order.phoneNumber || order.user?.phone || "N/A",
        getPaymentMethodLabel((order as any).paymentMethod),
        state.total,
        state.isReturned ? "YES" : "NO",
        state.isPaid ? "YES" : "NO",
        state.isDelivered ? "YES" : "NO",
        state.commission,
        state.vendorPayout,
        order.paymentStatus,
        order.status,
      ]
        .map(escapeCell)
        .join(",");
    });

    const csv =
      "data:text/csv;charset=utf-8," +
      [headers.map(escapeCell).join(","), ...rows].join("\n");
    const uri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", uri);
    link.setAttribute("download", `Admin_Orders_${statusFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${searchedAndFilteredOrders.length} orders to CSV.`);
  };

  const paymentMethodStats = useMemo(() => {
    return PAYMENT_METHODS.map((method) => {
      const matching = searchedAndFilteredOrders.filter(
        (order) => (order as any).paymentMethod === method,
      );
      const paidMatching = matching.filter(
        (order) =>
          order.paymentStatus === "SUCCESS" && order.status !== "RETURNED",
      );

      const totalAmount = matching.reduce(
        (sum, order) => sum + Number(order.totalAmount || 0),
        0,
      );
      const paidAmount = paidMatching.reduce(
        (sum, order) => sum + Number(order.totalAmount || 0),
        0,
      );

      return {
        method,
        label: PAYMENT_METHOD_LABELS[method],
        orderVolume: matching.length,
        totalAmount,
        paidVolume: paidMatching.length,
        paidAmount,
      };
    });
  }, [searchedAndFilteredOrders]);

  const summary = useMemo(() => {
    const totalOrders = searchedAndFilteredOrders.length;

    const returnedOrders = searchedAndFilteredOrders.filter(
      (order) =>
        order.status === "RETURNED" || order.paymentStatus === "REFUNDED",
    );
    const returnedVolume = returnedOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0,
    );

    const paidOrders = searchedAndFilteredOrders.filter(
      (order) =>
        order.paymentStatus === "SUCCESS" && order.status !== "RETURNED",
    );
    const paidVolume = paidOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0,
    );

    const lockedOrders = paidOrders.filter(
      (order) => order.status === "DELIVERED",
    );
    const lockedRevenue = lockedOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0,
    );

    const lockedCommission = lockedRevenue * COMMISSION_RATE;
    const paidCommissionPipeline = paidVolume * COMMISSION_RATE;
    const pendingOrders = searchedAndFilteredOrders.filter(
      (order) => order.status?.toLowerCase() === "pending",
    ).length;

    return {
      totalOrders,
      returnedOrdersCount: returnedOrders.length,
      returnedVolume,
      paidOrdersCount: paidOrders.length,
      lockedOrdersCount: lockedOrders.length,
      paidVolume,
      lockedCommission,
      paidCommissionPipeline,
      pendingOrders,
    };
  }, [searchedAndFilteredOrders]);

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case "MOBILE_MONEY":
        return <Smartphone size={15} className="text-amber-400" />;
      case "CREDIT_CARD":
        return <CreditCard size={15} className="text-blue-400" />;
      case "CASH_ON_DELIVERY":
        return <Banknote size={15} className="text-emerald-400" />;
      case "WORKFORCE_WALLET":
        return <Wallet size={15} className="text-purple-400" />;
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    const baseline =
      "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ";
    switch (status?.toLowerCase()) {
      case "pending":
        return (
          baseline +
          "bg-amber-500/10 text-amber-500 border border-amber-500/20"
        );
      case "processing":
        return (
          baseline + "bg-blue-500/10 text-blue-400 border border-blue-500/20"
        );
      case "shipped":
        return (
          baseline +
          "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
        );
      case "delivered":
        return (
          baseline +
          "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
        );
      case "returned":
        return (
          baseline +
          "bg-orange-500/10 text-orange-400 border border-orange-500/20"
        );
      case "cancelled":
        return (
          baseline + "bg-rose-500/10 text-rose-500 border border-rose-500/20"
        );
      default:
        return (
          baseline + "bg-zinc-800 text-zinc-400 border border-zinc-700"
        );
    }
  };

  const getPaymentBadgeClass = (status?: string) => {
    const baseline =
      "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ";
    switch (status) {
      case "SUCCESS":
        return (
          baseline +
          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        );
      case "INITIALIZED":
      case "PENDING":
        return (
          baseline +
          "bg-amber-500/10 text-amber-400 border border-amber-500/20"
        );
      case "REFUNDED":
        return (
          baseline +
          "bg-orange-500/10 text-orange-400 border border-orange-500/20"
        );
      case "FAILED":
        return (
          baseline + "bg-rose-500/10 text-rose-400 border border-rose-500/20"
        );
      default:
        return (
          baseline + "bg-zinc-800 text-zinc-400 border border-zinc-700"
        );
    }
  };

  const buildVendorBreakdown = (order: Order) => {
    const grouped = new Map<
      string,
      { vendorName: string; revenue: number; items: OrderItem[] }
    >();
    const safeItems = order?.items || [];

    safeItems.forEach((item) => {
      const vendorId = item.vendorId || item.product?.vendor?.id || "global";
      const vendorName = getVendorLabel(item);
      const current = grouped.get(vendorId) || {
        vendorName,
        revenue: 0,
        items: [],
      };
      current.revenue +=
        Number(item.priceAtPurchase || 0) * Number(item.quantity || 0);
      current.items.push(item);
      grouped.set(vendorId, current);
    });

    return Array.from(grouped.values());
  };

  return (
    <div className="py-6 max-w-7xl mx-auto min-h-screen text-zinc-100 relative">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-end mb-8">
        <div>
          <h1 className="text-3xl uppercase font-extrabold text-zinc-100 tracking-tight flex items-center gap-3">
            <ClipboardList className="text-emerald-500" size={32} /> Logistics &amp;
            Commission Ledger
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Monitor Ingeni Market orders, payment method volumes &amp; amounts,
            returned/refunded volume, and 8% commission on paid orders.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-2 bg-zinc-900 text-zinc-300 px-4 py-2 rounded-2xl hover:bg-zinc-800 active:scale-95 transition-all text-xs font-semibold border border-zinc-800 shadow-sm cursor-pointer"
          >
            <Download size={14} className="text-emerald-400" /> Export CSV
          </button>

          <button
            type="button"
            onClick={() => void fetchAllOrders()}
            className="flex items-center gap-2 bg-zinc-900 text-zinc-300 px-4 py-2 rounded-2xl hover:bg-zinc-800 active:scale-95 transition-all text-xs font-semibold border border-zinc-800 shadow-sm cursor-pointer"
          >
            <RefreshCw
              size={14}
              className={loading ? "animate-spin text-emerald-500" : ""}
            />{" "}
            Sync Database
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider font-medium">
            <DollarSign size={16} className="text-emerald-500" /> Paid Volume
          </div>
          <div className="mt-3 text-2xl font-extrabold text-zinc-100">
            {formatRwf(summary.paidVolume)}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {summary.paidOrdersCount} of {summary.totalOrders} matching orders
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider font-medium">
            <CreditCard size={16} className="text-emerald-500" /> Locked Fee
            (8%)
          </div>
          <div className="mt-3 text-2xl font-extrabold text-emerald-400">
            {formatRwf(summary.lockedCommission)}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {summary.lockedOrdersCount} paid &amp; delivered
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider font-medium">
            <Package size={16} className="text-blue-400" /> Pipeline Fee (8%)
          </div>
          <div className="mt-3 text-2xl font-extrabold text-blue-400">
            {formatRwf(summary.paidCommissionPipeline)}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Across active SUCCESS orders
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider font-medium">
            <RotateCcw size={16} className="text-orange-400" /> Returned
            Volume
          </div>
          <div className="mt-3 text-2xl font-extrabold text-orange-400">
            {formatRwf(summary.returnedVolume)}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {summary.returnedOrdersCount} returned / refunded
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider font-medium">
            <Store size={16} className="text-amber-500" /> Pending Fulfillment
          </div>
          <div className="mt-3 text-2xl font-extrabold text-amber-500">
            {summary.pendingOrders}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Awaiting dispatch / delivery
          </p>
        </div>
      </div>

      {/* Payment Method Volume & Amount Breakdown */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Order Volume &amp; Amount by Payment Method
          </h2>
          {paymentMethodFilter !== "ALL" && (
            <button
              type="button"
              onClick={() => setPaymentMethodFilter("ALL")}
              className="text-xs text-emerald-400 hover:underline cursor-pointer"
            >
              Clear payment method filter
            </button>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {paymentMethodStats.map((stat) => {
            const isSelected = paymentMethodFilter === stat.method;
            return (
              <button
                type="button"
                key={stat.method}
                onClick={() =>
                  setPaymentMethodFilter((prev) =>
                    prev === stat.method ? "ALL" : stat.method,
                  )
                }
                className={`text-left rounded-2xl border p-4 transition-all cursor-pointer ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/80"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-200">
                    {getMethodIcon(stat.method)}
                    {stat.label}
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                    {stat.orderVolume}{" "}
                    {stat.orderVolume === 1 ? "order" : "orders"}
                  </span>
                </div>

                <div className="mt-2.5 text-xl font-extrabold text-zinc-100">
                  {formatRwf(stat.totalAmount)}
                </div>

                <div className="mt-1 text-[11px] text-zinc-400">
                  Paid:{" "}
                  <strong className="text-emerald-400">
                    {stat.paidVolume}
                  </strong>{" "}
                  ({formatRwf(stat.paidAmount)})
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search, Payment Method & Payment Status Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, customer, email, phone, or store..."
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="bg-zinc-900/80 border border-zinc-800 rounded-2xl px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Payment Methods</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                Method: {PAYMENT_METHOD_LABELS[m]}
              </option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-zinc-900/80 border border-zinc-800 rounded-2xl px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Payment States</option>
            {PAYMENT_STATUS_OPTIONS.map((p) => (
              <option key={p} value={p}>
                Payment: {p}
              </option>
            ))}
          </select>

          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="bg-zinc-900/80 border border-zinc-800 rounded-2xl px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-zinc-800 pb-4">
        {STATUS_OPTIONS.map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => setStatusFilter(tab === "ALL" ? "all" : tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              statusFilter === (tab === "ALL" ? "all" : tab)
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-zinc-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
          <ShieldAlert size={18} /> {error}
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-zinc-900/50 backdrop-blur-md rounded-3xl shadow-sm border border-zinc-800 overflow-hidden">
        {loading && paginatedOrders.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-zinc-500 gap-3">
            <Loader2 className="animate-spin text-emerald-500" size={36} />
            <p className="text-sm font-medium text-zinc-400">
              Loading transactional registers...
            </p>
          </div>
        ) : paginatedOrders.length === 0 ? (
          <div className="p-20 text-center text-zinc-500 space-y-3">
            <FileText className="mx-auto text-zinc-600" size={48} />
            <p className="text-sm font-medium">
              No order files match the active search or status filters.
            </p>
            {(searchQuery ||
              paymentFilter !== "ALL" ||
              paymentMethodFilter !== "ALL" ||
              statusFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setPaymentFilter("ALL");
                  setPaymentMethodFilter("ALL");
                  setStatusFilter("all");
                }}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-900/80 border-b border-zinc-800 text-xs font-bold uppercase text-zinc-400 tracking-wider">
                    <th className="p-4">Order / Customer</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4">Fulfillment</th>
                    <th className="p-4">Commission (8%) &amp; Payout</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-sm">
                  {paginatedOrders.map((order) => {
                    const state = getOrderCommissionState(order);
                    const emailInfo = lastEmailByOrderId[order.id];
                    const orderCode = getOrderCode(order);
                    const method = (order as any).paymentMethod as
                      | PaymentMethod
                      | undefined;

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-zinc-800/40 transition-colors group"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-zinc-200">
                              {orderCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => void handleCopyCode(orderCode)}
                              className="text-zinc-500 hover:text-zinc-200 cursor-pointer"
                              title="Copy Order Code"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                          <div className="text-xs text-zinc-300 font-medium mt-1">
                            {order.user?.name || "Guest Checkout"}
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            {order.email || order.user?.email || "No email"}
                          </div>
                        </td>

                        <td className="p-4 font-mono text-xs">
                          <div className="font-bold text-zinc-100">
                            {formatRwf(state.total)}
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {getPaymentMethodLabel(method)}
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex flex-col gap-1.5 items-start">
                            <span
                              className={getPaymentBadgeClass(
                                order.paymentStatus,
                              )}
                            >
                              {order.paymentStatus || "INITIALIZED"}
                            </span>
                            <select
                              disabled={updatingPaymentId === order.id}
                              value={order.paymentStatus || "INITIALIZED"}
                              onChange={(e) =>
                                void handlePaymentStatusChange(
                                  order,
                                  e.target.value,
                                )
                              }
                              className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-[11px] text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                            >
                              {PAYMENT_STATUS_OPTIONS.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex flex-col gap-1.5 items-start">
                            <span className={getStatusBadgeClass(order.status)}>
                              {order.status}
                            </span>
                            <select
                              disabled={updatingId === order.id}
                              value={order.status}
                              onChange={(e) =>
                                void handleStatusChange(order, e.target.value)
                              }
                              className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-[11px] text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                            >
                              {STATUS_OPTIONS.filter((s) => s !== "ALL").map(
                                (st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ),
                              )}
                            </select>
                            {emailInfo && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                                {emailInfo.success ? (
                                  <CheckCircle2
                                    size={11}
                                    className="text-emerald-400"
                                  />
                                ) : (
                                  <AlertCircle
                                    size={11}
                                    className="text-amber-400"
                                  />
                                )}
                                {emailInfo.success ? "Email sent" : "No email"}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-4 font-mono text-xs">
                          {state.isReturned ? (
                            <span className="text-orange-400 font-semibold">
                              Returned / Refunded
                            </span>
                          ) : state.isPaid ? (
                            <div className="space-y-0.5">
                              <div className="text-emerald-400 font-bold">
                                Fee: {formatRwf(state.commission)}
                              </div>
                              <div className="text-zinc-300">
                                Net: {formatRwf(state.vendorPayout)}
                              </div>
                              <div className="text-[10px] text-zinc-500">
                                {state.isLocked
                                  ? "Locked (Delivered)"
                                  : "Awaiting Delivery"}
                              </div>
                            </div>
                          ) : (
                            <span className="text-zinc-500">
                              Pending payment
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer"
                              title="View Order Details"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              type="button"
                              disabled={deletingOrderId === order.id}
                              onClick={() => void handleDeleteOrder(order.id)}
                              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer disabled:opacity-50"
                              title="Delete / Cancel Order"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-zinc-800 bg-zinc-900/40 text-xs">
              <div className="text-zinc-400">
                Showing{" "}
                <span className="font-bold text-zinc-200">
                  {startItemNumber}
                </span>
                –
                <span className="font-bold text-zinc-200">
                  {endItemNumber}
                </span>{" "}
                of{" "}
                <span className="font-bold text-zinc-200">{totalItems}</span>{" "}
                orders
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safeCurrentPage <= 1}
                  onClick={() =>
                    setCurrentPage((p) => Math.max(1, p - 1))
                  }
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-40 cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={15} />
                </button>

                {pageNumbers.map((page, idx) =>
                  page === "ellipsis" ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 text-zinc-500"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      type="button"
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                        safeCurrentPage === page
                          ? "bg-emerald-600 text-white"
                          : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-40 cursor-pointer"
                  aria-label="Next page"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">
                  Order Inspection
                </span>
                <h2 className="text-xl font-extrabold text-white">
                  {getOrderCode(selectedOrder)}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                <div className="text-zinc-500 uppercase text-[10px]">
                  Customer
                </div>
                <div className="text-zinc-100 font-bold">
                  {selectedOrder.user?.name || "Guest Checkout"}
                </div>
                <div className="text-zinc-400">
                  {selectedOrder.email || selectedOrder.user?.email || "N/A"}
                </div>
                <div className="text-zinc-400">
                  {selectedOrder.phoneNumber ||
                    selectedOrder.user?.phone ||
                    "N/A"}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                <div className="text-zinc-500 uppercase text-[10px]">
                  Settlement &amp; Channel
                </div>
                <div className="text-zinc-100 font-bold">
                  {getPaymentMethodLabel((selectedOrder as any).paymentMethod)}
                </div>
                <div className="text-zinc-400">
                  Payment: {selectedOrder.paymentStatus || "INITIALIZED"}
                </div>
                <div className="text-zinc-400">
                  Fulfillment: {selectedOrder.status}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Send size={13} className="text-emerald-400" /> Items &amp;
                Vendor Attribution
              </h3>
              <div className="divide-y divide-zinc-800 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                {(selectedOrder.items || []).map((item, idx) => {
                  const vendorInfo = resolveItemVendorDisplay(
                    item,
                    selectedOrder,
                  );
                  const lineTotal =
                    Number(item.priceAtPurchase || 0) *
                    Number(item.quantity || 1);
                  return (
                    <div
                      key={item.id || idx}
                      className="p-3.5 flex items-center justify-between gap-4 text-xs font-mono"
                    >
                      <div>
                        <div className="font-bold text-zinc-100">
                          {item.product?.title || `Item #${idx + 1}`}
                        </div>
                        <div className="text-zinc-400 text-[11px]">
                          Store: {vendorInfo.name}
                          {vendorInfo.meta ? ` (${vendorInfo.meta})` : ""}
                        </div>
                        <div className="text-zinc-500 text-[11px]">
                          Qty: {item.quantity || 1} ×{" "}
                          {formatRwf(Number(item.priceAtPurchase || 0))}
                        </div>
                      </div>
                      <div className="font-bold text-emerald-400">
                        {formatRwf(lineTotal)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Vendor Breakdown
              </h3>
              <div className="grid sm:grid-cols-2 gap-3 text-xs font-mono">
                {buildVendorBreakdown(selectedOrder).map((v) => (
                  <div
                    key={v.vendorName}
                    className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between"
                  >
                    <span className="text-zinc-200 font-semibold">
                      {v.vendorName}
                    </span>
                    <span className="text-emerald-400 font-bold">
                      {formatRwf(v.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
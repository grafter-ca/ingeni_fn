// components/vendor/VendorOverview.tsx
import { useEffect, useMemo } from "react";
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  CreditCard,
  RotateCcw,
  Wallet,
} from "lucide-react";
import { useOrderStore } from "../../store/useOrderStore";
import { useProductStore } from "../../store/productStore";
import { useAuthState } from "../../context/AuthContext";
import { useVendorStore } from "../../store/vendorStore";

const isPaidOrder = (order: any) => {
  const payStatus = String(order?.paymentStatus || "").toUpperCase();
  const status = String(order?.status || "").toUpperCase();
  return (
    ["SUCCESS", "PAID", "COMPLETED", "VERIFIED"].includes(payStatus) ||
    status === "DELIVERED"
  );
};

const isReturnedOrder = (order: any) => {
  const status = String(order?.status || "").toUpperCase();
  const payStatus = String(order?.paymentStatus || "").toUpperCase();
  return (
    ["RETURNED", "REFUNDED", "RETURN_REQUESTED"].includes(status) ||
    ["REFUNDED", "REVERSED"].includes(payStatus)
  );
};

const isDeliveredOrder = (order: any) => {
  const status = String(order?.status || "").toUpperCase();
  return status === "DELIVERED" || status === "COMPLETED";
};

const getOrderVendorValue = (order: any, vendorId?: string) => {
  const items = Array.isArray(order?.items) ? order.items : [];
  if (items.length > 0) {
    return items.reduce((sum: number, item: any) => {
      const itemVendorId = item?.vendorId ?? item?.vendor?.id ?? null;
      if (
        vendorId &&
        itemVendorId &&
        String(itemVendorId) !== String(vendorId)
      ) {
        return sum;
      }

      const explicitEarnings = Number(item?.vendorEarnings);
      if (Number.isFinite(explicitEarnings) && explicitEarnings > 0) {
        return sum + explicitEarnings;
      }

      const price = Number(item?.priceAtPurchase ?? item?.price ?? 0);
      const qty = Number(item?.quantity ?? 1);
      return sum + (Number.isFinite(price * qty) ? price * qty : 0);
    }, 0);
  }

  return Number(order?.totalAmount) || 0;
};

export const VendorOverview = () => {
  const {
    orders,
    fetchVendorOrders,
    initSocket,
    getVendorTotalRevenue,
    getVendorNetBalance,
  } = useOrderStore();
  const { products, fetchVendorProducts } = useProductStore();
  const { user } = useAuthState();
  const { selectedVendor, fetchVendorDashboardData, fetchVendorById } =
    useVendorStore();

  const userId = user?.id;
  const vendorId = selectedVendor?.id || (user as any)?.vendorId;

  useEffect(() => {
    initSocket();
    void fetchVendorOrders();
    void fetchVendorProducts(vendorId);
    void fetchVendorDashboardData();
    if (userId) {
      void fetchVendorById(userId);
    }
  }, [
    initSocket,
    userId,
    vendorId,
    fetchVendorOrders,
    fetchVendorProducts,
    fetchVendorDashboardData,
    fetchVendorById,
  ]);

  const safeOrders = useMemo(
    () => (Array.isArray(orders) ? orders : []),
    [orders],
  );

  const safeProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter((product) => {
      if (!vendorId) return true;
      const pVendorId = product.vendorId || product.vendor?.id;
      return !pVendorId || String(pVendorId) === String(vendorId);
    });
  }, [products, vendorId]);

  // Gross revenue across active orders
  const totalRevenue = useMemo(() => {
    const storeGross =
      typeof getVendorTotalRevenue === "function"
        ? Number(getVendorTotalRevenue(vendorId)) || 0
        : 0;

    if (storeGross > 0) {
      return storeGross;
    }

    return safeOrders.reduce((acc, order) => {
      const status = String(order?.status || "").toUpperCase();
      if (status === "CANCELLED" || status === "FAILED") {
        return acc;
      }
      return acc + getOrderVendorValue(order, vendorId);
    }, 0);
  }, [safeOrders, vendorId, getVendorTotalRevenue]);

  // Net vendor earnings across all items in each order
  const totalEarnings = useMemo(() => {
    const storeNet =
      typeof getVendorNetBalance === "function"
        ? Number(getVendorNetBalance(vendorId)) || 0
        : 0;

    if (storeNet > 0) {
      return storeNet;
    }

    return safeOrders.reduce((acc, order) => {
      const status = String(order?.status || "").toUpperCase();
      if (status === "CANCELLED" || status === "FAILED" || isReturnedOrder(order)) {
        return acc;
      }
      return acc + getOrderVendorValue(order, vendorId);
    }, 0);
  }, [safeOrders, vendorId, getVendorNetBalance]);

  // Order & payment status breakdowns
  const orderMetrics = useMemo(() => {
    let pendingOrders = 0;
    let deliveredOrders = 0;
    let deliveredAmount = 0;
    let returnedOrders = 0;
    let returnedAmount = 0;
    let paidOrders = 0;
    let paidAmount = 0;
    let unpaidOrders = 0;
    let unpaidAmount = 0;

    const paymentMethodsMap = new Map<
      string,
      { method: string; count: number; amount: number; paidCount: number }
    >();

    for (const order of safeOrders) {
      const status = String(order?.status || "PENDING").toUpperCase();
      const amount = getOrderVendorValue(order, vendorId);
      const rawMethod = String(order?.paymentMethod || "UNSPECIFIED")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_");

      if (status === "PENDING") {
        pendingOrders += 1;
      }

      if (isDeliveredOrder(order)) {
        deliveredOrders += 1;
        deliveredAmount += amount;
      }

      if (isReturnedOrder(order)) {
        returnedOrders += 1;
        returnedAmount += amount;
      }

      const paid = !isReturnedOrder(order) && isPaidOrder(order);
      if (paid) {
        paidOrders += 1;
        paidAmount += amount;
      } else if (status !== "CANCELLED" && status !== "FAILED") {
        unpaidOrders += 1;
        unpaidAmount += amount;
      }

      const currentMethod = paymentMethodsMap.get(rawMethod) || {
        method: rawMethod.replace(/_/g, " "),
        count: 0,
        amount: 0,
        paidCount: 0,
      };
      currentMethod.count += 1;
      currentMethod.amount += amount;
      if (paid) {
        currentMethod.paidCount += 1;
      }
      paymentMethodsMap.set(rawMethod, currentMethod);
    }

    const paymentMethods = Array.from(paymentMethodsMap.values()).sort(
      (a, b) => b.amount - a.amount,
    );

    return {
      pendingOrders,
      deliveredOrders,
      deliveredAmount,
      returnedOrders,
      returnedAmount,
      paidOrders,
      paidAmount,
      unpaidOrders,
      unpaidAmount,
      paymentMethods,
    };
  }, [safeOrders, vendorId]);

  const statCards = [
    {
      label: "Gross Sales / Revenue",
      value: `RWF ${totalRevenue.toLocaleString()}`,
      change: "Active marketplace pool",
      icon: DollarSign,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Net Sales Earnings",
      value: `RWF ${totalEarnings.toLocaleString()}`,
      change: "Active vendor earnings after tax",
      icon: Wallet,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Active Products",
      value: safeProducts.length,
      change: "In stock & listed",
      icon: Package,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Total Orders",
      value: safeOrders.length,
      change: `${orderMetrics.pendingOrders} pending fulfillment`,
      icon: ShoppingCart,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
  ];

  const fulfillmentAndPaymentCards = [
    {
      label: "Success Paid Orders",
      value: orderMetrics.paidOrders,
      subValue: `RWF ${orderMetrics.paidAmount.toLocaleString()}`,
      hint: `${orderMetrics.unpaidOrders} pending/unpaid (RWF ${orderMetrics.unpaidAmount.toLocaleString()})`,
      icon: CheckCircle2,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Delivered Orders",
      value: orderMetrics.deliveredOrders,
      subValue: `RWF ${orderMetrics.deliveredAmount.toLocaleString()}`,
      hint: "Completed & received by customers",
      icon: Package,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Returned / Refunded",
      value: orderMetrics.returnedOrders,
      subValue: `RWF ${orderMetrics.returnedAmount.toLocaleString()}`,
      hint: "Returned or refunded order volume",
      icon: RotateCcw,
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-linear-to-r from-blue-900/40 via-[#0c0c0e] to-[#0c0c0e] border border-white/10 relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-[10px] uppercase tracking-wider mb-4">
            <TrendingUp size={12} />
            <span>Storefront Telemetry Active</span>
          </div>
          <h1 className="font-poppins font-bold text-2xl md:text-4xl text-white tracking-tight mb-2">
            Welcome back,{" "}
            {selectedVendor?.storeName || user?.name || "Vendor"}
          </h1>
          <p className="font-mono text-xs text-gray-400 leading-relaxed">
            Monitor your real-time store performance metrics, payment
            clearances, returned or delivered orders, and live customer
            shipments directly from your dashboard.
          </p>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(
          ({ label, value, change, icon: Icon, color }, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-[#0c0c0e] border border-white/10 shadow-xl flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs uppercase tracking-wider text-gray-400">
                  {label}
                </span>
                <div className={`p-3 rounded-xl border ${color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <div>
                <div className="font-poppins font-bold text-2xl md:text-3xl text-white mb-1 tracking-tight">
                  {value}
                </div>
                <div className="font-mono text-[11px] text-gray-500 flex items-center gap-1">
                  <ArrowUpRight size={12} className="text-emerald-400" />
                  <span>{change}</span>
                </div>
              </div>
            </div>
          ),
        )}
      </div>

      {/* Paid, Delivered & Returned Orders Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {fulfillmentAndPaymentCards.map(
          ({ label, value, subValue, hint, icon: Icon, color }, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-[#0c0c0e] border border-white/10 shadow-xl flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs uppercase tracking-wider text-gray-400">
                  {label}
                </span>
                <div className={`p-2.5 rounded-xl border ${color}`}>
                  <Icon size={18} />
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="font-poppins font-bold text-2xl text-white">
                    {value} {value === 1 ? "order" : "orders"}
                  </span>
                  <span className="font-mono text-xs font-bold text-blue-400">
                    {subValue}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-gray-500">{hint}</p>
              </div>
            </div>
          ),
        )}
      </div>

      {/* Payment Methods Breakdown */}
      <div className="rounded-3xl bg-[#0c0c0e] border border-white/10 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <CreditCard size={18} />
            </div>
            <div>
              <h2 className="font-poppins font-bold text-lg text-white">
                Stats by Payment Method
              </h2>
              <p className="font-mono text-[11px] text-gray-400">
                Order counts, cleared payments, and volume per payment channel.
              </p>
            </div>
          </div>
        </div>

        {orderMetrics.paymentMethods.length === 0 ? (
          <p className="text-center py-6 font-mono text-xs text-gray-500">
            No payment method data available yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orderMetrics.paymentMethods.map((pm) => (
              <div
                key={pm.method}
                className="p-4 rounded-2xl bg-white/2 border border-white/10 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase text-white">
                    {pm.method}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono text-[10px]">
                    {pm.count} {pm.count === 1 ? "order" : "orders"}
                  </span>
                </div>
                <div className="font-poppins font-bold text-xl text-emerald-400">
                  RWF {pm.amount.toLocaleString()}
                </div>
                <p className="font-mono text-[11px] text-gray-400">
                  Paid cleared: {pm.paidCount} / {pm.count}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Orders Preview Section */}
      <div className="rounded-3xl bg-[#0c0c0e] border border-white/10 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div>
            <h2 className="font-poppins font-bold text-lg text-white">
              Recent Customer Orders
            </h2>
            <p className="font-mono text-[11px] text-gray-400">
              Latest transactions requiring fulfillment attention.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-gray-500 text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer Contact</th>
                <th className="py-3 px-4">Method &amp; Payment</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {safeOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No orders recorded yet.
                  </td>
                </tr>
              ) : (
                safeOrders.slice(0, 5).map((order) => {
                  const paid = !isReturnedOrder(order) && isPaidOrder(order);
                  const methodLabel = order?.paymentMethod
                    ? String(order.paymentMethod).replace(/_/g, " ")
                    : "N/A";
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-white/2 transition"
                    >
                      <td className="py-3.5 px-4 font-bold text-white">
                        #{order.orderNumber}
                      </td>
                      <td className="py-3.5 px-4 text-gray-300">
                        {order.phoneNumber || "N/A"}
                      </td>
                      <td className="py-3.5 px-4 text-gray-300">
                        <span className="capitalize">{methodLabel}</span>
                        <span
                          className={`ml-2 px-2 py-0.5 rounded text-[10px] font-semibold ${
                            paid
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {paid ? "PAID" : order?.paymentStatus || "PENDING"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-blue-400">
                        RWF{" "}
                        {Number(order.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold ${
                            isDeliveredOrder(order)
                              ? "bg-emerald-500/10 text-emerald-400"
                              : isReturnedOrder(order)
                                ? "bg-rose-500/10 text-rose-400"
                                : order.status === "SHIPPED"
                                  ? "bg-blue-500/10 text-blue-400"
                                  : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {isDeliveredOrder(order) ? (
                            <CheckCircle2 size={10} />
                          ) : isReturnedOrder(order) ? (
                            <RotateCcw size={10} />
                          ) : (
                            <Clock size={10} />
                          )}
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
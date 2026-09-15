// components/vendor/VendorOrdersView.tsx
// Complete updated VendorOrdersView with fully integrated payment status toggling

import { useState, useEffect } from "react";
import { 
  ShoppingCart, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Search, 
  CreditCard, 
  Trash2, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  Store,
  Package
} from "lucide-react";
import { useOrderStore } from "../../store/useOrderStore";

interface OrderItem {
  id?: string;
  title?: string;
  quantity?: number;
  price?: number;
  priceAtPurchase?: number;
  commissionAmount?: number;
  commissionRate?: number;
  vendorEarnings?: number;
  location?: string;
  vendor?: {
    storeName?: string;
    address?: string;
  };
  product?: {
    title?: string;
    location?: string;
    store?: {
      name?: string;
    };
  };
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt?: string | number | Date;
  email?: string;
  customerEmail?: string;
  phoneNumber?: string;
  shippingAddress?: string;
  paymentStatus?: string;
  status: string;
  totalAmount?: number;
  taxAmount?: number;
  items?: OrderItem[];
}

export const VendorOrdersView = () => {
  const { 
    filteredOrders, 
    loading, 
    fetchVendorOrders, 
    updateOrderStatus, 
    updatePaymentStatus, 
    setStatusFilter, 
    statusFilter,
    removeOrder 
  } = useOrderStore() as any;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const itemsPerPage = 6;

  // Fetch vendor-specific orders on mount
  useEffect(() => {
    if (typeof fetchVendorOrders === "function") {
      fetchVendorOrders();
    }
  }, [fetchVendorOrders]);

  // Handle status filter change using the store action and reset page
  const handleStatusChange = (status: string) => {
    if (typeof setStatusFilter === "function") {
      setStatusFilter(status);
    }
    setCurrentPage(1);
  };

  // Filter orders locally by order number, customer email, or store name
  const safeOrders: Order[] = Array.isArray(filteredOrders) ? filteredOrders : [];
  const filteredOrdersList = safeOrders.filter((order) => {
    const storeName = order?.items?.[0]?.vendor?.storeName || "";
    const matchesSearch = 
      (order?.orderNumber && order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order?.email && order.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (storeName && storeName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  // Pagination computations
  const totalPages = Math.ceil(filteredOrdersList.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedOrders = filteredOrdersList.slice(startIndex, startIndex + itemsPerPage);

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm("Are you sure you want to delete this order record?")) {
      if (typeof removeOrder === "function") {
        await removeOrder(orderId);
      }
      if (typeof fetchVendorOrders === "function") {
        fetchVendorOrders();
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Page Header */}
      <div className="flex flex-col gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart size={14} className="text-blue-400" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-blue-400">Order Fulfillment & Store Ledger</span>
          </div>
          <h1 className="font-poppins font-bold text-2xl md:text-3xl text-white tracking-tight">Customer Orders</h1>
        </div>
        
        {/* Status Filter Pills */}
        <div className="flex items-center flex-wrap gap-1.5 bg-[#0c0c0e] p-1.5 rounded-2xl border border-white/10 overflow-x-auto">
          {["all", "PENDING", "SHIPPED","RETURNED","PROCESSING", "DELIVERED", "CANCELLED"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => handleStatusChange(status)}
              className={`px-3 py-1.5 rounded-xl font-mono text-[11px] uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
                (statusFilter || "all").toLowerCase() === status.toLowerCase() 
                  ? "bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/25" 
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar & Stats info */}
      <div className="p-4 rounded-2xl bg-[#0c0c0e] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by order ID, email, or store name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-blue-500/50 transition placeholder:text-gray-500"
          />
        </div>
        <div className="font-mono text-xs text-gray-400">
          Showing <span className="text-white font-bold">{filteredOrdersList.length > 0 ? startIndex + 1 : 0}</span>-
          <span className="text-white font-bold">{Math.min(startIndex + itemsPerPage, filteredOrdersList.length)}</span> of{" "}
          <span className="text-white font-bold">{filteredOrdersList.length}</span> orders
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="rounded-3xl bg-[#0c0c0e] border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-gray-500 text-[10px] uppercase tracking-wider bg-white/[0.01]">
                <th className="py-4 px-6">Order / Date</th>
                <th className="py-4 px-6">Customer & Address</th>
                <th className="py-4 px-6">Payment Status</th>
                <th className="py-4 px-6">Net Earnings</th>
                <th className="py-4 px-6">Commission</th>
                <th className="py-4 px-6">Order Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="h-4 w-20 bg-white/10 rounded mb-1.5" />
                      <div className="h-3 w-14 bg-white/5 rounded" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 w-36 bg-white/10 rounded mb-1.5" />
                      <div className="h-3 w-24 bg-white/5 rounded" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-6 w-24 bg-white/10 rounded-full" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 w-20 bg-white/10 rounded mb-1" />
                      <div className="h-3 w-12 bg-white/5 rounded" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 w-16 bg-white/10 rounded mb-1" />
                      <div className="h-3 w-10 bg-white/5 rounded" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-2">
                        <div className="h-6 w-24 bg-white/10 rounded-full" />
                        <div className="h-6 w-28 bg-white/5 rounded-lg" />
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <div className="h-8 w-8 bg-white/10 rounded-xl" />
                        <div className="h-8 w-8 bg-white/10 rounded-xl" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-500 font-mono text-xs">
                    No orders matching your criteria found.
                  </td>
                </tr>
              ) : (
                displayedOrders.map((order) => {
                  const isPaid = order.paymentStatus === "SUCCESS";
                  const isDelivered = order.status === "DELIVERED";
                  const isReady = isPaid && isDelivered;

                  const total = Number(order.totalAmount || 0);
                  const firstItem = order.items?.[0];
                  const commission = Number(firstItem?.commissionAmount || total * 0.10);
                  const netEarnings = Number(firstItem?.vendorEarnings || total - commission);

                  const customerEmail = order.email || order.customerEmail || "No email provided";
                  return (
                    <tr key={order.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-4 px-6 font-bold text-white">
                        #{order.orderNumber}
                        <span className="block text-[10px] text-gray-500 font-normal">
                          {new Date(order.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <span className="text-gray-200 font-bold block">{customerEmail}</span>
                        <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-white/5 text-[10px]">
                          <span className="text-blue-400 font-semibold">Location : {order.shippingAddress || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Payment Status Badge & Toggle Dropdown */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            order.paymentStatus === 'SUCCESS' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : order.paymentStatus === 'FAILED'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            <CreditCard size={10} />
                            {order.paymentStatus || 'INITIALIZED'}
                          </span>

                          <select
                            value={order.paymentStatus || 'INITIALIZED'}
                            onChange={(e) => {
                              if (typeof updatePaymentStatus === "function") {
                                updatePaymentStatus(order.id, e.target.value);
                              }
                            }}
                            className="bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white font-mono focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="INITIALIZED" className="bg-[#0c0c0e] text-amber-400">INITIALIZED</option>
                            <option value="PENDING" className="bg-[#0c0c0e] text-amber-400">PENDING</option>
                            <option value="SUCCESS" className="bg-[#0c0c0e] text-emerald-400">SUCCESS</option>
                            <option value="FAILED" className="bg-[#0c0c0e] text-rose-400">FAILED</option>
                            <option value="REFUNDED" className="bg-[#0c0c0e] text-rose-400">REFUNDED</option>
                          </select>
                        </div>
                      </td>

                      {/* Net Earnings */}
                      <td className="py-4 px-6">
                        {isReady ? (
                          <div className="space-y-0.5">
                            <span className="text-emerald-400 font-bold">RWF {netEarnings.toLocaleString()}</span>
                            <span className="text-[9px] text-emerald-500/80 font-bold uppercase tracking-wider block">✓ Ready</span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="text-gray-400 font-bold">RWF {netEarnings.toLocaleString()}</span>
                            <p className="text-amber-500/80 text-[9px] italic">Locked (Pending)</p>
                          </div>
                        )}
                      </td>

                      {/* Commission Breakdown */}
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <span className="text-gray-400 font-bold">RWF {commission.toLocaleString()}</span>
                          <span className="text-[9px] text-gray-500 block">10% Fee</span>
                        </div>
                      </td>

                      {/* Fulfillment Status & Toggle Dropdown */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold ${
                            order.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            order.status === 'SHIPPED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                            order.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {order.status === 'DELIVERED' ? <CheckCircle2 size={12} /> :
                             order.status === 'SHIPPED' ? <Truck size={12} /> : <Clock size={12} />}
                            {order.status}
                          </span>
                          
                          <select
                            value={order.status}
                            onChange={(e) => {
                              if (typeof updateOrderStatus === "function") {
                                updateOrderStatus(order.id, e.target.value);
                              }
                            }}
                            className="bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white font-mono focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="PENDING" className="bg-[#0c0c0e] text-amber-400">PENDING</option>
                            <option value="PROCESSING" className="bg-[#0c0c0e] text-amber-400">PROCESSING</option>
                            <option value="SHIPPED" className="bg-[#0c0c0e] text-blue-400">SHIPPED</option>
                            <option value="DELIVERED" className="bg-[#0c0c0e] text-emerald-400">DELIVERED</option>
                            <option value="RETURNED" className="bg-[#0c0c0e] text-emerald-400">RETURNED</option>
                            <option value="CANCELLED" className="bg-[#0c0c0e] text-rose-400">CANCELLED</option>
                          </select>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderDetails(order)}
                            title="View Order Details & Customer Info"
                            className="p-2 rounded-xl bg-gray-500/10 text-gray-300 hover:bg-gray-500/20 hover:text-white transition cursor-pointer inline-flex items-center justify-center"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order.id)}
                            title="Delete Order"
                            className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-white transition cursor-pointer inline-flex items-center justify-center"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {!loading && filteredOrdersList.length > itemsPerPage && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/[0.01]">
            <div className="font-mono text-xs text-gray-400">
              Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrderDetails && (() => {
        console.log("Order detail",selectedOrderDetails)
        const detailCustEmail = selectedOrderDetails.email || selectedOrderDetails.customerEmail || "N/A";
        const detailCustPhone = selectedOrderDetails.phoneNumber || "N/A";
        const detailShippingAddr = selectedOrderDetails.shippingAddress || "N/A";
        
        const firstItem = selectedOrderDetails.items?.[0];
        const detailVendorStore = firstItem?.vendor?.storeName || "N/A";
        const detailStoreAddress = firstItem?.vendor?.address || "N/A";

        const totalAmt = Number(selectedOrderDetails.totalAmount || 0);
        const commAmt = Number(firstItem?.commissionAmount || totalAmt * 0.10);
        const commRate = Number(firstItem?.commissionRate || "");
        const TaxAmt = Number(selectedOrderDetails.taxAmount || 0)
        const netAmt = Number(firstItem?.vendorEarnings || totalAmt - commAmt);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0c0c0e] border border-white/10 shadow-2xl p-6 sm:p-8 space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400">Detailed Invoice & Summary</span>
                  <h2 className="font-poppins font-bold text-xl text-white">Order #{selectedOrderDetails.orderNumber}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrderDetails(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-blue-950/10 border border-blue-500/20 font-mono text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                    <Store size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">Vendor Store</span>
                    <span className="text-white font-bold">{detailVendorStore}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                    <Package size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">Store Location</span>
                    <span className="text-white font-bold">{detailStoreAddress}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-poppins font-semibold text-sm text-gray-300 uppercase tracking-wider">Customer Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10 font-mono text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                      <Mail size={16} />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase">Email Address</span>
                      <span className="text-white">{detailCustEmail}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                      <Phone size={16} />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase">Phone Number</span>
                      <span className="text-white">{detailCustPhone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase">Customer Address</span>
                      <span className="text-white line-clamp-1">{detailShippingAddr}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-poppins font-semibold text-sm text-gray-300 uppercase tracking-wider">Order Items</h3>
                <div className="rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden font-mono text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-500 text-[10px] uppercase">
                        <th className="py-3 px-4">Item</th>
                        <th className="py-3 px-4 text-center">Qty</th>
                        <th className="py-3 px-4 text-right">Price</th>
                        <th className="py-3 px-4 text-right">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {Array.isArray(selectedOrderDetails.items) && selectedOrderDetails.items.length > 0 ? (
                        selectedOrderDetails.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.02]">
                            <td className="py-3 px-4 font-bold text-white">
                              {item.product?.title || item.title || `Product #${idx + 1}`}
                            </td>
                            <td className="py-3 px-4 text-center text-gray-300">{item.quantity || 0}</td>
                            <td className="py-3 px-4 text-right text-blue-400">RWF {Number(item.priceAtPurchase || item.price || 0).toLocaleString()}</td>
                            <td className="py-3 px-4 text-right text-blue-400">{item.product?.location || 'N/A'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-gray-500">No items available for this order.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/20 font-mono text-xs space-y-2">
                <div className="flex justify-between text-gray-400">
                  <span>Total Gross Amount:</span>
                  <span className="text-white font-bold">RWF {totalAmt.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Platform Commission ({commRate*100}%):</span>
                  <span className="text-amber-400">RWF {commAmt.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>VAT Taxes (10%):</span>
                  <span className="text-amber-400">RWF {TaxAmt.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-300 pt-2 border-t border-white/10 font-bold text-sm">
                  <span>Vendor Net Payout:</span>
                  <span className="text-emerald-400">RWF {netAmt.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedOrderDetails(null)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-poppins font-semibold text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
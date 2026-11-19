import { useState, useEffect } from 'react';
import {
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Download,
  Smartphone,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { useVendorStore } from '../../store/vendorStore';
import { useOrderStore } from '../../store/useOrderStore';
import { useAuthState } from '../../context/AuthContext';
import { socket } from '../../libs/socket.client';

export const VendorFinancials = () => {
  const { user } = useAuthState();
  const {
    requests,
    vendorSettings,
    isLoading,
    fetchVendorFinancials,
    fetchVendorSettings,
    requestCashout,
  } = useVendorStore();
  const { orders, fetchVendorOrders } = useOrderStore();

  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState(user?.phone || '+250');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'month', 'quarter'

  const vendorId = user?.vendorId || user?.id;

  useEffect(() => {
    void fetchVendorOrders();
    if (typeof fetchVendorSettings === 'function') {
      void fetchVendorSettings();
    }
    if (vendorId) {
      void fetchVendorFinancials(vendorId);
    }
  }, [vendorId, fetchVendorFinancials, fetchVendorOrders, fetchVendorSettings]);

  useEffect(() => {
    const preferredPhone =
      vendorSettings?.momoNumber || vendorSettings?.phone || user?.phone;
    if (preferredPhone && (!phone || phone === '+250')) {
      setPhone(preferredPhone);
    }
  }, [vendorSettings?.momoNumber, vendorSettings?.phone, user?.phone, phone]);

  useEffect(() => {
    const handleRequestUpdated = (payload: {
      vendorId?: string | null;
      userId?: string | null;
    }) => {
      const belongsToCurrent =
        (payload.vendorId && payload.vendorId === vendorId) ||
        (payload.userId && payload.userId === user?.id);

      if (belongsToCurrent && vendorId) {
        void fetchVendorFinancials(vendorId);
      }
    };

    socket?.on?.('admin:request-updated', handleRequestUpdated);
    return () => {
      socket?.off?.('admin:request-updated', handleRequestUpdated);
    };
  }, [fetchVendorFinancials, user?.id, vendorId]);

  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeRequests = Array.isArray(requests) ? requests : [];

  const now = new Date();
  const filteredOrders = safeOrders.filter((order) => {
    if (dateFilter === 'all') return true;
    const orderDate = new Date(order.createdAt || Date.now());
    const diffTime = Math.abs(now.getTime() - orderDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (dateFilter === 'month') return diffDays <= 30;
    if (dateFilter === 'quarter') return diffDays <= 90;
    return true;
  });

  // Gross sales/revenue
  const totalRevenue = filteredOrders.reduce((acc, order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const orderRev = items.reduce((itemAcc, item) => {
      const price = Number(item?.priceAtPurchase) || 0;
      const qty = Number(item?.quantity) || 1;
      return itemAcc + price * qty;
    }, 0);
    return acc + orderRev;
  }, 0);

  // Platform commission (8%) on paid & delivered orders
  const totalCommission = filteredOrders.reduce((acc, order) => {
    const isPaid = order.paymentStatus?.toUpperCase() === 'SUCCESS';
    const isDelivered = order.status?.toUpperCase() === 'DELIVERED';
    if (!isPaid || !isDelivered) return acc;

    const items = Array.isArray(order.items) ? order.items : [];
    const orderComm = items.reduce((itemAcc, item) => {
      const lineTotal =
        (Number(item?.priceAtPurchase) || 0) * (Number(item?.quantity) || 1);
      return itemAcc + lineTotal * 0.08;
    }, 0);
    return acc + orderComm;
  }, 0);

  // Raw net earnings from paid & delivered orders
  const rawNetEarnings = filteredOrders.reduce((acc, order) => {
    const isPaid = order.paymentStatus?.toUpperCase() === 'SUCCESS';
    const isDelivered = order.status?.toUpperCase() === 'DELIVERED';
    if (!isPaid || !isDelivered) return acc;

    const items = Array.isArray(order.items) ? order.items : [];
    const orderEarnings = items.reduce((itemAcc, item) => {
      const earnings = Number(item?.vendorEarnings) || 0;
      const lineTotal =
        (Number(item?.priceAtPurchase) || 0) * (Number(item?.quantity) || 1);
      const computed = earnings > 0 ? earnings : lineTotal * 0.92;
      return itemAcc + computed;
    }, 0);
    return acc + orderEarnings;
  }, 0);

  // Returned / cancelled order deductions
  const refundedDeductions = filteredOrders.reduce((acc, order) => {
    const statusUpper = order.status?.toUpperCase();
    if (statusUpper !== 'RETURNED' && statusUpper !== 'CANCELLED') return acc;

    const items = Array.isArray(order.items) ? order.items : [];
    const orderRef = items.reduce((sum, item) => {
      const lineTotal =
        (Number(item?.priceAtPurchase) || 0) * (Number(item?.quantity) || 1);
      return sum + lineTotal * 0.92;
    }, 0);
    return acc + orderRef;
  }, 0);

  // Approved / resolved cashouts deducted from available net balance
  const totalApprovedCashouts = safeRequests
    .filter((req) => {
      const st = (req.status || '').toUpperCase();
      return req.type === 'CASHOUT' && (st === 'APPROVED' || st === 'RESOLVED');
    })
    .reduce((sum, req) => sum + Number(req.amount || 0), 0);

  const netBalance = Math.max(
    0,
    rawNetEarnings - totalApprovedCashouts - refundedDeductions,
  );

  const escapeCsvCell = (val: unknown) =>
    `"${String(val ?? '').replace(/"/g, '""')}"`;

  const handleExportStatement = () => {
    const headers = [
      'Order ID',
      'Date',
      'Customer Email',
      'Status',
      'Payment Status',
      'Total Gross (RWF)',
      'Vendor Earnings (RWF)',
    ];

    const rows = filteredOrders.map((o) => {
      const dateStr = new Date(o.createdAt || Date.now()).toLocaleDateString();
      const email = o.email || 'N/A';
      const items = Array.isArray(o.items) ? o.items : [];
      const gross = items.reduce(
        (sum, i) => sum + Number(i.priceAtPurchase || 0) * Number(i.quantity || 1),
        0,
      );
      const earnings = items.reduce((sum, i) => {
        const lineTotal =
          Number(i.priceAtPurchase || 0) * Number(i.quantity || 1);
        return sum + (Number(i.vendorEarnings) > 0 ? Number(i.vendorEarnings) : lineTotal * 0.92);
      }, 0);

      return [
        o.orderNumber,
        dateStr,
        email,
        o.status,
        o.paymentStatus || 'INITIALIZED',
        gross,
        earnings,
      ]
        .map(escapeCsvCell)
        .join(',');
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.map(escapeCsvCell).join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Ingeni_Store_Financial_Statement_${dateFilter}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCashoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount);

    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setFeedback('Please enter a valid cashout amount.');
      return;
    }

    if (numericAmount > netBalance) {
      setFeedback('Requested amount exceeds your available net balance.');
      return;
    }

    if (!phone.trim()) {
      setFeedback('Please enter a valid Mobile Money payout number.');
      return;
    }

    try {
      setSubmitting(true);
      setFeedback('');
      await requestCashout(vendorId!, String(numericAmount), phone.trim());
      setAmount('');
      setFeedback('Cashout request successfully submitted to admin!');
      if (vendorId) {
        await fetchVendorFinancials(vendorId);
      }
    } catch {
      setFeedback('Failed to submit cashout request. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn font-mono">
      {/* Header Banner & Controls */}
      <div className="p-8 rounded-3xl bg-linear-to-r from-emerald-950/40 via-[#0c0c0e] to-[#0c0c0e] border border-white/10 shadow-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase tracking-wider mb-4">
            <DollarSign size={12} />
            <span>Financial Ledger & Payouts</span>
          </div>
          <h1 className="font-poppins font-bold text-2xl md:text-4xl text-white tracking-tight mb-2">
            Earnings & MoMo Withdrawals
          </h1>
          <p className="text-xs text-gray-400 leading-relaxed max-w-xl">
            Track marketplace sales, monitor 8% platform commission deductions, export CSV statements, and dispatch fast cashout requests directly to Mobile Money.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All-Time Period</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 90 Days</option>
          </select>

          <button
            type="button"
            onClick={handleExportStatement}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-white/10 shadow-xl">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">
            Total Sales / Revenue
          </span>
          <div className="font-poppins font-bold text-2xl text-white">
            RWF {totalRevenue.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-400 mt-2 inline-flex items-center gap-1">
            <ShieldCheck size={12} /> MoMo + Verified COD
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-white/10 shadow-xl">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">
            Platform Commission (8%)
          </span>
          <div className="font-poppins font-bold text-2xl text-amber-400">
            RWF {totalCommission.toLocaleString()}
          </div>
          <span className="text-[10px] text-gray-500 mt-2 block">
            Deducted server-side per order
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-white/10 shadow-xl">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">
            Returns / Adjustments
          </span>
          <div className="font-poppins font-bold text-2xl text-rose-400">
            - RWF {refundedDeductions.toLocaleString()}
          </div>
          <span className="text-[10px] text-gray-500 mt-2 inline-flex items-center gap-1">
            <RotateCcw size={12} /> Refunded / Cancelled orders
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c0c0e] border shadow-xl border-blue-500/30 bg-linear-to-br from-blue-950/20 to-[#0c0c0e]">
          <span className="text-[10px] uppercase tracking-wider text-blue-400 block mb-1">
            Available Net Balance
          </span>
          <div className="font-poppins font-bold text-2xl text-emerald-400">
            RWF {netBalance.toLocaleString()}
          </div>
          <span className="text-[10px] text-gray-400 mt-2 block">
            Ready for instant MoMo withdrawal
          </span>
        </div>
      </div>

      {/* Cashout Request Section & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 rounded-3xl bg-[#0c0c0e] border border-white/10 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-poppins font-bold text-lg text-white">Request Cashout</h2>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Smartphone size={16} />
            </div>
          </div>
          <p className="text-[11px] text-gray-400">
            Withdraw funds securely to your saved MTN/Airtel Mobile Money account.
          </p>

          <form onSubmit={handleCashoutSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-2">
                Amount (RWF)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-2">
                Payout MoMo Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+250..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {feedback && (
              <p
                className={`text-xs ${
                  feedback.toLowerCase().includes('success')
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                {feedback}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 disabled:opacity-50 cursor-pointer"
            >
              <Send size={14} />
              <span>{submitting ? 'Submitting Request...' : 'Send Cashout Request'}</span>
            </button>
          </form>
        </div>

        {/* Request History Table */}
        <div className="lg:col-span-2 rounded-3xl bg-[#0c0c0e] border border-white/10 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-poppins font-bold text-lg text-white">
                Payout & Ticket History
              </h2>
              <p className="text-[11px] text-gray-400">
                Review status updates from platform administrators regarding your withdrawals.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-gray-500 text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Message / Details</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {safeRequests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-gray-500">
                      No cashout requests logged yet.
                    </td>
                  </tr>
                ) : (
                  safeRequests.map((req) => {
                    const statusUpper = (req.status || 'PENDING').toUpperCase();
                    const isSuccess =
                      statusUpper === 'APPROVED' || statusUpper === 'RESOLVED';
                    const isProcessing = statusUpper === 'PROCESSING';
                    const isRejected = statusUpper === 'REJECTED';

                    return (
                      <tr key={req.id} className="hover:bg-white/2 transition">
                        <td className="py-3.5 px-4 font-bold text-white">{req.type}</td>
                        <td className="py-3.5 px-4 text-emerald-400 font-bold">
                          {req.amount
                            ? `RWF ${Number(req.amount).toLocaleString()}`
                            : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-gray-300 max-w-xs space-y-1">
                          <p className="truncate">{req.message}</p>
                          {req.adminNotes && (
                            <p className="text-[10px] text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-500/20 inline-block">
                              <strong>Admin Note:</strong> {req.adminNotes}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                              isSuccess
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : isProcessing
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : isRejected
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {isSuccess ? (
                              <CheckCircle2 size={10} />
                            ) : isRejected ? (
                              <AlertCircle size={10} />
                            ) : (
                              <Clock size={10} />
                            )}
                            {statusUpper}
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
    </div>
  );
};
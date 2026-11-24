import { useState, useEffect, useMemo } from 'react';
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
  CreditCard,
  Package,
  Receipt,
} from 'lucide-react';
import { useVendorStore } from '../../store/vendorStore';
import { useOrderStore } from '../../store/useOrderStore';
import { useAuthState } from '../../context/AuthContext';
import { socket } from '../../libs/socket.client';

const VENDOR_ALLOWED_ROLES = new Set(['vendor', 'admin', 'super_admin']);

const isPaidOrder = (order: any) => {
  const payStatus = String(order?.paymentStatus || '').toUpperCase();
  const status = String(order?.status || '').toUpperCase();
  return (
    ['SUCCESS', 'PAID', 'COMPLETED', 'VERIFIED'].includes(payStatus) ||
    status === 'DELIVERED'
  );
};

const isDeliveredOrder = (order: any) => {
  const status = String(order?.status || '').toUpperCase();
  return status === 'DELIVERED' || status === 'COMPLETED';
};

const isReturnedOrCancelledOrder = (order: any) => {
  const status = String(order?.status || '').toUpperCase();
  const payStatus = String(order?.paymentStatus || '').toUpperCase();
  return (
    ['RETURNED', 'REFUNDED', 'RETURN_REQUESTED', 'CANCELLED'].includes(status) ||
    ['REFUNDED', 'REVERSED'].includes(payStatus)
  );
};

const getOrderGross = (order: any) => {
  const items = Array.isArray(order?.items) ? order.items : [];
  if (items.length > 0) {
    return items.reduce((sum: number, item: any) => {
      const price = Number(item?.priceAtPurchase ?? item?.price ?? 0);
      const qty = Number(item?.quantity ?? 1);
      return sum + (Number.isFinite(price * qty) ? price * qty : 0);
    }, 0);
  }
  return Number(order?.totalAmount) || 0;
};

const getOrderNet = (order: any) => {
  const items = Array.isArray(order?.items) ? order.items : [];
  if (items.length > 0) {
    return items.reduce((sum: number, item: any) => {
      const explicit = Number(item?.vendorEarnings);
      if (Number.isFinite(explicit) && explicit > 0) {
        return sum + explicit;
      }
      const price = Number(item?.priceAtPurchase ?? item?.price ?? 0);
      const qty = Number(item?.quantity ?? 1);
      return sum + (Number.isFinite(price * qty) ? price * qty * 0.92 : 0);
    }, 0);
  }
  return (Number(order?.totalAmount) || 0) * 0.92;
};

export const VendorFinancials = () => {
  const authState = useAuthState() as {
    user?: {
      id?: string;
      vendorId?: string;
      phone?: string;
      role?: string;
    } | null;
    isLoading?: boolean;
    loading?: boolean;
  };
  const {
    requests,
    vendorSettings,
    isLoading,
    fetchVendorFinancials,
    fetchVendorSettings,
    requestCashout,
  } = useVendorStore() as any;
  const { orders, fetchVendorOrders } = useOrderStore();

  const user = authState?.user ?? null;
  const isAuthLoading = Boolean(authState?.isLoading ?? authState?.loading);
  const normalizedRole = String(user?.role || '').toLowerCase();
  const canAccessVendorData =
    Boolean(user?.id) && VENDOR_ALLOWED_ROLES.has(normalizedRole);

  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState(user?.phone || '+250');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'month', 'quarter'

  const vendorId = user?.vendorId || user?.id;
  const vendorMomoCode: string | null =
    vendorSettings?.momoCode || vendorSettings?.momo_code || null;

  useEffect(() => {
    if (isAuthLoading || !canAccessVendorData) {
      return;
    }

    void fetchVendorOrders();
    if (typeof fetchVendorSettings === 'function') {
      void fetchVendorSettings();
    }
    if (vendorId) {
      void fetchVendorFinancials(vendorId);
    }
  }, [
    isAuthLoading,
    canAccessVendorData,
    vendorId,
    fetchVendorFinancials,
    fetchVendorOrders,
    fetchVendorSettings,
  ]);

  useEffect(() => {
    const preferredPhone =
      vendorSettings?.momoNumber ||
      vendorSettings?.phone ||
      vendorSettings?.momoCode ||
      vendorSettings?.momo_code ||
      user?.phone;
    if (preferredPhone && (!phone || phone === '+250')) {
      setPhone(preferredPhone);
    }
  }, [
    vendorSettings?.momoNumber,
    vendorSettings?.phone,
    vendorSettings?.momoCode,
    vendorSettings?.momo_code,
    user?.phone,
    phone,
  ]);

  useEffect(() => {
    if (isAuthLoading || !canAccessVendorData) {
      return;
    }

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
  }, [
    isAuthLoading,
    canAccessVendorData,
    fetchVendorFinancials,
    user?.id,
    vendorId,
  ]);

  const safeOrders = useMemo(
    () => (Array.isArray(orders) ? orders : []),
    [orders],
  );
  const safeRequests = useMemo(
    () => (Array.isArray(requests) ? requests : []),
    [requests],
  );

  const filteredOrders = useMemo(() => {
    const now = new Date();
    return safeOrders.filter((order) => {
      if (dateFilter === 'all') return true;
      const orderDate = new Date(order.createdAt || Date.now());
      const diffTime = Math.abs(now.getTime() - orderDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (dateFilter === 'month') return diffDays <= 30;
      if (dateFilter === 'quarter') return diffDays <= 90;
      return true;
    });
  }, [safeOrders, dateFilter]);

  const ledgerStats = useMemo(() => {
    let totalRevenue = 0;
    let totalCommission = 0;
    let rawNetEarnings = 0;
    let refundedDeductions = 0;

    let paidCount = 0;
    let paidAmount = 0;
    let unpaidCount = 0;
    let unpaidAmount = 0;

    let deliveredCount = 0;
    let deliveredAmount = 0;
    let returnedCount = 0;
    let returnedAmount = 0;

    const methodMap = new Map<
      string,
      {
        method: string;
        count: number;
        gross: number;
        paidCount: number;
        paidAmount: number;
      }
    >();

    for (const order of filteredOrders) {
      const gross = getOrderGross(order);
      const net = getOrderNet(order);
      const paid = !isReturnedOrCancelledOrder(order) && isPaidOrder(order);
      const delivered = isDeliveredOrder(order);
      const returnedOrCancelled = isReturnedOrCancelledOrder(order);
      const statusUpper = String(order?.status || '').toUpperCase();

      const rawMethod = String(order?.paymentMethod || 'UNSPECIFIED')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '_');

      if (!returnedOrCancelled || statusUpper === 'RETURNED') {
        totalRevenue += gross;
      }

      if (paid && delivered) {
        totalCommission += Math.max(0, gross - net);
        rawNetEarnings += net;
      }

      if (returnedOrCancelled) {
        refundedDeductions += net;
      }

      if (paid) {
        paidCount += 1;
        paidAmount += gross;
      } else if (statusUpper !== 'CANCELLED' && statusUpper !== 'FAILED') {
        unpaidCount += 1;
        unpaidAmount += gross;
      }

      if (delivered) {
        deliveredCount += 1;
        deliveredAmount += gross;
      }

      if (
        statusUpper === 'RETURNED' ||
        statusUpper === 'REFUNDED' ||
        statusUpper === 'RETURN_REQUESTED'
      ) {
        returnedCount += 1;
        returnedAmount += gross;
      }

      const currentMethod = methodMap.get(rawMethod) || {
        method: rawMethod.replace(/_/g, ' '),
        count: 0,
        gross: 0,
        paidCount: 0,
        paidAmount: 0,
      };
      currentMethod.count += 1;
      currentMethod.gross += gross;
      if (paid) {
        currentMethod.paidCount += 1;
        currentMethod.paidAmount += gross;
      }
      methodMap.set(rawMethod, currentMethod);
    }

    const totalApprovedCashouts = safeRequests
      .filter((req) => {
        const st = String(req.status || '').toUpperCase();
        return req.type === 'CASHOUT' && (st === 'APPROVED' || st === 'RESOLVED');
      })
      .reduce((sum, req) => sum + Number(req.amount || 0), 0);

    const totalPendingCashouts = safeRequests
      .filter((req) => {
        const st = String(req.status || '').toUpperCase();
        return (
          req.type === 'CASHOUT' &&
          (st === 'PENDING' || st === 'PROCESSING')
        );
      })
      .reduce((sum, req) => sum + Number(req.amount || 0), 0);

    const netBalance = Math.max(
      0,
      rawNetEarnings - totalApprovedCashouts - refundedDeductions,
    );

    const paymentMethods = Array.from(methodMap.values()).sort(
      (a, b) => b.gross - a.gross,
    );

    return {
      totalRevenue,
      totalCommission,
      rawNetEarnings,
      refundedDeductions,
      totalApprovedCashouts,
      totalPendingCashouts,
      netBalance,
      paidCount,
      paidAmount,
      unpaidCount,
      unpaidAmount,
      deliveredCount,
      deliveredAmount,
      returnedCount,
      returnedAmount,
      paymentMethods,
    };
  }, [filteredOrders, safeRequests]);

  const escapeCsvCell = (val: unknown) =>
    `"${String(val ?? '').replace(/"/g, '""')}"`;

  const handleExportStatement = () => {
    const headers = [
      'Order ID',
      'Date',
      'Customer Email',
      'Payment Method',
      'Status',
      'Payment Status',
      'Total Gross (RWF)',
      'Vendor Earnings (RWF)',
    ];

    const rows = filteredOrders.map((o) => {
      const dateStr = new Date(o.createdAt || Date.now()).toLocaleDateString();
      const email = o.email || 'N/A';
      const method = o.paymentMethod || 'N/A';
      const gross = getOrderGross(o);
      const earnings = getOrderNet(o);

      return [
        o.orderNumber,
        dateStr,
        email,
        method,
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

    if (numericAmount > ledgerStats.netBalance) {
      setFeedback('Requested amount exceeds your available net balance.');
      return;
    }

    if (!phone.trim()) {
      setFeedback('Please enter a valid Mobile Money payout number or MoMo code.');
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
            <span>Financial Ledger &amp; Payouts</span>
          </div>
          <h1 className="font-poppins font-bold text-2xl md:text-4xl text-white tracking-tight mb-2">
            Earnings &amp; MoMo Withdrawals
          </h1>
          <p className="text-xs text-gray-400 leading-relaxed max-w-xl">
            Track marketplace sales, monitor 8% platform commission deductions, inspect payment &amp; delivery breakdowns, export CSV statements, and dispatch cashout requests to Mobile Money.
          </p>
          {vendorMomoCode && (
            <p className="text-[11px] text-emerald-400 mt-3">
              Registered MoMo Code:{' '}
              <span className="font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">
                {vendorMomoCode}
              </span>
            </p>
          )}
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

      {/* Primary Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-white/10 shadow-xl">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">
            Total Sales / Revenue
          </span>
          <div className="font-poppins font-bold text-2xl text-white">
            RWF {ledgerStats.totalRevenue.toLocaleString()}
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
            RWF {ledgerStats.totalCommission.toLocaleString()}
          </div>
          <span className="text-[10px] text-gray-500 mt-2 block">
            Paid &amp; delivered orders
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-white/10 shadow-xl">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">
            Returns / Adjustments
          </span>
          <div className="font-poppins font-bold text-2xl text-rose-400">
            - RWF {ledgerStats.refundedDeductions.toLocaleString()}
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
            RWF {ledgerStats.netBalance.toLocaleString()}
          </div>
          <span className="text-[10px] text-gray-400 mt-2 block">
            Approved payouts: RWF{' '}
            {ledgerStats.totalApprovedCashouts.toLocaleString()} • Pending: RWF{' '}
            {ledgerStats.totalPendingCashouts.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Paid, Delivered & Returned Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-gray-400">
              Success Paid Orders
            </span>
            <CheckCircle2 size={15} className="text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-poppins font-bold text-xl text-white">
              {ledgerStats.paidCount} orders
            </span>
            <span className="text-xs font-bold text-emerald-400">
              RWF {ledgerStats.paidAmount.toLocaleString()}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1.5">
            Unpaid / pending: {ledgerStats.unpaidCount} orders (RWF{' '}
            {ledgerStats.unpaidAmount.toLocaleString()})
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-gray-400">
              Delivered Orders
            </span>
            <Package size={15} className="text-blue-400" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-poppins font-bold text-xl text-white">
              {ledgerStats.deliveredCount} orders
            </span>
            <span className="text-xs font-bold text-blue-400">
              RWF {ledgerStats.deliveredAmount.toLocaleString()}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1.5">
            Completed &amp; delivered to buyers
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-gray-400">
              Returned Orders
            </span>
            <RotateCcw size={15} className="text-rose-400" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-poppins font-bold text-xl text-white">
              {ledgerStats.returnedCount} orders
            </span>
            <span className="text-xs font-bold text-rose-400">
              RWF {ledgerStats.returnedAmount.toLocaleString()}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1.5">
            Returned or refund-flagged volume
          </p>
        </div>
      </div>

      {/* Payment Methods Financial Breakdown */}
      <div className="rounded-3xl bg-[#0c0c0e] border border-white/10 p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/10">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <CreditCard size={18} />
          </div>
          <div>
            <h2 className="font-poppins font-bold text-lg text-white">
              Financials by Payment Method
            </h2>
            <p className="text-[11px] text-gray-400">
              Gross volume, cleared payments, and order counts across each payment method.
            </p>
          </div>
        </div>

        {ledgerStats.paymentMethods.length === 0 ? (
          <p className="text-center py-6 text-xs text-gray-500">
            No orders in the selected period to break down by payment method.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ledgerStats.paymentMethods.map((pm) => (
              <div
                key={pm.method}
                className="p-4 rounded-2xl bg-white/2 border border-white/10 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-white">
                    {pm.method}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px]">
                    {pm.count} {pm.count === 1 ? 'order' : 'orders'}
                  </span>
                </div>
                <div className="font-poppins font-bold text-xl text-emerald-400">
                  RWF {pm.gross.toLocaleString()}
                </div>
                <p className="text-[11px] text-gray-400">
                  Paid: {pm.paidCount}/{pm.count} (RWF{' '}
                  {pm.paidAmount.toLocaleString()})
                </p>
              </div>
            ))}
          </div>
        )}
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
            Withdraw funds securely to your saved MTN/Airtel Mobile Money number or MoMo code.
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
                Payout MoMo Number / Code
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+250... or MoMo code"
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
                Payout &amp; Ticket History
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
                    const statusUpper = String(req.status || 'PENDING').toUpperCase();
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

      {/* Order-Level Financial Breakdown */}
      <div className="rounded-3xl bg-[#0c0c0e] border border-white/10 p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/10">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Receipt size={18} />
          </div>
          <div>
            <h2 className="font-poppins font-bold text-lg text-white">
              Order-Level Financial Statement
            </h2>
            <p className="text-[11px] text-gray-400">
              Gross amount, commission, vendor net share, payment channel, and settlement status per order.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-gray-500 text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Gross</th>
                <th className="py-3 px-4">Net Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No orders found for the selected timeframe.
                  </td>
                </tr>
              ) : (
                filteredOrders.slice(0, 10).map((order) => {
                  const gross = getOrderGross(order);
                  const net = getOrderNet(order);
                  const paid =
                    !isReturnedOrCancelledOrder(order) && isPaidOrder(order);
                  const methodLabel = order?.paymentMethod
                    ? String(order.paymentMethod).replace(/_/g, ' ')
                    : 'N/A';

                  return (
                    <tr key={order.id} className="hover:bg-white/2 transition">
                      <td className="py-3.5 px-4 font-bold text-white">
                        #{order.orderNumber || String(order.id || '').slice(-6)}
                      </td>
                      <td className="py-3.5 px-4 text-gray-300">
                        <span className="capitalize">{methodLabel}</span>
                        <span
                          className={`ml-2 px-2 py-0.5 rounded text-[10px] font-semibold ${
                            paid
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {paid ? 'PAID' : order?.paymentStatus || 'PENDING'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-300">
                        {order?.status || 'PENDING'}
                      </td>
                      <td className="py-3.5 px-4 text-white">
                        RWF {gross.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-400 font-bold">
                        RWF {net.toLocaleString()}
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
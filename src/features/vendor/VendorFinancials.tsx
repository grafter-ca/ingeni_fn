// src/features/vendor/VendorFinancials.tsx
import { useState, useEffect } from 'react';
import { DollarSign, ArrowDownRight, Clock, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { useVendorStore } from '../../store/vendorStore';
import { useOrderStore } from '../../store/useOrderStore';
import { useAuthState } from '../../context/AuthContext';

export const VendorFinancials = () => {
  const { user } = useAuthState();
  const { requests, isLoading, fetchVendorFinancials, requestCashout } = useVendorStore();
  const { orders, fetchVendorOrders } = useOrderStore();
  
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState(user?.phone || '+250');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const vendorId = user?.vendorId || user?.id;

  useEffect(() => {
    fetchVendorOrders();
    if (vendorId) {
      fetchVendorFinancials(vendorId);
    }
  }, [vendorId, fetchVendorFinancials, fetchVendorOrders]);

  const safeOrders = Array.isArray(orders) ? orders : [];

  // Calculate gross sales/revenue dynamically from all items' priceAtPurchase * quantity
  const totalRevenue = safeOrders.reduce((acc, order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const orderRev = items.reduce((itemAcc, item) => {
      const price = Number(item?.priceAtPurchase) || 0;
      const qty = Number(item?.quantity) || 1;
      return itemAcc + (price * qty);
    }, 0);
    return acc + orderRev;
  }, 0);

  // Calculate available net balance dynamically from all items' vendorEarnings
  const netBalance = safeOrders.reduce((acc, order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const orderEarnings = items.reduce((itemAcc, item) => {
      const earnings = Number(item?.vendorEarnings) || 0;
      return itemAcc + earnings;
    }, 0);
    return acc + orderEarnings;
  }, 0);

  const handleCashoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setFeedback('Please enter a valid cashout amount.');
      return;
    }

    if (Number(amount) > netBalance) {
      setFeedback('Requested amount exceeds your available net balance.');
      return;
    }

    try {
      setSubmitting(true);
      setFeedback('');
      await requestCashout(vendorId!, amount, phone);
      setAmount('');
      setFeedback('Cashout request successfully submitted to admin!');
    } catch (err) {
      setFeedback('Failed to submit cashout request. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn font-mono">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#0c0c0e] to-[#0c0c0e] border border-white/10 shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase tracking-wider mb-4">
          <DollarSign size={12} />
          <span>Financial Ledger & Payouts</span>
        </div>
        <h1 className="font-poppins font-bold text-2xl md:text-4xl text-white tracking-tight mb-2">
          Earnings & MoMo Withdrawals
        </h1>
        <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
          Track lifetime marketplace sales (including MoMo and verified Cash on Delivery), monitor 10% platform commission deductions, and dispatch fast cashout requests directly to your Mobile Money account.
        </p>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[#0c0c0e] border border-white/10 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-gray-400">Total Sales/Revenue</span>
            <div className="font-poppins font-bold text-3xl text-white mt-1">
              RWF {totalRevenue.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-400 mt-1 inline-block">Gross sales (MoMo + Verified COD)</span>
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0c0c0e] border border-white/10 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-gray-400">Available Net Balance</span>
            <div className="font-poppins font-bold text-3xl text-blue-400 mt-1">
              RWF {netBalance.toLocaleString()}
            </div>
            <span className="text-[11px] text-gray-500 mt-1 inline-block">After 10% platform commission</span>
          </div>
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <ArrowDownRight size={24} />
          </div>
        </div>
      </div>

      {/* Cashout Request Section & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 rounded-3xl bg-[#0c0c0e] border border-white/10 p-6 shadow-xl">
          <h2 className="font-poppins font-bold text-lg text-white mb-2">Request Cashout</h2>
          <p className="text-[11px] text-gray-400 mb-6">Withdraw funds instantly to your MTN/Airtel Mobile Money account.</p>

          <form onSubmit={handleCashoutSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-2">Amount (RWF)</label>
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-2">Mobile Money Number</label>
              <input 
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+250..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            {feedback && (
              <p className={`text-xs ${feedback.includes('success') ? 'text-emerald-400' : 'text-amber-400'}`}>
                {feedback}
              </p>
            )}

            <button 
              type="submit"
              disabled={submitting || isLoading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              <Send size={14} />
              <span>{submitting ? 'Submitting...' : 'Send Cashout Request'}</span>
            </button>
          </form>
        </div>

        {/* Request History Table */}
        <div className="lg:col-span-2 rounded-3xl bg-[#0c0c0e] border border-white/10 p-6 shadow-xl">
          <h2 className="font-poppins font-bold text-lg text-white mb-2">Payout & Ticket History</h2>
          <p className="text-[11px] text-gray-400 mb-6">Review status updates from platform administrators regarding your withdrawals.</p>

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
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">No cashout requests logged yet.</td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4 font-bold text-white">{req.type}</td>
                      <td className="py-3.5 px-4 text-emerald-400">
                        {req.amount ? `RWF ${Number(req.amount).toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-300 max-w-xs truncate">{req.message}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold ${
                          req.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                          req.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {req.status === 'APPROVED' ? <CheckCircle2 size={10} /> :
                           req.status === 'REJECTED' ? <AlertCircle size={10} /> : <Clock size={10} />}
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
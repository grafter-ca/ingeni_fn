// src/pages/OrderSuccess.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle, Package, ArrowRight, Printer, Clock, CreditCard, AlertCircle, Headset, Phone, MessageCircle, ShieldCheck, Copy, Check, UploadCloud } from "lucide-react";
import { useOrderStore } from "../store/useOrderStore";
import type { Order } from "../types/api";
import { PaymentProofUpload } from "../components/common/PaymentProofUpload";

const OrderSuccess = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { filteredOrders, fetchAllOrders } = useOrderStore();
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);

  const supportTeam = {
    phone: "+250786015225",
    email: "team@ingenistore.com",
    whatsapp: "+250786015225",
  };

  useEffect(() => {
    if (!filteredOrders || filteredOrders.length === 0) {
      void fetchAllOrders();
    }
  }, [filteredOrders, fetchAllOrders]);

  useEffect(() => {
    if (orderNumber && filteredOrders) {
      const found = filteredOrders.find(
        (o) => o.orderNumber === orderNumber || o.id.slice(-8).toUpperCase() === orderNumber.toUpperCase()
      );
      if (found) {
        setCurrentOrder(found);
      }
    }
  }, [orderNumber, filteredOrders]);

  const paymentStatus = currentOrder?.paymentStatus || "SUCCESS";
  const isPaid = paymentStatus === "SUCCESS";

  const handleCopyOrderNumber = async () => {
    if (!orderNumber) return;
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy order number:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white flex items-center justify-center px-4 sm:px-6 py-12 font-poppins transition-colors duration-200">
      
      {/* Printable Receipt Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div id="printable-receipt" className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left/Main Column: Status, Verification, and Next Steps */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl transition-all flex flex-col justify-between">
          <div>
            {/* Top Header Card / Status Section */}
            <div className="text-center pb-6 border-b border-gray-100 dark:border-white/5">
              <div className="mb-4 flex justify-center">
                <div className={`p-4 rounded-full border ${isPaid ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                  {isPaid ? (
                    <CheckCircle size={48} className="animate-pulse" />
                  ) : (
                    <CreditCard size={48} className="animate-bounce" />
                  )}
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <ShieldCheck size={14} /> Official IngeniStore Transaction
              </div>

              <h1 className="text-2xl font-black uppercase tracking-wide mb-1">
                {isPaid ? "Order Confirmed!" : "Payment Pending Review"}
              </h1>
              
              <div className="mt-2 flex flex-col items-center justify-center gap-1.5">
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                  OrderNumber: {orderNumber}
                </p>
                <button
                  onClick={handleCopyOrderNumber}
                  title="Click to copy order Number"
                  className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all cursor-pointer shadow-2xs"
                >
                  <span className="text-blue-600 dark:text-blue-400 font-mono font-bold tracking-wide text-sm sm:text-base">
                    #{orderNumber}
                  </span>
                  {copied ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      <Check size={12} /> Copied!
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-500 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                      <Copy size={12} /> Copy
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Payment Verification Banner */}
            <div className={`my-5 p-4 rounded-2xl border text-xs flex items-start gap-3 text-left shadow-2xs ${
              isPaid 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300'
            }`}>
              {isPaid ? <CheckCircle size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />}
              <div className="space-y-0.5">
                <strong className="block uppercase tracking-wider font-bold">Payment State: {paymentStatus}</strong>
                <p className="text-gray-600 dark:text-gray-300 text-xs">
                  {isPaid 
                    ? "Funds verified. Fulfillment center is preparing your items." 
                    : "Please upload your payment proof below or contact support to complete verification."}
                </p>
              </div>
            </div>

            {/* Conditional Payment Proof Upload Component (Hidden on Print if not paid/if uploading) */}
            {!isPaid && currentOrder && (
              <div className="no-print my-6">
                <div className="p-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    <UploadCloud size={16} /> Submit Proof of Payment
                  </div>
                  <PaymentProofUpload 
                    orderId={currentOrder.id} 
                    orderNumber={currentOrder.orderNumber} 
                    onSuccess={() => {
                      void fetchAllOrders();
                    }}
                  />
                </div>
              </div>
            )}

            {/* Status Timeline / Next Steps */}
            <div className="bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl p-5 text-left">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                Fulfillment Workflow & Next Steps
              </h3>
              <ul className="space-y-3">
                <li className="flex gap-3 items-start">
                  <div className="p-1.5 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                    <Package size={15} />
                  </div>
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    {isPaid ? "Items queued for secure packaging and courier handover." : "Products reserved. Automatic fulfillment unlocks upon admin verification."}
                  </span>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="p-1.5 rounded-lg bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400 shrink-0 mt-0.5">
                    <Clock size={15} />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Tracking links and SMS updates will dispatch once transit begins.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Action Buttons inside Left Card (Hidden on Print) */}
          <div className="no-print mt-6 pt-6 border-t border-gray-100 dark:border-white/5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to="/my-orders"
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold uppercase transition-all text-xs tracking-wider shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                Track History
              </Link>
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 py-3 rounded-xl font-bold uppercase transition-all text-xs tracking-wider cursor-pointer text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10"
              >
                <Printer size={15} /> Print Receipt
              </button>
            </div>

            <div className="text-center pt-1">
              <Link
                to="/products"
                className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all text-xs uppercase font-bold tracking-wider"
              >
                Continue Shopping <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Support & Help Section */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl transition-all flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-white/5">
              <div className="p-3 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-500 shrink-0">
                <Headset size={22} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Need Assistance?</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Handling payment verifications & fulfillment queries 24/7.
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              If your payment proof upload fails or order status hasn't updated within a reasonable window, reach out immediately with your reference code <span className="font-mono font-bold text-blue-600 dark:text-blue-400">#{orderNumber}</span>.
            </p>
          </div>

          <div className="no-print space-y-2.5">
            <a
              href={`tel:${supportTeam.phone}`}
              className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition flex items-center gap-3 border border-gray-200 dark:border-white/10 group text-xs font-medium shadow-2xs"
            >
              <Phone size={16} className="text-blue-600 dark:text-blue-400 group-hover:text-white transition shrink-0" />
              <div className="overflow-hidden">
                <p className="text-gray-400 text-[9px] uppercase font-bold group-hover:text-white/80">Call Support</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-white truncate">{supportTeam.phone}</p>
              </div>
            </a>

            <a
              href={`mailto:${supportTeam.email}?subject=Delayed Order Inquiry - #${orderNumber}`}
              className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition flex items-center gap-3 border border-gray-200 dark:border-white/10 group text-xs font-medium shadow-2xs"
            >
              <MessageCircle size={16} className="text-blue-600 dark:text-blue-400 group-hover:text-white transition shrink-0" />
              <div className="overflow-hidden">
                <p className="text-gray-400 text-[9px] uppercase font-bold group-hover:text-white/80">Email Desk</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-white truncate">{supportTeam.email}</p>
              </div>
            </a>

            <a
              href={`https://wa.me/${supportTeam.whatsapp.replace("+", "")}?text=Hello%20IngeniStore%20Support,%20I%20am%20inquiring%20about%20my%20order%20%23${orderNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 transition flex items-center gap-3 border border-gray-200 dark:border-white/10 group text-xs font-medium shadow-2xs"
            >
              <MessageCircle size={16} className="text-emerald-600 dark:text-emerald-400 group-hover:text-white transition shrink-0" />
              <div className="overflow-hidden">
                <p className="text-gray-400 text-[9px] uppercase font-bold group-hover:text-white/80">WhatsApp</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-white truncate">Instant Live Chat</p>
              </div>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderSuccess;
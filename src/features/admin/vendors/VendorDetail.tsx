// src/features/admin/vendors/VendorDetail.tsx
import { useState } from "react";
import { useVendorStore } from "../../../store/vendorStore";
import {
  ArrowLeft,
  Store,
  Package,
  TrendingUp,
  Mail,
  Phone,
  ShieldCheck,
  Edit3,
  Smartphone,
  MapPin,
  Copy,
  Check,
} from "lucide-react";

export const VendorDetail = () => {
  const { selectedVendor, activeMetrics, setSelectedVendor, setEditingVendor } =
    useVendorStore() as any;
  const [copiedMomo, setCopiedMomo] = useState(false);

  if (!selectedVendor) return null;

  const momoCode: string | null =
    selectedVendor.momoCode || selectedVendor.momo_code || null;
  const ownerName: string =
    selectedVendor.name ||
    selectedVendor.ownerName ||
    selectedVendor.user?.name ||
    "—";
  const ownerEmail: string =
    selectedVendor.email ||
    selectedVendor.supportEmail ||
    selectedVendor.user?.email ||
    "Not provided";
  const ownerPhone: string =
    selectedVendor.phone || selectedVendor.user?.phone || "Not provided";

  const handleEditClick = () => {
    setEditingVendor(selectedVendor);
  };

  const handleCopyMomoCode = async () => {
    if (!momoCode) return;
    try {
      await navigator.clipboard.writeText(momoCode);
      setCopiedMomo(true);
      setTimeout(() => setCopiedMomo(false), 2000);
    } catch {
      // Clipboard fallback ignored if blocked
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Navigation Bar */}
      <button
        type="button"
        onClick={() => setSelectedVendor(null)}
        className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer bg-[#0a0a0a] border border-white/10 px-4 py-2 rounded-xl w-fit"
      >
        <ArrowLeft size={14} /> Back to Directory Catalog
      </button>

      {/* Header Profile Card */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-blue-900/40 shrink-0">
            {selectedVendor.logoUrl ? (
              <img
                src={selectedVendor.logoUrl}
                alt={selectedVendor.storeName}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              selectedVendor.storeName?.charAt(0) || "S"
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-white">
                {selectedVendor.storeName}
              </h2>
              <span
                className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${
                  selectedVendor.isActive
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}
              >
                {selectedVendor.isActive ? "Active Storefront" : "Suspended"}
              </span>
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-blue-500" /> Enterprise
              Merchant Registered ID:{" "}
              <span className="font-mono text-gray-300">
                {selectedVendor.id}
              </span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleEditClick}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-2 shrink-0"
        >
          <Edit3 size={14} /> Modify Store Details
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <Package size={14} className="text-blue-500" /> Active Inventory
            Count
          </span>
          <p className="text-2xl font-black text-white pt-1">
            {activeMetrics?.totalProducts ?? 0}{" "}
            <span className="text-xs font-normal text-gray-400">
              products listed
            </span>
          </p>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-emerald-500" /> Storefront
            Status
          </span>
          <p className="text-2xl font-black text-emerald-400 pt-1">
            {selectedVendor.isActive ? "Operational" : "Restricted"}
          </p>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <Smartphone size={14} className="text-amber-400" /> MoMo Merchant
            Code
          </span>
          <div className="flex items-center justify-between gap-2 pt-1">
            <p className="text-xl font-mono font-black text-white truncate">
              {momoCode || "Not configured"}
            </p>
            {momoCode && (
              <button
                type="button"
                onClick={() => void handleCopyMomoCode()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-medium text-gray-300 transition cursor-pointer shrink-0"
                title="Copy MoMo code"
              >
                {copiedMomo ? (
                  <>
                    <Check size={12} className="text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    Copy
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Information Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-white/10 pb-3">
            Owner Contact &amp; Payment Profile
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-gray-400 flex items-center gap-2">
                <Store size={14} /> Full Name
              </span>
              <strong className="text-white font-medium">{ownerName}</strong>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-gray-400 flex items-center gap-2">
                <Mail size={14} /> Email Address
              </span>
              <span className="text-gray-200 font-mono">{ownerEmail}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-gray-400 flex items-center gap-2">
                <Phone size={14} /> Phone Contact
              </span>
              <span className="text-gray-200 font-mono">{ownerPhone}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-gray-400 flex items-center gap-2">
                <Smartphone size={14} /> MoMo Code
              </span>
              <span className="text-emerald-400 font-mono font-bold">
                {momoCode || "Not configured"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-400 flex items-center gap-2">
                <MapPin size={14} /> Store Address
              </span>
              <span className="text-gray-200">
                {selectedVendor.address || "Not provided"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-white/10 pb-3">
            Business Summary
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            {selectedVendor.description ||
              selectedVendor.businessDescription ||
              "No detailed business overview description has been provided for this store account."}
          </p>
        </div>
      </div>
    </div>
  );
};
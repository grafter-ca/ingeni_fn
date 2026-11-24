import { useState, useEffect } from "react";
import {
  Settings,
  CreditCard,
  Bell,
  ShieldCheck,
  Check,
  Palette,
  User,
  Send,
  HelpCircle,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Mail,
} from "lucide-react";
import Button from "../../components/ui/Button";
import { useVendorStore } from "../../store/vendorStore";
import { useAuthState } from "../../context/AuthContext";
import { socket } from "../../libs/socket.client";

export const VendorSettingsView = () => {
  const { user } = useAuthState();
  const {
    vendorSettings,
    requests,
    fetchVendorSettings,
    fetchVendorFinancials,
    updateVendorSettings,
    submitAdminRequest,
    isLoading,
  } = useVendorStore() as any;

  const [saved, setSaved] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    storeName: "Ingeni Store Official",
    ownerName: "Ingeni Store Representative",
    supportEmail: "support@ingenistore.rw",
    phone: "+2507xxx",
    momoCode: "",
    momoNumber: "+2507xxx",
    address: "",
    description: "",
    logoUrl: "",
    theme: "dark",
    autoAcceptOrders: true,
    emailAlerts: true,
  });

  const [adminRequest, setAdminRequest] = useState({
    type: "CASHOUT",
    amount: "",
    message: "",
  });

  const vendorId = user?.vendorId || user?.id;

  // Fetch settings & ticket history on mount
  useEffect(() => {
    if (typeof fetchVendorSettings === "function") {
      void fetchVendorSettings();
    }
    if (vendorId && typeof fetchVendorFinancials === "function") {
      void fetchVendorFinancials(vendorId);
    }
  }, [fetchVendorSettings, fetchVendorFinancials, vendorId]);

  // Listen for real-time admin request updates pushed over socket
  useEffect(() => {
    const handleRequestUpdated = (payload: {
      id?: string;
      vendorId?: string | null;
      userId?: string | null;
      status?: string;
      adminNotes?: string | null;
    }) => {
      const belongsToCurrent =
        (payload.vendorId && payload.vendorId === vendorId) ||
        (payload.userId && payload.userId === user?.id);

      if (belongsToCurrent && vendorId && typeof fetchVendorFinancials === "function") {
        void fetchVendorFinancials(vendorId);
      }
    };

    socket?.on?.("admin:request-updated", handleRequestUpdated);
    return () => {
      socket?.off?.("admin:request-updated", handleRequestUpdated);
    };
  }, [fetchVendorFinancials, user?.id, vendorId]);

  // Sync store data to local state when loaded
  useEffect(() => {
    if (vendorSettings) {
      setSettings({
        storeName: vendorSettings.storeName || "Ingeni Store Official",
        ownerName:
          vendorSettings.ownerName ||
          vendorSettings.name ||
          user?.name ||
          "Ingeni Store Representative",
        supportEmail:
          vendorSettings.supportEmail ||
          vendorSettings.email ||
          user?.email ||
          "support@ingenistore.rw",
        phone: vendorSettings.phone || user?.phone || "+2507xxxx",
        momoCode: vendorSettings.momoCode || vendorSettings.momo_code || "",
        momoNumber:
          vendorSettings.momoNumber ||
          vendorSettings.phone ||
          "+2507xxxx",
        address: vendorSettings.address || "",
        description:
          vendorSettings.description || vendorSettings.businessDescription || "",
        logoUrl: vendorSettings.logoUrl || vendorSettings.logo_url || "",
        theme: vendorSettings.theme || "dark",
        autoAcceptOrders: vendorSettings.autoAcceptOrders ?? true,
        emailAlerts: vendorSettings.emailAlerts ?? true,
      });
    }
  }, [vendorSettings, user?.name, user?.email, user?.phone]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setErrorMessage(null);

    const normalizedPayload = {
      ...settings,
      storeName: settings.storeName.trim(),
      ownerName: settings.ownerName.trim(),
      supportEmail: settings.supportEmail.trim(),
      phone: settings.phone.trim(),
      momoCode: settings.momoCode.trim() || null,
      momoNumber: settings.momoNumber.trim(),
      address: settings.address.trim(),
      description: settings.description.trim(),
      logoUrl: settings.logoUrl.trim(),
    };

    try {
      await updateVendorSettings(normalizedPayload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Failed to update vendor and user profile settings.",
      );
    }
  };

  const handleRequestTypeChange = (newType: string) => {
    setAdminRequest({
      type: newType,
      amount: newType === "CASHOUT" ? adminRequest.amount : "",
      message: "",
    });
  };

  const handleAdminRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMessage = adminRequest.message.trim();
    if (!cleanMessage) {
      setAdminError("Please enter a message describing your request.");
      return;
    }

    if (
      adminRequest.type === "CASHOUT" &&
      (!adminRequest.amount || Number(adminRequest.amount) <= 0)
    ) {
      setAdminError("Please enter a valid withdrawal amount in RWF.");
      return;
    }

    setRequestSent(false);
    setAdminError(null);
    setSubmittingRequest(true);

    try {
      const payoutDestination =
        settings.momoNumber ||
        settings.momoCode ||
        settings.phone ||
        "Registered MoMo";
      const formattedMessage =
        adminRequest.type === "CASHOUT" && !cleanMessage.includes(payoutDestination)
          ? `${cleanMessage} (Payout MoMo: ${payoutDestination})`
          : cleanMessage;

      await submitAdminRequest({
        type: adminRequest.type,
        amount:
          adminRequest.type === "CASHOUT" && adminRequest.amount
            ? String(adminRequest.amount)
            : undefined,
        message: formattedMessage,
      });

      setRequestSent(true);
      setAdminRequest((prev) => ({ ...prev, amount: "", message: "" }));

      if (vendorId && typeof fetchVendorFinancials === "function") {
        await fetchVendorFinancials(vendorId);
      }

      setTimeout(() => setRequestSent(false), 4000);
    } catch (err: any) {
      setAdminError(err?.message || "Failed to send request to admin");
    } finally {
      setSubmittingRequest(false);
    }
  };

  const safeRequests = Array.isArray(requests) ? requests : [];

  return (
    <div className="space-y-8 max-w-4xl animate-fadeIn pb-16 font-mono">
      {/* Header */}
      <div className="pb-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings size={14} className="text-blue-400" />
            <span className="text-[11px] uppercase tracking-widest text-blue-400">
              Configuration
            </span>
          </div>
          <h1 className="font-poppins font-bold text-2xl md:text-3xl text-white tracking-tight">
            Store Settings &amp; Management
          </h1>
        </div>
        {saved && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <Check size={14} />
            <span>
              Saved &amp; synced
              {settings.emailAlerts && settings.supportEmail
                ? ` (${settings.supportEmail})`
                : ""}
            </span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* 1. Vendor & User Profile Information */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#0c0c0e] border border-white/10 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <User size={18} />
            </div>
            <div>
              <h2 className="font-poppins font-bold text-base text-white">
                Vendor &amp; User Profile Synchronization
              </h2>
              <p className="text-[11px] text-gray-400">
                Updates here synchronize your user account credentials, vendor record, and store details.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-400 uppercase text-[10px] mb-1.5">
                Owner / User Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Caleb Habyarimana"
                value={settings.ownerName}
                onChange={(e) =>
                  setSettings({ ...settings, ownerName: e.target.value })
                }
                className="w-full p-3.5 rounded-xl bg-white/3 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-gray-400 uppercase text-[10px] mb-1.5">
                Store Name
              </label>
              <input
                type="text"
                placeholder="e.g. Ingeni Store"
                value={settings.storeName}
                onChange={(e) =>
                  setSettings({ ...settings, storeName: e.target.value })
                }
                className="w-full p-3.5 rounded-xl bg-white/3 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-gray-400 uppercase text-[10px] mb-1.5">
                Support &amp; Account Email
              </label>
              <input
                type="email"
                placeholder="e.g. callebhabyar55@gmail.com"
                value={settings.supportEmail}
                onChange={(e) =>
                  setSettings({ ...settings, supportEmail: e.target.value })
                }
                className="w-full p-3.5 rounded-xl bg-white/3 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-gray-400 uppercase text-[10px] mb-1.5">
                Contact Phone Number
              </label>
              <input
                type="text"
                placeholder="e.g. +250786015225"
                value={settings.phone}
                onChange={(e) =>
                  setSettings({ ...settings, phone: e.target.value })
                }
                className="w-full p-3.5 rounded-xl bg-white/3 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-gray-400 uppercase text-[10px] mb-1.5">
                Store Physical Address
              </label>
              <input
                type="text"
                placeholder="e.g. Kigali, Nyarugenge, Biryogo"
                value={settings.address}
                onChange={(e) =>
                  setSettings({ ...settings, address: e.target.value })
                }
                className="w-full p-3.5 rounded-xl bg-white/3 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-gray-400 uppercase text-[10px] mb-1.5">
                Store Logo URL
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={settings.logoUrl}
                onChange={(e) =>
                  setSettings({ ...settings, logoUrl: e.target.value })
                }
                className="w-full p-3.5 rounded-xl bg-white/3 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-400 uppercase text-[10px] mb-1.5">
                Store Description / Bio
              </label>
              <textarea
                rows={3}
                placeholder="Describe your storefront, specialties, delivery coverage, and policies..."
                value={settings.description}
                onChange={(e) =>
                  setSettings({ ...settings, description: e.target.value })
                }
                className="w-full p-3.5 rounded-xl bg-white/3 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition resize-none"
              />
            </div>
          </div>
        </div>

        {/* 2. Theme & Appearance Customization */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#0c0c0e] border border-white/10 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Palette size={18} />
            </div>
            <div>
              <h2 className="font-poppins font-bold text-base text-white">
                Dashboard Theme Customization
              </h2>
              <p className="text-[11px] text-gray-400">
                Personalize your console UI interface appearance.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                id: "dark",
                name: "Deep Obsidian",
                desc: "Default dark interface style with crisp accents.",
              },
              {
                id: "midnight",
                name: "Midnight Blue",
                desc: "Deep rich indigo/blue shaded tone.",
              },
              {
                id: "cyberpunk",
                name: "Cyber Matrix",
                desc: "High contrast dark mode styling.",
              },
            ].map((t) => (
              <div
                key={t.id}
                onClick={() => setSettings({ ...settings, theme: t.id })}
                className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                  settings.theme === t.id
                    ? "bg-blue-600/10 border-blue-500 text-white shadow-lg shadow-blue-500/10"
                    : "bg-white/2 border-white/5 text-gray-400 hover:border-white/20"
                }`}
              >
                <div>
                  <span className="block font-bold text-white text-sm mb-1">
                    {t.name}
                  </span>
                  <span className="text-[11px] text-gray-400 leading-relaxed block">
                    {t.desc}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-blue-400">
                    {settings.theme === t.id ? "Active Theme" : "Select"}
                  </span>
                  {settings.theme === t.id && (
                    <Check size={14} className="text-blue-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payout & Financials */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#0c0c0e] border border-white/10 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CreditCard size={18} />
            </div>
            <div>
              <h2 className="font-poppins font-bold text-base text-white">
                Payout &amp; Mobile Money
              </h2>
              <p className="text-[11px] text-gray-400">
                Configure your MoMo Merchant Code and payout phone number for direct customer and cashout transfers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-400 uppercase text-[10px] mb-1.5">
                MoMo Merchant Code
              </label>
              <input
                type="text"
                placeholder="e.g. 123456"
                value={settings.momoCode}
                onChange={(e) =>
                  setSettings({ ...settings, momoCode: e.target.value })
                }
                className="w-full p-3.5 rounded-xl bg-white/3 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-gray-400 uppercase text-[10px] mb-1.5">
                Mobile Money Number (MTN/Airtel)
              </label>
              <input
                type="text"
                placeholder="e.g. +2507xxxx"
                value={settings.momoNumber}
                onChange={(e) =>
                  setSettings({ ...settings, momoNumber: e.target.value })
                }
                className="w-full p-3.5 rounded-xl bg-white/3 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Notifications & Toggles */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#0c0c0e] border border-white/10 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Bell size={18} />
            </div>
            <div>
              <h2 className="font-poppins font-bold text-base text-white">
                Automations &amp; Email Notifications
              </h2>
              <p className="text-[11px] text-gray-400">
                Manage alert behaviors, order tracking emails, and operational rules.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 rounded-2xl bg-white/2 border border-white/5 cursor-pointer hover:bg-white/4 transition">
              <div>
                <span className="block font-bold text-white text-sm">
                  Auto-Accept Incoming Orders
                </span>
                <span className="text-gray-400 text-[11px]">
                  Automatically shift new customer requests into active fulfillment queues.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoAcceptOrders}
                onChange={(e) =>
                  setSettings({ ...settings, autoAcceptOrders: e.target.checked })
                }
                className="w-5 h-5 rounded accent-blue-600 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-2xl bg-white/2 border border-white/5 cursor-pointer hover:bg-white/4 transition">
              <div>
                <span className="block font-bold text-white text-sm md:flex items-center gap-2">
                  Email Alerts &amp; Status Notifications{" "}
                  <Mail size={13} className="text-blue-400" />
                </span>
                <span className="text-gray-400 text-[11px]">
                  Receive email alerts for profile updates, low stock warnings, and admin ticket responses at{" "}
                  <strong className="text-zinc-200">
                    {settings.supportEmail || "your account email"}
                  </strong>
                  .
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.emailAlerts}
                onChange={(e) =>
                  setSettings({ ...settings, emailAlerts: e.target.checked })
                }
                className="w-5 h-5 rounded accent-blue-600 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <Button
            label={isLoading ? "Saving Changes..." : "Save All Changes"}
            icon={isLoading ? Loader2 : ShieldCheck}
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs py-3.5 px-8 rounded-2xl transition shadow-lg shadow-blue-600/25 cursor-pointer disabled:opacity-50"
          />
        </div>
      </form>

      {/* 3. Request Admin Assistance */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#0c0c0e] border border-white/10 shadow-xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <HelpCircle size={18} />
          </div>
          <div>
            <h2 className="font-poppins font-bold text-base text-white">
              Request Admin Assistance / Cashout
            </h2>
            <p className="text-[11px] text-gray-400">
              Submit requests directly to marketplace administrators for cash disbursements or custom updates.
            </p>
          </div>
        </div>

        {requestSent && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <Check size={16} />
            <span>
              Your request has been sent to the admin team. Status updates will appear below and via email.
            </span>
          </div>
        )}

        {adminError && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {adminError}
          </div>
        )}

        <form onSubmit={handleAdminRequestSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 uppercase text-[10px] mb-1.5">
                Request Type
              </label>
              <select
                value={adminRequest.type}
                onChange={(e) => handleRequestTypeChange(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-white/3 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition cursor-pointer"
              >
                <option value="CASHOUT" className="bg-[#0c0c0e]">
                  Cashout / Revenue Withdrawal
                </option>
                <option value="DASHBOARD_FEATURE" className="bg-[#0c0c0e]">
                  Dashboard / Feature Request
                </option>
                <option value="SUPPORT" className="bg-[#0c0c0e]">
                  General Admin Support
                </option>
              </select>
            </div>

            {adminRequest.type === "CASHOUT" && (
              <div>
                <label className="block text-gray-400 uppercase text-[10px] mb-1.5">
                  Withdrawal Amount (RWF)
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="e.g. 50000"
                  value={adminRequest.amount}
                  onChange={(e) =>
                    setAdminRequest({ ...adminRequest, amount: e.target.value })
                  }
                  className="w-full p-3.5 rounded-xl bg-white/3 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-gray-400 uppercase text-[10px] mb-1.5">
              Message / Details
            </label>
            <textarea
              rows={3}
              placeholder={
                adminRequest.type === "CASHOUT"
                  ? `Requesting revenue withdrawal to Mobile Money (${
                      settings.momoNumber || settings.momoCode || "+250..."
                    })...`
                  : adminRequest.type === "DASHBOARD_FEATURE"
                  ? "Describe the dashboard feature or store modification you need..."
                  : "Describe your support question or issue..."
              }
              value={adminRequest.message}
              onChange={(e) =>
                setAdminRequest({ ...adminRequest, message: e.target.value })
              }
              className="w-full p-3.5 rounded-xl bg-white/3 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition resize-none"
              required
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              label={submittingRequest ? "Submitting..." : "Submit Request to Admin"}
              icon={submittingRequest ? Loader2 : Send}
              type="submit"
              disabled={submittingRequest}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs py-3.5 px-6 rounded-2xl transition shadow-lg shadow-amber-600/25 cursor-pointer disabled:opacity-50"
            />
          </div>
        </form>

        {/* Live Ticket & Admin Response Feed */}
        {safeRequests.length > 0 && (
          <div className="pt-6 border-t border-white/10 space-y-3">
            <h3 className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">
              Recent Admin Tickets &amp; Responses ({safeRequests.length})
            </h3>
            <div className="space-y-2.5">
              {safeRequests.slice(0, 5).map((req: any) => {
                const statusUpper = (req.status || "PENDING").toUpperCase();
                const isResolved =
                  statusUpper === "RESOLVED" || statusUpper === "APPROVED";
                const isProcessing = statusUpper === "PROCESSING";
                const isRejected = statusUpper === "REJECTED";

                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-white/2 border border-white/5 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">
                          {req.type}
                        </span>
                        {req.amount && (
                          <span className="text-emerald-400 font-bold">
                            RWF {Number(req.amount).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isResolved
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : isProcessing
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : isRejected
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {isResolved ? (
                          <CheckCircle2 size={10} />
                        ) : isRejected ? (
                          <AlertCircle size={10} />
                        ) : (
                          <Clock size={10} />
                        )}
                        {statusUpper}
                      </span>
                    </div>
                    <p className="text-gray-300">{req.message}</p>
                    {req.adminNotes && (
                      <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 flex items-start gap-2">
                        <MessageSquare
                          size={12}
                          className="shrink-0 mt-0.5 text-emerald-400"
                        />
                        <span>
                          <strong>Admin Note:</strong> {req.adminNotes}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
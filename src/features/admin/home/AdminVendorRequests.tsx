// src/pages/admin/AdminVendorRequests.tsx
import { useEffect, useState } from "react";
import {
  Store,
  CheckCircle2,
  XCircle,
  Mail,
  User,
  Calendar,
  ShieldAlert,
  Loader2,
  MessageSquare,
  DollarSign,
  Building,
  Trash2,
  CheckCircle,
  Search,
  Clock,
  Phone,
  Hash,
  Send,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useVendorStore,
  type OnboardingRequest,
  type AdminRequest,
} from "../../../store/vendorStore";
import { localApi } from "../../../libs/api";
import { socket } from "../../../libs/socket.client";

interface EmailNotificationInfo {
  success: boolean;
  messageId: string | null;
  reason?: string;
}

type AdminRequestWithSender = AdminRequest & {
  user?: { id?: string; name?: string; email?: string; phone?: string };
  vendor?: {
    id?: string;
    storeName?: string;
    phone?: string;
    user?: { name?: string; email?: string; phone?: string };
  };
  emailNotification?: EmailNotificationInfo;
};

export default function AdminVendorRequests() {
  const [activeTab, setActiveTab] = useState<"onboarding" | "inquiries">("onboarding");
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const {
    pendingRequests: onboardingRequests,
    fetchPendingRequests,
    approveVendorRequest,
    rejectVendorRequest,
    isLoading: storeLoading,
    isLoadingRequests,
  } = useVendorStore();

  const [adminQueries, setAdminQueries] = useState<AdminRequestWithSender[]>([]);
  const [loadingQueries, setLoadingQueries] = useState(false);
  const [submittingActionId, setSubmittingActionId] = useState<string | null>(null);

  // Approval Modal State
  const [selectedRequest, setSelectedRequest] = useState<OnboardingRequest | null>(null);
  const [formData, setFormData] = useState({
    storeName: "",
    description: "",
    address: "",
    phone: "",
  });

  // Reply / Response Modal State
  const [respondingQuery, setRespondingQuery] = useState<AdminRequestWithSender | null>(null);
  const [adminReplyNotes, setAdminReplyNotes] = useState("");
  const [replyStatus, setReplyStatus] = useState("RESOLVED");

  const fetchData = async (silent = false) => {
    if (!silent) {
      setError(null);
      setLoadingQueries(true);
    }
    try {
      await fetchPendingRequests();
      const queries = await localApi.get<AdminRequestWithSender[]>("/vendors/admin-requests");
      const freshList = Array.isArray(queries) ? queries : (queries as any)?.data || [];

      setAdminQueries((prev) => {
        const prevEmailMap = new Map(
          prev.filter((item) => item.emailNotification).map((item) => [item.id, item.emailNotification]),
        );
        return freshList.map((item: AdminRequestWithSender) => ({
          ...item,
          emailNotification: item.emailNotification || prevEmailMap.get(item.id),
        }));
      });
    } catch (err: any) {
      if (!silent) {
        setError(err?.message || "Failed to load vendor requests.");
      }
    } finally {
      if (!silent) {
        setLoadingQueries(false);
      }
    }
  };

  useEffect(() => {
    void fetchData();

    const handleRequestUpdated = (payload: Partial<AdminRequestWithSender> & { id: string }) => {
      setAdminQueries((prev) =>
        prev.map((q) =>
          q.id === payload.id
            ? {
                ...q,
                ...(payload.status !== undefined && { status: payload.status }),
                ...(payload.adminNotes !== undefined && { adminNotes: payload.adminNotes }),
              }
            : q,
        ),
      );
    };

    socket?.on?.("admin:request-updated", handleRequestUpdated);
    return () => {
      socket?.off?.("admin:request-updated", handleRequestUpdated);
    };
  }, []);

  const getSenderContact = (q: AdminRequestWithSender) => {
    const storeName = q.vendor?.storeName || null;
    const name = q.user?.name || q.vendor?.user?.name || null;
    const email = q.user?.email || q.vendor?.user?.email || null;
    const phone = q.vendor?.phone || q.user?.phone || q.vendor?.user?.phone || null;
    return { storeName, name, email, phone };
  };

  const notifyEmailOutcome = (
    emailNotification: EmailNotificationInfo | undefined,
    recipientEmail: string | null,
  ) => {
    if (emailNotification?.success) {
      toast.success(
        `Email sent to ${recipientEmail || "recipient"}${
          emailNotification.messageId ? ` (Ref: ${emailNotification.messageId.slice(0, 12)}...)` : ""
        }`,
      );
    } else if (!recipientEmail) {
      toast("Status updated (no recipient email on file to notify).", { icon: "ℹ️" });
    } else {
      toast(
        `Status updated, but email was not sent${
          emailNotification?.reason ? `: ${emailNotification.reason}` : "."
        }`,
        { icon: "⚠️" },
      );
    }
  };

  const safeOnboarding = Array.isArray(onboardingRequests) ? onboardingRequests : [];
  const safeQueries = Array.isArray(adminQueries) ? adminQueries : [];

  const filteredOnboarding = safeOnboarding.filter((req) => {
    const query = searchTerm.toLowerCase();
    const name = req.user?.name?.toLowerCase() || "";
    const email = req.user?.email?.toLowerCase() || "";
    const desc = (req.businessDescription || req.description || "").toLowerCase();
    return name.includes(query) || email.includes(query) || desc.includes(query);
  });

  const filteredQueries = safeQueries.filter((q) => {
    const query = searchTerm.toLowerCase();
    const message = q.message?.toLowerCase() || "";
    const type = q.type?.toLowerCase() || "";
    const vendorId = q.vendorId?.toLowerCase() || "";
    const contact = getSenderContact(q);
    const storeName = contact.storeName?.toLowerCase() || "";
    const userName = contact.name?.toLowerCase() || "";
    const userEmail = contact.email?.toLowerCase() || "";
    const phone = contact.phone?.toLowerCase() || "";

    const matchesSearch =
      message.includes(query) ||
      type.includes(query) ||
      vendorId.includes(query) ||
      storeName.includes(query) ||
      userName.includes(query) ||
      userEmail.includes(query) ||
      phone.includes(query);

    const matchesStatus = statusFilter === "ALL" || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenApproveModal = (req: OnboardingRequest) => {
    setSelectedRequest(req);
    setFormData({
      storeName: `${req.user?.name || "Merchant"}'s Store`,
      description: req.businessDescription || req.description || "",
      address: "Kigali, Rwanda",
      phone: "+2507",
    });
  };

  const handleApproveOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !selectedRequest.user?.id) return;

    setSubmittingActionId(selectedRequest.id);
    try {
      await approveVendorRequest({
        userId: selectedRequest.user.id,
        ...formData,
      });
      toast.success(`Store "${formData.storeName}" provisioned & welcome email queued!`);
      setSelectedRequest(null);
      void fetchData(true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve vendor onboarding request.");
    } finally {
      setSubmittingActionId(null);
    }
  };

  const handleRejectOnboarding = async (requestId: string) => {
    if (!window.confirm("Are you sure you want to reject this vendor application?")) return;
    setSubmittingActionId(requestId);
    try {
      await rejectVendorRequest(requestId);
      toast.success("Vendor request rejected.");
      void fetchData(true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to reject request.");
    } finally {
      setSubmittingActionId(null);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingQuery) return;

    const targetQuery = respondingQuery;
    const contact = getSenderContact(targetQuery);
    setSubmittingActionId(targetQuery.id);

    try {
      const response = await localApi.patch<AdminRequestWithSender>(
        `/vendors/admin-requests/${targetQuery.id}`,
        {
          status: replyStatus,
          adminNotes: adminReplyNotes,
        },
      );

      setAdminQueries((prev) =>
        prev.map((q) =>
          q.id === targetQuery.id
            ? {
                ...q,
                ...response,
                emailNotification: response?.emailNotification,
              }
            : q,
        ),
      );

      toast.success("Response saved & status updated.");
      notifyEmailOutcome(response?.emailNotification, contact.email);
      setRespondingQuery(null);
      setAdminReplyNotes("");
      void fetchData(true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit response.");
    } finally {
      setSubmittingActionId(null);
    }
  };

  const handleQuickStatusChange = async (queryId: string, newStatus: string) => {
    const target = adminQueries.find((q) => q.id === queryId);
    const recipientEmail = target ? getSenderContact(target).email : null;

    setAdminQueries((prevQueries) =>
      prevQueries.map((q) => (q.id === queryId ? { ...q, status: newStatus as any } : q)),
    );

    setSubmittingActionId(queryId);
    try {
      const response = await localApi.patch<AdminRequestWithSender>(
        `/vendors/admin-requests/${queryId}`,
        { status: newStatus },
      );

      setAdminQueries((prevQueries) =>
        prevQueries.map((q) =>
          q.id === queryId
            ? {
                ...q,
                ...response,
                emailNotification: response?.emailNotification,
              }
            : q,
        ),
      );

      toast.success(`Status updated to ${newStatus}`);
      notifyEmailOutcome(response?.emailNotification, recipientEmail);
      void fetchData(true);
    } catch (err: any) {
      console.error("Failed to update status on server:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to update status.");
      await fetchData(true);
    } finally {
      setSubmittingActionId(null);
    }
  };

  const handleDeleteQuery = async (queryId: string) => {
    if (!window.confirm("Are you sure you want to archive/delete this resolved query?")) return;
    setSubmittingActionId(queryId);
    try {
      await localApi.delete(`/vendors/admin-requests/${queryId}`);
      setAdminQueries((prev) => prev.filter((q) => q.id !== queryId));
      toast.success("Query archived & notification sent.");
      void fetchData(true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete query.");
    } finally {
      setSubmittingActionId(null);
    }
  };

  const isLoading = storeLoading || isLoadingRequests || loadingQueries;

  const pendingOnboardingCount = safeOnboarding.length;
  const activeQueriesCount = safeQueries.filter(
    (q) => q.status === "PENDING" || q.status === "PROCESSING",
  ).length;
  const resolvedQueriesCount = safeQueries.filter((q) => q.status === "RESOLVED").length;

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen text-zinc-100 font-poppins">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-100 flex items-center gap-3 tracking-tight">
            <Store className="text-emerald-500" size={32} /> Vendor Onboarding & Queries
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Review merchant partnership applications, dispatch email updates, and manage support requests.
          </p>
        </div>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block mb-1">
              Pending Onboarding
            </span>
            <div className="text-2xl font-bold text-white">{pendingOnboardingCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Building size={20} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block mb-1">
              Active Inquiries / Cashouts
            </span>
            <div className="text-2xl font-bold text-amber-400">{activeQueriesCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock size={20} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block mb-1">
              Resolved Tickets
            </span>
            <div className="text-2xl font-bold text-blue-400">{resolvedQueriesCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Tabs Switcher & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-800">
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab("onboarding")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "onboarding"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-100 border border-zinc-800"
            }`}
          >
            Onboarding Applications ({safeOnboarding.length})
          </button>
          <button
            onClick={() => setActiveTab("inquiries")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "inquiries"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-100 border border-zinc-800"
            }`}
          >
            Support & Cashouts ({safeQueries.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              placeholder="Search store, name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 w-full sm:w-72 transition"
            />
          </div>

          {activeTab === "inquiries" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
          <ShieldAlert size={18} /> {error}
        </div>
      )}

      {/* Content Area */}
      {isLoading ? (
        <div className="p-20 flex flex-col items-center justify-center text-zinc-500 gap-3">
          <Loader2 className="animate-spin text-emerald-500" size={36} />
          <p className="text-sm font-medium text-zinc-400">Loading requests queue...</p>
        </div>
      ) : activeTab === "onboarding" ? (
        filteredOnboarding.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-16 text-center text-zinc-500">
            <CheckCircle2 className="mx-auto text-emerald-500 mb-3" size={48} />
            <p className="text-sm font-medium text-zinc-300">
              No matching vendor onboarding applications found.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredOnboarding.map((req) => (
              <div
                key={req.id}
                className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between shadow-sm"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-zinc-100 flex items-center gap-2">
                        <User size={16} className="text-emerald-500" />{" "}
                        {req.user?.name || "Unnamed User"}
                      </h3>
                      <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                        <Mail size={12} /> {req.user?.email || "No email provided"}
                      </p>
                    </div>
                    {req.submittedAt && (
                      <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1 bg-zinc-800/80 px-2.5 py-1 rounded-full border border-zinc-700">
                        <Calendar size={10} /> {new Date(req.submittedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="bg-zinc-950/50 border border-zinc-800/80 p-4 rounded-2xl">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Business Concept / Pitch:
                    </p>
                    <p className="text-sm text-zinc-300 leading-relaxed italic">
                      "{req.businessDescription || req.description || "No pitch provided"}"
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-zinc-800/80">
                  <button
                    disabled={submittingActionId === req.id}
                    onClick={() => handleOpenApproveModal(req)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/20"
                  >
                    <CheckCircle2 size={14} /> Provision Store
                  </button>
                  <button
                    disabled={submittingActionId === req.id}
                    onClick={() => void handleRejectOnboarding(req.id)}
                    className="bg-rose-500/10 hover:bg-rose-500 disabled:opacity-50 text-rose-400 hover:text-white border border-rose-500/20 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : filteredQueries.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-16 text-center text-zinc-500">
          <MessageSquare className="mx-auto text-zinc-600 mb-3" size={48} />
          <p className="text-sm font-medium text-zinc-300">
            No active vendor support queries or cashout requests matched.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQueries.map((query) => {
            const sender = getSenderContact(query);
            const emailStatus = query.emailNotification;

            return (
              <div
                key={query.id}
                className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm"
              >
                <div className="space-y-2.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {query.type}
                    </span>
                    {query.amount && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <DollarSign size={12} /> RWF {Number(query.amount).toLocaleString()}
                      </span>
                    )}
                    <select
                      disabled={submittingActionId === query.id}
                      value={query.status}
                      onChange={(e) => void handleQuickStatusChange(query.id, e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-xl border focus:outline-none cursor-pointer ${
                        query.status === "RESOLVED"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : query.status === "PROCESSING"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : query.status === "REJECTED"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      <option value="PENDING" className="bg-zinc-900 text-amber-400">
                        PENDING
                      </option>
                      <option value="PROCESSING" className="bg-zinc-900 text-blue-400">
                        PROCESSING
                      </option>
                      <option value="RESOLVED" className="bg-zinc-900 text-emerald-400">
                        RESOLVED
                      </option>
                      <option value="REJECTED" className="bg-zinc-900 text-rose-400">
                        REJECTED
                      </option>
                    </select>

                    {emailStatus && (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${
                          emailStatus.success
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                        }`}
                        title={emailStatus.messageId || emailStatus.reason || "Email status"}
                      >
                        {emailStatus.success ? (
                          <>
                            <Send size={10} /> Email Sent
                          </>
                        ) : (
                          <>
                            <AlertCircle size={10} /> {emailStatus.reason || "Email Not Sent"}
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-zinc-200 font-medium">{query.message}</p>

                  {/* Full Sender Contact Details */}
                  <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-zinc-400">
                    {sender.storeName && (
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <Store size={13} /> {sender.storeName}
                      </span>
                    )}
                    {sender.name && (
                      <span className="inline-flex items-center gap-1.5 text-zinc-200">
                        <User size={13} className="text-zinc-500" /> {sender.name}
                      </span>
                    )}
                    {sender.email && (
                      <a
                        href={`mailto:${sender.email}`}
                        className="inline-flex items-center gap-1.5 text-blue-400 hover:underline"
                      >
                        <Mail size={13} /> {sender.email}
                      </a>
                    )}
                    {sender.phone && (
                      <a
                        href={`tel:${sender.phone}`}
                        className="inline-flex items-center gap-1.5 text-amber-300 hover:underline font-mono"
                      >
                        <Phone size={13} /> {sender.phone}
                      </a>
                    )}
                    {query.vendorId ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500">
                        <Hash size={12} /> Vendor: <strong className="text-zinc-300">{query.vendorId}</strong>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500">
                        <Hash size={12} /> Ref: {query.id}
                      </span>
                    )}
                  </div>

                  {query.adminNotes && (
                    <div className="mt-2 p-3.5 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5">
                      <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                          Admin Response Reference:
                        </p>
                        <p className="text-xs text-zinc-300 mt-0.5">{query.adminNotes}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    disabled={submittingActionId === query.id}
                    onClick={() => {
                      setRespondingQuery(query);
                      setAdminReplyNotes(query.adminNotes || "");
                      setReplyStatus(query.status || "RESOLVED");
                    }}
                    className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600 disabled:opacity-50 text-blue-400 hover:text-white border border-blue-500/30 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <MessageSquare size={14} /> {query.adminNotes ? "Edit Response" : "Respond"}
                  </button>
                  <button
                    disabled={submittingActionId === query.id}
                    onClick={() => void handleDeleteQuery(query.id)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500 disabled:opacity-50 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl transition cursor-pointer"
                    title="Archive / Delete Query"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Store Provisioning Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => setSelectedRequest(null)} />

          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col z-10 text-zinc-100 overflow-hidden">
            <div className="p-6 border-b border-zinc-800 bg-zinc-900/90 flex justify-between items-center">
              <h3 className="font-bold text-lg text-zinc-100 flex items-center gap-2">
                <Building size={18} className="text-emerald-500" /> Provision Vendor Storefront
              </h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApproveOnboarding} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Store Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Business Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Physical Address
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/20 cursor-pointer"
                >
                  Authorize & Create Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Response / Resolution Modal */}
      {respondingQuery && (() => {
        const modalSender = getSenderContact(respondingQuery);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="absolute inset-0" onClick={() => setRespondingQuery(null)} />
            <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl z-15 text-zinc-100 overflow-hidden">
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/90">
                <h3 className="font-bold text-lg text-zinc-100">Respond to Vendor Inquiry</h3>
                <button
                  onClick={() => setRespondingQuery(null)}
                  className="text-zinc-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSendReply} className="p-6 space-y-4">
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-xs text-zinc-300 space-y-2">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-400 pb-2 border-b border-zinc-800/80">
                    {modalSender.storeName && (
                      <strong className="text-emerald-400">{modalSender.storeName}</strong>
                    )}
                    {modalSender.name && <span>{modalSender.name}</span>}
                    {modalSender.email && (
                      <span className="text-blue-400">{modalSender.email}</span>
                    )}
                    {modalSender.phone && (
                      <span className="text-amber-300 font-mono">{modalSender.phone}</span>
                    )}
                  </div>
                  <p className="font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Original Vendor Message:
                  </p>
                  <p className="italic">"{respondingQuery.message}"</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Action Status
                  </label>
                  <select
                    value={replyStatus}
                    onChange={(e) => setReplyStatus(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing / Under Review</option>
                    <option value="RESOLVED">Resolved / Payout Dispatched</option>
                    <option value="REJECTED">Reject Request</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Admin Response / Transfer Reference Note
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide details (e.g., Momo transaction ID or notes on why it's processed)..."
                    value={adminReplyNotes}
                    onChange={(e) => setAdminReplyNotes(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
                <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setRespondingQuery(null)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/20 cursor-pointer"
                  >
                    Send Response & Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
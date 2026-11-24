import { useState, useEffect, useCallback, useRef } from "react";
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  Settings,
  Activity,
} from "lucide-react";
import UserManagementPage from "../../../features/admin/user/UserManagement";
import AdminOverview, { type LiveRegistryMetric } from "./AdminOverview";
import GlobalConfig from "./GlobalConfig";
import SystemLogs from "./SystemLogs";
import { useAuthActions } from "../../../context/AuthContext";
import { socket } from "../../../libs/socket";

interface LiveUserRecord {
  id: string;
  role?: string | null;
  emailVerified?: boolean | null;
  email_verified?: boolean | null;
  image?: string | null;
}

interface RegistryTelemetryState {
  total: number;
  verifiedCount: number;
  vendorCount: number;
  adminCount: number;
  latencyMs: number | null;
  statusText: string;
  loading: boolean;
}

const AdminUserPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { admin } = useAuthActions();
  const isMountedRef = useRef(true);

  const [telemetry, setTelemetry] = useState<RegistryTelemetryState>({
    total: 0,
    verifiedCount: 0,
    vendorCount: 0,
    adminCount: 0,
    latencyMs: null,
    statusText: "SYNCING",
    loading: true,
  });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const syncLiveRegistryData = useCallback(async () => {
    if (!isMountedRef.current) return;
    setTelemetry((prev) => ({ ...prev, loading: true }));
    const startTime = performance.now();

    try {
      const res = await admin.listUsers({ limit: 500, offset: 0 });
      const elapsedMs = Math.max(1, Math.round(performance.now() - startTime));
      const responseData = res?.data || res;

      const users: LiveUserRecord[] = Array.isArray(responseData?.users)
        ? responseData.users
        : Array.isArray(responseData)
        ? responseData
        : [];

      const totalFromApi =
        typeof responseData?.total === "number"
          ? responseData.total
          : users.length;

      const verifiedCount = users.filter((u) =>
        Boolean(u.emailVerified ?? u.email_verified),
      ).length;
      const vendorCount = users.filter(
        (u) => String(u.role || "").toLowerCase() === "vendor",
      ).length;
      const adminCount = users.filter(
        (u) => String(u.role || "").toLowerCase() === "admin",
      ).length;

      if (!isMountedRef.current) return;
      setTelemetry({
        total: totalFromApi,
        verifiedCount,
        vendorCount,
        adminCount,
        latencyMs: elapsedMs,
        statusText: "LIVE DB CONNECTED",
        loading: false,
      });
    } catch (err) {
      const elapsedMs = Math.max(1, Math.round(performance.now() - startTime));
      console.error("Live registry telemetry failed:", err);
      if (!isMountedRef.current) return;
      setTelemetry((prev) => ({
        ...prev,
        latencyMs: elapsedMs,
        statusText: "SYNC ERROR",
        loading: false,
      }));
    }
  }, [admin]);

  useEffect(() => {
    void syncLiveRegistryData();
  }, [syncLiveRegistryData]);

  useEffect(() => {
    const handleRegistryChange = () => {
      void syncLiveRegistryData();
    };

    socket?.on?.("user:updated", handleRegistryChange);
    socket?.on?.("user:deleted", handleRegistryChange);
    socket?.on?.("vendorCreated", handleRegistryChange);
    socket?.on?.("vendorUpdated", handleRegistryChange);
    socket?.on?.("vendorDeleted", handleRegistryChange);

    return () => {
      socket?.off?.("user:updated", handleRegistryChange);
      socket?.off?.("user:deleted", handleRegistryChange);
      socket?.off?.("vendorCreated", handleRegistryChange);
      socket?.off?.("vendorUpdated", handleRegistryChange);
      socket?.off?.("vendorDeleted", handleRegistryChange);
    };
  }, [syncLiveRegistryData]);

  const denominator = Math.max(telemetry.total, 1);
  const liveMetrics: LiveRegistryMetric[] = [
    {
      label: "Verified Email Accounts",
      count: telemetry.verifiedCount,
      total: telemetry.total,
      percent:
        telemetry.total > 0
          ? Math.min(100, Math.round((telemetry.verifiedCount / denominator) * 100))
          : 0,
      color: "bg-emerald-500",
    },
    {
      label: "Vendor Accounts",
      count: telemetry.vendorCount,
      total: telemetry.total,
      percent:
        telemetry.total > 0
          ? Math.min(100, Math.round((telemetry.vendorCount / denominator) * 100))
          : 0,
      color: "bg-blue-500",
    },
    {
      label: "Admin Accounts",
      count: telemetry.adminCount,
      total: telemetry.total,
      percent:
        telemetry.total > 0
          ? Math.min(100, Math.round((telemetry.adminCount / denominator) * 100))
          : 0,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#050505] rounded-4xl p-4">
      {/* Admin Sidebar Navigation */}
      <aside className="w-full md:w-72 mt-2 bg-[#0a0a0a] md:rounded-r-[2.5rem] border-r border-white/5 p-8 flex flex-col space-y-10">
        <div>
          <div className="flex items-center gap-3 text-blue-500 mb-2">
            <ShieldCheck size={24} />
            <h2 className="font-black uppercase tracking-[0.3em] text-xs">
              Admin.Core
            </h2>
          </div>
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
            Live Database Control
          </p>
        </div>

        <nav className="space-y-2 flex-1">
          <NavItem
            icon={<LayoutDashboard size={18} />}
            label="Overview"
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />
          <NavItem
            icon={<Users size={18} />}
            label="User Registry"
            active={activeTab === "registry"}
            onClick={() => setActiveTab("registry")}
          />
          <NavItem
            icon={<Activity size={18} />}
            label="System Logs"
            active={activeTab === "logs"}
            onClick={() => setActiveTab("logs")}
          />
          <div className="pt-4 mt-4 border-t border-white/5">
            <NavItem
              icon={<Settings size={18} />}
              label="Global Config"
              active={activeTab === "config"}
              onClick={() => setActiveTab("config")}
            />
          </div>
        </nav>
      </aside>

      {/* Main Content Node - Switcher */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto max-h-screen custom-scrollbar relative">
        {activeTab === "overview" && (
          <AdminOverview
            totalUsers={telemetry.total}
            vendorCount={telemetry.vendorCount}
            isLoading={telemetry.loading}
            connectionStatus={telemetry.statusText}
            requestLatencyMs={telemetry.latencyMs}
            liveMetrics={liveMetrics}
            onRefresh={() => {
              void syncLiveRegistryData();
            }}
          />
        )}

        {activeTab === "registry" && <UserManagementPage />}

        {activeTab === "logs" && <SystemLogs />}

        {activeTab === "config" && <GlobalConfig />}
      </main>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const NavItem = ({ icon, label, active = false, onClick }: NavItemProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group cursor-pointer
      ${
        active
          ? "bg-blue-600/10 border border-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/5"
          : "text-gray-500 hover:bg-white/5 hover:text-white border border-transparent"
      }
    `}
  >
    <span
      className={`${
        active ? "text-blue-400" : "text-gray-600 group-hover:text-blue-400"
      } transition-colors`}
    >
      {icon}
    </span>
    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
      {label}
    </span>
  </button>
);

export default AdminUserPage;
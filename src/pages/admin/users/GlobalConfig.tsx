import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ShieldAlert,
  Globe,
  Bell,
  RefreshCcw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

export interface PlatformConfigState {
  maintenance: boolean;
  registrations: boolean;
  notifications: boolean;
}

const RAW_API_BASE = (import.meta.env.VITE_API_URL || "https://ingeri-api.onrender.com").replace(/\/+$/, "");

const buildConfigUrl = () => {
  if (!RAW_API_BASE) return "/api/admin/config";
  if (RAW_API_BASE.endsWith("/api")) {
    return `${RAW_API_BASE}/admin/config`;
  }
  return `${RAW_API_BASE}/api/admin/config`;
};

const DEFAULT_CONFIG: PlatformConfigState = {
  maintenance: false,
  registrations: true,
  notifications: true,
};

const normalizeConfig = (data: any): PlatformConfigState => ({
  maintenance: Boolean(data?.maintenance),
  registrations:
    data?.registrations !== undefined ? Boolean(data.registrations) : true,
  notifications:
    data?.notifications !== undefined ? Boolean(data.notifications) : true,
});

const GlobalConfig = () => {
  const [configs, setConfigs] = useState<PlatformConfigState>(DEFAULT_CONFIG);
  const [savedConfigs, setSavedConfigs] =
    useState<PlatformConfigState>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const loadLiveConfig = useCallback(async () => {
    setLoading(true);
    setSyncError(null);
    const endpoint = buildConfigUrl();

    try {
      const res = await fetch(endpoint, {
        credentials: "include",
      });

      if (!res.ok) {
        const message =
          res.status === 404
            ? "Endpoint GET /admin/config is not yet exposed on the backend."
            : `Failed to fetch live configuration (HTTP ${res.status}).`;
        setSyncError(message);
        return;
      }

      const payload = await res.json();
      const data = payload?.data ?? payload;
      const normalized = normalizeConfig(data);
      setConfigs(normalized);
      setSavedConfigs(normalized);
    } catch (err: any) {
      console.error("Failed to load live configuration:", err);
      setSyncError(err?.message || "Unable to reach configuration endpoint.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLiveConfig();
  }, [loadLiveConfig]);

  const isDirty = useMemo(
    () =>
      configs.maintenance !== savedConfigs.maintenance ||
      configs.registrations !== savedConfigs.registrations ||
      configs.notifications !== savedConfigs.notifications,
    [configs, savedConfigs],
  );

  const toggleConfig = (key: keyof PlatformConfigState) => {
    setConfigs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCommit = async () => {
    setSaving(true);
    setSyncError(null);
    const endpoint = buildConfigUrl();

    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(configs),
      });

      if (!res.ok) {
        throw new Error(`Config update failed (HTTP ${res.status})`);
      }

      let nextState = configs;
      try {
        const payload = await res.json();
        const data = payload?.data ?? payload;
        if (data && typeof data === "object") {
          nextState = normalizeConfig({ ...configs, ...data });
        }
      } catch {
        // 204 or plain response still counts as committed
      }

      setConfigs(nextState);
      setSavedConfigs(nextState);
      toast.success("Global configuration committed to server.");
    } catch (err: any) {
      const msg = err?.message || "Failed to save global configuration.";
      setSyncError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center gap-3 text-xs font-mono uppercase tracking-widest text-gray-500">
        <Loader2 size={16} className="animate-spin text-blue-500" /> Loading
        live configuration...
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tighter text-white">
            SYSTEM CONFIGURATION
          </h2>
          <p className="text-gray-500 text-sm">
            Manage live platform variables and security overrides via cookie-authenticated API.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadLiveConfig()}
          disabled={loading || saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
          Reload State
        </button>
      </div>

      {syncError && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono flex items-center gap-2.5">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{syncError}</span>
        </div>
      )}

      <div className="space-y-4">
        <ConfigItem
          title="Maintenance Override"
          desc="Restrict incoming traffic while performing system maintenance."
          icon={<ShieldAlert size={18} />}
          active={configs.maintenance}
          onClick={() => toggleConfig("maintenance")}
        />
        <ConfigItem
          title="New Registrations"
          desc="Allow external users to register new accounts."
          icon={<Globe size={18} />}
          active={configs.registrations}
          onClick={() => toggleConfig("registrations")}
        />
        <ConfigItem
          title="System Notifications"
          desc="Enable automated email and operational alerts."
          icon={<Bell size={18} />}
          active={configs.notifications}
          onClick={() => toggleConfig("notifications")}
        />
      </div>

      <div className="pt-8 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-mono">
          {isDirty ? (
            <span className="text-amber-400">Unsaved changes pending commit</span>
          ) : (
            <span className="text-emerald-400 inline-flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Synced with server
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isDirty && (
            <button
              type="button"
              disabled={saving}
              onClick={() => setConfigs(savedConfigs)}
              className="px-5 py-4 bg-white/5 hover:bg-white/10 text-gray-300 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
            >
              Discard
            </button>
          )}

          <button
            type="button"
            disabled={saving || !isDirty}
            onClick={() => void handleCommit()}
            className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-blue-500/10"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCcw size={14} />
            )}
            {saving ? "Saving..." : "Commit Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ConfigItemProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

const ConfigItem = ({
  title,
  desc,
  icon,
  active,
  onClick,
}: ConfigItemProps) => (
  <div
    onClick={onClick}
    className="flex items-center justify-between p-6 bg-[#0a0a0a] border border-white/5 rounded-4xl hover:border-white/10 transition-colors cursor-pointer select-none"
  >
    <div className="flex items-center gap-5">
      <div className="p-4 bg-white/5 rounded-2xl text-blue-500 border border-white/5">
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-white uppercase tracking-tight">
          {title}
        </p>
        <p className="text-xs text-gray-500 font-medium mt-0.5">{desc}</p>
      </div>
    </div>
    <div
      className={`w-14 h-8 rounded-full p-1 transition-colors border ${
        active
          ? "bg-blue-600 border-blue-400"
          : "bg-gray-900 border-white/10"
      }`}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform ${
          active ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </div>
  </div>
);

export default GlobalConfig;
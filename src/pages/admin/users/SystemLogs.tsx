import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Terminal,
  Download,
  Search,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import toast from "react-hot-toast";
import { socket } from "../../../libs/socket";

export interface LiveSystemLog {
  id: string | number;
  time: string;
  level: string;
  module: string;
  msg: string;
  node?: string;
  payloadBytes?: number;
}

const RAW_VITE_API_URL = (import.meta.env.VITE_API_URL || "")
  .trim()
  .replace(/\/+$/, "");

const resolveApiBase = (rawUrl: string): string => {
  const isDeployedSite =
    Boolean(import.meta.env.PROD) ||
    (typeof window !== "undefined" &&
      window.location.hostname === "ingeni.onrender.com");

  if (isDeployedSite) {
    return "/api";
  }

  if (!rawUrl) {
    return "https://ingeri-api.onrender.com/api";
  }

  return rawUrl.endsWith("/api") ? rawUrl : `${rawUrl}/api`;
};

const API_BASE = resolveApiBase(RAW_VITE_API_URL);

const buildApiUrl = (path: string) => {
  const cleanBase = API_BASE.replace(/\/+$/, "");
  let cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (cleanBase.endsWith("/api") && cleanPath.startsWith("/api/")) {
    cleanPath = cleanPath.slice(4);
  }

  return `${cleanBase}${cleanPath}`;
};

const normalizeLogEntry = (entry: any, idx: number): LiveSystemLog => ({
  id: entry?.id ?? `log-${Date.now()}-${idx}`,
  time:
    entry?.time ||
    entry?.timestamp ||
    entry?.createdAt ||
    new Date().toISOString(),
  level: String(entry?.level || entry?.severity || "INFO").toUpperCase(),
  module: String(entry?.module || entry?.context || "SYSTEM").toUpperCase(),
  msg: String(entry?.msg || entry?.message || ""),
  node: entry?.node || entry?.host || "API",
  payloadBytes: Number(entry?.payloadBytes || entry?.sizeBytes || 0),
});

const SystemLogs = () => {
  const [logs, setLogs] = useState<LiveSystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusNote, setStatusNote] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [activeMetric, setActiveMetric] = useState<"requests" | "bandwidth">(
    "requests",
  );
  const abortRef = useRef<AbortController | null>(null);

  const fetchLiveLogs = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setStatusNote("");
    try {
      const targetUrl = buildApiUrl("/admin/logs?limit=200");
      const res = await fetch(targetUrl, {
        credentials: "include",
        signal: controller.signal,
      });

      const rawText = await res.text();
      const looksLikeHtml = rawText.trim().toLowerCase().startsWith("<!doctype");

      if (!res.ok || looksLikeHtml) {
        setLogs([]);
        setStatusNote(
          looksLikeHtml
            ? `Expected JSON from ${targetUrl}, received HTML instead. Check VITE_API_URL or backend server port.`
            : res.status === 404
              ? "Endpoint GET /admin/logs not found on backend (0 persisted log rows yet)."
              : `Backend returned HTTP ${res.status} from ${targetUrl}`,
        );
        return;
      }

      const payload = rawText ? JSON.parse(rawText) : [];
      const rawList = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.logs)
            ? payload.logs
            : [];

      const normalized = rawList.map((entry: any, idx: number) =>
        normalizeLogEntry(entry, idx),
      );

      setLogs(normalized);
      if (normalized.length === 0) {
        setStatusNote(
          "Connected to live log endpoint — 0 log entries in database.",
        );
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.error("Error fetching live logs:", err);
      setLogs([]);
      setStatusNote(err?.message || "Unable to reach live logs endpoint.");
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchLiveLogs();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchLiveLogs]);

  useEffect(() => {
    const handleIncomingLog = (incoming: any) => {
      if (!incoming || typeof incoming !== "object") return;
      const entry = normalizeLogEntry(incoming, Math.floor(Math.random() * 10000));
      setStatusNote("");
      setLogs((prev) => [entry, ...prev.filter((l) => l.id !== entry.id)].slice(0, 200));
    };

    socket?.on?.("admin:log-created", handleIncomingLog);
    socket?.on?.("system:log", handleIncomingLog);

    return () => {
      socket?.off?.("admin:log-created", handleIncomingLog);
      socket?.off?.("system:log", handleIncomingLog);
    };
  }, []);

  const filteredLogs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return logs.filter((log) => {
      if (levelFilter !== "ALL" && log.level !== levelFilter) {
        return false;
      }
      if (!q) return true;
      return (
        log.msg.toLowerCase().includes(q) ||
        log.module.toLowerCase().includes(q) ||
        log.level.toLowerCase().includes(q) ||
        (log.node || "").toLowerCase().includes(q)
      );
    });
  }, [logs, searchTerm, levelFilter]);

  const chartData = useMemo(() => {
    const bucketMap = new Map<
      string,
      { time: string; requests: number; bandwidth: number }
    >();

    logs.forEach((log) => {
      const parsedDate = new Date(log.time);
      const label = Number.isNaN(parsedDate.getTime())
        ? String(log.time).slice(0, 5) || "LIVE"
        : parsedDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

      const current = bucketMap.get(label) || {
        time: label,
        requests: 0,
        bandwidth: 0,
      };
      current.requests += 1;
      const bytes =
        log.payloadBytes && log.payloadBytes > 0
          ? log.payloadBytes
          : new TextEncoder().encode(log.msg).length;
      current.bandwidth = Number(
        (current.bandwidth + bytes / (1024 * 1024)).toFixed(4),
      );
      bucketMap.set(label, current);
    });

    return Array.from(bucketMap.values());
  }, [logs]);

  const criticalErrorCount = useMemo(
    () =>
      logs.filter(
        (l) =>
          l.level === "ERROR" || l.level === "CRITICAL" || l.level === "FATAL",
      ).length,
    [logs],
  );

  const handleExportLogs = () => {
    if (filteredLogs.length === 0) {
      toast("No live log entries to export.", { icon: "ℹ️" });
      return;
    }

    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `system-logs-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredLogs.length} log entries.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tighter text-white uppercase">
            System Telemetry
          </h2>
          <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            Live Audit Trail &amp; Database Event Logs
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 md:w-60">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"
              size={14}
            />
            <input
              type="text"
              placeholder="FILTER LOGS..."
              className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-[10px] font-mono text-gray-300 outline-none focus:border-blue-500/30 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-[#0a0a0a] border border-white/5 rounded-xl px-3.5 py-3 text-[10px] font-mono uppercase text-gray-300 outline-none focus:border-blue-500/30 cursor-pointer"
          >
            <option value="ALL">ALL LEVELS</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
          </select>

          <button
            type="button"
            onClick={() => void fetchLiveLogs()}
            className="p-3 bg-[#0a0a0a] border border-white/5 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
            title="Refresh live logs"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin text-blue-400" : ""}
            />
          </button>

          <button
            type="button"
            onClick={handleExportLogs}
            className="p-3 bg-[#0a0a0a] border border-white/5 rounded-xl text-gray-400 hover:text-blue-400 transition-all cursor-pointer"
            title="Export filtered logs (JSON)"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {statusNote && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono">
          {statusNote}
        </div>
      )}

      {/* Live Event Chart */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">
              Recorded Event Activity
            </h3>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">
              Derived from live log records
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#050505] border border-white/5 p-1.5 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveMetric("requests")}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                activeMetric === "requests"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              Events
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric("bandwidth")}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                activeMetric === "bandwidth"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              Payload (MB)
            </button>
          </div>
        </div>

        <div className="h-64 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs font-mono text-gray-600 uppercase tracking-widest">
              {loading
                ? "Loading live log series..."
                : "No live log series available"}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis
                  dataKey="time"
                  stroke="#525252"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis stroke="#525252" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#050505",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "1rem",
                    fontSize: "11px",
                  }}
                  itemStyle={{ color: "#3b82f6", fontWeight: "bold" }}
                  labelStyle={{ color: "#737373", marginBottom: "4px" }}
                />
                <Area
                  type="monotone"
                  dataKey={activeMetric}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorMetric)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Terminal View */}
      <div className="bg-[#050505] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
          <Terminal size={180} />
        </div>

        <div className="bg-[#0a0a0a] border-b border-white/5 px-8 py-4 flex items-center justify-between">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/40" />
          </div>
          <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">
            {loading ? "Syncing..." : `${filteredLogs.length} entries`}
          </span>
        </div>

        <div className="p-6 font-mono overflow-x-auto custom-scrollbar">
          <div className="min-w-175 space-y-1">
            {loading && filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-600 text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin text-blue-500" />
                Loading live log stream...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-600 text-xs uppercase tracking-widest">
                No log entries found for the current filter.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="grid grid-cols-12 gap-4 py-2 px-4 rounded-lg hover:bg-white/5 transition-colors border-l border-transparent hover:border-blue-500/30 group"
                >
                  <span className="col-span-2 text-gray-600 text-[11px] truncate">
                    {log.time}
                  </span>

                  <span
                    className={`col-span-1 text-[10px] font-black text-center rounded px-1 h-fit mt-0.5 ${
                      log.level === "ERROR" || log.level === "CRITICAL"
                        ? "bg-red-500/10 text-red-500"
                        : log.level === "WARN"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-blue-500/10 text-blue-500"
                    }`}
                  >
                    {log.level}
                  </span>

                  <span className="col-span-1 text-gray-500 text-[11px] font-bold uppercase tracking-tighter truncate">
                    {log.module}
                  </span>

                  <span className="col-span-6 text-gray-400 text-[11px] group-hover:text-gray-200 transition-colors">
                    {log.msg}
                  </span>

                  <span className="col-span-2 text-right text-gray-700 text-[10px] font-bold uppercase italic truncate">
                    {log.node || "API"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Live Summary Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex items-center justify-between">
          <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
            Total Loaded Events
          </span>
          <span className="text-lg font-mono font-bold text-white">
            {logs.length.toLocaleString()}
          </span>
        </div>
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex items-center justify-between">
          <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
            Critical / Error Logs
          </span>
          <span className="text-lg font-mono font-bold text-red-500">
            {criticalErrorCount.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;
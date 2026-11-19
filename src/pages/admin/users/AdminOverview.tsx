import { useEffect, useState } from "react";
import {
  Users,
  Store,
  Zap,
  Database,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export interface LiveRegistryMetric {
  label: string;
  count: number;
  total: number;
  percent: number;
  color: string;
}

export interface SiteTrafficPoint {
  time: string;
  requests: number;
  activeSessions: number;
}

export interface AdminOverviewProps {
  totalUsers: number;
  vendorCount: number;
  activeSessionsCount?: number;
  isLoading: boolean;
  connectionStatus: string;
  requestLatencyMs: number | null;
  liveMetrics: LiveRegistryMetric[];
  trafficSeries?: SiteTrafficPoint[];
  onRefresh: () => void;
}

const AdminOverview = ({
  totalUsers,
  vendorCount,
  activeSessionsCount = 0,
  isLoading,
  connectionStatus,
  requestLatencyMs,
  liveMetrics = [],
  trafficSeries,
  onRefresh,
}: AdminOverviewProps) => {
  const [observedTraffic, setObservedTraffic] = useState<SiteTrafficPoint[]>([]);

  // Record real observed telemetry snapshots when live data updates
  useEffect(() => {
    if (isLoading) return;

    const nowLabel = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    setObservedTraffic((prev) => {
      const nextPoint: SiteTrafficPoint = {
        time: nowLabel,
        requests: prev.length + 1,
        activeSessions: activeSessionsCount,
      };
      const updated = [...prev, nextPoint];
      return updated.slice(-20);
    });
  }, [isLoading, totalUsers, vendorCount, activeSessionsCount, requestLatencyMs]);

  const chartData =
    trafficSeries && trafficSeries.length > 0
      ? trafficSeries
      : observedTraffic;

  if (isLoading && chartData.length === 0) {
    return (
      <div className="py-24 text-center text-sm font-mono uppercase tracking-widest text-white/70">
        Syncing live database records...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">
            Live Registry Telemetry
          </p>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
            Database &amp; Account Overview
          </h2>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0a0a0a] border border-white/10 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          Refresh Live Metrics
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Registered Users"
          value={totalUsers.toLocaleString()}
          icon={<Users className="text-blue-500" />}
          sub="Live DB User Count"
        />
        <StatCard
          label="Vendor Accounts"
          value={vendorCount.toLocaleString()}
          icon={<Store className="text-emerald-500" />}
          sub="Role: vendor in DB"
        />
        <StatCard
          label="Auth Query RTT"
          value={requestLatencyMs !== null ? `${requestLatencyMs}ms` : "—"}
          icon={<Zap className="text-amber-500" />}
          sub={connectionStatus}
        />
      </div>

      {/* Live Site Traffic Line Chart */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <TrendingUp size={15} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.35em]">
                Live Site Traffic
              </h3>
            </div>
            <p className="text-xs text-gray-500">
              Real-time telemetry polls &amp; active session activity
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
            {chartData.length} live point(s)
          </span>
        </div>

        <div className="h-64 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs font-mono text-gray-600 uppercase tracking-widest">
              Waiting for live traffic data...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 16, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis
                  dataKey="time"
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#050505",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "0.75rem",
                    fontSize: "11px",
                  }}
                  labelStyle={{ color: "#a1a1aa", marginBottom: "4px" }}
                />
                <Line
                  type="monotone"
                  dataKey="requests"
                  name="Telemetry Syncs / Traffic"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#3b82f6" }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="activeSessions"
                  name="Active Sessions"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: "#10b981" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <Database size={200} />
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-8">
          Live Account Distribution
        </h3>
        <div className="space-y-6 max-w-lg">
          {liveMetrics.map((metric) => (
            <HealthBar
              key={metric.label}
              label={metric.label}
              count={metric.count}
              total={metric.total}
              percent={metric.percent}
              color={metric.color}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  label,
  value,
  icon,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  sub: string;
}) => (
  <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-4xl shadow-2xl">
    <div className="mb-4 flex items-center gap-3">
      {icon}
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
        {label}
      </p>
    </div>
    <p className="text-3xl font-mono font-bold text-white mt-1">{value}</p>
    <p className="text-[9px] font-medium text-gray-500 mt-2 uppercase tracking-widest">
      {sub}
    </p>
  </div>
);

const HealthBar = ({
  label,
  count,
  total,
  percent,
  color,
}: {
  label: string;
  count: number;
  total: number;
  percent: number;
  color: string;
}) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
      <span>{label}</span>
      <span>
        {count.toLocaleString()} / {total.toLocaleString()} ({percent}%)
      </span>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} transition-all duration-700`}
        style={{ width: `${percent}%` }}
      />
    </div>
  </div>
);

export default AdminOverview;
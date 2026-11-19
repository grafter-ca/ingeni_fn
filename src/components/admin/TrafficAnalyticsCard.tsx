import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MessageCircle,
  Phone,
  Loader2,
  BarChart3,
  Store,
  X,
  Package,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { fetchVendorTrafficStats } from '../../services/admin-analytics.service';
import type { TrafficStat } from '../../types/admin';
import { useAuthState } from '../../context/AuthContext';

interface TrafficAnalyticsCardProps {
  vendorId: string;
  vendorName?: string;
}

interface NormalizedStat {
  id: string;
  actionType: 'whatsapp' | 'call' | string;
  count: number;
  productId: string | null;
  vendorId: string | null;
  vendorName: string | null;
  createdAt: string | null;
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

function extractCount(raw: any): number {
  if (typeof raw?.count === 'number' && Number.isFinite(raw.count)) {
    return Math.max(0, raw.count);
  }
  if (typeof raw?.count?.id === 'number' && Number.isFinite(raw.count.id)) {
    return Math.max(0, raw.count.id);
  }
  if (typeof raw?._count?.id === 'number' && Number.isFinite(raw._count.id)) {
    return Math.max(0, raw._count.id);
  }
  return 1;
}

function normalizeStatsPayload(payload: any): NormalizedStat[] {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.stats)
        ? payload.stats
        : [];

  return list
    .filter((item: any) => item && typeof item === 'object')
    .map((item: any, idx: number) => ({
      id: String(item.id ?? `stat-${idx}`),
      actionType: String(item.actionType ?? item.action_type ?? 'unknown').toLowerCase(),
      count: extractCount(item),
      productId: item.productId ? String(item.productId) : null,
      vendorId: item.vendorId ? String(item.vendorId) : null,
      vendorName: item.vendorName || item.storeName || null,
      createdAt: item.createdAt || item.timestamp || null,
    }));
}

export const TrafficAnalyticsCard: React.FC<TrafficAnalyticsCardProps> = ({
  vendorId,
  vendorName,
}) => {
  const { isLoading: isAuthLoading, user } = useAuthState();
  const [stats, setStats] = useState<NormalizedStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State for Clicks Breakdown
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'call' | 'whatsapp'>('call');
  const [modalSearch, setModalSearch] = useState('');

  const loadStats = useCallback(
    async (isCancelled?: () => boolean) => {
      if (!vendorId) {
        if (!isCancelled?.()) {
          setStats([]);
          setError('Missing vendor identifier.');
          setLoading(false);
        }
        return;
      }

      try {
        if (!isCancelled?.()) {
          setLoading(true);
          setError(null);
        }

        const rawData = await fetchVendorTrafficStats(vendorId);
        const normalized = normalizeStatsPayload(rawData as TrafficStat[] | any);

        if (!isCancelled?.()) {
          setStats(normalized);
        }
      } catch (err: any) {
        if (!isCancelled?.()) {
          setStats([]);
          setError(err?.message || 'Error loading traffic analytics');
        }
      } finally {
        if (!isCancelled?.()) {
          setLoading(false);
        }
      }
    },
    [vendorId],
  );

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    void loadStats(() => cancelled);

    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, user, loadStats]);

  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const { whatsappCount, callCount, totalClicks, whatsappPercent, callPercent } =
    useMemo(() => {
      const wa = stats
        .filter((s) => s.actionType === 'whatsapp')
        .reduce((acc, curr) => acc + curr.count, 0);

      const calls = stats
        .filter((s) => s.actionType === 'call')
        .reduce((acc, curr) => acc + curr.count, 0);

      const total = wa + calls;
      const waPct = total > 0 ? Math.round((wa / total) * 100) : 0;
      const callPct = total > 0 ? Math.max(0, 100 - waPct) : 0;

      return {
        whatsappCount: wa,
        callCount: calls,
        totalClicks: total,
        whatsappPercent: waPct,
        callPercent: callPct,
      };
    }, [stats]);

  const chartData = useMemo(() => {
    const sourceBreakdown = stats.reduce<
      Record<
        string,
        {
          whatsapp: number;
          call: number;
          total: number;
          items: NormalizedStat[];
        }
      >
    >((acc, curr) => {
      const groupKey = curr.productId
        ? `Product: ${curr.productId.length > 16 ? `${curr.productId.slice(0, 16)}…` : curr.productId}`
        : curr.vendorName || vendorName || 'Store Activity';

      if (!acc[groupKey]) {
        acc[groupKey] = { whatsapp: 0, call: 0, total: 0, items: [] };
      }

      if (curr.actionType === 'whatsapp') {
        acc[groupKey].whatsapp += curr.count;
      } else if (curr.actionType === 'call') {
        acc[groupKey].call += curr.count;
      }

      acc[groupKey].total += curr.count;
      acc[groupKey].items.push(curr);
      return acc;
    }, {});

    return Object.entries(sourceBreakdown)
      .map(([name, data], idx) => ({
        name,
        clicks: data.total,
        whatsapp: data.whatsapp,
        call: data.call,
        items: data.items,
        color: CHART_COLORS[idx % CHART_COLORS.length],
      }))
      .sort((a, b) => b.clicks - a.clicks);
  }, [stats, vendorName]);

  const modalFilteredStats = useMemo(() => {
    const q = modalSearch.trim().toLowerCase();
    return stats.filter((s) => {
      if (s.actionType !== modalType) return false;
      if (!q) return true;
      return (
        s.id.toLowerCase().includes(q) ||
        (s.productId || '').toLowerCase().includes(q) ||
        (s.vendorId || '').toLowerCase().includes(q)
      );
    });
  }, [stats, modalType, modalSearch]);

  const openModalFor = (type: 'call' | 'whatsapp') => {
    setModalType(type);
    setModalSearch('');
    setIsModalOpen(true);
  };

  if (isAuthLoading || loading) {
    return (
      <div className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center min-h-56 gap-2 shadow-sm">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
          Loading engagement metrics...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-[#0a0a0a] border border-red-500/20 rounded-2xl p-5 space-y-3 shadow-sm">
        <div className="text-red-500 text-xs font-medium">
          Failed to load traffic analytics: {error}
        </div>
        <button
          type="button"
          onClick={() => void loadStats()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition cursor-pointer"
        >
          <RefreshCw size={13} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/5 rounded-2xl p-4 sm:p-5 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Traffic &amp; Conversion
          </h4>
          <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white mt-0.5">
            {vendorName ? `${vendorName} Engagement` : 'Store Interactions'}
          </h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void loadStats()}
            title="Refresh analytics"
            className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <RefreshCw size={14} />
          </button>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <BarChart3 size={16} />
          </div>
        </div>
      </div>

      {/* Total Metric Overview */}
      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121212] border border-zinc-100 dark:border-white/5 flex items-baseline justify-between gap-3">
        <div className="space-y-0.5 pr-2">
          <span className="text-[10px] uppercase text-zinc-400 block">
            Total Interactions
          </span>
          <span className="text-xs text-zinc-600 dark:text-zinc-300">
            Customer interactions tracked from database records
          </span>
        </div>
        <span className="text-xl font-mono font-bold text-zinc-900 dark:text-white shrink-0">
          {totalClicks.toLocaleString()}
        </span>
      </div>

      {/* Recharts Breakdown Chart */}
      <div className="space-y-3 pt-1">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[10px]">
            Product &amp; Reference Breakdown
          </span>
        </div>

        <div className="h-48 sm:h-52 w-full bg-zinc-50/50 dark:bg-[#121212]/50 border border-zinc-100 dark:border-white/5 rounded-2xl p-2 sm:p-3">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs font-mono text-zinc-500">
              No interaction records yet for this scope.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 15, right: 10, left: -25, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs shadow-xl space-y-1.5 text-white max-w-xs">
                          <p className="font-bold text-sm text-zinc-100 border-b border-white/10 pb-1">
                            {data.name}
                          </p>
                          <div className="flex gap-3 text-[11px] text-zinc-300">
                            <span className="text-emerald-400">
                              WhatsApp: <b>{data.whatsapp}</b>
                            </span>
                            <span className="text-blue-400">
                              Calls: <b>{data.call}</b>
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                />
                <Bar dataKey="clicks" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Detailed Cards for Each Breakdown Source */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {chartData.map((item) => (
              <div
                key={item.name}
                className="p-3.5 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-[#121212] space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-semibold text-xs shadow-sm shrink-0"
                      style={{ backgroundColor: item.color }}
                    >
                      <Store size={14} />
                    </div>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-xs font-black text-zinc-700 dark:text-zinc-300 shrink-0">
                    {item.clicks} clicks
                  </span>
                </div>
                <div className="flex gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 pl-9">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    WhatsApp: {item.whatsapp}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400">
                    Calls: {item.call}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <hr className="border-zinc-100 dark:border-white/5" />

      {/* Action Type Proportion Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            WhatsApp ({whatsappPercent}%)
          </span>
          <span className="flex items-center gap-1.5 text-blue-500 font-medium">
            Calls ({callPercent}%)
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </span>
        </div>
        <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${whatsappPercent}%` }}
          />
          <div
            className="bg-blue-500 transition-all duration-500"
            style={{ width: `${callPercent}%` }}
          />
        </div>
      </div>

      {/* Action Breakdown Grid (Clickable Cards to Open Modal) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={() => openModalFor('whatsapp')}
          className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 cursor-pointer hover:bg-emerald-500/10 transition-colors group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <MessageCircle size={16} />
            </div>
            <div>
              <span className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 block group-hover:underline font-semibold">
                WhatsApp Clicks
              </span>
              <span className="text-sm font-bold text-zinc-900 dark:text-white">
                {whatsappCount} total
              </span>
            </div>
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            View details →
          </span>
        </button>

        <button
          type="button"
          onClick={() => openModalFor('call')}
          className="flex items-center justify-between p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 cursor-pointer hover:bg-blue-500/10 transition-colors group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Phone size={16} />
            </div>
            <div>
              <span className="text-[10px] uppercase text-blue-600 dark:text-blue-400 block group-hover:underline font-semibold">
                Call Clicks
              </span>
              <span className="text-sm font-bold text-zinc-900 dark:text-white">
                {callCount} total
              </span>
            </div>
          </div>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            View details →
          </span>
        </button>
      </div>

      {/* Real Database Records Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
        >
          <div
            className="fixed inset-0"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative z-10 bg-white dark:bg-[#121212] border border-zinc-200 dark:border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 ${
                    modalType === 'whatsapp' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}
                >
                  {modalType === 'whatsapp' ? (
                    <MessageCircle size={16} />
                  ) : (
                    <Phone size={16} />
                  )}
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                    {modalType === 'whatsapp'
                      ? 'WhatsApp Interaction Records'
                      : 'Call Interaction Records'}
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    {modalFilteredStats.length} matching record(s)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
                className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shrink-0 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Search */}
            <div className="px-4 sm:px-5 pt-3.5">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="text"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="Filter by product ID, vendor ID, or record ID..."
                  className="w-full bg-zinc-50 dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-zinc-900 dark:text-white outline-none focus:border-blue-500/40"
                />
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-5 max-h-[55vh] overflow-y-auto space-y-3">
              {modalFilteredStats.length === 0 ? (
                <div className="text-center py-10 text-xs text-zinc-400">
                  No tracking log records match your current filter.
                </div>
              ) : (
                modalFilteredStats.map((stat) => {
                  const parsedDate = stat.createdAt
                    ? new Date(stat.createdAt)
                    : null;
                  const formattedDate =
                    parsedDate && !Number.isNaN(parsedDate.getTime())
                      ? parsedDate.toLocaleString()
                      : null;

                  return (
                    <div
                      key={stat.id}
                      className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/5 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 truncate pr-2">
                          <Package
                            size={13}
                            className={
                              modalType === 'whatsapp'
                                ? 'text-emerald-500'
                                : 'text-blue-500'
                            }
                          />
                          {stat.productId
                            ? `Product: ${stat.productId}`
                            : 'Store Interaction'}
                        </span>

                        {formattedDate && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium shrink-0">
                            {formattedDate}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-zinc-600 dark:text-zinc-300 space-y-1 pl-5 border-l-2 border-zinc-300 dark:border-zinc-700">
                        {stat.vendorId && (
                          <p>
                            <b className="text-zinc-400">Vendor ID:</b>{' '}
                            <span className="font-mono text-[10px]">
                              {stat.vendorId}
                            </span>
                          </p>
                        )}
                        <p>
                          <b className="text-zinc-400">Action Type:</b>{' '}
                          <span className="uppercase font-semibold">
                            {stat.actionType}
                          </span>{' '}
                          <span className="text-zinc-400">
                            (×{stat.count})
                          </span>
                        </p>
                        <p>
                          <b className="text-zinc-400">Record ID:</b>{' '}
                          <span className="font-mono text-[10px] text-zinc-400">
                            {stat.id}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-zinc-50 dark:bg-[#181818] border-t border-zinc-100 dark:border-white/5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
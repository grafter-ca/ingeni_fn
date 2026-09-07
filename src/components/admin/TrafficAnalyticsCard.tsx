// src/components/admin/TrafficAnalyticsCard.tsx
import React, { useEffect, useState } from 'react';
import { MessageCircle, Phone, Loader2, BarChart3, Store, X, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { fetchVendorTrafficStats } from '../../services/admin-analytics.service';
import type { TrafficStat } from '../../types/admin';
import { useAuthState } from '../../context/AuthContext';

interface TrafficAnalyticsCardProps {
  vendorId: string;
  vendorName?: string;
}

export const TrafficAnalyticsCard: React.FC<TrafficAnalyticsCardProps> = ({ vendorId, vendorName }) => {
  const { isLoading: isAuthLoading, user } = useAuthState();
  const [stats, setStats] = useState<TrafficStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State for Clicks Breakdown
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'call' | 'whatsapp'>('call');

  useEffect(() => {
    if (isAuthLoading || !user) return;

    let isMounted = true;

    async function loadStats() {
      try {
        setLoading(true);
        const data = await fetchVendorTrafficStats(vendorId);
        if (isMounted) setStats(data || []);
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Error loading stats');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [vendorId, isAuthLoading, user]);

  const whatsappCount = stats
    .filter((s: any) => s.actionType === 'whatsapp')
    .reduce((acc, curr) => acc + (curr._count?.id || curr.count || 1), 0);

  const callCount = stats
    .filter((s: any) => s.actionType === 'call')
    .reduce((acc, curr) => acc + (curr._count?.id || curr.count || 1), 0);

  const totalClicks = whatsappCount + callCount;

  const whatsappPercent = totalClicks > 0 ? (whatsappCount / totalClicks) * 100 : 50;
  const callPercent = totalClicks > 0 ? (callCount / totalClicks) * 100 : 50;

  // Group actual click statistics by real database schema fields (e.g., productId or vendorId)
  const sourceBreakdown = stats.reduce((acc: Record<string, { whatsapp: number; call: number; total: number; items: any[] }>, curr: any) => {
    const groupKey = curr.productId ? `Product: ${curr.productId.slice(0, 16)}...` : (curr.vendorName || curr.storeName || vendorName || 'Store Activity');

    if (!acc[groupKey]) {
      acc[groupKey] = { whatsapp: 0, call: 0, total: 0, items: [] };
    }

    const count = curr._count?.id || curr.count || 1;
    if (curr.actionType === 'whatsapp') {
      acc[groupKey].whatsapp += count;
    } else if (curr.actionType === 'call') {
      acc[groupKey].call += count;
    }
    acc[groupKey].total += count;
    acc[groupKey].items.push(curr);

    return acc;
  }, {});

  const chartData = Object.entries(sourceBreakdown).map(([name, data], idx) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    return {
      name,
      clicks: data.total,
      whatsapp: data.whatsapp,
      call: data.call,
      items: data.items,
      color: colors[idx % colors.length],
    };
  });

  // Filtered actual raw items for the selected modal type matching database rows
  const modalFilteredStats = stats.filter((s: any) => s.actionType === modalType);

  if (isAuthLoading || loading) {
    return (
      <div className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 flex items-center justify-center h-48 shadow-sm">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-[#0a0a0a] border border-red-500/20 rounded-2xl p-6 text-red-500 text-xs">
        Failed to load traffic analytics: {error}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/5 rounded-2xl p-4 sm:p-5 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Traffic & Conversion
          </h4>
          <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white mt-0.5">
            {vendorName ? `${vendorName} Engagement` : 'Store Interactions'}
          </h3>
        </div>
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <BarChart3 size={16} />
        </div>
      </div>

      {/* Total Metric Overview */}
      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121212] border border-zinc-100 dark:border-white/5 flex items-baseline justify-between">
        <div className="space-y-0.5 pr-2">
          <span className="text-[10px] uppercase text-zinc-400 block">Total Interactions</span>
          <span className="text-xs text-zinc-600 dark:text-zinc-300">Customer interactions tracked from database records</span>
        </div>
        <span className="text-xl font-bold text-zinc-900 dark:text-white shrink-0">{totalClicks}</span>
      </div>

      {/* Recharts Vendor Breakdown Chart */}
      <div className="space-y-3 pt-1">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[10px]">Product & Reference Breakdown</span>
        </div>

        <div className="h-48 sm:h-52 w-full bg-zinc-50/50 dark:bg-[#121212]/50 border border-zinc-100 dark:border-white/5 rounded-2xl p-2 sm:p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
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
                        <p className="font-bold text-sm text-zinc-100 border-b border-white/10 pb-1">{data.name}</p>
                        <div className="flex gap-3 text-[11px] text-zinc-300">
                          <span className="text-emerald-400">WhatsApp: <b>{data.whatsapp}</b></span>
                          <span className="text-blue-400">Calls: <b>{data.call}</b></span>
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
        </div>

        {/* Detailed Cards for each Breakpoint Source */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {chartData.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-[#121212] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-semibold text-xs shadow-sm shrink-0"
                      style={{ backgroundColor: item.color }}
                    >
                      <Store size={14} />
                    </div>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">{item.name}</span>
                  </div>
                  <span className="text-xs font-black text-zinc-700 dark:text-zinc-300 shrink-0">{item.clicks} clicks</span>
                </div>
                <div className="flex gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 pl-9">
                  <span className="text-emerald-600 dark:text-emerald-400">WhatsApp: {item.whatsapp}</span>
                  <span className="text-blue-600 dark:text-blue-400">Calls: {item.call}</span>
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
          <span className="flex items-center gap-1 text-emerald-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> WhatsApp ({Math.round(whatsappPercent)}%)
          </span>
          <span className="flex items-center gap-1 text-blue-500 font-medium">
            Calls ({Math.round(callPercent)}%) <span className="w-2 h-2 rounded-full bg-blue-500"></span>
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
        <div 
          onClick={() => { setModalType('whatsapp'); setIsModalOpen(true); }}
          className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 cursor-pointer hover:bg-emerald-500/10 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <MessageCircle size={16} />
            </div>
            <div>
              <span className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 block group-hover:underline font-semibold">WhatsApp Clicks</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-white">{whatsappCount} total</span>
            </div>
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">View details →</span>
        </div>

        <div 
          onClick={() => { setModalType('call'); setIsModalOpen(true); }}
          className="flex items-center justify-between p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 cursor-pointer hover:bg-blue-500/10 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Phone size={16} />
            </div>
            <div>
              <span className="text-[10px] uppercase text-blue-600 dark:text-blue-400 block group-hover:underline font-semibold">Call Clicks</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-white">{callCount} total</span>
            </div>
          </div>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">View details →</span>
        </div>
      </div>

      {/* Real Database Records Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 ${modalType === 'whatsapp' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                  {modalType === 'whatsapp' ? <MessageCircle size={16} /> : <Phone size={16} />}
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                    {modalType === 'whatsapp' ? 'WhatsApp Interaction Records' : 'Call Interaction Records'}
                  </h3>
                  <p className="text-[11px] text-zinc-500">Live database logs from actionType table</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content - Exact Database Fields Mapping (id, actionType, productId, vendorId, createdAt) */}
            <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto space-y-3">
              {modalFilteredStats.length === 0 ? (
                <div className="text-center py-10 text-xs text-zinc-400">
                  No tracking log records available for {modalType} actions.
                </div>
              ) : (
                modalFilteredStats.map((stat: any, index: number) => {
                  const recordId = stat.id || `record-${index}`;
                  const productId = stat.productId;
                  const vId = stat.vendorId;
                  const timestamp = stat.createdAt || stat.timestamp;

                  return (
                    <div key={recordId} className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 truncate pr-2">
                          <Package size={13} className={modalType === 'whatsapp' ? 'text-emerald-500' : 'text-blue-500'} /> 
                          {productId ? `Product: ${productId}` : 'Store Interaction'}
                        </span>

                        {timestamp && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium shrink-0">
                            {new Date(timestamp).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-zinc-600 dark:text-zinc-300 space-y-1 pl-5 border-l-2 border-zinc-300 dark:border-zinc-700">
                        {vId && (
                          <p><b className="text-zinc-400">Vendor ID:</b> <span className="font-mono text-[10px]">{vId}</span></p>
                        )}
                        <p><b className="text-zinc-400">Action Type:</b> <span className="uppercase font-semibold">{stat.actionType}</span></p>
                        <p><b className="text-zinc-400">Record ID:</b> <span className="font-mono text-[10px] text-zinc-400">{recordId}</span></p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-zinc-50 dark:bg-[#181818] border-t border-zinc-100 dark:border-white/5 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition-opacity"
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
import { useState } from "react";
import { Terminal, Download, Search, Filter } from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from "recharts";

const trafficData = [
  { time: "13:00", requests: 120, bandwidth: 2.4 },
  { time: "14:00", requests: 280, bandwidth: 4.1 },
  { time: "15:00", requests: 450, bandwidth: 6.8 },
  { time: "16:00", requests: 390, bandwidth: 5.2 },
  { time: "17:00", requests: 620, bandwidth: 9.4 },
  { time: "18:00", requests: 510, bandwidth: 7.5 },
];

const SystemLogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeMetric, setActiveMetric] = useState<"requests" | "bandwidth">("requests");

  // Production Note: These would ideally come from your API
  const logs = [
    { id: 1, time: "2026-04-14 17:42:01", level: "INFO", module: "AUTH", msg: "Admin session initialized via encrypted handshake.", node: "KGL-01" },
    { id: 2, time: "2026-04-14 17:41:55", level: "WARN", module: "DB", msg: "Prisma connection pool reaching 85% capacity.", node: "KGL-01" },
    { id: 3, time: "2026-04-14 17:40:12", level: "ERROR", module: "NIDA", msg: "External API Timeout: Barcode verification failed.", node: "GATEWAY-A" },
    { id: 4, time: "2026-04-14 17:38:22", level: "INFO", module: "USER", msg: "Profile update: UUID_7d4747 updated role to ADMIN.", node: "KGL-01" },
    { id: 5, time: "2026-04-14 17:35:01", level: "INFO", module: "AUTH", msg: "New registration attempt from IP 197.243.34.12.", node: "KGL-02" },
  ];

  const filteredLogs = logs.filter(log => 
    log.msg.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.node.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tighter text-white uppercase">System Telemetry</h2>
          <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Audit Trail & Event Logs</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
            <input 
              type="text"
              placeholder="FILTER LOGS..."
              className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-[10px] font-mono text-gray-300 outline-none focus:border-blue-500/30 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-3 bg-[#0a0a0a] border border-white/5 rounded-xl text-gray-500 hover:text-white transition-all cursor-pointer">
            <Filter size={16} />
          </button>
          <button className="p-3 bg-[#0a0a0a] border border-white/5 rounded-xl text-gray-500 hover:text-blue-400 transition-all cursor-pointer">
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Traffic Usage Recharts Module */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-4xl p-8 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">Network Ingress & Load</h3>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">Real-time throughput telemetry</p>
          </div>
          <div className="flex items-center gap-2 bg-[#050505] border border-white/5 p-1.5 rounded-xl">
            <button 
              onClick={() => setActiveMetric("requests")}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                activeMetric === "requests" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-gray-500 hover:text-white"
              }`}
            >
              Requests
            </button>
            <button 
              onClick={() => setActiveMetric("bandwidth")}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                activeMetric === "bandwidth" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-gray-500 hover:text-white"
              }`}
            >
              Bandwidth (GB)
            </button>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="time" stroke="#525252" fontSize={10} tickLine={false} />
              <YAxis stroke="#525252" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ background: "#050505", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1rem", fontSize: "11px" }}
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
        </div>
      </div>

      {/* Terminal View */}
      <div className="bg-[#050505] border border-white/10 rounded-4xl overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
          <Terminal size={180} />
        </div>

        {/* Console Header */}
        <div className="bg-[#0a0a0a] border-b border-white/5 px-8 py-4 flex items-center justify-between">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/40" />
          </div>
          <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Live Stream: Active</span>
        </div>

        {/* Log Entries */}
        <div className="p-6 font-mono overflow-x-auto custom-scrollbar">
          <div className="min-w-[700px] space-y-1">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-600 text-xs uppercase tracking-widest">No protocol events matched query filter.</div>
            ) : (
              filteredLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="grid grid-cols-12 gap-4 py-2 px-4 rounded-lg hover:bg-white/5 transition-colors border-l border-transparent hover:border-blue-500/30 group"
                >
                  <span className="col-span-2 text-gray-600 text-[11px]">{log.time.split(' ')[1]}</span>
                  
                  <span className={`col-span-1 text-[10px] font-black text-center rounded px-1 h-fit mt-0.5 ${
                    log.level === 'ERROR' ? 'bg-red-500/10 text-red-500' : 
                    log.level === 'WARN' ? 'bg-amber-500/10 text-amber-500' : 
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {log.level}
                  </span>

                  <span className="col-span-1 text-gray-500 text-[11px] font-bold uppercase tracking-tighter">
                    {log.module}
                  </span>

                  <span className="col-span-6 text-gray-400 text-[11px] group-hover:text-gray-200 transition-colors">
                    {log.msg}
                  </span>

                  <span className="col-span-2 text-right text-gray-700 text-[10px] font-bold uppercase italic">
                    {log.node}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Prompt Simulation */}
          <div className="mt-6 flex items-center gap-3 px-4 border-t border-white/5 pt-4">
            <span className="text-blue-500 font-bold text-xs animate-pulse">&gt;</span>
            <div className="h-4 w-1 bg-blue-500 animate-pulse" />
            <span className="text-gray-700 text-[10px] font-black uppercase tracking-[0.3em]">
              Listening for protocol events...
            </span>
          </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex items-center justify-between">
          <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Total Events (24h)</span>
          <span className="text-lg font-mono font-bold text-white">4,829</span>
        </div>
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex items-center justify-between">
          <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Critical Errors</span>
          <span className="text-lg font-mono font-bold text-red-500">02</span>
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;
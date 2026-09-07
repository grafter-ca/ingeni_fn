import { Users, ShieldCheck, Zap, Server } from "lucide-react";

export interface SystemHealthMetric {
  label: string;
  percent: number;
  color: string;
}

export interface AdminOverviewProps {
  totalUsers: number;
  isLoading: boolean;
  authVersion: string;
  systemLatencyMs: number;
  edgeRegion: string;
  healthMetrics: SystemHealthMetric[];
}

const AdminOverview = ({ 
  totalUsers, 
  isLoading,
  authVersion,
  systemLatencyMs,
  edgeRegion,
  healthMetrics = []
}: AdminOverviewProps) => {

    if (isLoading) {
        return (
            <div className="m-auto text-4xl text-white/70">Loading...</div>
        );
    }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Registered Entities" 
          value={totalUsers?.toLocaleString() ?? "0"} 
          icon={<Users className="text-blue-500" />} 
          sub="Verified DB Records"
        />
        <StatCard 
          label="Auth Protocol" 
          value={authVersion} 
          icon={<ShieldCheck className="text-purple-500" />} 
          sub="Better-Auth Production"
        />
        <StatCard 
          label="System Latency" 
          value={`${systemLatencyMs}ms`} 
          icon={<Zap className="text-amber-500" />} 
          sub={`Edge Node: ${edgeRegion}`}
        />
      </div>

      <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5"><Server size={200} /></div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-8">Infrastructure Health</h3>
        <div className="space-y-6 max-w-md">
          {healthMetrics?.map((metric) => (
            <HealthBar 
              key={metric.label}
              label={metric.label} 
              percent={metric.percent} 
              color={metric.color} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, sub }: { label: string; value: string; icon: React.ReactNode; sub: string }) => (
  <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem] shadow-2xl">
    <div className="mb-4 flex items-center gap-3">
      {icon}
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">{label}</p>
    </div>
    <p className="text-3xl font-mono font-bold text-white mt-1">{value}</p>
    <p className="text-[9px] font-medium text-gray-700 mt-2 uppercase tracking-widest">{sub}</p>
  </div>
);

const HealthBar = ({ label, percent, color }: { label: string; percent: number; color: string }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
      <span>{label}</span>
      <span>{percent}%</span>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${percent}%` }} />
    </div>
  </div>
);

export default AdminOverview;
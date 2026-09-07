import { ShieldAlert, Globe, Bell, RefreshCcw } from "lucide-react";
import { useState } from "react";

const GlobalConfig = () => {
  // Local state to track toggle configurations
  const [configs, setConfigs] = useState({
    maintenance: false,
    registrations: true,
    notifications: true,
  });

  const toggleConfig = (key: keyof typeof configs) => {
    setConfigs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCommit = () => {
    // Add your API integration or state persistence logic here
    console.log("Committing global config updates:", configs);
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tighter text-white">SYSTEM CONFIGURATION</h2>
        <p className="text-gray-500 text-sm">Manage global variables and security overrides.</p>
      </div>

      <div className="space-y-4">
        <ConfigItem 
          title="Maintenance Override" 
          desc="Redirect all incoming traffic to the maintenance cluster."
          icon={<ShieldAlert size={18}/>}
          active={configs.maintenance}
          onClick={() => toggleConfig("maintenance")}
        />
        <ConfigItem 
          title="New Registrations" 
          desc="Allow external entities to create new accounts."
          icon={<Globe size={18}/>}
          active={configs.registrations}
          onClick={() => toggleConfig("registrations")}
        />
        <ConfigItem 
          title="System Notifications" 
          desc="Push security alerts to administrative devices."
          icon={<Bell size={18}/>}
          active={configs.notifications}
          onClick={() => toggleConfig("notifications")}
        />
      </div>

      <div className="pt-8 border-t border-white/5 flex gap-4">
        <button 
          onClick={handleCommit}
          className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-blue-500/10"
        >
          <RefreshCcw size={14} /> Commit Changes
        </button>
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

const ConfigItem = ({ title, desc, icon, active, onClick }: ConfigItemProps) => (
  <div 
    onClick={onClick}
    className="flex items-center justify-between p-6 bg-[#0a0a0a] border border-white/5 rounded-4xl hover:border-white/10 transition-colors cursor-pointer select-none"
  >
    <div className="flex items-center gap-5">
      <div className="p-4 bg-white/5 rounded-2xl text-blue-500 border border-white/5">{icon}</div>
      <div>
        <p className="text-sm font-bold text-white uppercase tracking-tight">{title}</p>
        <p className="text-xs text-gray-500 font-medium mt-0.5">{desc}</p>
      </div>
    </div>
    <div className={`w-14 h-8 rounded-full p-1 transition-colors border ${active ? 'bg-blue-600 border-blue-400' : 'bg-gray-900 border-white/10'}`}>
      <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform ${active ? 'translate-x-6' : 'translate-x-0'}`} />
    </div>
  </div>
);

export default GlobalConfig;
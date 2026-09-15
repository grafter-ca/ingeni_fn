import { Link } from "react-router-dom";
import { ShieldCheck, Lock, Database, Mail, ArrowLeft } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono py-16 px-6 relative overflow-hidden selection:bg-blue-600/30 selection:text-blue-400">
      
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-600/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        
        {/* Header Section */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md">
            <ShieldCheck size={14} className="text-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">
              Security & Protocol
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">
            Last updated: September 2026 // System Version 1.2.4
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-10 text-xs md:text-sm font-light leading-relaxed border-t border-white/10 pt-10">
          
          <section className="space-y-3 bg-[#0a0a0a] border border-white/5 p-8 rounded-[2rem] shadow-2xl relative group hover:border-blue-500/20 transition-all duration-300">
            <div className="flex items-center gap-3 text-blue-400 mb-2">
              <Database size={18} />
              <h2 className="text-white uppercase tracking-[0.2em] font-bold text-xs">
                1. Information Matrix & Collection
              </h2>
            </div>
            <p className="text-gray-400 pl-7">
              We ingest and secure information transmitted directly during entity registration, profile configuration, merchant verification requests, or telemetry communication with our support channels. This encompasses designations, electronic mail endpoints, telephonic interfaces, and logistical distribution nodes.
            </p>
          </section>

          <section className="space-y-3 bg-[#0a0a0a] border border-white/5 p-8 rounded-[2rem] shadow-2xl relative group hover:border-blue-500/20 transition-all duration-300">
            <div className="flex items-center gap-3 text-purple-400 mb-2">
              <Lock size={18} />
              <h2 className="text-white uppercase tracking-[0.2em] font-bold text-xs">
                2. Data Processing & Telemetry Usage
              </h2>
            </div>
            <p className="text-gray-400 pl-7">
              Collected parameters are executed solely to process decentralized transactions, synchronize cart registries, maintain secure Better-Auth authorization sessions, and broadcast critical updates regarding your order queue or platform core announcements.
            </p>
          </section>

          <section className="space-y-3 bg-[#0a0a0a] border border-white/5 p-8 rounded-[2rem] shadow-2xl relative group hover:border-blue-500/20 transition-all duration-300">
            <div className="flex items-center gap-3 text-emerald-400 mb-2">
              <ShieldCheck size={18} />
              <h2 className="text-white uppercase tracking-[0.2em] font-bold text-xs">
                3. Encryption & Infrastructure Protection
              </h2>
            </div>
            <p className="text-gray-400 pl-7">
              We enforce industry-standard security protocols, end-to-end TLS encrypted connections, and hardened database architectures to shield your personal records from unauthorized access, payload injection, or data alteration.
            </p>
          </section>

          <section className="space-y-3 bg-[#0a0a0a] border border-white/5 p-8 rounded-[2rem] shadow-2xl relative group hover:border-blue-500/20 transition-all duration-300">
            <div className="flex items-center gap-3 text-amber-400 mb-2">
              <Mail size={18} />
              <h2 className="text-white uppercase tracking-[0.2em] font-bold text-xs">
                4. Privacy Interface & Contact
              </h2>
            </div>
            <p className="text-gray-400 pl-7">
              For any operational inquiries or data telemetry queries regarding our privacy protocols, establish direct contact via secure channel at <span className="text-white font-bold tracking-wider">hello@ingenistore.com</span>.
            </p>
          </section>

        </div>

        {/* Footer Navigation */}
        <div className="pt-6 border-t border-white/10 flex items-center justify-between">
          <Link 
            to="/" 
            className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 hover:text-blue-300 transition-colors bg-white/5 border border-white/10 px-5 py-3 rounded-xl hover:bg-white/10"
          >
            <ArrowLeft size={14} className="transform group-hover:-translate-x-1 transition-transform" />
            <span>Return to Home Node</span>
          </Link>
          <span className="text-[9px] text-gray-600 uppercase tracking-widest">
            Ingeni Core Security
          </span>
        </div>

      </div>
    </div>
  );
};

export default Privacy;
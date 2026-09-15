import { Link } from "react-router-dom";
import { FileText, ShieldAlert, ShoppingBag, Scale, ArrowLeft } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono py-16 px-6 relative overflow-hidden selection:bg-blue-600/30 selection:text-blue-400">
      
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[350px] bg-blue-600/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        
        {/* Header Section */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md">
            <FileText size={14} className="text-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">
              Legal Matrix
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">
            Terms of Service
          </h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">
            Last updated: September 2026 // System Version 1.2.4
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-10 text-xs md:text-sm font-light leading-relaxed border-t border-white/10 pt-10">
          
          <section className="space-y-3 bg-[#0a0a0a] border border-white/5 p-8 rounded-[2rem] shadow-2xl relative group hover:border-blue-500/20 transition-all duration-300">
            <div className="flex items-center gap-3 text-blue-400 mb-2">
              <Scale size={18} />
              <h2 className="text-white uppercase tracking-[0.2em] font-bold text-xs">
                1.Acceptance of Protocol Terms
              </h2>
            </div>
            <p className="text-gray-400 pl-7">
              By accessing and utilizing Ingeni Store, you acknowledge and agree to be bound by these Terms of Service, Better-Auth session rules, and all applicable regulatory laws. If you do not agree with any section of these terms, you are strictly prohibited from interfacing with or accessing this platform matrix.
            </p>
          </section>

          <section className="space-y-3 bg-[#0a0a0a] border border-white/5 p-8 rounded-[2rem] shadow-2xl relative group hover:border-blue-500/20 transition-all duration-300">
            <div className="flex items-center gap-3 text-purple-400 mb-2">
              <ShieldAlert size={18} />
              <h2 className="text-white uppercase tracking-[0.2em] font-bold text-xs">
                2.User Accounts & Node Security
              </h2>
            </div>
            <p className="text-gray-400 pl-7">
              You maintain total accountability for safeguarding your account credentials, authorization keys, and restricting entry to your terminal interface or hardware node. You accept full operational responsibility for all transactions and requests executed under your unique account signature.
            </p>
          </section>

          <section className="space-y-3 bg-[#0a0a0a] border border-white/5 p-8 rounded-[2rem] shadow-2xl relative group hover:border-blue-500/20 transition-all duration-300">
            <div className="flex items-center gap-3 text-emerald-400 mb-2">
              <ShoppingBag size={18} />
              <h2 className="text-white uppercase tracking-[0.2em] font-bold text-xs">
                3.Marketplace Transactions & Independent Vendors
              </h2>
            </div>
            <p className="text-gray-400 pl-7">
              Ingeni Store operates as a curated digital marketplace bridging buyers and independent merchants. Transactions initiated through the platform are subject to individual vendor fulfillment policies, real-time inventory availability, and accurate pricing parameters calculated at checkout.
            </p>
          </section>

          <section className="space-y-3 bg-[#0a0a0a] border border-white/5 p-8 rounded-[2rem] shadow-2xl relative group hover:border-blue-500/20 transition-all duration-300">
            <div className="flex items-center gap-3 text-amber-400 mb-2">
              <FileText size={18} />
              <h2 className="text-white uppercase tracking-[0.2em] font-bold text-xs">
                4.Governing Jurisdiction & Law
              </h2>
            </div>
            <p className="text-gray-400 pl-7">
              These terms and conditions are governed by and construed in accordance with the legislative framework and laws of Rwanda, and you irrevocably submit to the exclusive jurisdiction of the competent courts located within that territory.
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
            Ingeni Legal Framework
          </span>
        </div>

      </div>
    </div>
  );
};

export default Terms;
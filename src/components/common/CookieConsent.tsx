import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, ShieldCheck, Check, X } from "lucide-react";

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("ingeni_cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("ingeni_cookie_consent", "all");
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    localStorage.setItem("ingeni_cookie_consent", "essential");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-4 right-4 mx-auto max-w-sm sm:max-w-md md:left-6 md:right-auto md:mx-0 z-50 select-none"
        >
          <div className="bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-2xl border border-zinc-200 dark:border-white/15 p-6 rounded-[2rem] shadow-2xl shadow-black/10 dark:shadow-black/80 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
            
            {/* Subtle Neon Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header & Icon */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Cookie size={18} className="text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-mono font-bold text-zinc-900 dark:text-white text-xs uppercase tracking-[0.2em]">
                    Cookie Protocol
                  </h3>
                  <p className="font-mono text-[9px] text-zinc-500 dark:text-gray-500 uppercase tracking-widest mt-0.5">
                    Data Telemetry & Privacy
                  </p>
                </div>
              </div>

              <button
                onClick={handleAcceptEssential}
                className="text-zinc-400 dark:text-gray-500 hover:text-zinc-900 dark:hover:text-white transition-colors p-1 cursor-pointer"
                title="Dismiss to Essential Only"
              >
                <X size={16} />
              </button>
            </div>

            {/* Description */}
            <p className="font-mono text-xs text-zinc-600 dark:text-gray-300 font-light leading-relaxed mb-6">
              We deploy advanced telemetry cookies and Better-Auth session tokens to optimize navigation, secure your transactions, and analyze system performance. Review our{" "}
              <Link to="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline font-bold">
                Privacy Policy
              </Link>{" "}
              for complete protocol details.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleAcceptAll}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 dark:hover:bg-blue-500 text-white font-mono text-[10px] font-black uppercase tracking-[0.2em] py-3 px-4 rounded-xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer active:scale-95"
              >
                <Check size={14} />
                <span>Accept All</span>
              </button>

              <button
                onClick={handleAcceptEssential}
                className="flex-1 flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-gray-300 dark:hover:text-white border border-zinc-200 dark:border-white/10 font-mono text-[10px] font-bold uppercase tracking-[0.2em] py-3 px-4 rounded-xl transition-all cursor-pointer active:scale-95"
              >
                <ShieldCheck size={14} className="text-zinc-500 dark:text-gray-400" />
                <span>Essential Only</span>
              </button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
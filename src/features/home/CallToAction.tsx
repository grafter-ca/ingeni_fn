import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import { ArrowRight, UserPlus, Store } from "lucide-react";
import { useAuthState } from "../../context/AuthContext";
import VendorRequestModal from "../../components/common/VendorRequestModal";

const CallToAction = () => {
  const navigate = useNavigate();
  const { user } = useAuthState();
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);

  return (
    <section className="px-4 sm:px-6 py-16 md:py-24 flex flex-col items-center text-center gap-6 relative overflow-hidden bg-white dark:bg-[#0a0a0a] border-t border-zinc-200 dark:border-zinc-800/80 transition-colors">
      
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[650px] h-[200px] sm:h-[350px] bg-blue-600/10 dark:bg-blue-600/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />

      {/* Infinite shimmer line */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />

      <motion.div 
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 mb-2 backdrop-blur-md z-10 shadow-sm"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600 dark:text-gray-300 font-semibold">
          The Ingeni Experience
        </span>
      </motion.div>

      <motion.h2
        className="font-poppins font-bold text-3xl sm:text-4xl md:text-5xl text-zinc-900 dark:text-white max-w-2xl tracking-tight leading-tight z-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
      >
        Ready to Shop the Best?
      </motion.h2>

      <motion.p
        className="font-poppins text-zinc-500 dark:text-gray-400 max-w-md leading-relaxed z-10 font-light text-xs sm:text-sm md:text-base"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
      >
        Join thousands of happy customers discovering premium products every day, or expand your reach by selling with us.
      </motion.p>

      <motion.div
        className="flex gap-3 sm:gap-4 flex-wrap justify-center mt-4 z-10 w-full sm:w-auto px-4 sm:px-0"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
      >
        <div className="w-full sm:w-auto">
          <Button
            label="Browse Products"
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => navigate("/products")}
            className="w-full sm:w-auto justify-center"
          />
        </div>
        
        {!user && (
          <div className="w-full sm:w-auto">
            <Button
              label="Create Account"
              icon={UserPlus}
              variant="outline"
              className="w-full sm:w-auto justify-center border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-gray-300 hover:bg-zinc-100 dark:hover:bg-white/5"
              onClick={() => navigate("/register")}
            />
          </div>
        )}

        {/* Vendor Request Trigger Button */}
        <div className="w-full sm:w-auto">
          <Button
            label="Become a Vendor"
            icon={Store}
            variant="outline"
            className="w-full sm:w-auto justify-center border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-500/10"
            onClick={() => setIsVendorModalOpen(true)}
          />
        </div>
      </motion.div>

      {/* Render the Vendor Request Modal */}
      <VendorRequestModal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
      />
    </section>
  );
};

export default CallToAction;
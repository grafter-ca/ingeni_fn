// components/vendor/VendorRequestModal.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../../components/ui/Button";
import { X, Store, Lock, Loader2, Sparkles } from "lucide-react";
import { useAuthState } from "../../context/AuthContext";
import { useVendorStore } from "../../store/vendorStore";
import toast from "react-hot-toast";

interface VendorRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VendorRequestModal({ isOpen, onClose }: VendorRequestModalProps) {
  const navigate = useNavigate();
  const user = useAuthState();
  const requestOnboarding = useVendorStore((state) => state.requestOnboarding);

  const [businessDescription, setBusinessDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const toastId = toast.loading("Transmitting vendor request...");

    try {
      await requestOnboarding(businessDescription);
      toast.success("Vendor application successfully sent!", { id: toastId });
      setSubmitted(true);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err.message || "Failed to submit vendor request.";
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto select-none">
        
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !loading && onClose()}
          className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-md transition-colors"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-2xl border border-zinc-200 dark:border-white/15 rounded-[2rem] w-full max-w-lg p-6 sm:p-8 relative shadow-2xl shadow-black/20 dark:shadow-black/90 overflow-hidden z-10 my-auto"
        >
          
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button 
            onClick={onClose}
            disabled={loading}
            className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-900 dark:text-gray-400 dark:hover:text-white p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 transition-all disabled:opacity-50 cursor-pointer"
            title="Close modal"
          >
            <X size={18} />
          </button>

          {/* CASE 1: USER IS NOT LOGGED IN */}
          {!user?.user?.id ? (
            <div className="text-center py-4 sm:py-6">
              <div className="w-14 h-14 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5 text-blue-600 dark:text-blue-400 shadow-inner">
                <Lock size={24} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-poppins text-zinc-900 dark:text-white mb-2 tracking-tight">
                Authentication Required
              </h2>
              <p className="text-zinc-500 dark:text-gray-400 text-xs sm:text-sm mb-8 max-w-sm mx-auto leading-relaxed font-light">
                You must sign in or register an account before submitting a vendor onboarding request.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  label="Sign In"
                  variant="primary"
                  className="w-full sm:w-auto justify-center"
                  onClick={() => {
                    onClose();
                    navigate("/login");
                  }}
                />
                <Button
                  label="Create Account"
                  variant="outline"
                  className="w-full sm:w-auto justify-center border-zinc-300 dark:border-white/10 text-zinc-700 dark:text-gray-300 hover:bg-zinc-100 dark:hover:bg-white/5"
                  onClick={() => {
                    onClose();
                    navigate("/register");
                  }}
                />
              </div>
            </div>
          ) : submitted ? (
            /* CASE 2: SUCCESS STATE */
            <div className="text-center py-4 sm:py-6">
              <div className="w-14 h-14 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5 text-emerald-600 dark:text-emerald-400 shadow-inner">
                <Store size={24} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-poppins text-zinc-900 dark:text-white mb-2 tracking-tight">
                Request Dispatched
              </h2>
              <p className="text-zinc-500 dark:text-gray-400 text-xs sm:text-sm mb-8 max-w-sm mx-auto leading-relaxed font-light">
                Your application has been successfully transmitted to the admin team. We will review your inventory scope and follow up via email.
              </p>
              <Button
                label="Close Window"
                variant="primary"
                className="w-full justify-center"
                onClick={() => {
                  setSubmitted(false);
                  setBusinessDescription("");
                  onClose();
                }}
              />
            </div>
          ) : (
            /* CASE 3: LOGGED IN - SHOW FORM */
            <div>
              <div className="flex items-center gap-3.5 mb-6 pr-8">
                <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400 shadow-inner">
                  <Store size={22} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold font-poppins text-zinc-900 dark:text-white tracking-wide">
                    Request Vendor Account
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-gray-400 font-mono mt-0.5">
                    Authenticated as <span className="text-zinc-800 dark:text-gray-200 font-medium">{user.user.email}</span>
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600 dark:text-gray-400 mb-2 font-semibold flex items-center gap-1.5">
                    <Sparkles size={12} className="text-blue-500" />
                    Business Description & Inventory Scope
                  </label>
                  <textarea
                    rows={4}
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    placeholder="Detail what type of products you sell, your business registration name, or catalog background..."
                    className="w-full bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 rounded-2xl p-4 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-all resize-none shadow-sm"
                    required
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 dark:hover:bg-blue-500 active:scale-[0.98] transition-all text-white font-mono text-xs font-bold uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Transmitting Request...</span>
                    </>
                  ) : (
                    <span>Submit Vendor Application</span>
                  )}
                </button>
              </form>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
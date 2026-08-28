import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, LogIn, UserPlus } from "lucide-react";
import Button from "../ui/Button";

type Props = { isOpen: boolean; onClose: () => void };

const AuthPromptModal = ({ isOpen, onClose }: Props) => {
  const navigate = useNavigate();

  const handleLogin = useCallback(() => {
    onClose();
    navigate("/login");
  }, [navigate, onClose]);

  const handleRegister = useCallback(() => {
    onClose();
    navigate("/register");
  }, [navigate, onClose]);

  // Navigate back to previous page or safety route when close is clicked
  const handleCloseNavigation = useCallback(() => {
    onClose();
    navigate(-1);
  }, [onClose, navigate]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseNavigation}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-white/10 w-full max-w-md p-8 flex flex-col gap-6 relative rounded-2xl shadow-2xl pointer-events-auto">
              <button
                onClick={handleCloseNavigation}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors border border-zinc-200 dark:border-zinc-800 rounded-full p-1.5"
              >
                <X size={18} />
              </button>

              <div className="text-center flex flex-col gap-2">
                <h2 className="font-poppins font-bold text-2xl text-zinc-900 dark:text-white tracking-wide">
                  Hold on!
                </h2>
                <p className="font-poppins text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                  You need an account to view your cart and checkout. It's free and takes less than a minute.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  className="justify-center bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold"
                  label="Login to my account"
                  icon={LogIn}
                  onClick={handleLogin}
                />
                <Button
                  label="Create free account"
                  icon={UserPlus}
                  variant="outline"
                  className="justify-center py-4 rounded-2xl font-bold dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
                  onClick={handleRegister}
                />
              </div>

              <p className="font-poppins text-xs text-zinc-400 dark:text-zinc-500 text-center">
                Your cart items are saved — they'll be here when you get back.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AuthPromptModal;

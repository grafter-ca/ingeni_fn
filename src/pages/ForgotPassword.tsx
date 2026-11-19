// src/pages/ForgotPassword.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "../components/ui/Input";
import { useAuthActions } from "../context/AuthContext";
import { ArrowLeft, MailCheck } from "lucide-react";

const IngeniLogo: React.FC = () => (
  <Link to="/" className="flex flex-col items-center gap-2.5 select-none group">
    <div className="w-20 h-20 rounded-full overflow-hidden bg-white dark:bg-white/4 border border-zinc-200 dark:border-white/10 p-1 shadow-md">
      <img
        src="/ingeni-logo-2.png"
        alt="Ingeni Market Logo"
        width="44"
        height="44"
        className="w-full h-full object-contain"
      />
    </div>
    <div className="text-left">
      <span className="block text-lg font-extrabold tracking-widest uppercase font-mono text-zinc-900 dark:text-white leading-none">
        Ingeni Market
      </span>
      <span className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 dark:text-gray-400 mt-1">
        Account Recovery
      </span>
    </div>
  </Link>
);

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const { requestPasswordReset } = useAuthActions();

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setLocalError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setLocalError(null);

    try {
      await requestPasswordReset(cleanEmail);
      setSubmitted(true);
    } catch (err: any) {
      setLocalError(
        err?.message || "Unable to send reset link right now. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] flex flex-col justify-between px-4 py-6 md:py-8 text-zinc-900 dark:text-white transition-colors">
      <header className="w-full max-w-md mb-4 mx-auto">
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-white/3 hover:bg-zinc-100 dark:hover:bg-white/8 border border-zinc-200 dark:border-white/10 px-3.5 py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Sign In
        </button>
      </header>

      <div className="w-full max-w-md bg-white dark:bg-[#0a0a0a] p-6 md:p-8 flex flex-col gap-6 shadow-2xl rounded-3xl border border-zinc-200 dark:border-white/10 my-auto mx-auto transition-colors">
        <div className="flex flex-col items-center text-center gap-2.5 pb-1">
          <IngeniLogo />
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mt-1">
            Forgot Password
          </h1>
          <p className="text-xs text-zinc-500 dark:text-gray-400 max-w-xs">
            Enter your Ingeni Market account email and we&apos;ll send you a
            secure password reset link.
          </p>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center text-center gap-4 py-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <MailCheck size={28} />
            </div>
            <p className="text-sm text-zinc-600 dark:text-gray-300">
              If an account exists for{" "}
              <span className="font-semibold text-zinc-900 dark:text-white break-all">
                {email.trim().toLowerCase()}
              </span>
              , a reset link has been sent to your inbox.
            </p>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition cursor-pointer"
            >
              Return to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="space-y-1.5">
              <label
                htmlFor="forgot-email"
                className="block text-zinc-700 dark:text-gray-200 font-medium text-xs ml-1"
              >
                Email Address
              </label>
              <Input
                label=""
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(val: string) => {
                  setEmail(val);
                  if (localError) setLocalError(null);
                }}
              />
            </div>

            {localError && (
              <div
                role="alert"
                className="bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl"
              >
                <p className="text-red-600 dark:text-red-400 text-xs text-center font-medium">
                  {localError}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white text-sm font-semibold transition cursor-pointer"
            >
              {loading ? "Sending reset link..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <footer className="text-center pt-3 border-t border-zinc-100 dark:border-white/5">
          <p className="text-zinc-500 dark:text-gray-400 text-xs">
            Remembered your password?{" "}
            <Link
              to="/login"
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Sign In
            </Link>
          </p>
        </footer>
      </div>

      <div className="max-w-md w-full mx-auto hidden md:block" />
    </div>
  );
};

export default ForgotPassword;
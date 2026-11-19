import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "../components/ui/Input";
import { useAuthActions } from "../context/AuthContext";
import { ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";

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
        Set New Password
      </span>
    </div>
  </Link>
);

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuthActions();

  const token = searchParams.get("token") || "";
  const urlError = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(
    urlError ? "This password reset link is invalid or has expired." : null,
  );
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setLocalError(
        "Missing reset token. Please request a new password reset link.",
      );
      return;
    }
    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setLocalError(null);

    try {
      await resetPassword(password, token);
      setSuccess(true);
    } catch (err: any) {
      setLocalError(
        err?.message ||
          "Could not reset password. The link may have expired.",
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
            Reset Password
          </h1>
          <p className="text-xs text-zinc-500 dark:text-gray-400 max-w-xs">
            Choose a strong new password for your Ingeni Market account.
          </p>
        </div>

        {success ? (
          <div className="flex flex-col items-center text-center gap-4 py-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <CheckCircle2 size={28} />
            </div>
            <p className="text-sm text-zinc-600 dark:text-gray-300">
              Your password has been updated. You can now sign in with your new
              password.
            </p>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition cursor-pointer"
            >
              Proceed to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="space-y-1.5">
              <label
                htmlFor="new-password"
                className="block text-zinc-700 dark:text-gray-200 font-medium text-xs ml-1"
              >
                New Password
              </label>
              <div className="relative flex items-center">
                <div className="w-full [&_input]:pr-10">
                  <Input
                    label=""
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(val: string) => {
                      setPassword(val);
                      if (localError) setLocalError(null);
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 inset-y-0 my-auto h-8 w-8 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors focus:outline-none cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirm-new-password"
                className="block text-zinc-700 dark:text-gray-200 font-medium text-xs ml-1"
              >
                Confirm New Password
              </label>
              <div className="relative flex items-center">
                <div className="w-full [&_input]:pr-10">
                  <Input
                    label=""
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(val: string) => {
                      setConfirmPassword(val);
                      if (localError) setLocalError(null);
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-2.5 inset-y-0 my-auto h-8 w-8 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors focus:outline-none cursor-pointer"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
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
              {loading ? "Updating password..." : "Reset Password"}
            </button>
          </form>
        )}

        <footer className="text-center pt-3 border-t border-zinc-100 dark:border-white/5">
          <p className="text-zinc-500 dark:text-gray-400 text-xs">
            Need a new link?{" "}
            <Link
              to="/forgot-password"
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Request again
            </Link>
          </p>
        </footer>
      </div>

      <div className="max-w-md w-full mx-auto hidden md:block" />
    </div>
  );
};

export default ResetPassword;
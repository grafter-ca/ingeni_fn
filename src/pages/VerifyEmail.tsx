// frontend/src/pages/VerifyEmail.tsx
import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { authClient } from "../libs/auth-client";
import { ArrowLeft, CheckCircle2, XCircle, Loader2 } from "lucide-react";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email address...");

  useEffect(() => {
    let isMounted = true;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    const verify = async () => {
      const token = searchParams.get("token");

      if (!token) {
        if (isMounted) {
          setStatus("error");
          setMessage("Invalid or missing verification token.");
        }
        return;
      }

      try {
        const { error } = await authClient.verifyEmail({
          query: { token },
        });

        if (!isMounted) return;

        if (error) {
          setStatus("error");
          setMessage(
            error.message || "Verification failed. The link may have expired.",
          );
        } else {
          setStatus("success");
          setMessage(
            "Your email is verified and your Ingeni Market account is active. Redirecting to sign in...",
          );
          redirectTimer = setTimeout(() => {
            navigate("/login", { replace: true });
          }, 3000);
        }
      } catch {
        if (isMounted) {
          setStatus("error");
          setMessage("Network error while verifying your email. Please try again.");
        }
      }
    };

    verify();

    return () => {
      isMounted = false;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] flex flex-col justify-between px-4 sm:px-6 py-6 md:py-8 text-zinc-900 dark:text-white transition-colors overflow-y-auto">
      <header className="w-full max-w-md mx-auto mb-4">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-white/3 hover:bg-zinc-100 dark:hover:bg-white/8 border border-zinc-200 dark:border-white/10 px-3.5 py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
        >
          <ArrowLeft size={14} /> Back Home
        </button>
      </header>

      <div className="w-full max-w-md bg-white dark:bg-[#0a0a0a] p-6 sm:p-8 flex flex-col items-center text-center gap-6 shadow-2xl rounded-3xl border border-zinc-200 dark:border-white/10 my-auto mx-auto transition-colors">
        <div
          className={`w-16 h-16 rounded-2xl border flex items-center justify-center ${
            status === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : status === "error"
                ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                : "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
          }`}
        >
          {status === "loading" && <Loader2 size={30} className="animate-spin" />}
          {status === "success" && <CheckCircle2 size={32} />}
          {status === "error" && <XCircle size={32} />}
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {status === "success"
              ? "Email Verified"
              : status === "error"
                ? "Verification Failed"
                : "Verifying Email"}
          </h1>

          <div
            role={status === "error" ? "alert" : "status"}
            className={
              status === "error"
                ? "bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl mt-2"
                : "pt-1"
            }
          >
            <p
              className={`text-sm leading-relaxed ${
                status === "error"
                  ? "text-red-600 dark:text-red-400 text-xs font-medium"
                  : "text-zinc-500 dark:text-gray-400"
              }`}
            >
              {message}
            </p>
          </div>
        </div>

        {status !== "loading" && (
          <div className="w-full pt-4 border-t border-zinc-100 dark:border-white/10 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold h-11 rounded-xl transition-colors text-sm cursor-pointer shadow-lg shadow-blue-600/25"
            >
              Proceed to Sign In
            </button>

            {status === "error" && (
              <Link
                to="/register"
                className="text-xs text-zinc-500 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white transition-colors pt-1"
              >
                Need a new link? Register again
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="max-w-md w-full mx-auto hidden md:block" />
    </div>
  );
};

export default VerifyEmail;
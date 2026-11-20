import { MailCheck, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface VerificationProps {
  formData: {
    email: string;
  };
}

const VerificationAlertPage = ({ formData }: VerificationProps) => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-[#0a0a0a] p-6 sm:p-8 flex flex-col items-center text-center gap-6 shadow-2xl rounded-3xl border border-zinc-200 dark:border-white/10 my-auto transition-colors">
      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
        <MailCheck size={32} />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Check your email
        </h1>
        <p className="text-sm text-zinc-500 dark:text-gray-400 leading-relaxed">
          We&apos;ve sent a secure verification link to{" "}
          <span className="text-zinc-900 dark:text-white font-medium break-all">
            {formData.email}
          </span>
          . Please verify your inbox to activate your Ingeni Market account.
        </p>
      </div>

      <div className="w-full pt-4 border-t border-zinc-100 dark:border-white/10">
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold h-11 rounded-xl transition-colors text-sm cursor-pointer shadow-lg shadow-blue-600/25 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-[#0a0a0a]"
        >
          <span>Proceed to Sign In</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default VerificationAlertPage;
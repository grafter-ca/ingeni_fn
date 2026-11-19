import { useState } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { localApi } from "../../libs/api";

export interface SubscribeFormProps {
  source?: "footer" | "account" | "checkout" | "banner";
  placeholder?: string;
  buttonLabel?: string;
  description?: string;
  compact?: boolean;
  className?: string;
  onSuccess?: (email: string) => void;
}

export default function SubscribeForm({
  source = "footer",
  placeholder = "Email address",
  buttonLabel = "Subscribe",
  description,
  compact = false,
  className = "",
  onSuccess,
}: SubscribeFormProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribedEmail, setSubscribedEmail] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await localApi.post("/subscribers", {
        email: cleanEmail,
        source,
      });

      setSubscribedEmail(cleanEmail);
      setEmail("");
      toast.success("Subscribed to Ingeni Market product alerts!");
      onSuccess?.(cleanEmail);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Could not subscribe right now. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      {description && (
        <p className="text-sm font-light text-zinc-500 dark:text-gray-400">
          {description}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className={`flex ${compact ? "flex-row items-center gap-2" : "flex-col gap-2.5"}`}
      >
        <input
          type="email"
          required
          disabled={isSubmitting}
          placeholder={placeholder}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (subscribedEmail) setSubscribedEmail(null);
          }}
          className={`${
            compact ? "flex-1 min-w-0" : "w-full"
          } bg-zinc-50 dark:bg-white/3 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-60 transition`}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold transition cursor-pointer shrink-0"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Subscribing...</span>
            </>
          ) : (
            <>
              <Send size={14} />
              <span>{buttonLabel}</span>
            </>
          )}
        </button>
      </form>

      {subscribedEmail && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
          <CheckCircle2 size={13} className="shrink-0" />
          <span>{subscribedEmail} is active for Ingeni Market alerts.</span>
        </p>
      )}
    </div>
  );
}
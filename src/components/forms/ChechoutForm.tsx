// src/components/forms/CheckoutForm.tsx
import { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  Phone,
  Smartphone,
  Upload,
  X,
} from "lucide-react";
import type { PaymentMethod } from "../../types/api";

export type CheckoutVendorContact = {
  id: string;
  storeName: string;
  phone?: string | null;
};

export type CheckoutSubmitPayload = {
  shippingAddress: string;
  phoneNumber: string;
  email: string;
  paymentMethod: PaymentMethod;
  provider: string;
  paymentProofFile?: File;
  paymentProofUrl?: string;
};

type CheckoutFormProps = {
  onSubmit: (data: CheckoutSubmitPayload) => Promise<void>;

  loading?: boolean;
  error?: string | null;
  totalAmount: number;
  vendors?: CheckoutVendorContact[];
  uploadProofEndpoint?: string;

  // External synchronized payment state props
  selectedPayment?: PaymentMethod;
  onPaymentMethodChange?: (method: PaymentMethod) => void;

  defaultValues?: {
    shippingAddress: string;
    phoneNumber: string;
    email: string;
    paymentMethod: PaymentMethod;
    provider?: string;
  };
};

const MAX_PROOF_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const getDefaultProvider = (method: PaymentMethod): string => {
  switch (method) {
    case "MOBILE_MONEY":
      return "MTN_MOMO";
    case "CREDIT_CARD":
      return "CARD_PAYMENT";
    case "CASH_ON_DELIVERY":
      return "CASH";
    case "WORKFORCE_WALLET":
      return "WORKFORCE_WALLET";
    default:
      return "MTN_MOMO";
  }
};

function resolveApiUrl(path: string): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1";
    const envBase = import.meta.env.VITE_API_URL as string | undefined;

    if (!isLocal) {
      return path.startsWith("/") ? path : `/${path}`;
    }

    if (envBase && envBase.trim().length > 0) {
      return `${envBase.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
    }
  }
  return path.startsWith("/") ? path : `/${path}`;
}

async function uploadPaymentProofToServer(
  file: File,
  endpointPath: string,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("image", file);
  formData.append("folder", "payment-proofs");

  const response = await fetch(resolveApiUrl(endpointPath), {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const serverMessage =
      data?.message ||
      data?.error ||
      `Proof upload failed (${response.status}).`;
    throw new Error(serverMessage);
  }

  const uploadedUrl =
    data?.url ||
    data?.secure_url ||
    data?.imageUrl ||
    data?.paymentProofUrl ||
    data?.data?.url ||
    data?.data?.secure_url ||
    null;

  if (!uploadedUrl || typeof uploadedUrl !== "string") {
    throw new Error(
      "Image uploaded to server, but no permanent URL was returned to save in database.",
    );
  }

  return uploadedUrl;
}

const CheckoutForm = ({
  onSubmit,
  loading: externalLoading = false,
  error: externalError = null,
  totalAmount,
  vendors = [],
  uploadProofEndpoint = "/api/upload",
  selectedPayment,
  onPaymentMethodChange,
  defaultValues = {
    shippingAddress: "",
    phoneNumber: "",
    email: "",
    paymentMethod: "MOBILE_MONEY",
    provider: "MTN_MOMO",
  },
}: CheckoutFormProps) => {
  const [localLoading, setLocalLoading] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [selectedProofFile, setSelectedProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [uploadedProofUrl, setUploadedProofUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [internalMethod, setInternalMethod] = useState<PaymentMethod>(
    selectedPayment || defaultValues.paymentMethod,
  );

  const [provider, setProvider] = useState<string>(
    defaultValues.provider || getDefaultProvider(internalMethod),
  );

  useEffect(() => {
    if (selectedPayment) {
      setInternalMethod(selectedPayment);
      setProvider(getDefaultProvider(selectedPayment));
    }
  }, [selectedPayment]);

  useEffect(() => {
    return () => {
      if (proofPreviewUrl) {
        URL.revokeObjectURL(proofPreviewUrl);
      }
    };
  }, [proofPreviewUrl]);

  const handleMethodChange = (newMethod: PaymentMethod) => {
    setInternalMethod(newMethod);
    setProvider(getDefaultProvider(newMethod));

    if (onPaymentMethodChange) {
      onPaymentMethodChange(newMethod);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLocalError(null);
    setUploadedProofUrl(null);

    if (proofPreviewUrl) {
      URL.revokeObjectURL(proofPreviewUrl);
      setProofPreviewUrl(null);
    }

    if (!file) {
      setSelectedProofFile(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setSelectedProofFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setLocalError("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > MAX_PROOF_SIZE_BYTES) {
      setSelectedProofFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setLocalError("Payment proof image must be 5 MB or smaller.");
      return;
    }

    setSelectedProofFile(file);
    setProofPreviewUrl(URL.createObjectURL(file));
  };

  const handleClearProof = () => {
    if (proofPreviewUrl) {
      URL.revokeObjectURL(proofPreviewUrl);
    }
    setProofPreviewUrl(null);
    setSelectedProofFile(null);
    setUploadedProofUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const loading = externalLoading || localLoading || uploadingProof;
  const error = externalError || localError;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLocalLoading(true);
    setLocalError(null);

    try {
      const formData = new FormData(e.currentTarget);

      const shippingAddress = String(
        formData.get("shippingAddress") || "",
      ).trim();

      const phoneNumber = String(formData.get("phoneNumber") || "").trim();

      const email = String(formData.get("email") || "").trim();

      const paymentMethod = String(
        formData.get("paymentMethod") || internalMethod,
      ) as PaymentMethod;

      const selectedProvider = String(formData.get("provider") || provider);

      if (!email || !email.includes("@")) {
        throw new Error("Please enter a valid email address.");
      }

      if (shippingAddress.length < 5) {
        throw new Error("Please enter a valid delivery address.");
      }

      if (phoneNumber.length < 9) {
        throw new Error("Please enter a valid phone number.");
      }

      const proofFile =
        selectedProofFile ||
        ((formData.get("paymentProof") as File | null) ?? null);

      if (
        paymentMethod === "MOBILE_MONEY" &&
        (!proofFile || proofFile.size === 0)
      ) {
        throw new Error(
          "Please upload a payment proof screenshot for Mobile Money transfer.",
        );
      }

      let finalProofUrl: string | undefined = uploadedProofUrl || undefined;

      if (proofFile && proofFile.size > 0 && !finalProofUrl) {
        setUploadingProof(true);
        try {
          finalProofUrl = await uploadPaymentProofToServer(
            proofFile,
            uploadProofEndpoint,
          );
          setUploadedProofUrl(finalProofUrl);
        } finally {
          setUploadingProof(false);
        }
      }

      await onSubmit({
        shippingAddress,
        phoneNumber,
        email,
        paymentMethod,
        provider: selectedProvider,
        paymentProofFile:
          proofFile && proofFile.size > 0 ? proofFile : undefined,
        paymentProofUrl: finalProofUrl,
      });
    } catch (err: any) {
      console.error(err);
      setLocalError(err?.message || "Checkout failed. Please try again.");
    } finally {
      setUploadingProof(false);
      setLocalLoading(false);
    }
  };

  return (
    <form
      id="checkout-form"
      onSubmit={handleSubmit}
      className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/5 rounded-3xl p-8 space-y-6 shadow-sm transition-colors duration-200"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Delivery &amp; Payment
        </h2>

        <div className="flex items-center gap-2 text-green-600 dark:text-green-500 text-sm font-medium">
          <Smartphone size={18} />
          Multi-Vendor Enabled
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border text-center border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block mb-2 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
          Email Address
        </label>

        <input
          name="email"
          type="email"
          required
          disabled={loading}
          defaultValue={defaultValues.email}
          placeholder="john@example.com"
          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 outline-none focus:border-blue-500 text-gray-900 dark:text-white transition-colors"
        />
      </div>

      <div>
        <label className="block mb-2 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
          Phone Number
        </label>

        <input
          name="phoneNumber"
          type="tel"
          required
          disabled={loading}
          defaultValue={defaultValues.phoneNumber}
          placeholder="+250 720 000 000"
          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 outline-none focus:border-blue-500 text-gray-900 dark:text-white transition-colors"
        />
      </div>

      <div>
        <label className="block mb-2 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
          Shipping Address / Location
        </label>

        <input
          name="shippingAddress"
          required
          disabled={loading}
          defaultValue={defaultValues.shippingAddress}
          placeholder="Kigali, Nyarugenge, KN 4 Ave"
          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 outline-none focus:border-blue-500 text-gray-900 dark:text-white transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
            Payment Method
          </label>

          <select
            name="paymentMethod"
            required
            value={internalMethod}
            onChange={(e) =>
              handleMethodChange(e.target.value as PaymentMethod)
            }
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 outline-none focus:border-blue-500 text-gray-900 dark:text-white transition-colors"
          >
            <option value="MOBILE_MONEY">Mobile Money (MoMo)</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="CASH_ON_DELIVERY">Cash On Delivery</option>
            <option value="WORKFORCE_WALLET">Workforce Wallet</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
            Provider
          </label>

          <select
            name="provider"
            required
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 outline-none focus:border-blue-500 text-gray-900 dark:text-white transition-colors"
          >
            {internalMethod === "MOBILE_MONEY" && (
              <>
                <option value="MTN_MOMO">MTN Mobile Money</option>
                <option value="AIRTEL_MONEY">Airtel Money</option>
              </>
            )}
            {internalMethod === "CREDIT_CARD" && (
              <option value="CARD_PAYMENT">Card Payment</option>
            )}
            {internalMethod === "CASH_ON_DELIVERY" && (
              <option value="CASH">Cash on Delivery</option>
            )}
            {internalMethod === "WORKFORCE_WALLET" && (
              <option value="WORKFORCE_WALLET">Wallet Balance</option>
            )}
          </select>
        </div>
      </div>

      {/* Conditional Mobile Money Instructions and Screenshot Upload Section */}
      {internalMethod === "MOBILE_MONEY" && (
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-black border border-yellow-500/30 space-y-3 transition-colors">
          <div className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
            <Smartphone size={16} />
            Mobile Money Transfer Instructions
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1 bg-white dark:bg-white/5 p-3 rounded-xl border border-gray-200 dark:border-white/5 transition-colors">
            <p>
              Store Name:{" "}
              <strong className="text-gray-900 dark:text-white">
                INGET GROUP / Ingeni Store
              </strong>
            </p>
            <p>
              MoMo Account Name:{" "}
              <strong className="text-gray-900 dark:text-white">
                Caleb&apos;s Admin
              </strong>
            </p>
            <p>
              MoMo Number:{" "}
              <strong className="text-yellow-600 dark:text-yellow-400 font-mono text-sm">
                1005404
              </strong>
            </p>
            <p>
              Amount to Transfer:{" "}
              <strong className="text-gray-900 dark:text-white font-mono">
                RF {Number(totalAmount || 0).toLocaleString()}
              </strong>
            </p>

            {vendors.length > 0 && (
              <div className="pt-2 mt-2 border-t border-gray-200 dark:border-white/10 space-y-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  Vendor Contact Phone(s):
                </p>
                {vendors.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span>{v.storeName}</span>
                    {v.phone ? (
                      <a
                        href={`tel:${v.phone}`}
                        className="inline-flex items-center gap-1 font-mono text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <Phone size={12} />
                        {v.phone}
                      </a>
                    ) : (
                      <span className="text-gray-400">Not provided</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold md:flex items-center gap-2">
              <Upload size={14} /> Upload Payment Screenshot Proof (Max 5MB)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              name="paymentProof"
              accept="image/png,image/jpeg,image/webp,image/*"
              disabled={loading}
              onChange={handleFileChange}
              className="w-full text-xs text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
            />

            {selectedProofFile && proofPreviewUrl && (
              <div className="p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={proofPreviewUrl}
                    alt="Payment proof preview"
                    className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-white/10 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                      {selectedProofFile.name}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {(selectedProofFile.size / 1024).toFixed(1)} KB
                      {uploadedProofUrl ? " • Uploaded & ready for DB" : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {uploadedProofUrl && (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  )}
                  <button
                    type="button"
                    onClick={handleClearProof}
                    disabled={loading}
                    aria-label="Remove payment proof image"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <label className="block mb-2 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
          Total Amount
        </label>

        <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 font-mono text-lg font-bold text-blue-600 dark:text-blue-400 transition-colors">
          RF {Number(totalAmount || 0).toLocaleString()}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider text-white shadow-lg shadow-blue-600/20"
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            {uploadingProof ? "Uploading Proof..." : "Processing..."}
          </>
        ) : (
          <>
            Confirm &amp; Pay
            <CreditCard size={18} />
          </>
        )}
      </button>
    </form>
  );
};

export default CheckoutForm;
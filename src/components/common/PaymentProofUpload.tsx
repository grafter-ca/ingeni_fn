// src/components/common/PaymentProofUpload.tsx
import React, { useEffect, useState } from "react";
import { useOrderStore } from "../../store/useOrderStore";
import {
  uploadProofDirectlyFromDevice,
  validateProofFile,
} from "../../libs/cloudinary";
import { Upload, Image as ImageIcon, X } from "lucide-react";

interface PaymentProofUploadProps {
  orderId: string;
  orderNumber: string;
  onSuccess?: () => void;
}

export const PaymentProofUpload: React.FC<PaymentProofUploadProps> = ({
  orderId,
  orderNumber,
  onSuccess,
}) => {
  const { submitPaymentProof, loading, error } = useOrderStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [transactionReference, setTransactionReference] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateProofFile(file);
    if (validationError) {
      setUploadError(validationError);
      e.target.value = "";
      return;
    }

    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }

    setUploadError(null);
    setSuccessMessage("");
    setUploadedUrl(null);
    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadedUrl(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setUploadError(null);

    if (!selectedFile && !uploadedUrl) {
      setUploadError("Please select a payment screenshot from your device.");
      return;
    }

    try {
      let proofUrl = uploadedUrl;

      if (!proofUrl && selectedFile) {
        setUploadingImage(true);
        proofUrl = await uploadProofDirectlyFromDevice(selectedFile);
        setUploadedUrl(proofUrl);
      }

      await submitPaymentProof(
        orderId,
        proofUrl!,
        transactionReference.trim() || undefined,
      );

      setSuccessMessage(
        "Payment proof uploaded and linked to your order. Pending admin verification.",
      );
      onSuccess?.();
    } catch (err: any) {
      if (uploadingImage) {
        setUploadError(err?.message || "Failed to upload image to Cloudinary.");
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const isSubmitting = loading || uploadingImage;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 max-w-lg w-full mx-auto">
      <h3 className="text-lg text-center lg:text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Upload Payment Proof
      </h3>
      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
        Order Tracking No :{" "}
        <span
          role="orderNumber"
          aria-label="Order Number"
          className="font-bold text-blue-600"
        >
          {orderNumber}
        </span>
      </h4>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
        Select a payment receipt screenshot directly from your device.
      </p>

      {(error || uploadError) && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {uploadError || error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 text-green-600 dark:text-green-400 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Payment Screenshot <span className="text-red-500">*</span>
          </label>
          {!filePreview ? (
            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                <ImageIcon className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                  <span className="font-semibold text-blue-600 dark:text-blue-400 inline-flex items-center gap-1">
                    <Upload size={13} /> Choose file from device
                  </span>
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  PNG, JPG, WEBP, AVIF up to 5MB
                </p>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                disabled={isSubmitting}
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 flex items-center gap-3">
              <img
                src={filePreview}
                alt="Payment proof preview"
                className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                  {selectedFile?.name}
                </p>
                <p className="text-[10px] text-gray-500">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleRemoveFile}
                className="p-1.5 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-red-100 hover:text-red-600 transition disabled:opacity-50"
                title="Remove image"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Transaction Reference / Mobile Money Code (Optional)
          </label>
          <input
            type="text"
            disabled={isSubmitting}
            placeholder="e.g., MOMO-20260610-XYZ"
            value={transactionReference}
            onChange={(e) => setTransactionReference(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2"
        >
          {uploadingImage
            ? "Uploading to Cloudinary..."
            : loading
              ? "Saving Proof..."
              : "Submit Payment Proof"}
        </button>
      </form>
    </div>
  );
};
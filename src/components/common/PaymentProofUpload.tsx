import React, { useState } from 'react';
import { useOrderStore } from '../../store/useOrderStore';
import { Upload, Image as ImageIcon, X, Link as LinkIcon } from 'lucide-react';

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
  
  // Upload mode: 'file' or 'url'
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  
  const [proofUrl, setProofUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  const [transactionReference, setTransactionReference] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select a valid image file (PNG, JPG, JPEG)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit check
        setUploadError('File size must be less than 5MB');
        return;
      }
      setUploadError(null);
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
  };

  // Helper function to upload the file to your cloud storage/backend API or convert/upload to a host service.
  // Replace this placeholder logic with your actual storage upload service (e.g., Supabase storage, Cloudinary, S3, or your backend file endpoint).
  const uploadFileToStorage = async (file: File): Promise<string> => {
    // Example implementation using FormData to upload to your backend endpoint:
    /*
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to upload image file');
    const data = await response.json();
    return data.url; // Returns the hosted public image URL
    */

    // Fallback simulation or data-URL mapping if direct endpoint isn't wired yet:
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // If your backend accepts base64 data strings or you have a dedicated upload endpoint, replace this:
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setUploadError(null);

    let finalProofUrl = '';

    if (uploadMode === 'file') {
      if (!selectedFile) {
        setUploadError('Please select a payment screenshot image to upload.');
        return;
      }
      try {
        setUploadingImage(true);
        finalProofUrl = await uploadFileToStorage(selectedFile);
      } catch (err: any) {
        setUploadError(err.message || 'Failed to upload image file.');
        setUploadingImage(false);
        return;
      } finally {
        setUploadingImage(false);
      }
    } else {
      if (!proofUrl.trim()) {
        setUploadError('Please provide a valid payment proof URL.');
        return;
      }
      finalProofUrl = proofUrl.trim();
    }

    try {
      await submitPaymentProof(orderId, finalProofUrl, transactionReference.trim() || undefined);
      setSuccessMessage('Payment proof uploaded successfully! Your payment status is now pending admin verification.');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      // Error is managed inside the Zustand store
    }
  };

  const isSubmitting = loading || uploadingImage;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 max-w-lg w-full mx-auto">
      <h3 className="text-lg text-center text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Upload Payment Proof 
      </h3>
      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
        Order Trucking No : <span role='orderNumber' aria-label="Order Number" className="font-bold text-blue-600">{orderNumber}</span>
      </h4>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
        Upload a screenshot of your transaction receipt or enter your reference code below for admin verification.
      </p>

      {/* Mode Switcher Tabs */}
      <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1 mb-4 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setUploadMode('file')}
          className={`flex-1 py-2 rounded-md transition flex items-center justify-center gap-1.5 ${
            uploadMode === 'file'
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
          }`}
        >
          <Upload size={14} /> Upload from Device
        </button>
        <button
          type="button"
          onClick={() => setUploadMode('url')}
          className={`flex-1 py-2 rounded-md transition flex items-center justify-center gap-1.5 ${
            uploadMode === 'url'
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
          }`}
        >
          <LinkIcon size={14} /> Paste Image URL
        </button>
      </div>

      {(error || uploadError) && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {error || uploadError}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 text-green-600 dark:text-green-400 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {uploadMode === 'file' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Payment Screenshot <span className="text-red-500">*</span>
            </label>
            {!filePreview ? (
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                  <ImageIcon className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">Click to browse</span> or drag & drop screenshot
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">PNG, JPG, JPEG up to 5MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
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
                    {selectedFile ? (selectedFile.size / 1024).toFixed(1) + ' KB' : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-red-100 hover:text-red-600 transition"
                  title="Remove image"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Proof of Payment URL (Image/Receipt) <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              required={uploadMode === 'url'}
              placeholder="https://imgur.com/... or your storage link"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Transaction Reference / Mobile Money Code (Optional)
          </label>
          <input
            type="text"
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
          {uploadingImage ? 'Uploading Image...' : loading ? 'Submitting Proof...' : 'Submit Payment Proof'}
        </button>
      </form>
    </div>
  );
};
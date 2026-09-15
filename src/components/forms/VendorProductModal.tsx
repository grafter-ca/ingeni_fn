// components/vendor/VendorProductModal.tsx
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { ProductImageUploader } from "../forms/ProductImageUploader";

interface VendorProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: FormData) => Promise<void>;
  initialData?: any;
  categories: any[];
  vendorId: string;
}

export const VendorProductModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categories,
  vendorId,
}: VendorProductModalProps) => {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  
  // We store newly selected files here using ProductImageUploader
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  // We can track existing image URLs from initialData for editing mode
  const [existingImages, setExistingImages] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setPrice(
        initialData.price !== undefined && initialData.price !== null
          ? initialData.price.toString()
          : ""
      );
      setStock(
        initialData.stock !== undefined && initialData.stock !== null
          ? initialData.stock.toString()
          : ""
      );
      setCategoryId(initialData.categoryId || "");
      setDescription(initialData.description || "");

      const prevImages = Array.isArray(initialData.images)
        ? initialData.images
            .map((img: any) => (typeof img === "string" ? img : img?.url))
            .filter(Boolean)
        : [];
      setExistingImages(prevImages);
      setImageFiles([]);
    } else {
      setTitle("");
      setPrice("");
      setStock("");
      setCategoryId("");
      setDescription("");
      setExistingImages([]);
      setImageFiles([]);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vendorId) {
      toast.error("Error: Vendor ID is missing. Please refresh or re-login.");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("price", String(parseFloat(price) || 0));
      formData.append("stock", String(parseInt(stock, 10) || 0));
      formData.append("categoryId", categoryId);
      formData.append("description", description);
      formData.append("vendorId", vendorId);

      // Append newly uploaded File objects under both common field keys ("images" and "image") to guarantee backend compatibility
      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      // Append retained existing image URLs so the backend preserves them
      existingImages.forEach((url) => {
        formData.append("images", url);
      });

      console.log("Submitting FormData payload for vendor:", vendorId);

      await onSubmit(formData);
      onClose();
    } catch (error: any) {
      console.error("Failed to submit product:", error);
      toast.error(`Failed to submit product: ${error?.message || "Unknown error occurred"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-hidden"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg p-6 my-auto rounded-3xl bg-[#0c0c0e] border border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-poppins font-bold text-lg text-white mb-2">
          {initialData ? "Edit Product Details" : "Add New Product Listing"}
        </h2>
        <p className="font-mono text-xs text-gray-400 mb-6">
          Configure your item attributes, select category, attach device images, and manage pricing below.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] uppercase text-gray-400 mb-1">Product Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Wireless Ergonomic Mouse"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[10px] uppercase text-gray-400 mb-1">Price (RWF)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase text-gray-400 mb-1">Stock Units</label>
              <input
                type="number"
                required
                placeholder="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase text-gray-400 mb-1">Category</label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-blue-500 transition cursor-pointer bg-[#0c0c0e]"
            >
              <option value="" disabled>Select category</option>
              {Array.isArray(categories) &&
                categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name || cat.title}
                  </option>
                ))}
            </select>
          </div>

          {/* Existing Images Display (for Edit mode if any remain) */}
          {existingImages.length > 0 && (
            <div>
              <label className="block font-mono text-[10px] uppercase text-gray-400 mb-2">Existing Images</label>
              <div className="flex flex-wrap gap-3">
                {existingImages.map((url, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 group">
                    <img src={url} alt="existing" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setExistingImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-mono cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Integrated ProductImageUploader for new file attachments */}
          <div>
            <ProductImageUploader
              existingImages={existingImages}
              newFiles={imageFiles}
              onUpdate={(updatedExistingImages, updatedNewFiles) => {
                setExistingImages(updatedExistingImages);
                setImageFiles(updatedNewFiles);
              }}
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase text-gray-400 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Describe your product features..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-mono text-xs transition disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-poppins font-semibold text-xs transition shadow-lg shadow-blue-600/20 disabled:opacity-50 min-w-[120px] cursor-pointer"
            >
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              <span>{initialData ? "Update Product" : "Add Product"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
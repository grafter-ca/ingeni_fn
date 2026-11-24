import { Loader2, X } from "lucide-react";
import { ProductDetailsForm } from "./ProductDetailsForm";
import { useEffect } from "react";
import { useProductStore } from "../../store/productStore";

type ProductFormProps = {
  vendorId: string;
  vendorName?: string;
  productId?: string | null;
  onClose: () => void;
};

const cleanEntityId = (value?: string | number | null): string =>
  value ? String(value).replace(/^(local-|fake-)/, "") : "";

export const ProductForm = ({
  vendorId,
  vendorName,
  onClose,
}: ProductFormProps) => {
  const {
    formData,
    addProduct,
    updateProduct,
    isEditing,
    updateFormData,
    isLoading,
    error,
  } = useProductStore();

  useEffect(() => {
    const cleanPropVendorId = cleanEntityId(vendorId);

    if (isEditing) {
      const existingImages = Array.isArray(isEditing.images)
        ? isEditing.images
            .map((img: any) => (typeof img === "string" ? img : img?.url))
            .filter(Boolean)
        : [];

      const rawCategoryId =
        isEditing.categoryId ||
        (isEditing.category?.id ? String(isEditing.category.id) : "");

      updateFormData({
        title: isEditing.title ?? "",
        slug: isEditing.slug ?? "",
        stock: isEditing.stock ?? 0,
        price: isEditing.price ?? 0,
        description: isEditing.description ?? "",
        location: isEditing.location ?? "",
        isActive:
          isEditing.isActive !== undefined ? Boolean(isEditing.isActive) : true,
        images: existingImages,
        imageFiles: [],
        categoryId: cleanEntityId(rawCategoryId),
        vendorId: cleanEntityId(isEditing.vendorId) || cleanPropVendorId,
      });
      return;
    }

    updateFormData({
      title: "",
      slug: "",
      stock: 0,
      price: 0,
      description: "",
      location: "",
      isActive: true,
      images: [],
      imageFiles: [],
      categoryId: "",
      vendorId: cleanPropVendorId,
    });
  }, [isEditing?.id, vendorId, updateFormData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetVendorId = cleanEntityId(formData.vendorId || vendorId);
    const targetCategoryId = cleanEntityId(formData.categoryId);
    const isEditMode = Boolean(isEditing?.id);

    const payload = new FormData();

    // 1. Required Product fields
    payload.append("vendorId", targetVendorId);
    payload.append("title", String(formData.title ?? "").trim());
    payload.append("price", String(formData.price ?? 0));
    payload.append("stock", String(formData.stock ?? 0));
    payload.append("categoryId", targetCategoryId);
    payload.append("description", String(formData.description ?? "").trim());

    // 2. Optional / toggleable Product fields
    const trimmedSlug = String(formData.slug ?? "").trim();
    if (trimmedSlug) {
      payload.append("slug", trimmedSlug);
    }

    const trimmedLocation = String(formData.location ?? "").trim();
    if (trimmedLocation || isEditMode) {
      payload.append("location", trimmedLocation);
    }

    payload.append("isActive", String(Boolean(formData.isActive ?? true)));

    // 3. ProductImage relations (existing URLs to keep + new files to upload)
    (formData.images || []).forEach((url: string) => {
      if (url) {
        payload.append("images_to_keep", url);
      }
    });

    (formData.imageFiles || []).forEach((file: File) => {
      payload.append("images", file);
    });

    try {
      if (isEditMode && isEditing?.id) {
        await updateProduct(cleanEntityId(isEditing.id), payload);
      } else {
        await addProduct(targetVendorId, payload);
      }
      onClose();
    } catch (err) {
      console.error("Submission failed:", err);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#0a0a0a] border border-white/10 p-6 md:p-8 rounded-3xl w-full max-w-lg mx-auto shadow-2xl flex flex-col max-h-[90vh]"
    >
      <div className="shrink-0 mb-6 flex justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
            {isEditing ? "Modify" : "New"} Asset
          </h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">
            Deploy to live catalog
          </p>
        </div>

        <div className="flex items-start gap-3">
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl min-w-45">
            <p className="text-[9px] text-gray-400 uppercase tracking-widest">
              Vendor
            </p>
            <p className="text-sm font-bold text-white">
              {vendorName || "Active Merchant"}
            </p>
            <p className="text-[10px] text-gray-500 mt-1 truncate">
              {cleanEntityId(formData.vendorId || vendorId) ||
                "No vendor assigned"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product form"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer"
          >
            <X size={20} className="text-gray-400 hover:text-white" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-5 subtle-scroll">
        {error && (
          <div className="text-rose-400 bg-rose-500/10 p-4 rounded-xl text-xs border border-rose-500/20">
            {error}
          </div>
        )}
        <ProductDetailsForm />
      </div>

      <div className="shrink-0 mt-6 pt-4 border-t border-white/10">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-[0.25em] hover:bg-gray-200 disabled:opacity-50 transition-all flex items-center justify-center cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : isEditing ? (
            "Commit Changes"
          ) : (
            "Publish to Catalog"
          )}
        </button>
      </div>
    </form>
  );
};
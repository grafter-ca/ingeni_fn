import { useState, useEffect, useCallback } from "react";
import ProductList from "./ProductList";
import { ProductForm } from "../../../components/forms/ProductForm";
import { Plus } from "lucide-react";
import { useAuthState } from "../../../context/AuthContext";
import { useProductStore } from "../../../store/productStore";

export default function ProductManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { user } = useAuthState();
  const { setEditingProduct, isEditing } = useProductStore();

  const handleClose = useCallback(() => {
    setIsFormOpen(false);
    setEditingProduct(null);
  }, [setEditingProduct]);

  const handleEdit = useCallback(
    (product: any) => {
      setEditingProduct(product);
      setIsFormOpen(true);
    },
    [setEditingProduct],
  );

  const handleAddNew = useCallback(() => {
    setEditingProduct(null);
    setIsFormOpen(true);
  }, [setEditingProduct]);

  useEffect(() => {
    if (!isFormOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFormOpen, handleClose]);

  const resolvedVendorId = isEditing?.vendorId || user?.id || "";
  const resolvedVendorName =
    isEditing?.vendor?.storeName ||
    user?.name ||
    user?.email?.split("@")[0] ||
    "Active Merchant";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header and List */}
      <div className="flex justify-between items-end">
        <h1 className="text-3xl font-bold text-white uppercase tracking-tighter">
          Product Catalog
        </h1>
        <button
          type="button"
          onClick={handleAddNew}
          className="bg-white hover:bg-gray-100 text-black px-3 py-2 rounded-xl flex items-center gap-2 font-bold uppercase text-[10px] transition cursor-pointer"
        >
          <Plus size={16} /> New Asset
        </button>
      </div>

      <ProductList onEdit={handleEdit} />

      {/* Modal */}
      {isFormOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={handleClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <ProductForm
              key={isEditing?.id ?? "new"}
              productId={isEditing?.id || null}
              vendorId={resolvedVendorId}
              vendorName={resolvedVendorName}
              onClose={handleClose}
            />
          </div>
        </div>
      )}
    </div>
  );
}
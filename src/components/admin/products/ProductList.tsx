// src/components/admin/products/ProductList.tsx
"use client";

import { useState } from "react";
import { useProductStore } from "../../../store/productStore";
import { Trash2, Edit2, Package, Eye, EyeOff } from "lucide-react";

interface ProductRecord {
  id: string;
  title: string;
  price: number | string;
  stock: number;
  isActive?: boolean;
  images?: string[];
  vendor?: {
    storeName?: string;
  } | null;
  category?: {
    name?: string;
  } | null;
}

export default function ProductList({
  onEdit,
}: {
  onEdit: (product: ProductRecord) => void;
}) {
  const { products, removeProduct, setProducts } = useProductStore() as {
    products: ProductRecord[];
    removeProduct: (id: string) => void;
    setProducts?: (products: ProductRecord[]) => void;
  };

  const [togglingIds, setTogglingIds] = useState<Record<string, boolean>>({});
  const [toggleError, setToggleError] = useState<string | null>(null);

  const handleToggleVisibility = async (product: ProductRecord) => {
    const currentActive = Boolean(product.isActive ?? true);
    const nextActive = !currentActive;
    const previousProducts = products;

    setToggleError(null);
    setTogglingIds((prev) => ({ ...prev, [product.id]: true }));

    // Optimistic update in Zustand store
    if (typeof setProducts === "function") {
      setProducts(
        products.map((item) =>
          item.id === product.id ? { ...item, isActive: nextActive } : item,
        ),
      );
    } else {
      // Fallback in-place mutation if store doesn't expose setProducts
      product.isActive = nextActive;
    }

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });

      if (!res.ok) {
        throw new Error(`Failed to update visibility (${res.status})`);
      }
    } catch (err) {
      if (typeof setProducts === "function") {
        setProducts(previousProducts);
      } else {
        product.isActive = currentActive;
      }
      setToggleError(
        err instanceof Error
          ? err.message
          : "Could not update product visibility.",
      );
    } finally {
      setTogglingIds((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
    }
  };

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Package size={48} className="mb-4 opacity-20" />
        <p className="text-sm font-bold uppercase tracking-widest">
          No inventory assets found
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {toggleError && (
        <div className="px-4 py-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center justify-between">
          <span>{toggleError}</span>
          <button
            type="button"
            onClick={() => setToggleError(null)}
            className="text-[11px] font-semibold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        {/* Table Header */}
        <div className="grid grid-cols-12 p-5 border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 bg-white/2">
          <span className="col-span-4">Product Details</span>
          <span className="col-span-2">Category</span>
          <span className="col-span-2">Price</span>
          <span className="col-span-1">Stock</span>
          <span className="col-span-1 text-center">Visible</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-white/5">
          {products.map((product) => {
            const isVisible = Boolean(product.isActive ?? true);
            const isUpdating = Boolean(togglingIds[product.id]);
            const previewImage = product.images?.[0];

            return (
              <div
                key={product.id}
                className={`grid grid-cols-12 p-4 items-center hover:bg-white/3 transition-all group ${
                  !isVisible ? "opacity-65" : ""
                }`}
              >
                {/* Product Column */}
                <div className="col-span-4 flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 overflow-hidden border border-white/10 shrink-0 flex items-center justify-center">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        className="w-full h-full object-cover"
                        alt={product.title}
                      />
                    ) : (
                      <Package size={18} className="text-gray-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                        {product.title}
                      </p>
                      {!isVisible && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-white/10 shrink-0">
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-medium text-gray-500 mt-0.5 tracking-wide truncate">
                      {product.vendor?.storeName || "Unknown Vendor"}
                    </p>
                  </div>
                </div>

                {/* Category */}
                <span className="col-span-2 text-[11px] font-medium text-gray-400 bg-white/5 px-2 py-1 rounded-md w-fit truncate">
                  {product.category?.name || "Uncategorized"}
                </span>

                {/* Price */}
                <span className="col-span-2 text-sm font-bold text-white">
                  {Number(product.price || 0).toLocaleString()}{" "}
                  <span className="text-[10px] text-gray-600">RWF</span>
                </span>

                {/* Stock */}
                <div className="col-span-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                      product.stock > 10
                        ? "text-emerald-400 bg-emerald-400/10"
                        : "text-amber-400 bg-amber-400/10"
                    }`}
                  >
                    {product.stock}
                  </span>
                </div>

                {/* Visibility Toggle (isActive) */}
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isVisible}
                    aria-label={`Toggle visibility for ${product.title}`}
                    disabled={isUpdating}
                    onClick={() => void handleToggleVisibility(product)}
                    title={
                      isVisible
                        ? "Visible on storefront (click to hide)"
                        : "Hidden from storefront (click to show)"
                    }
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 ${
                      isVisible
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                        : "bg-zinc-800/80 border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                    }`}
                  >
                    {isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                    <span>{isVisible ? "On" : "Off"}</span>
                  </button>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex justify-end gap-2 opacity-75 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onEdit(product)}
                    aria-label={`Edit ${product.title}`}
                    className="p-2 hover:bg-blue-500/10 rounded-xl text-gray-400 hover:text-blue-400 transition-all cursor-pointer"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeProduct(product.id)}
                    aria-label={`Delete ${product.title}`}
                    className="p-2 hover:bg-rose-500/10 rounded-xl text-gray-400 hover:text-rose-500 transition-all cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
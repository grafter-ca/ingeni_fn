// components/vendor/VendorProduct.tsx
import { useEffect, useState } from "react";
import { Package, Plus, Search, Pencil, Trash2, AlertCircle } from "lucide-react";
import { useProductStore } from "../../store/productStore";
import { useVendorStore } from "../../store/vendorStore";
import { useCategoryStore } from "../../store/categoryStore";
import { useAuthState } from "../../context/AuthContext";
import { VendorProductModal } from "../../components/forms/VendorProductModal";

export const VendorProduct = () => {
  const { products, fetchVendorProducts, removeProduct, addProduct, updateProduct } = useProductStore() as any;
  const { selectedVendor, fetchVendorById } = useVendorStore();
  const { categories, fetchCategories } = useCategoryStore() as any;
  const { user } = useAuthState();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const userId = user?.id;
  const vendorId = selectedVendor?.id ?? "";

  useEffect(() => {
    if (userId && !selectedVendor) {
      if (typeof fetchVendorById === "function") {
        fetchVendorById(userId);
      }
    }
  }, [userId, selectedVendor, fetchVendorById]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (vendorId && typeof fetchVendorProducts === "function") {
          await fetchVendorProducts(vendorId);
        }
        if (typeof fetchCategories === "function") {
          await fetchCategories();
        }
      } catch (error) {
        console.error("Failed to load vendor products or categories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [vendorId, fetchVendorProducts, fetchCategories]);

  const safeProducts = Array.isArray(products)
    ? products.filter((product: any) => {
        if (!vendorId) return true;
        const pVendorId = product.vendorId || product.vendor?.id;
        return pVendorId === vendorId;
      })
    : [];

  const filteredProducts = safeProducts.filter((product: any) => {
    const matchesSearch =
      (product?.title && product.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product?.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategory === "ALL" || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      if (typeof removeProduct === "function") {
        await removeProduct(id);
      }
      if (vendorId && typeof fetchVendorProducts === "function") {
        await fetchVendorProducts(vendorId);
      }
    }
  };

  const handleModalSubmit = async (payload: FormData) => {
    const formDataEntries: Record<string, any> = {};
    payload.forEach((value, key) => {
      formDataEntries[key] = value;
    });
    console.log("Submitting product payload:", formDataEntries);

    try {
      if (editingProduct) {
        if (typeof updateProduct === "function") {
          await updateProduct(editingProduct.id, payload);
        }
      } else {
        if (typeof addProduct === "function") {
          await addProduct(vendorId, payload);
        }
      }

      if (vendorId && typeof fetchVendorProducts === "function") {
        await fetchVendorProducts(vendorId);
      }
    } catch (err) {
      console.error("Error inside handleModalSubmit:", err);
      throw err;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Actions Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-3xl bg-gradient-to-r from-blue-900/40 via-[#0c0c0e] to-[#0c0c0e] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-[10px] uppercase tracking-wider mb-3">
            <Package size={12} />
            <span>Catalog Inventory Management</span>
          </div>
          <h1 className="font-poppins font-bold text-2xl md:text-3xl text-white tracking-tight">
            Vendor Products
          </h1>
          <p className="font-mono text-xs text-gray-400 mt-1">
            Create, update pricing, and monitor stock levels for your catalog items.
          </p>
        </div>
        <button
          type="button"
          disabled={!vendorId}
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-poppins font-semibold text-xs transition shadow-lg shadow-blue-600/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          <span>{!vendorId ? "Loading Vendor..." : "Add New Product"}</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0c0c0e] border border-white/10 shadow-xl">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search products by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 font-mono text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="font-mono text-[10px] text-gray-500 uppercase">Filter:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-gray-300 focus:outline-none focus:border-blue-500 transition cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {Array.isArray(categories) &&
              categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name || cat.title}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Products Grid Table */}
      <div className="rounded-3xl bg-[#0c0c0e] border border-white/10 p-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-gray-500 text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                // Loading Skeleton Rows
                [...Array(4)].map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="py-3.5 px-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex-shrink-0" />
                      <div className="space-y-2">
                        <div className="h-3 w-32 bg-white/10 rounded" />
                        <div className="h-2 w-20 bg-white/5 rounded" />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-3 w-20 bg-white/10 rounded" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-3 w-16 bg-white/10 rounded" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-14 bg-white/10 rounded-full" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <div className="w-7 h-7 bg-white/5 rounded-lg" />
                        <div className="w-7 h-7 bg-white/5 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500 font-mono text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle size={24} className="text-gray-600" />
                      <span>No products found matching your criteria.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product: any) => {
                  const imageUrl = product.images?.[0]?.url || (typeof product.images?.[0] === 'string' ? product.images[0] : null);
                  return (
                    <tr key={product.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package size={16} className="text-gray-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-poppins font-semibold text-white text-sm line-clamp-1">
                            {product.title}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            Slug: {product.slug || "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-blue-400 font-bold">
                        RWF {Number(product.price || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold ${
                            product.stock > 5
                              ? "text-emerald-400"
                              : product.stock > 0
                              ? "text-amber-400"
                              : "text-rose-400"
                          }`}
                        >
                          {product.stock} units
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold ${
                            product.isActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                          }`}
                        >
                          {product.isActive ? "Active" : "Hidden"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(product);
                              setIsModalOpen(true);
                            }}
                            title="Edit Product"
                            className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition cursor-pointer"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product.id)}
                            title="Delete Product"
                            className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Standalone Product Form Modal */}
      <VendorProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleModalSubmit}
        initialData={editingProduct}
        categories={categories}
        vendorId={vendorId}
      />
    </div>
  );
};
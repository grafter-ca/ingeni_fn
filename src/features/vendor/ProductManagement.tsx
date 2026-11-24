import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Package,
  Plus,
  Search,
  Trash2,
  Edit3,
  Loader2,
  MapPin,
  Store,
  ShieldCheck,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
} from "lucide-react";
import { useVendorStore } from "../../store/vendorStore";
import { useProductStore } from "../../store/productStore";
import { ProductForm } from "../../components/forms/ProductForm";
import Button from "../../components/ui/Button";
import { useAuthState } from "../../context/AuthContext";
import { toast } from "react-hot-toast";

function getPaginationRange(
  current: number,
  total: number,
): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, idx) => idx + 1);
  }

  if (current <= 3) {
    return [1, 2, 3, 4, "...", total];
  }

  if (current >= total - 2) {
    return [1, "...", total - 3, total - 2, total - 1, total];
  }

  return [1, "...", current - 1, current, current + 1, "...", total];
}

export const ProductManagement = () => {
  const { stats, fetchVendorDashboardData } = useVendorStore();

  const {
    filteredProducts,
    categories,
    fetchCategories,
    fetchVendorProducts,
    setSelectedVendorId,
    setEditingProduct,
    isEditing,
    removeProduct,
    isLoading,
  } = useProductStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const { user } = useAuthState();

  const vendorId = user?.id || "";

  // Sync vendor context, dashboard telemetry stats, and product catalog on mount
  useEffect(() => {
    void fetchCategories();
    if (vendorId) {
      setSelectedVendorId(vendorId);
      void fetchVendorProducts(vendorId);
      void fetchVendorDashboardData();
    }
  }, [
    vendorId,
    fetchCategories,
    fetchVendorProducts,
    setSelectedVendorId,
    fetchVendorDashboardData,
  ]);

  // Reset pagination to page 1 when search or category filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategoryFilter, pageSize]);

  const refreshVendorCatalog = useCallback(() => {
    if (vendorId) {
      void fetchVendorProducts(vendorId);
      void fetchVendorDashboardData();
    }
  }, [vendorId, fetchVendorProducts, fetchVendorDashboardData]);

  const handleOpenCreateModal = useCallback(() => {
    setEditingProduct(null);
    setIsFormOpen(true);
  }, [setEditingProduct]);

  const handleOpenEditModal = useCallback(
    (product: any) => {
      setEditingProduct(product);
      setIsFormOpen(true);
    },
    [setEditingProduct],
  );

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingProduct(null);
    refreshVendorCatalog();
  }, [setEditingProduct, refreshVendorCatalog]);

  useEffect(() => {
    if (!isFormOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFormOpen(false);
        setEditingProduct(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFormOpen, setEditingProduct]);

  const handleDeleteProduct = async (productId: string) => {
    if (
      window.confirm(
        "Are you sure you want to remove this product from your inventory catalog?",
      )
    ) {
      try {
        const cleanId = String(productId).replace(/^(local-|fake-)/, "");
        await removeProduct(cleanId);
        toast.success("Product deleted successfully.");
        refreshVendorCatalog();
      } catch {
        toast.error("Failed to delete product.");
      }
    }
  };

  // Filter products by search query and optional category filter
  const displayedProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = Array.isArray(filteredProducts) ? filteredProducts : [];

    return list.filter((product: any) => {
      if (selectedCategoryFilter !== "ALL") {
        const rawCat = String(
          product.categoryId ?? product.category?.id ?? "",
        ).replace(/^(local-|fake-)/, "");
        if (rawCat !== selectedCategoryFilter) {
          return false;
        }
      }

      if (!q) return true;
      const titleMatch = String(product.title || "")
        .toLowerCase()
        .includes(q);
      const locationMatch = String(product.location || "")
        .toLowerCase()
        .includes(q);
      const skuMatch = String(product.sku || "")
        .toLowerCase()
        .includes(q);
      const brandMatch = String(product.brand || "")
        .toLowerCase()
        .includes(q);
      const idMatch = String(product.id || "")
        .toLowerCase()
        .includes(q);
      return titleMatch || locationMatch || skuMatch || brandMatch || idMatch;
    });
  }, [filteredProducts, searchQuery, selectedCategoryFilter]);

  const totalItems = displayedProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  useEffect(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
    }
  }, [currentPage, safePage]);

  const paginatedProducts = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return displayedProducts.slice(start, start + pageSize);
  }, [displayedProducts, safePage, pageSize]);

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  const pageNumbers = useMemo(
    () => getPaginationRange(safePage, totalPages),
    [safePage, totalPages],
  );

  const hasFilters =
    Boolean(searchQuery.trim()) || selectedCategoryFilter !== "ALL";

  const vendorDisplayName =
    user?.name || user?.email?.split("@")[0] || "Vendor Store Portal";

  const resolvedFormVendorId = isEditing?.vendorId || vendorId;
  const resolvedFormVendorName =
    isEditing?.vendor?.storeName || vendorDisplayName || "Active Merchant";

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Vendor Info Banner Card using VendorStore stats */}
      <div className="p-5 rounded-3xl bg-linear-to-r from-blue-950/40 via-[#0c0c0e] to-[#0c0c0e] border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Store size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="font-poppins font-bold text-white text-lg tracking-wide">
                {vendorDisplayName}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[10px] font-mono text-blue-400 uppercase flex items-center gap-1">
                <ShieldCheck size={10} /> Active Vendor
              </span>
            </div>
            <p className="font-mono text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
              <User size={12} className="text-blue-400" /> Account ID:{" "}
              <span className="text-gray-300">
                {vendorId || "Session Active"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 sm:border-l sm:border-white/10 sm:pl-6">
          <div className="font-mono text-right">
            <p className="text-[10px] uppercase text-gray-500">Catalog Count</p>
            <p className="text-sm font-bold text-white">
              {stats?.productCount ?? displayedProducts.length}
            </p>
          </div>
          <div className="font-mono text-right">
            <p className="text-[10px] uppercase text-gray-500">Active Orders</p>
            <p className="text-sm font-bold text-blue-400">
              {stats?.activeOrders ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Package size={14} className="text-blue-400" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-blue-400">
              Inventory Management
            </span>
          </div>
          <h1 className="font-poppins font-bold text-2xl md:text-3xl text-white tracking-tight">
            Products &amp; Inventory
          </h1>
        </div>
        <Button
          label="Add New Product"
          icon={Plus}
          onClick={handleOpenCreateModal}
          className="bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs py-3 px-5 rounded-xl transition shadow-lg shadow-blue-600/25 cursor-pointer"
        />
      </div>

      {/* Search, Category Filter & Page Size Toolbar */}
      <div className="p-4 rounded-2xl bg-[#0c0c0e] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
        <div className="relative w-full md:max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Search by title, SKU, brand, location, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-blue-500/50 transition placeholder:text-gray-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            className="px-3.5 py-2.5 rounded-xl bg-[#121215] border border-white/10 text-gray-200 focus:outline-none focus:border-blue-500/50 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat: any) => {
              const cleanCatId = String(cat.id).replace(/^(local-|fake-)/, "");
              return (
                <option key={cat.id} value={cleanCatId}>
                  {cat.name}
                </option>
              );
            })}
          </select>

          <label className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#121215] border border-white/10 text-gray-400">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              aria-label="Products per page"
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value={6} className="bg-[#0c0c0e]">
                6
              </option>
              <option value={12} className="bg-[#0c0c0e]">
                12
              </option>
              <option value={24} className="bg-[#0c0c0e]">
                24
              </option>
            </select>
          </label>

          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategoryFilter("ALL");
                setCurrentPage(1);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition cursor-pointer"
            >
              <RotateCcw size={13} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-16 text-center font-mono text-xs text-gray-500 bg-[#0c0c0e] rounded-3xl border border-white/10 flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin text-blue-400" />{" "}
            Synchronizing inventory catalog...
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div className="col-span-full py-16 text-center font-mono text-xs text-gray-500 bg-[#0c0c0e] rounded-3xl border border-white/10 space-y-2">
            <p>
              {hasFilters
                ? "No products match your current search or category filter."
                : 'No products found in your catalog. Click "Add New Product" to publish items.'}
            </p>
          </div>
        ) : (
          paginatedProducts.map((product: any) => {
            const imageUrl =
              typeof product.images?.[0] === "string"
                ? product.images[0]
                : (product.images?.[0] as any)?.url ||
                  "https://images.unsplash.com/photo-1523275335684-37898b6baf30";

            const imageCount = Array.isArray(product.images)
              ? product.images.length
              : 1;
            const stockVal = Number(product.stock ?? 10);

            return (
              <div
                key={product.id}
                className="rounded-3xl bg-[#0c0c0e] border border-white/10 hover:border-white/20 overflow-hidden flex flex-col justify-between shadow-xl group transition"
              >
                <div>
                  <div className="h-48 w-full bg-[#121215] relative overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {imageCount > 1 && (
                        <span className="px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[9px] font-mono text-blue-300 border border-white/10">
                          +{imageCount - 1} more
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-1 rounded-lg backdrop-blur-md text-[10px] font-mono border ${
                          stockVal <= 0
                            ? "bg-rose-950/80 text-rose-300 border-rose-500/30"
                            : stockVal <= 5
                              ? "bg-amber-950/80 text-amber-300 border-amber-500/30"
                              : "bg-black/70 text-white border-white/10"
                        }`}
                      >
                        Stock: {stockVal} {product.unit || ""}
                      </span>
                    </div>
                    {product.location && (
                      <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-mono text-blue-300 border border-white/10 flex items-center gap-1">
                        <MapPin size={10} /> {product.location}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-poppins font-bold text-base text-white line-clamp-1">
                        {product.title}
                      </h3>
                      {product.brand && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300 shrink-0">
                          {product.brand}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2 font-mono text-xs">
                      <span className="text-blue-400 font-bold">
                        RWF {Number(product.price || 0).toLocaleString()}
                      </span>
                      {product.compareAtPrice && (
                        <span className="text-gray-500 line-through text-[11px]">
                          RWF {Number(product.compareAtPrice).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {product.sku && (
                      <p className="font-mono text-[10px] text-gray-500 mb-1.5">
                        SKU: {product.sku}
                      </p>
                    )}
                    <p className="font-mono text-[11px] text-gray-400 line-clamp-2">
                      {product.description || "No description provided."}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-3 flex items-center justify-between border-t border-white/5 mt-2">
                  <span className="font-mono text-[10px] text-gray-500 uppercase truncate max-w-35">
                    ID: {product.id}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(product)}
                      className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                      title="Edit Product"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer border border-rose-500/20"
                      title="Delete Product"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Bar */}
      <div className="px-5 py-4 rounded-2xl bg-[#0c0c0e] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
        <p className="text-gray-400">
          Showing <span className="text-white font-bold">{startItem}</span>–
          <span className="text-white font-bold">{endItem}</span> of{" "}
          <span className="text-white font-bold">{totalItems}</span>{" "}
          {totalItems === 1 ? "item" : "items"}
        </p>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={safePage <= 1 || isLoading}
            aria-label="First page"
            className="p-2 rounded-xl bg-[#121215] border border-white/10 text-gray-400 hover:text-white disabled:opacity-35 disabled:pointer-events-none transition cursor-pointer"
          >
            <ChevronsLeft size={14} />
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1 || isLoading}
            aria-label="Previous page"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#121215] border border-white/10 text-gray-300 hover:text-white disabled:opacity-35 disabled:pointer-events-none transition cursor-pointer"
          >
            <ChevronLeft size={14} />
            <span className="hidden sm:inline">Prev</span>
          </button>

          <div className="flex items-center gap-1 mx-1">
            {pageNumbers.map((page, idx) =>
              page === "..." ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-gray-600"
                >
                  …
                </span>
              ) : (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  disabled={isLoading}
                  aria-current={safePage === page ? "page" : undefined}
                  className={`min-w-8.5 h-8.5 px-2 rounded-xl font-bold transition cursor-pointer ${
                    safePage === page
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                      : "bg-[#121215] border border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  {page}
                </button>
              ),
            )}
          </div>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages || isLoading}
            aria-label="Next page"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#121215] border border-white/10 text-gray-300 hover:text-white disabled:opacity-35 disabled:pointer-events-none transition cursor-pointer"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={14} />
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={safePage >= totalPages || isLoading}
            aria-label="Last page"
            className="p-2 rounded-xl bg-[#121215] border border-white/10 text-gray-400 hover:text-white disabled:opacity-35 disabled:pointer-events-none transition cursor-pointer"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>

      {/* --- REUSABLE PRODUCT FORM MODAL --- */}
      {isFormOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => {
            setIsFormOpen(false);
            setEditingProduct(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <ProductForm
              key={isEditing?.id ?? "new"}
              productId={isEditing?.id || null}
              vendorId={resolvedFormVendorId}
              vendorName={resolvedFormVendorName}
              onClose={handleCloseForm}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
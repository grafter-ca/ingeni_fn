import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Package,
  Plus,
  Search,
  Trash2,
  Edit3,
  Upload,
  X,
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
    addProduct,
    updateProduct,
    removeProduct,
    isLoading,
  } = useProductStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthState();

  // Multi-file upload states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const vendorId = user?.id || "";

  const clearObjectPreviews = useCallback((urls: string[]) => {
    urls.forEach((url) => {
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      clearObjectPreviews(imagePreviews);
    };
  }, [clearObjectPreviews, imagePreviews]);

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

  // Form State
  const [form, setForm] = useState({
    title: "",
    price: "",
    stock: "",
    categoryId: "",
    description: "",
    location: "Kigali",
  });

  // Sync default category ID once categories are successfully fetched from backend
  useEffect(() => {
    if (categories.length > 0) {
      const categoryExists = categories.some(
        (cat: any) => String(cat.id) === String(form.categoryId),
      );
      if (!form.categoryId || !categoryExists) {
        setForm((prev) => ({
          ...prev,
          categoryId: String(categories[0].id).replace(/^(local-|fake-)/, ""),
        }));
      }
    }
  }, [categories, form.categoryId]);

  // Reset pagination to page 1 when search or category filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategoryFilter, pageSize]);

  // Handle multiple files selection from device
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFilesArray = Array.from(files);
      setSelectedFiles((prev) => [...prev, ...newFilesArray]);

      const newPreviews = newFilesArray.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveNewFile = (index: number) => {
    const targetUrl = imagePreviews[index];
    if (targetUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(targetUrl);
    }
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOpenCreateModal = () => {
    clearObjectPreviews(imagePreviews);
    setIsEditMode(false);
    setSelectedProductId(null);
    setSelectedFiles([]);
    setImagePreviews([]);
    setExistingImages([]);

    const rawCatId = categories.length > 0 ? String(categories[0].id) : "";
    const cleanDefaultCatId = rawCatId.replace(/^(local-|fake-)/, "");

    setForm({
      title: "",
      price: "",
      stock: "",
      categoryId: cleanDefaultCatId,
      description: "",
      location: "Kigali",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: any) => {
    clearObjectPreviews(imagePreviews);
    setIsEditMode(true);
    setSelectedProductId(product.id);
    setSelectedFiles([]);
    setImagePreviews([]);

    const productImages = Array.isArray(product.images)
      ? product.images
          .map((img: any) => (typeof img === "string" ? img : img?.url))
          .filter(Boolean)
      : [];

    setExistingImages(productImages);

    const rawProdCatId = String(
      product.categoryId || product.category?.id || "",
    );
    const cleanProdCatId = rawProdCatId.replace(/^(local-|fake-)/, "");

    const matchingCategory = categories.find(
      (cat: any) =>
        String(cat.id).replace(/^(local-|fake-)/, "") === cleanProdCatId,
    );

    const resolvedCategoryId = matchingCategory
      ? String(matchingCategory.id).replace(/^(local-|fake-)/, "")
      : categories[0]?.id
        ? String(categories[0].id).replace(/^(local-|fake-)/, "")
        : "";

    setForm({
      title: product.title || "",
      price: product.price?.toString() || "",
      stock: product.stock?.toString() || "",
      categoryId: resolvedCategoryId,
      description: product.description || "",
      location: product.location || "Kigali",
    });
    setIsModalOpen(true);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.price) {
      toast.error("Please provide a product title and price.");
      return;
    }

    if (!form.categoryId) {
      toast.error("Please select a valid category.");
      return;
    }

    if (!vendorId) {
      toast.error("Vendor session not found. Please log in again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanCategoryId = String(form.categoryId).replace(
        /^(local-|fake-)/,
        "",
      );

      const formDataPayload = new FormData();
      formDataPayload.append("title", form.title);
      formDataPayload.append("price", String(form.price));
      formDataPayload.append("stock", String(form.stock || "10"));
      formDataPayload.append("categoryId", cleanCategoryId);
      formDataPayload.append("description", form.description);
      formDataPayload.append("location", form.location || "Kigali");
      formDataPayload.append("vendorId", vendorId);

      selectedFiles.forEach((file) => {
        formDataPayload.append("images", file);
      });

      if (isEditMode && existingImages.length > 0) {
        existingImages.forEach((imgUrl) => {
          formDataPayload.append("images_to_keep", imgUrl);
        });
      }

      if (isEditMode && selectedProductId) {
        const cleanId = String(selectedProductId).replace(
          /^(local-|fake-)/,
          "",
        );
        await updateProduct(cleanId, formDataPayload);
        toast.success("Product successfully updated.");
      } else {
        await addProduct(vendorId, formDataPayload);
        toast.success(
          "Product successfully created and assigned to your catalog.",
        );
      }

      clearObjectPreviews(imagePreviews);
      setImagePreviews([]);
      setSelectedFiles([]);
      setIsModalOpen(false);
      if (vendorId) {
        void fetchVendorProducts(vendorId);
        void fetchVendorDashboardData();
      }
    } catch (error: any) {
      toast.error(
        error?.message || "Operation failed. Please verify your inputs.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
        if (vendorId) {
          void fetchVendorProducts(vendorId);
          void fetchVendorDashboardData();
        }
      } catch (error) {
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
      const idMatch = String(product.id || "")
        .toLowerCase()
        .includes(q);
      return titleMatch || locationMatch || idMatch;
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
            placeholder="Search inventory items by title, location, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/ border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-blue-500/50 transition placeholder:text-gray-500"
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
          paginatedProducts.map((product) => {
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
                        Stock: {stockVal}
                      </span>
                    </div>
                    {product.location && (
                      <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-mono text-blue-300 border border-white/10 flex items-center gap-1">
                        <MapPin size={10} /> {product.location}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-poppins font-bold text-base text-white mb-1 line-clamp-1">
                      {product.title}
                    </h3>
                    <p className="font-mono text-xs text-blue-400 font-bold mb-2">
                      RWF {Number(product.price || 0).toLocaleString()}
                    </p>
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

      {/* --- ADD / EDIT PRODUCT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-[#0c0c0e] border border-white/10 p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <h2 className="font-poppins font-bold text-lg text-white">
                {isEditMode ? "Edit Inventory Item" : "Add New Inventory Item"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmitProduct}
              className="space-y-4 font-mono text-xs"
            >
              <div>
                <label className="block text-gray-400 uppercase text-[10px] mb-1">
                  Product Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Product"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-3 rounded-xl bg-white/ border border-white/10 text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 uppercase text-[10px] mb-1">
                    Price (RWF)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="15000"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full p-3 rounded-xl bg-white/ border border-white/10 text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 uppercase text-[10px] mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="100"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full p-3 rounded-xl bg-white/ border border-white/10 text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 uppercase text-[10px] mb-1">
                    Category
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        categoryId: e.target.value.replace(
                          /^(local-|fake-)/,
                          "",
                        ),
                      })
                    }
                    required
                    className="w-full p-3 rounded-xl bg-[#121215] border border-white/10 text-white focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value="" disabled>
                      Select a valid category
                    </option>
                    {categories.map((cat: any) => {
                      const cleanCatId = String(cat.id).replace(
                        /^(local-|fake-)/,
                        "",
                      );
                      return (
                        <option key={cat.id} value={cleanCatId}>
                          {cat.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 uppercase text-[10px] mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kigali Market"
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    className="w-full p-3 rounded-xl bg-white/ border border-white/10 text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Multi-Image Upload Section */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-gray-400 uppercase text-[10px]">
                    Product Images (Multiple allowed)
                  </label>
                  <span className="text-[10px] text-blue-400">
                    {existingImages.length + imagePreviews.length} total
                  </span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />

                {(existingImages.length > 0 || imagePreviews.length > 0) && (
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {existingImages.map((url, idx) => (
                      <div
                        key={`existing-${idx}`}
                        className="relative h-20 rounded-xl overflow-hidden border border-white/10 bg-black/40 group"
                      >
                        <img
                          src={url}
                          alt={`Existing ${idx}`}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 px-1 rounded bg-black/60 text-[8px] text-gray-300">
                          Saved
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(idx)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white opacity-90 hover:opacity-100 transition cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}

                    {imagePreviews.map((previewUrl, idx) => (
                      <div
                        key={`new-${idx}`}
                        className="relative h-20 rounded-xl overflow-hidden border border-blue-500/40 bg-black/40 group"
                      >
                        <img
                          src={previewUrl}
                          alt={`New ${idx}`}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 px-1 rounded bg-blue-600/80 text-[8px] text-white">
                          New
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveNewFile(idx)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white opacity-90 hover:opacity-100 transition cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-white/20 hover:border-blue-500/50 rounded-2xl p-4 bg-white/ transition cursor-pointer flex flex-col items-center justify-center gap-2 text-center"
                >
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Upload size={18} />
                  </div>
                  <div>
                    <p className="text-white font-medium text-xs">
                      Click to browse &amp; select images
                    </p>
                    <p className="text-gray-500 text-[10px] mt-0.5">
                      You can select multiple PNG, JPG, or WEBP files
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 uppercase text-[10px] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide details about the product quality, origin, or specifications..."
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full p-3 rounded-xl bg-white/ border border-white/10 text-white focus:outline-none focus:border-blue-500 transition resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition shadow-lg shadow-blue-600/25 cursor-pointer flex items-center gap-2 min-w-32.5 justify-center"
                >
                  {isSubmitting && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  {isSubmitting
                    ? "Saving..."
                    : isEditMode
                      ? "Update Product"
                      : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
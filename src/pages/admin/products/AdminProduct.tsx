import { useCallback, useEffect, useMemo, useState } from "react";
import { useProductStore } from "../../../store/productStore";
import { useCategoryStore } from "../../../store/categoryStore";
import { useAuthState } from "../../../context/AuthContext";
import ProductManagement from "../../../components/admin/products/ProductManagement";
import {
  Loader2,
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  RotateCcw,
  RefreshCw,
} from "lucide-react";

type SortOption = "default" | "name-asc" | "price-asc" | "price-desc";

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

export default function AdminProducts() {
  const productStore = useProductStore() as any;
  const {
    fetchProducts,
    isLoading,
    loading,
    selectedVendorId,
    products = [],
    totalCount,
  } = productStore;

  const { fetchCategories, categories = [] } = useCategoryStore() as any;
  const { user } = useAuthState();

  const isSyncing = Boolean(isLoading ?? loading);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const syncCatalog = useCallback(
    (targetPage: number, targetSize: number) => {
      const offset = (targetPage - 1) * targetSize;
      void fetchProducts({
        vendorId: selectedVendorId,
        page: targetPage,
        limit: targetSize,
        offset,
        search: searchTerm.trim() || undefined,
        categoryId: selectedCategory !== "ALL" ? selectedCategory : undefined,
        sort: sortBy !== "default" ? sortBy : undefined,
      });
    },
    [
      fetchProducts,
      selectedVendorId,
      searchTerm,
      selectedCategory,
      sortBy,
    ],
  );

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    syncCatalog(currentPage, pageSize);
  }, [syncCatalog, currentPage, pageSize]);

  const productList: any[] = Array.isArray(products) ? products : [];
  const categoryList: any[] = Array.isArray(categories) ? categories : [];

  const filteredAndSortedProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    const filtered = productList.filter((item) => {
      if (selectedCategory !== "ALL") {
        const catId = item?.categoryId ?? item?.category?.id ?? item?.category;
        if (String(catId) !== selectedCategory) {
          return false;
        }
      }

      if (!q) return true;
      const title = String(item?.name ?? item?.title ?? "").toLowerCase();
      const sku = String(item?.sku ?? item?.id ?? "").toLowerCase();
      const catName = String(item?.category?.name ?? "").toLowerCase();
      return title.includes(q) || sku.includes(q) || catName.includes(q);
    });

    if (sortBy === "name-asc") {
      return [...filtered].sort((a, b) =>
        String(a?.name ?? a?.title ?? "").localeCompare(
          String(b?.name ?? b?.title ?? ""),
        ),
      );
    }
    if (sortBy === "price-asc") {
      return [...filtered].sort(
        (a, b) => Number(a?.price ?? 0) - Number(b?.price ?? 0),
      );
    }
    if (sortBy === "price-desc") {
      return [...filtered].sort(
        (a, b) => Number(b?.price ?? 0) - Number(a?.price ?? 0),
      );
    }
    return filtered;
  }, [productList, searchTerm, selectedCategory, sortBy]);

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    selectedCategory !== "ALL" ||
    sortBy !== "default";

  const totalItems = hasActiveFilters
    ? filteredAndSortedProducts.length
    : typeof totalCount === "number" && totalCount > productList.length
      ? totalCount
      : filteredAndSortedProducts.length;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  const pageNumbers = useMemo(
    () => getPaginationRange(safePage, totalPages),
    [safePage, totalPages],
  );

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("ALL");
    setSortBy("default");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white py-8 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500/20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* --- PAGE HEADER --- */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 mb-1.5">
              <Package size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.22em]">
                Catalog &amp; Stock Operations
              </span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">
              Inventory Catalog
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {user?.name ? (
                <>
                  Managing assets for{" "}
                  <span className="text-emerald-400 font-medium">
                    {user.name}
                  </span>
                  {selectedVendorId ? ` • Scope: ${selectedVendorId}` : ""}
                </>
              ) : (
                "Manage marketplace listings, pricing, and product availability."
              )}
            </p>
          </div>

          {/* Summary Telemetry Strip */}
          <div className="flex items-center gap-4 bg-[#0a0a0a] border border-white/10 rounded-2xl px-4 py-2.5 self-start lg:self-auto">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
                Matching Assets
              </p>
              <p className="text-lg font-mono font-bold text-white">
                {totalItems.toLocaleString()}
              </p>
            </div>
            <div className="h-7 w-px bg-white/10" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
                Page
              </p>
              <p className="text-lg font-mono font-bold text-emerald-400">
                {safePage}
                <span className="text-xs text-gray-500 font-normal">
                  /{totalPages}
                </span>
              </p>
            </div>
            <div className="h-7 w-px bg-white/10" />
            <button
              type="button"
              onClick={() => syncCatalog(safePage, pageSize)}
              disabled={isSyncing}
              title="Refresh catalog"
              aria-label="Refresh catalog"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white disabled:opacity-40 transition cursor-pointer"
            >
              <RefreshCw
                size={14}
                className={isSyncing ? "animate-spin text-emerald-400" : ""}
              />
            </button>
          </div>
        </header>

        {/* --- SEARCH, FILTER & SORT TOOLBAR --- */}
        <section className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search products by name, SKU, or category..."
              className="w-full bg-[#050505] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 outline-none focus:border-emerald-500/40 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by category"
              className="bg-[#050505] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-gray-200 outline-none focus:border-emerald-500/40 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categoryList.map((cat: any) => (
                <option key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </option>
              ))}
            </select>

            <label className="inline-flex items-center gap-1.5 bg-[#050505] border border-white/10 rounded-xl px-3 py-2.5 text-xs font-mono text-gray-400">
              <ArrowUpDown size={13} className="text-emerald-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as SortOption);
                  setCurrentPage(1);
                }}
                aria-label="Sort products"
                className="bg-transparent text-gray-200 outline-none cursor-pointer"
              >
                <option value="default" className="bg-[#0a0a0a]">
                  Sort: Default
                </option>
                <option value="name-asc" className="bg-[#0a0a0a]">
                  Name: A → Z
                </option>
                <option value="price-asc" className="bg-[#0a0a0a]">
                  Price: Low → High
                </option>
                <option value="price-desc" className="bg-[#0a0a0a]">
                  Price: High → Low
                </option>
              </select>
            </label>

            <label className="inline-flex items-center gap-2 bg-[#050505] border border-white/10 rounded-xl px-3 py-2.5 text-xs font-mono text-gray-400">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                aria-label="Items per page"
                className="bg-transparent text-white font-bold outline-none cursor-pointer"
              >
                <option value={6} className="bg-[#0a0a0a]">
                  6
                </option>
                <option value={12} className="bg-[#0a0a0a]">
                  12
                </option>
                <option value={24} className="bg-[#0a0a0a]">
                  24
                </option>
                <option value={48} className="bg-[#0a0a0a]">
                  48
                </option>
              </select>
            </label>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 hover:text-white transition cursor-pointer"
              >
                <RotateCcw size={13} />
                Reset
              </button>
            )}
          </div>
        </section>

        {/* --- ORCHESTRATED MANAGEMENT LAYER --- */}
        <section className="bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
          {isSyncing && productList.length === 0 ? (
            <div className="p-20 flex flex-col items-center justify-center text-gray-500 gap-3">
              <Loader2 className="animate-spin text-emerald-500" size={36} />
              <p className="text-xs font-mono uppercase tracking-widest">
                Syncing inventory catalog...
              </p>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              <ProductManagement />
            </div>
          )}

          {/* --- PAGINATION BAR --- */}
          <div className="px-6 py-4 bg-[#070707] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-mono text-gray-400">
              Showing <span className="text-white font-bold">{startItem}</span>–
              <span className="text-white font-bold">{endItem}</span> of{" "}
              <span className="text-white font-bold">{totalItems}</span>{" "}
              {totalItems === 1 ? "product" : "products"}
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safePage <= 1 || isSyncing}
                aria-label="First page"
                className="p-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-gray-400 hover:text-white hover:border-white/20 disabled:opacity-35 disabled:pointer-events-none transition cursor-pointer"
              >
                <ChevronsLeft size={15} />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                disabled={safePage <= 1 || isSyncing}
                aria-label="Previous page"
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs font-medium text-gray-300 hover:text-white hover:border-white/20 disabled:opacity-35 disabled:pointer-events-none transition cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span className="hidden sm:inline">Prev</span>
              </button>

              <div className="flex items-center gap-1 mx-1">
                {pageNumbers.map((page, idx) =>
                  page === "..." ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 py-1.5 text-xs font-mono text-gray-600"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      disabled={isSyncing}
                      aria-current={safePage === page ? "page" : undefined}
                      className={`min-w-8.5 h-8.5 px-2.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                        safePage === page
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                          : "bg-[#0a0a0a] border border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, safePage + 1))
                }
                disabled={safePage >= totalPages || isSyncing}
                aria-label="Next page"
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs font-medium text-gray-300 hover:text-white hover:border-white/20 disabled:opacity-35 disabled:pointer-events-none transition cursor-pointer"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={14} />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage >= totalPages || isSyncing}
                aria-label="Last page"
                className="p-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-gray-400 hover:text-white hover:border-white/20 disabled:opacity-35 disabled:pointer-events-none transition cursor-pointer"
              >
                <ChevronsRight size={15} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
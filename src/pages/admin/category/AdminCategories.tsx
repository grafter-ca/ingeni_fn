import { useEffect, useMemo, useState } from "react";
import { useCategoryStore } from "../../../store/categoryStore";
import {
  Edit3,
  Plus,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FolderTree,
  ArrowUpDown,
} from "lucide-react";
import toast from "react-hot-toast";
import CategoryTable from "../../../features/admin/category/CategoryTable";
import { CategoryForm } from "../../../features/admin/category/CreateCategory";

type SortMode = "default" | "asc" | "desc";

function getPaginationRange(current: number, total: number): (number | "...")[] {
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

export default function AdminCategories() {
  const {
    categories,
    loading,
    isEditing,
    formData,
    fetchCategories,
    saveCategory,
    deleteCategory,
    setIsEditing,
    setFormData,
  } = useCategoryStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const filteredAndSortedCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = Array.isArray(categories) ? categories : [];

    const filtered = q
      ? list.filter((cat: any) => {
          const name = String(cat?.name || "").toLowerCase();
          const slug = String(cat?.slug || "").toLowerCase();
          return name.includes(q) || slug.includes(q);
        })
      : list;

    if (sortMode === "asc") {
      return [...filtered].sort((a: any, b: any) =>
        String(a?.name || "").localeCompare(String(b?.name || "")),
      );
    }
    if (sortMode === "desc") {
      return [...filtered].sort((a: any, b: any) =>
        String(b?.name || "").localeCompare(String(a?.name || "")),
      );
    }
    return filtered;
  }, [categories, searchQuery, sortMode]);

  const totalFiltered = filteredAndSortedCategories.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  useEffect(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
    }
  }, [currentPage, safePage]);

  const paginatedCategories = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return filteredAndSortedCategories.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedCategories, safePage, pageSize]);

  const startItem = totalFiltered === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalFiltered);

  const pageNumbers = useMemo(
    () => getPaginationRange(safePage, totalPages),
    [safePage, totalPages],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveCategory();
      toast.success(
        isEditing ? "Category updated successfully." : "Category created successfully.",
      );
    } catch (error) {
      toast.error("Error saving category.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteCategory(id);
        toast.success("Category removed.");
      } catch (error) {
        toast.error("Delete failed.");
      }
    }
  };

  const cycleSortMode = () => {
    setCurrentPage(1);
    setSortMode((prev) =>
      prev === "default" ? "asc" : prev === "asc" ? "desc" : "default",
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 mb-1.5">
              <FolderTree size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.22em]">
                Catalog Taxonomy
              </span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">
              Categories
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Create, organize, and paginate marketplace product categories.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#0a0a0a] border border-white/10 rounded-2xl px-4 py-2.5">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
                Total Categories
              </p>
              <p className="text-lg font-mono font-bold text-white">
                {Array.isArray(categories) ? categories.length : 0}
              </p>
            </div>
            <div className="h-7 w-px bg-white/10" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
                Mode
              </p>
              <span
                className={`inline-block text-xs font-mono font-bold uppercase ${
                  isEditing ? "text-blue-400" : "text-emerald-400"
                }`}
              >
                {isEditing ? "Editing" : "Create"}
              </span>
            </div>
          </div>
        </header>

        {/* FORM CONTAINER */}
        <section className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold flex items-center gap-3 text-white">
              {isEditing ? (
                <div className="p-2.5 rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/20">
                  <Edit3 size={18} />
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-600/15 text-emerald-400 border border-emerald-500/20">
                  <Plus size={18} />
                </div>
              )}
              <span>{isEditing ? "Edit Existing Category" : "Create New Category"}</span>
            </h2>

            {isEditing && (
              <span className="text-[11px] font-mono text-blue-300 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                Editing Mode Active
              </span>
            )}
          </div>

          <CategoryForm
            formData={formData}
            setFormData={setFormData}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            handleSubmit={handleSubmit}
          />
        </section>

        {/* SEARCH, SORT & PAGE SIZE TOOLBAR */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0a0a0a] border border-white/10 rounded-2xl p-3.5">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search categories by name or slug..."
              className="w-full bg-[#050505] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500/40 transition"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={cycleSortMode}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#050505] border border-white/10 hover:border-white/20 text-xs font-mono text-gray-300 hover:text-white transition cursor-pointer"
              title="Cycle sort order"
            >
              <ArrowUpDown size={14} className="text-blue-400" />
              <span>
                Sort:{" "}
                {sortMode === "default"
                  ? "Default"
                  : sortMode === "asc"
                  ? "A–Z"
                  : "Z–A"}
              </span>
            </button>

            <label className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#050505] border border-white/10 text-xs font-mono text-gray-400">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent text-white font-bold outline-none cursor-pointer"
              >
                <option value={5} className="bg-[#0a0a0a]">
                  5
                </option>
                <option value={8} className="bg-[#0a0a0a]">
                  8
                </option>
                <option value={15} className="bg-[#0a0a0a]">
                  15
                </option>
                <option value={25} className="bg-[#0a0a0a]">
                  25
                </option>
              </select>
            </label>
          </div>
        </section>

        {/* TABLE & PAGINATION CONTAINER */}
        <section className="bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="animate-spin mb-3 text-blue-500" size={38} />
              <p className="text-xs font-mono uppercase tracking-widest">
                Syncing with server...
              </p>
            </div>
          ) : paginatedCategories.length === 0 ? (
            <div className="p-16 text-center space-y-2">
              <p className="text-sm font-semibold text-gray-300">
                No matching categories found
              </p>
              <p className="text-xs text-gray-500">
                {searchQuery
                  ? `Try clearing "${searchQuery}" or creating a new category above.`
                  : "Create your first category using the form above."}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="mt-3 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition cursor-pointer"
                >
                  Reset Search
                </button>
              )}
            </div>
          ) : (
            <CategoryTable
              categories={paginatedCategories}
              handleDelete={handleDelete}
              setIsEditing={setIsEditing}
              setFormData={setFormData}
            />
          )}

          {/* PAGINATION BAR */}
          <div className="px-6 py-4 bg-[#070707] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-mono text-gray-400">
              Showing{" "}
              <span className="text-white font-bold">{startItem}</span>–
              <span className="text-white font-bold">{endItem}</span> of{" "}
              <span className="text-white font-bold">{totalFiltered}</span>{" "}
              {totalFiltered === 1 ? "category" : "categories"}
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safePage <= 1 || loading}
                aria-label="First page"
                className="p-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-gray-400 hover:text-white hover:border-white/20 disabled:opacity-35 disabled:pointer-events-none transition cursor-pointer"
              >
                <ChevronsLeft size={15} />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1 || loading}
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
                      disabled={loading}
                      aria-current={safePage === page ? "page" : undefined}
                      className={`min-w-8.5 h-8.5 px-2.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                        safePage === page
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
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
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={safePage >= totalPages || loading}
                aria-label="Next page"
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs font-medium text-gray-300 hover:text-white hover:border-white/20 disabled:opacity-35 disabled:pointer-events-none transition cursor-pointer"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={14} />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage >= totalPages || loading}
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
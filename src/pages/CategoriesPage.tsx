// src/pages/CategoriesPage.tsx
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Layers, Search, ArrowLeft, Grid } from "lucide-react";
import { useProductStore } from "../store/productStore";
import CategorySkeleton from "../components/common/CategorySkeleton";
import CategoryCard from "../features/admin/category/CategoryCard";
import Pagination from "../components/common/ClientPagination";

const ITEMS_PER_PAGE = 8;

const CategoriesPage = () => {
  const { categories, fetchCategories, isLoading } = useProductStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Filter categories based on search input
  const filteredCategories = useMemo(() => {
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cat.description &&
          cat.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [categories, searchQuery]);

  // Reset to page 1 whenever the search filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Calculate paginated slice
  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCategories.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCategories, currentPage]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-zinc-900 dark:text-white transition-colors pb-20">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-blue-600/[0.03] dark:bg-emerald-600/[0.03] rounded-full blur-[160px] pointer-events-none" />

      {/* Header Banner */}
      <div className="border-b border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-[#080808]/50 backdrop-blur-md pt-8 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-zinc-800 dark:text-gray-400 dark:hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 mb-3 shadow-inner">
                <Layers size={14} className="text-blue-600 dark:text-emerald-400" />
                <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 dark:text-gray-300">
                  Marketplace Directory
                </p>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-poppins">
                All Categories
              </h1>
              <p className="text-sm text-zinc-500 dark:text-gray-400 mt-2 max-w-xl">
                Browse all available product categories, local produce collections, and specialized neighborhood goods on Ingeni.
              </p>
            </div>

            {/* Search Input Filter */}
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-emerald-500 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-6 pt-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-gray-400">
            <Grid size={14} />
            <span>
              Showing {filteredCategories.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredCategories.length)} of {filteredCategories.length} categories
            </span>
          </div>
        </div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {isLoading ? (
            Array.from({ length: 8 }).map((_, idx) => (
              <CategorySkeleton key={idx} />
            ))
          ) : filteredCategories.length === 0 ? (
            <div className="col-span-full text-center py-20 border border-dashed border-zinc-300 dark:border-white/10 rounded-2xl bg-zinc-50 dark:bg-[#0a0a0a]">
              <p className="text-zinc-500 dark:text-gray-400 font-mono text-xs mb-2">
                No matching categories found
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-blue-600 dark:text-emerald-400 underline font-medium"
              >
                Clear search filter
              </button>
            </div>
          ) : (
            paginatedCategories.map((cat) => (
              <CategoryCard
                key={cat.id}
                id={cat.id}
                name={cat.name}
                description={cat.description}
                imageUrl={cat.image || cat.imageUrl}
                itemCount={cat.productsCount}
                onClick={() => navigate(`/products?categoryId=${cat.id}`)}
              />
            ))
          )}
        </motion.div>

        {/* Reusable Pagination Component */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>
    </div>
  );
};

export default CategoriesPage;
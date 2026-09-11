// src/components/vendor/CategoryShowcase.tsx
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Layers, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useProductStore } from "../../store/productStore";
import CategorySkeleton from "../../components/common/CategorySkeleton";
import CategoryCard from "../../features/admin/category/CategoryCard";

const CategoryShowcase = () => {
  const { categories, fetchCategories, isLoading } = useProductStore();
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Autoplay effect: scroll by one card width every 2 seconds
  useEffect(() => {
    if (isPaused || isLoading || categories.length === 0) return;

    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        // Find the first card item width + gap to scroll by exactly one card
        const firstCard = container.querySelector("div[data-card-item]") as HTMLElement;
        const cardWidth = firstCard ? firstCard.offsetWidth + 20 : 300; // 20px is approx gap-5

        const maxScrollLeft = container.scrollWidth - container.clientWidth;

        if (container.scrollLeft >= maxScrollLeft - 10) {
          // Loop back to the start smoothly
          container.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          container.scrollTo({ left: container.scrollLeft + cardWidth, behavior: "smooth" });
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isPaused, isLoading, categories.length]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const firstCard = container.querySelector("div[data-card-item]") as HTMLElement;
      const cardWidth = firstCard ? firstCard.offsetWidth + 20 : 300;

      container.scrollTo({
        left: direction === "left" ? container.scrollLeft - cardWidth : container.scrollLeft + cardWidth,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="px-6 py-8 border-b border-zinc-200 dark:border-white/5 bg-white dark:bg-[#050505] relative overflow-hidden transition-colors">
      {/* Background Glow matching your blue/green/gray theme */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/[0.03] dark:bg-emerald-600/[0.03] rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          className="flex flex-col md:flex-row md:items-end mb-6 justify-between gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 mb-3 backdrop-blur-md shadow-inner">
              <Layers size={14} className="text-blue-600 dark:text-emerald-400" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 dark:text-gray-300">
                Explore Marketplace
              </p>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white font-poppins">
              Shop by Category
            </h2>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-4">
            <p className="font-poppins text-xs md:text-sm text-zinc-500 dark:text-gray-400 max-w-xs leading-relaxed hidden sm:block">
              Discover locally sourced commodities, daily goods, and vendor supplies.
            </p>

            {/* Scroll Controls & View All */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => scroll("left")}
                className="p-2 rounded-full border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02] hover:bg-zinc-100 dark:hover:bg-white/[0.08] text-zinc-700 dark:text-gray-300 transition-colors shadow-sm cursor-pointer"
                aria-label="Scroll left"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => scroll("right")}
                className="p-2 rounded-full border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02] hover:bg-zinc-100 dark:hover:bg-white/[0.08] text-zinc-700 dark:text-gray-300 transition-colors shadow-sm cursor-pointer"
                aria-label="Scroll right"
              >
                <ChevronRight size={18} />
              </button>
              <button
                onClick={() => navigate("/categories")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white transition-colors shadow-sm ml-2 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Horizontal Scrollable Categories Container */}
        <div
          ref={scrollContainerRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="flex gap-5 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {isLoading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} data-card-item className="min-w-[260px] sm:min-w-[280px] snap-start flex-shrink-0">
                <CategorySkeleton />
              </div>
            ))
          ) : categories.length === 0 ? (
            <div className="flex gap-5 w-full overflow-x-auto no-scrollbar" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              <div data-card-item className="min-w-[280px] sm:min-w-[320px] p-6 rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#0a0a0a] flex flex-col justify-between shrink-0 shadow-sm">
                <div>
                  <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-3">
                    Notice
                  </span>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
                    No marketplace categories available yet!
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-gray-400">
                    Check back soon as our vendors add new product categories to explore.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                data-card-item
                className="min-w-[260px] sm:min-w-[280px] max-w-[300px] snap-start flex-shrink-0"
              >
                <CategoryCard
                  id={cat.id}
                  name={cat.name}
                  description={cat.description}
                  imageUrl={cat.image || cat.imageUrl}
                  itemCount={cat.productsCount}
                  onClick={() => navigate(`/products?categoryId=${cat.id}`)}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default CategoryShowcase;
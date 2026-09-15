import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, PackageX } from "lucide-react";
import { useProductStore } from "../../store/productStore";
import ProductCard from "../../components/common/ProductCard";
import ProductCardSkeleton from "../../components/common/ProductCardSkeleton";

const FeaturedProducts = () => {
  const { products, isLoading, fetchPublicProducts } = useProductStore();
  const navigate = useNavigate();

  useEffect(() => { 
    fetchPublicProducts({ limit: 10 }); 
  }, [fetchPublicProducts]);

  const featured = useMemo(() => products.slice(0, 10), [products]);

  if (products.length === 0 && !isLoading) {
    return (
      <section className="px-6 py-28 border-b border-zinc-200 dark:border-white/5 bg-white dark:bg-[#050505] transition-colors">
        <div className="max-w-7xl mx-auto text-center flex flex-col items-center">
          <div className="bg-zinc-100 dark:bg-white/2 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-200 dark:border-white/5 shadow-inner">
            <PackageX className="text-blue-600 dark:text-blue-400" size={24} />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500 dark:text-gray-500">
            No featured units available in the matrix at the moment.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 md:px-8 py-6 border-b border-zinc-200 dark:border-white/5 bg-white dark:bg-[#050505] relative overflow-hidden transition-colors">
      
      {/* Subtle Background Glow */}
      <div className="absolute top-1/3 right-10 w-[500px] h-[300px] bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <motion.div
          className="flex items-end justify-between mb-6 flex-wrap gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 mb-3 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600 dark:text-gray-400 font-bold">
                Curated Array
              </p>
            </div>
            <h2 className="font-mono font-black text-2xl md:text-4xl text-zinc-900 dark:text-white tracking-tight uppercase">
              Featured Matrix
            </h2>
          </div>

          <button
            onClick={() => navigate("/products")}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-medium bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white transition-colors shadow-sm ml-2 cursor-pointer"
          >
            <span>Explore All Products</span>
            <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Product Grid / Skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {featured.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                className="flex flex-col h-full"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
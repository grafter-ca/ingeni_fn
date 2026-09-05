// src/components/common/ProductCardSkeleton.tsx
import React from "react";

const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="group bg-white dark:bg-[#0a0a0a] rounded-2xl overflow-hidden flex flex-col h-full border border-zinc-200 dark:border-white/5 max-w-[350px] sm:max-w-none mx-auto w-full animate-pulse select-none">
      {/* ── 1. Image & Overlay Container Placeholder ── */}
      <div className="relative overflow-hidden aspect-[4/3] sm:aspect-square bg-zinc-200 dark:bg-[#121212]">
        {/* Wishlist button placeholder */}
        <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-zinc-300 dark:bg-white/10" />

        {/* Stock badge placeholder */}
        <div className="absolute top-2.5 left-2.5 w-16 h-5 rounded-full bg-zinc-300 dark:bg-white/10" />
      </div>

      {/* ── 2. Card Information Body Placeholder ── */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-2.5">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            {/* Category tag */}
            <div className="w-16 h-3 rounded bg-zinc-200 dark:bg-white/10" />
            {/* Rating */}
            <div className="w-10 h-3 rounded bg-zinc-200 dark:bg-white/10" />
          </div>

          {/* Title lines */}
          <div className="space-y-1.5 pt-1">
            <div className="w-full h-3.5 rounded bg-zinc-200 dark:bg-white/10" />
            <div className="w-3/4 h-3.5 rounded bg-zinc-200 dark:bg-white/10" />
          </div>
        </div>

        <div className="space-y-1.5 pt-1.5 border-t border-zinc-200 dark:border-white/5">
          {/* Store name */}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-zinc-200 dark:bg-white/10 shrink-0" />
            <div className="w-28 h-3 rounded bg-zinc-200 dark:bg-white/10" />
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-zinc-200 dark:bg-white/10 shrink-0" />
            <div className="w-20 h-3 rounded bg-zinc-200 dark:bg-white/10" />
          </div>

          {/* Contact action buttons placeholder */}
          <div className="flex items-center gap-1.5 pt-1">
            <div className="w-16 h-5 rounded-md bg-zinc-200 dark:bg-white/10" />
            <div className="w-14 h-5 rounded-md bg-zinc-200 dark:bg-white/10" />
          </div>
        </div>

        {/* ── 3. Footer: Price & Stock Placeholder ── */}
        <div className="pt-2 flex items-center justify-between border-t border-zinc-200 dark:border-white/5 mt-auto">
          <div className="space-y-1">
            <div className="w-8 h-2.5 rounded bg-zinc-200 dark:bg-white/10" />
            <div className="w-20 h-4 rounded bg-zinc-200 dark:bg-white/10" />
          </div>
          <div className="w-14 h-5 rounded-full bg-zinc-200 dark:bg-white/10" />
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
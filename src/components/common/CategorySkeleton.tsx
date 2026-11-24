// components/category/CategorySkeleton.tsx
export default function CategorySkeleton() {
  return (
    <div className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/5 rounded-2xl p-4 flex flex-col justify-between shadow-sm animate-pulse h-full">
      <div>
        {/* Thumbnail Placeholder matching aspect-[16/10] */}
        <div className="relative mb-3.5 overflow-hidden rounded-xl border border-zinc-200 dark:border-white/10 aspect-16/10 bg-zinc-100 dark:bg-white/4">
          <div className="h-6 w-16 rounded-full bg-zinc-200 dark:bg-white/6 absolute top-2.5 right-2.5" />
        </div>

        {/* Title & Action Placeholder */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="h-4 bg-zinc-200 dark:bg-white/[0.07] rounded-md w-2/3" />
          <div className="h-6 w-6 rounded-lg bg-zinc-200 dark:bg-white/5 shrink-0" />
        </div>

        {/* Slug Placeholder */}
        <div className="h-2.5 bg-zinc-100 dark:bg-white/4 rounded w-1/3 mb-2" />

        {/* Description Placeholder */}
        <div className="space-y-1.5">
          <div className="h-3 bg-zinc-100 dark:bg-white/4 rounded w-full" />
          <div className="h-3 bg-zinc-100 dark:bg-white/4 rounded w-4/5" />
        </div>
      </div>

      {/* Subcategory Pills Placeholder */}
      <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-white/5 flex gap-1.5">
        <div className="h-4 w-16 rounded-md bg-zinc-100 dark:bg-white/5" />
        <div className="h-4 w-20 rounded-md bg-zinc-100 dark:bg-white/5" />
      </div>
    </div>
  );
}
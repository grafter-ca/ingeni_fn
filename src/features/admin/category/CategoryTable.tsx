import { Edit3, Trash2 } from "lucide-react";
import type { Category } from "../../../libs/categoryApi";

interface CategoryFormState {
  name: string;
  slug: string;
  parentId: string | null;
  image: string;
}

interface CategoryTableProps {
  categories: Category[];
  setIsEditing: (category: Category) => void;
  setFormData: (data: CategoryFormState) => void;
  handleDelete: (id: string) => void;
}

function CategoryTable({
  categories,
  setIsEditing,
  setFormData,
  handleDelete,
}: CategoryTableProps) {
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  const resolveParentLabel = (cat: Category): string | null => {
    if (cat.parent?.name) return cat.parent.name;
    if (cat.parentId) return categoryNameById.get(cat.parentId) || "Parent Category";
    return null;
  };

  return (
    <div className="overflow-x-auto rounded-3xl border border-white/5 bg-[#0a0a0a]">
      <table className="w-full text-left border-collapse min-w-160">
        <thead>
          <tr className="border-b border-white/5 text-gray-500 text-xs uppercase tracking-wider bg-white/2">
            <th className="p-4 pl-6">Preview</th>
            <th className="p-4">Name &amp; Slug</th>
            <th className="p-4">Parent / Subcategories</th>
            <th className="p-4">Products</th>
            <th className="p-4 pr-6 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {categories.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-8 text-center text-gray-500 text-sm">
                No categories found.
              </td>
            </tr>
          ) : (
            categories.map((cat) => {
              const parentLabel = resolveParentLabel(cat);
              const childrenNames = Array.isArray(cat.children)
                ? cat.children.map((child) => child.name).filter(Boolean)
                : [];
              const productCount = cat._count?.products ?? 0;

              return (
                <tr
                  key={cat.id}
                  className="hover:bg-white/2 transition-colors group"
                >
                  <td className="p-4 pl-6">
                    <img
                      src={cat.image}
                      className="w-12 h-12 object-cover rounded-xl border border-white/10"
                      alt={cat.name}
                    />
                  </td>

                  <td className="p-4">
                    <div className="font-semibold text-white">{cat.name}</div>
                    {cat.slug && (
                      <div className="text-xs font-mono text-gray-500">
                        /{cat.slug}
                      </div>
                    )}
                  </td>

                  <td className="p-4 text-xs text-gray-300">
                    {parentLabel ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                        Under: {parentLabel}
                      </span>
                    ) : childrenNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {childrenNames.map((childName) => (
                          <span
                            key={childName}
                            className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 text-gray-300 border border-white/10"
                          >
                            {childName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">Top-Level</span>
                    )}
                  </td>

                  <td className="p-4 font-mono text-xs text-emerald-400">
                    {productCount}
                  </td>

                  <td className="p-4 pr-6 text-right">
                    <div className="inline-flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(cat);
                          setFormData({
                            name: cat.name,
                            slug: cat.slug || "",
                            parentId: cat.parentId ?? cat.parent?.id ?? null,
                            image: cat.image,
                          });
                        }}
                        className="p-2 rounded-xl bg-white/5 text-blue-400 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat.id)}
                        className="p-2 rounded-xl bg-white/5 text-red-400 hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 size={16} />
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
  );
}

export default CategoryTable;
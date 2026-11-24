import { useState, useEffect } from 'react';
import { X, Plus, Edit3, Upload, Image as ImageIcon } from 'lucide-react';
import type { Category } from '../../../libs/categoryApi';

export interface CategoryFormState {
  name: string;
  slug?: string;
  parentId?: string | null;
  image: string | File;
}

interface CategoryFormProps {
  formData: CategoryFormState;
  setFormData: (data: CategoryFormState) => void;
  isEditing: Category | null;
  setIsEditing: (val: Category | null) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void> | void;
  categories?: Category[];
}

export const CategoryForm = ({
  formData,
  setFormData,
  isEditing,
  setIsEditing,
  handleSubmit,
  categories = [],
}: CategoryFormProps) => {
  const [preview, setPreview] = useState<string | null>(
    typeof formData.image === 'string' && formData.image ? formData.image : null,
  );

  useEffect(() => {
    if (typeof formData.image === 'string') {
      setPreview(formData.image || null);
    } else if (formData.image instanceof File) {
      const objectUrl = URL.createObjectURL(formData.image);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(null);
    }
  }, [formData.image]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
    }
  };

  // Prevent selecting self as its own parent when editing
  const parentOptions = categories.filter(
    (cat) => !isEditing || cat.id !== isEditing.id,
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 space-y-6"
    >
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="text-lg font-bold text-white">
          {isEditing ? 'Edit Category' : 'Add New Category'}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Name Input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wider text-gray-400">
            Category Name
          </label>
          <input
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-all text-sm"
            placeholder="e.g., Men's Shoes or Shoes"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        {/* Parent Category Selector (Optional Subcategory) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wider text-gray-400">
            Parent Category (Optional)
          </label>
          <select
            value={formData.parentId ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                parentId: e.target.value ? e.target.value : null,
              })
            }
            className="w-full px-4 py-3 rounded-xl bg-black border border-white/10 text-white outline-none focus:border-blue-500 transition-all text-sm"
          >
            <option value="">Top-Level Category (None)</option>
            {parentOptions.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Optional Slug Input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wider text-gray-400">
            Slug (Optional — Auto-generated if blank)
          </label>
          <input
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-all text-sm font-mono"
            placeholder="e.g., mens-shoes"
            value={formData.slug ?? ''}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          />
        </div>

        {/* Device Image File Picker */}
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <Upload size={14} /> Upload Image from Device
          </label>

          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-xs text-gray-400 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer bg-white/5 border border-white/10 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Image Preview Window */}
      {(preview || (typeof formData.image === 'string' && formData.image)) && (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
          <ImageIcon size={20} className="text-blue-400 shrink-0" />
          <div className="flex-1 text-xs text-gray-300 min-w-0">
            <span className="font-semibold text-white block mb-1">
              Selected Image Preview:
            </span>
            <span className="truncate block text-gray-500">
              {typeof formData.image === 'object'
                ? formData.image.name
                : formData.image}
            </span>
          </div>
          <img
            src={preview || (typeof formData.image === 'string' ? formData.image : '')}
            alt="Preview"
            className="w-14 h-14 object-cover rounded-xl border border-white/10 shrink-0"
          />
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white transition-all text-sm uppercase tracking-wider ${
            isEditing
              ? 'bg-blue-600 hover:bg-blue-500'
              : 'bg-green-600 hover:bg-green-500'
          }`}
        >
          {isEditing ? <Edit3 size={18} /> : <Plus size={18} />}
          {isEditing ? 'Update Category' : 'Save Category'}
        </button>

        {isEditing && (
          <button
            type="button"
            onClick={() => {
              setIsEditing(null);
              setFormData({ name: '', slug: '', parentId: null, image: '' });
              setPreview(null);
            }}
            className="flex items-center gap-2 bg-white/5 text-gray-400 hover:text-white px-6 py-3 rounded-2xl hover:bg-white/10 transition-all text-sm font-bold uppercase tracking-wider"
          >
            <X size={18} /> Cancel
          </button>
        )}
      </div>
    </form>
  );
};
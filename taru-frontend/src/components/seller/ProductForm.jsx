import { useState, useEffect } from 'react'
import { Upload, X, Plus, Gem, Sparkles } from 'lucide-react'
import { productAPI } from '../../api/productAPI.jsx'
import { PRODUCT_TYPES } from '../../utils/constants.jsx'
import Spinner from '../common/Spinner.jsx'
import toast from 'react-hot-toast'

export const SAMPLE_PRODUCTS = [
  {
    title: 'Handwoven Bamboo Basket',
    categoryName: 'Bamboo Crafts',
    categorySlug: 'bamboo-crafts',
    price: '450',
    type: PRODUCT_TYPES.STANDARD,
    quantity: '25',
    description: 'Eco-friendly handwoven basket crafted from natural bamboo by skilled artisans. Durable, lightweight, and versatile for everyday storage or home decor.',
    tags: 'bamboo, crafts, handmade, basket, eco-friendly',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800',
        altText: 'Handwoven Bamboo Basket',
      },
    ],
  },
  {
    title: 'Organic Cotton Scarf',
    categoryName: 'Handloom',
    categorySlug: 'handloom',
    price: '650',
    type: PRODUCT_TYPES.STANDARD,
    quantity: '15',
    description: 'Finely woven organic cotton scarf made on traditional wooden handlooms with natural plant-based dyes. Soft, breathable, and sustainably crafted.',
    tags: 'handloom, organic, cotton, scarf, textile',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800',
        altText: 'Organic Cotton Scarf',
      },
    ],
  },
  {
    title: 'Clay Pot Set',
    categoryName: 'Pottery',
    categorySlug: 'pottery',
    price: '550',
    type: PRODUCT_TYPES.STANDARD,
    quantity: '20',
    description: 'Artisanal terracotta clay pot set made by traditional potters. Natural non-toxic cookware that retains heat and enhances food flavor.',
    tags: 'pottery, clay, terracotta, cookware, handmade',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800',
        altText: 'Clay Pot Set',
      },
    ],
  },
]

const defaultForm = {
  title: '',
  description: '',
  price: '',
  categoryId: '',
  type: PRODUCT_TYPES.STANDARD,
  quantity: '',
  tags: '',
}

export default function ProductForm({
  initialData = null,
  onSubmit,
  isLoading,
  categories: propCategories = null,
  isCategoriesLoading = false,
}) {
  const getInitialForm = () => {
    if (!initialData) return defaultForm
    const rawPrice = initialData.price
    const price = typeof rawPrice === 'object' && rawPrice !== null ? (rawPrice.amount ?? '') : (rawPrice ?? '')
    const categoryId = initialData.categoryId?._id || initialData.categoryId || initialData.category?._id || initialData.category || ''
    const tags = Array.isArray(initialData.tags)
      ? initialData.tags.join(', ')
      : (initialData.tags || '')
    return {
      ...defaultForm,
      ...initialData,
      price,
      categoryId,
      tags,
    }
  }

  const [form, setForm] = useState(getInitialForm)
  const [categories, setCategories] = useState(() =>
    Array.isArray(propCategories) ? propCategories : []
  )
  const [mediaFiles, setMediaFiles] = useState([])
  const [previews, setPreviews] = useState(initialData?.images || [])
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (initialData) {
      setForm(getInitialForm())
      setPreviews(initialData.images || [])
    }
  }, [initialData])

  useEffect(() => {
    if (Array.isArray(propCategories) && propCategories.length > 0) {
      setCategories(propCategories)
    }
  }, [propCategories])

  useEffect(() => {
    if (Array.isArray(propCategories) && propCategories.length > 0) return

    productAPI.getCategories()
      .then((res) => {
        const raw = res?.data ?? res
        const cats = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.categories)
          ? raw.categories
          : Array.isArray(raw?.items)
          ? raw.items
          : []
        setCategories(cats)
      })
      .catch(() => setCategories([]))
  }, [propCategories])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    setMediaFiles((prev) => [...prev, ...files])
    const newPreviews = files.map((f) => ({ url: URL.createObjectURL(f), isNew: true }))
    setPreviews((prev) => [...prev, ...newPreviews])
  }

  const removePreview = (index) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index))
    setMediaFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const validate = () => {
    const newErrors = {}
    if (!form.title.trim()) newErrors.title = 'Title is required.'
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0)
      newErrors.price = 'Enter a valid price.'
    if (!form.categoryId || !String(form.categoryId).trim())
      newErrors.categoryId = 'Please select a category.'
    if (form.type === PRODUCT_TYPES.STANDARD && (!form.quantity || form.quantity < 0))
      newErrors.quantity = 'Enter a valid quantity.'
    return newErrors
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    onSubmit({ ...form, mediaFiles })
  }

  const categoryList = Array.isArray(categories)
    ? categories
    : Array.isArray(categories?.data)
    ? categories.data
    : Array.isArray(categories?.categories)
    ? categories.categories
    : Array.isArray(categories?.items)
    ? categories.items
    : []

  const handleLoadSample = (sample) => {
    const list = Array.isArray(categoryList) ? categoryList : []
    const matchedCategory = list.find((cat) => {
      const name = typeof cat === 'object' && cat ? (cat.name || cat.title || cat.slug || '') : String(cat)
      const slug = typeof cat === 'object' && cat ? (cat.slug || '') : ''
      return (
        name.toLowerCase() === sample.categoryName.toLowerCase() ||
        slug.toLowerCase() === sample.categorySlug.toLowerCase() ||
        name.toLowerCase().includes(sample.categoryName.toLowerCase()) ||
        sample.categoryName.toLowerCase().includes(name.toLowerCase())
      )
    })

    const catId = matchedCategory
      ? typeof matchedCategory === 'object'
        ? matchedCategory._id || matchedCategory.id || matchedCategory.slug || ''
        : String(matchedCategory)
      : sample.categorySlug || ''

    setForm((prev) => ({
      ...prev,
      title: sample.title,
      description: sample.description,
      price: sample.price,
      categoryId: catId,
      type: sample.type || PRODUCT_TYPES.STANDARD,
      quantity: sample.quantity || '10',
      tags: sample.tags || '',
    }))

    if (Array.isArray(sample.images) && sample.images.length > 0) {
      setPreviews(sample.images)
    }

    setErrors({})
    toast.success(`Loaded sample: ${sample.title}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Sample Data Quick-Fill */}
      <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 mb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-700" /> Sample Data
            </span>
            <span className="text-xs text-amber-900 font-medium">
              Click to preview & auto-fill sample product details:
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_PRODUCTS.map((sample) => (
              <button
                key={sample.title}
                type="button"
                onClick={() => handleLoadSample(sample)}
                className="text-xs font-medium px-2.5 py-1 bg-white hover:bg-amber-100/80 border border-amber-300 text-amber-900 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                {sample.title} ({sample.categoryName})
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Product Title <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="e.g. Handwoven Bamboo Basket"
          className="input-field"
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Describe your product, materials used, dimensions..."
          rows={4}
          className="input-field resize-none"
        />
      </div>

      {/* Price & Category */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price (₹) <span className="text-red-500">*</span>
          </label>
          <input
            name="price"
            type="number"
            min="1"
            value={form.price}
            onChange={handleChange}
            placeholder="0"
            className="input-field"
          />
          {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
        </div>

        <div>
          <label htmlFor="product-category" className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="product-category"
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            className={`input-field ${errors.categoryId ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
            aria-invalid={Boolean(errors.categoryId)}
            aria-describedby={errors.categoryId ? 'category-error' : undefined}
          >
            <option value="">
              {isCategoriesLoading ? 'Loading categories...' : 'Select category'}
            </option>
            {Array.isArray(categoryList) && categoryList.length > 0 ? (
              categoryList.map((cat) => {
                const id =
                  typeof cat === 'object' && cat !== null
                    ? cat._id || cat.id || cat.slug || ''
                    : String(cat)
                const name =
                  typeof cat === 'object' && cat !== null
                    ? cat.name || cat.title || cat.label || cat.slug || ''
                    : String(cat)
                return (
                  <option key={id} value={id}>
                    {name}
                  </option>
                )
              })
            ) : (
              !isCategoriesLoading && (
                <option value="" disabled>
                  No categories available
                </option>
              )
            )}
          </select>
          {errors.categoryId && (
            <p id="category-error" className="text-xs text-red-500 mt-1">{errors.categoryId}</p>
          )}
        </div>
      </div>

      {/* Product type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Type
        </label>
        <div className="flex gap-3 flex-wrap">
          {[
            { value: PRODUCT_TYPES.STANDARD, label: 'Standard' },
            { value: PRODUCT_TYPES.UNIQUE, label: 'One of a Kind', icon: Gem },
            { value: PRODUCT_TYPES.MADE_TO_ORDER, label: 'Made to Order' },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, type: value }))}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                form.type === value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-600 hover:border-primary-300'
              }`}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity — standard only */}
      {form.type === PRODUCT_TYPES.STANDARD && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stock Quantity <span className="text-red-500">*</span>
          </label>
          <input
            name="quantity"
            type="number"
            min="0"
            value={form.quantity}
            onChange={handleChange}
            placeholder="0"
            className="input-field"
          />
          {errors.quantity && (
            <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>
          )}
        </div>
      )}

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags{' '}
          <span className="text-gray-400 font-normal">(comma separated)</span>
        </label>
        <input
          name="tags"
          value={form.tags}
          onChange={handleChange}
          placeholder="handmade, bamboo, eco-friendly"
          className="input-field"
        />
      </div>

      {/* Media upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Images
        </label>

        {/* Previews */}
        {previews.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-3">
            {previews.map((img, i) => (
              <div key={i} className="relative group">
                <img
                  src={img.url}
                  alt={`Preview ${i + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removePreview(i)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
          <Upload className="h-6 w-6 text-gray-400" />
          <span className="text-sm text-gray-500">Click to upload images</span>
          <span className="text-xs text-gray-400">PNG, JPG up to 5MB each</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Spinner size="sm" />
            Saving...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            {initialData ? 'Update Product' : 'Create Product'}
          </>
        )}
      </button>
    </form>
  )
}

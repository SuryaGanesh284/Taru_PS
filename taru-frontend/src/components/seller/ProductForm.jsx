import { useState, useEffect } from 'react'
import { Upload, X, Plus, Gem } from 'lucide-react'
import { productAPI } from '../../api/productAPI.jsx'
import { PRODUCT_TYPES } from '../../utils/constants.jsx'
import Spinner from '../common/Spinner.jsx'

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
    if (!form.categoryId) newErrors.categoryId = 'Please select a category.'
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">Select category</option>
            {Array.isArray(categories) &&
              categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
          </select>
          {errors.categoryId && (
            <p className="text-xs text-red-500 mt-1">{errors.categoryId}</p>
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

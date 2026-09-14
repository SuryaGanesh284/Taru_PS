import { useState } from 'react'
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react'
import { SORT_OPTIONS, PRODUCT_TYPES } from '../../utils/constants.jsx'
import { formatCurrency } from '../../utils/formatters.jsx'

export default function FilterSidebar({ filters, onChange, categories = [] }) {
  const [expandedSections, setExpandedSections] = useState({
    sort: true,
    category: true,
    price: true,
    type: true,
  })

  const toggle = (section) =>
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))

  const handleChange = (key, value) => onChange({ ...filters, [key]: value })

  const handlePriceChange = (e) => {
    const { name, value } = e.target
    onChange({ ...filters, [name]: value })
  }

  return (
    <aside className="w-full space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <SlidersHorizontal className="h-4 w-4 text-primary-600" />
        <span className="font-semibold text-gray-700">Filters</span>
      </div>

      {/* Sort */}
      <div className="card p-4">
        <button
          className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 mb-2"
          onClick={() => toggle('sort')}
        >
          Sort By
          {expandedSections.sort ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>
        {expandedSections.sort && (
          <div className="space-y-1.5">
            {SORT_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sort"
                  value={opt.value}
                  checked={filters.sort === opt.value}
                  onChange={(e) => handleChange('sort', e.target.value)}
                  className="accent-primary-500"
                />
                <span className="text-sm text-gray-600">{opt.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Category */}
      {Array.isArray(categories) && categories.length > 0 && (
        <div className="card p-4">
          <button
            className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 mb-2"
            onClick={() => toggle('category')}
          >
            Category
            {expandedSections.category ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>
          {expandedSections.category && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value=""
                  checked={!filters.categoryId}
                  onChange={() => handleChange('categoryId', '')}
                  className="accent-primary-500"
                />
                <span className="text-sm text-gray-600">All Categories</span>
              </label>
              {categories.map((cat) => (
                <label key={cat._id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value={cat._id}
                    checked={filters.categoryId === cat._id}
                    onChange={(e) => handleChange('categoryId', e.target.value)}
                    className="accent-primary-500"
                  />
                  <span className="text-sm text-gray-600">{cat.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Price range */}
      <div className="card p-4">
        <button
          className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 mb-2"
          onClick={() => toggle('price')}
        >
          Price Range
          {expandedSections.price ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>
        {expandedSections.price && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice || ''}
                onChange={handlePriceChange}
                placeholder="Min"
                className="input-field text-sm"
                min={0}
              />
              <span className="text-gray-400">—</span>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice || ''}
                onChange={handlePriceChange}
                placeholder="Max"
                className="input-field text-sm"
                min={0}
              />
            </div>
          </div>
        )}
      </div>

      {/* Product type */}
      <div className="card p-4">
        <button
          className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 mb-2"
          onClick={() => toggle('type')}
        >
          Product Type
          {expandedSections.type ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>
        {expandedSections.type && (
          <div className="space-y-1.5">
            {[
              { label: 'All Types', value: '' },
              { label: 'Standard', value: PRODUCT_TYPES.STANDARD },
              { label: 'One of a Kind', value: PRODUCT_TYPES.UNIQUE },
              { label: 'Made to Order', value: PRODUCT_TYPES.MADE_TO_ORDER },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value={opt.value}
                  checked={filters.type === opt.value || (!filters.type && !opt.value)}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="accent-primary-500"
                />
                <span className="text-sm text-gray-600">{opt.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Clear filters */}
      <button
        onClick={() => onChange({})}
        className="btn-secondary w-full text-sm"
      >
        Clear All Filters
      </button>
    </aside>
  )
}

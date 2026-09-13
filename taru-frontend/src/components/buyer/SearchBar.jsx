import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { productAPI } from '../../api/productAPI.jsx'
import { useDebounce } from '../../hooks/useDebounce.jsx'

export default function SearchBar({ initialValue = '', onSearch }) {
  const [query, setQuery] = useState(initialValue)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const navigate = useNavigate()
  const inputRef = useRef(null)

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSuggestions([])
      return
    }
    productAPI
      .getSearchSuggestions({ q: debouncedQuery })
      .then((res) => setSuggestions(res.data.suggestions || []))
      .catch(() => setSuggestions([]))
  }, [debouncedQuery])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setShowSuggestions(false)
    if (onSearch) {
      onSearch(query.trim())
    } else {
      navigate(`/products?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion)
    setShowSuggestions(false)
    if (onSearch) {
      onSearch(suggestion)
    } else {
      navigate(`/products?q=${encodeURIComponent(suggestion)}`)
    }
  }

  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    inputRef.current?.focus()
    if (onSearch) onSearch('')
  }

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => query.length >= 2 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Search products, crafts, categories..."
            className="input-field pl-10 pr-10"
            aria-label="Search products"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button type="submit" className="btn-primary whitespace-nowrap">
          Search
        </button>
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={() => handleSuggestionClick(s)}
              className="px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 cursor-pointer flex items-center gap-2"
            >
              <Search className="h-3.5 w-3.5 text-gray-400" />
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

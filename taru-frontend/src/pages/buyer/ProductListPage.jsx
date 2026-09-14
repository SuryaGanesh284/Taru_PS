import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageWrapper from '../../components/common/PageWrapper.jsx'
import ProductGrid from '../../components/buyer/ProductGrid.jsx'
import FilterSidebar from '../../components/buyer/FilterSidebar.jsx'
import SearchBar from '../../components/buyer/SearchBar.jsx'
import ChatWidget from '../../components/ai/ChatWidget.jsx'
import { productAPI } from '../../api/productAPI.jsx'
import { DEFAULT_PAGE_SIZE } from '../../utils/constants.jsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const page = parseInt(searchParams.get('page') || '1')
  const filters = {
    q: searchParams.get('q') || '',
    categoryId: searchParams.get('categoryId') || '',
    sort: searchParams.get('sort') || 'createdAt:desc',
    type: searchParams.get('type') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
  }

  useEffect(() => {
    productAPI
      .getCategories()
      .then((res) => {
        const raw = res?.data ?? res
        const cats = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.categories)
          ? raw.categories
          : Array.isArray(raw?.data)
          ? raw.data
          : []
        setCategories(cats)
      })
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    setIsLoading(true)
    const params = { page, limit: DEFAULT_PAGE_SIZE, ...filters }
    Object.keys(params).forEach((k) => !params[k] && delete params[k])
    productAPI
      .getProducts(params)
      .then((res) => {
        setProducts(res.data.products || [])
        setTotalPages(res.data.meta?.totalPages || 1)
        setTotalCount(res.data.meta?.total || 0)
      })
      .catch(() => setProducts([]))
      .finally(() => setIsLoading(false))
  }, [searchParams])

  const handleFilterChange = (newFilters) => {
    const params = { ...newFilters, page: '1' }
    Object.keys(params).forEach((k) => !params[k] && delete params[k])
    setSearchParams(params)
  }

  const handleSearch = (q) => handleFilterChange({ ...filters, q })

  const handlePageChange = (newPage) => {
    setSearchParams({ ...Object.fromEntries(searchParams), page: newPage.toString() })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <PageWrapper>
      <div className="mb-6">
        <SearchBar initialValue={filters.q} onSearch={handleSearch} />
      </div>
      {filters.q && (
        <p className="text-sm text-gray-500 mb-4">
          Showing {totalCount} results for{' '}
          <span className="font-semibold text-gray-800">"{filters.q}"</span>
        </p>
      )}
      <div className="flex gap-6">
        <div className="hidden lg:block w-56 shrink-0">
          <FilterSidebar filters={filters} onChange={handleFilterChange} categories={categories} />
        </div>
        <div className="flex-1">
          <ProductGrid products={products} isLoading={isLoading} />
          {totalPages > 1 && !isLoading && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => handlePageChange(page - 1)} disabled={page <= 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => handlePageChange(p)} className={`w-9 h-9 rounded-lg text-sm font-medium ${p === page ? 'bg-primary-500 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      <ChatWidget />
    </PageWrapper>
  )
}
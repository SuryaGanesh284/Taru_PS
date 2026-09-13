import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, ShieldCheck, Truck } from 'lucide-react'
import PageWrapper from '../../components/common/PageWrapper.jsx'
import ProductGrid from '../../components/buyer/ProductGrid.jsx'
import SearchBar from '../../components/buyer/SearchBar.jsx'
import ChatWidget from '../../components/ai/ChatWidget.jsx'
import { productAPI } from '../../api/productAPI.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

const HERO_CATEGORIES = [
  { name: 'Handicrafts', emoji: '🧶', slug: 'handicrafts' },
  { name: 'Pottery', emoji: '🏺', slug: 'pottery' },
  { name: 'Textiles', emoji: '🧵', slug: 'textiles' },
  { name: 'Organic Food', emoji: '🌾', slug: 'organic-food' },
  { name: 'Jewellery', emoji: '💎', slug: 'jewellery' },
  { name: 'Bamboo Products', emoji: '🎍', slug: 'bamboo' },
]

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true)
  const [isLoadingRecs, setIsLoadingRecs] = useState(false)

  useEffect(() => {
    productAPI
      .getProducts({ limit: 8, sort: 'popularity:desc' })
      .then((res) => setFeaturedProducts(res.data.products || []))
      .catch(() => {})
      .finally(() => setIsLoadingFeatured(false))
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    setIsLoadingRecs(true)
    productAPI
      .getHomeRecommendations()
      .then((res) => setRecommendations(res.data.items || []))
      .catch(() => {})
      .finally(() => setIsLoadingRecs(false))
  }, [isAuthenticated])

  return (
    <PageWrapper>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-600 to-earth-700 rounded-3xl overflow-hidden mb-10 px-8 py-14 text-white">
        <div className="max-w-xl">
          <p className="text-primary-200 text-sm font-semibold uppercase tracking-wider mb-2">
            Rural India's Marketplace
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
            Handcrafted with{' '}
            <span className="text-primary-200">love</span>,<br />
            delivered to your door.
          </h1>
          <p className="text-primary-100 text-base mb-8 leading-relaxed">
            Discover authentic handmade products from Self Help Group sellers
            across rural India. Every purchase empowers a family.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/products" className="btn-primary bg-white text-primary-700 hover:bg-primary-50">
              Shop Now <ArrowRight className="inline h-4 w-4 ml-1" />
            </Link>
            <Link to="/register" className="btn-secondary border-white text-white hover:bg-white/10">
              Become a Seller
            </Link>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -right-5 bottom-0 w-40 h-40 rounded-full bg-white/5" />
      </section>

      {/* Search */}
      <div className="mb-10">
        <SearchBar />
      </div>

      {/* Categories */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Browse Categories</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {HERO_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              to={`/products?category=${cat.slug}`}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:border-primary-300 hover:shadow-sm transition-all group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">
                {cat.emoji}
              </span>
              <span className="text-xs font-medium text-gray-600 text-center">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Personalized Recommendations */}
      {isAuthenticated && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-500" />
              Recommended for You
            </h2>
            <Link
              to="/products"
              className="text-sm text-primary-600 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ProductGrid products={recommendations} isLoading={isLoadingRecs} skeletonCount={4} />
        </section>
      )}

      {/* Featured Products */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Featured Products</h2>
          <Link
            to="/products"
            className="text-sm text-primary-600 hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <ProductGrid products={featuredProducts} isLoading={isLoadingFeatured} />
      </section>

      {/* Trust badges */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          {
            icon: ShieldCheck,
            title: 'Verified SHG Sellers',
            desc: 'Every seller is verified by Taru Foundation.',
          },
          {
            icon: Truck,
            title: 'Pan-India Delivery',
            desc: 'We deliver to your doorstep anywhere in India.',
          },
          {
            icon: Sparkles,
            title: 'AI-Powered Discovery',
            desc: 'Find products you love with smart recommendations.',
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card flex items-start gap-4">
            <div className="bg-primary-50 p-3 rounded-xl">
              <Icon className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{title}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* AI Chat Widget */}
      <ChatWidget />
    </PageWrapper>
  )
}

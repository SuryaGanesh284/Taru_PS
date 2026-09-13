import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="font-bold text-xl text-primary-700">Taru</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Connecting rural artisans and SHG sellers with buyers across India.
            </p>
          </div>

          {/* Buyers */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">For Buyers</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/products" className="hover:text-primary-600 transition-colors">Browse Products</Link></li>
              <li><Link to="/cart" className="hover:text-primary-600 transition-colors">My Cart</Link></li>
              <li><Link to="/orders" className="hover:text-primary-600 transition-colors">My Orders</Link></li>
              <li><Link to="/wishlist" className="hover:text-primary-600 transition-colors">Wishlist</Link></li>
            </ul>
          </div>

          {/* Sellers */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">For Sellers</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/seller/dashboard" className="hover:text-primary-600 transition-colors">Seller Dashboard</Link></li>
              <li><Link to="/seller/products" className="hover:text-primary-600 transition-colors">Manage Products</Link></li>
              <li><Link to="/seller/orders" className="hover:text-primary-600 transition-colors">Manage Orders</Link></li>
              <li><Link to="/register" className="hover:text-primary-600 transition-colors">Become a Seller</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><span className="hover:text-primary-600 transition-colors cursor-pointer">Help Center</span></li>
              <li><span className="hover:text-primary-600 transition-colors cursor-pointer">Contact Us</span></li>
              <li><span className="hover:text-primary-600 transition-colors cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-primary-600 transition-colors cursor-pointer">Terms of Service</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Taru Foundation. All rights reserved.
          </p>
          <p className="text-sm text-gray-400 flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-red-400 fill-red-400" /> for rural India
          </p>
        </div>
      </div>
    </footer>
  )
}

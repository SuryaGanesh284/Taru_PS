import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'

export default function PageWrapper({ children, hideFooter = false }) {
  return (
    <div className="min-h-screen flex flex-col bg-earth-50">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  )
}

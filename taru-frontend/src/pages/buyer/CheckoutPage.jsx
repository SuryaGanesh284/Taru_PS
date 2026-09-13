import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, CreditCard, Plus, CheckCircle } from 'lucide-react'
import PageWrapper from '../../components/common/PageWrapper.jsx'
import Spinner from '../../components/common/Spinner.jsx'
import { useCart } from '../../context/CartContext.jsx'
import { orderAPI } from '../../api/orderAPI.jsx'
import { formatCurrency } from '../../utils/formatters.jsx'
import toast from 'react-hot-toast'

export default function CheckoutPage() {
  const { items, totalPrice, clearCartLocal } = useCart()
  const navigate = useNavigate()

  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [quote, setQuote] = useState(null)
  const [isPlacing, setIsPlacing] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressForm, setAddressForm] = useState({
    line1: '', line2: '', city: '', state: '', pincode: '', country: 'India',
  })

  useEffect(() => {
    orderAPI.getAddresses().then((res) => {
      const addrs = res.data.addresses || []
      setAddresses(addrs)
      if (addrs.length > 0) setSelectedAddress(addrs[0]._id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedAddress || items.length === 0) return
    orderAPI
      .getQuote({ addressId: selectedAddress, items: items.map((i) => ({ productId: i.product._id, quantity: i.quantity })) })
      .then((res) => setQuote(res.data))
      .catch(() => {})
  }, [selectedAddress, items])

  const handleAddAddress = async (e) => {
    e.preventDefault()
    try {
      const res = await orderAPI.createAddress(addressForm)
      const newAddr = res.data.address
      setAddresses((prev) => [...prev, newAddr])
      setSelectedAddress(newAddr._id)
      setShowAddressForm(false)
      toast.success('Address added!')
    } catch { toast.error('Failed to add address.') }
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.error('Please select a delivery address.'); return }
    setIsPlacing(true)
    try {
      const orderRes = await orderAPI.createOrder({
        addressId: selectedAddress,
        items: items.map((i) => ({ productId: i.product._id, quantity: i.quantity })),
      })
      const order = orderRes.data.order

      // Create payment intent
      const payRes = await orderAPI.createPaymentIntent({ orderId: order._id })
      const { paymentUrl, paymentIntentId } = payRes.data

      clearCartLocal()
      toast.success('Order placed! Redirecting to payment...')

      // Redirect to payment provider or order page
      if (paymentUrl) {
        window.location.href = paymentUrl
      } else {
        navigate(`/orders/${order._id}`)
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to place order.')
    } finally {
      setIsPlacing(false)
    }
  }

  if (items.length === 0) {
    navigate('/cart')
    return null
  }

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-5">
            {/* Delivery Address */}
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary-500" />
                Delivery Address
              </h2>

              {addresses.length === 0 && !showAddressForm && (
                <p className="text-sm text-gray-500 mb-3">No saved addresses yet.</p>
              )}

              <div className="space-y-3 mb-3">
                {addresses.map((addr) => (
                  <label
                    key={addr._id}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                      selectedAddress === addr._id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={addr._id}
                      checked={selectedAddress === addr._id}
                      onChange={() => setSelectedAddress(addr._id)}
                      className="mt-0.5 accent-primary-500"
                    />
                    <div className="text-sm">
                      <p className="font-medium text-gray-800">{addr.line1}</p>
                      {addr.line2 && <p className="text-gray-500">{addr.line2}</p>}
                      <p className="text-gray-500">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {showAddressForm ? (
                <form onSubmit={handleAddAddress} className="space-y-3 border-t pt-4">
                  <div className="grid grid-cols-1 gap-3">
                    <input name="line1" value={addressForm.line1} onChange={(e) => setAddressForm(p => ({...p, line1: e.target.value}))} placeholder="Address Line 1" className="input-field text-sm" required />
                    <input name="line2" value={addressForm.line2} onChange={(e) => setAddressForm(p => ({...p, line2: e.target.value}))} placeholder="Address Line 2 (optional)" className="input-field text-sm" />
                    <div className="grid grid-cols-2 gap-3">
                      <input name="city" value={addressForm.city} onChange={(e) => setAddressForm(p => ({...p, city: e.target.value}))} placeholder="City" className="input-field text-sm" required />
                      <input name="state" value={addressForm.state} onChange={(e) => setAddressForm(p => ({...p, state: e.target.value}))} placeholder="State" className="input-field text-sm" required />
                    </div>
                    <input name="pincode" value={addressForm.pincode} onChange={(e) => setAddressForm(p => ({...p, pincode: e.target.value}))} placeholder="Pincode" className="input-field text-sm" required />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-sm py-2">Save Address</button>
                    <button type="button" onClick={() => setShowAddressForm(false)} className="btn-secondary text-sm py-2">Cancel</button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="flex items-center gap-1.5 text-sm text-primary-600 hover:underline"
                >
                  <Plus className="h-4 w-4" /> Add new address
                </button>
              )}
            </div>

            {/* Items summary */}
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4">Items ({items.length})</h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.product._id} className="flex items-center gap-3">
                    <img
                      src={item.product.images?.[0]?.url || '/placeholder-product.jpg'}
                      alt={item.product.title}
                      className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.product.title}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatCurrency(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="card h-fit space-y-4">
            <h2 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary-500" />
              Payment Summary
            </h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Items Total</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
              {quote?.deliveryCharge !== undefined && (
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span>
                    {quote.deliveryCharge === 0
                      ? <span className="text-green-600">Free</span>
                      : formatCurrency(quote.deliveryCharge)}
                  </span>
                </div>
              )}
              {quote?.taxes !== undefined && (
                <div className="flex justify-between text-gray-600">
                  <span>Taxes</span>
                  <span>{formatCurrency(quote.taxes)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900 text-base">
              <span>Total Payable</span>
              <span>{formatCurrency(quote?.totalAmount ?? totalPrice)}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isPlacing || !selectedAddress}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isPlacing ? (
                <><Spinner size="sm" /> Placing Order...</>
              ) : (
                <><CheckCircle className="h-4 w-4" /> Place Order & Pay</>
              )}
            </button>

            <p className="text-xs text-gray-400 text-center">
              By placing this order you agree to our Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}

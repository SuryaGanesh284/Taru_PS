import { Bot, User } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters.jsx'
import { Link } from 'react-router-dom'

function ProductCard({ product }) {
  return (
    <Link
      to={`/products/${product._id}`}
      className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all"
    >
      {product.images?.[0] && (
        <img
          src={product.images[0].url}
          alt={product.title}
          className="w-14 h-14 object-cover rounded-lg bg-gray-100 shrink-0"
        />
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800 line-clamp-1">
          {product.title}
        </p>
        <p className="text-xs text-gray-400">{product.category?.name}</p>
        <p className="text-sm font-bold text-primary-600 mt-0.5">
          {formatCurrency(product.price)}
        </p>
      </div>
    </Link>
  )
}

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
          isUser ? 'bg-primary-500' : 'bg-earth-200'
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-earth-700" />
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-primary-500 text-white rounded-tr-sm'
              : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
          }`}
        >
          {/* Streaming indicator */}
          {message.isStreaming ? (
            <span>
              {message.content}
              <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse rounded-sm" />
            </span>
          ) : (
            message.content
          )}
        </div>

        {/* Product cards from AI */}
        {isAssistant && message.products && message.products.length > 0 && (
          <div className="space-y-2 w-full">
            {message.products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}

        {/* Citations */}
        {isAssistant && message.citations && message.citations.length > 0 && (
          <div className="text-xs text-gray-400 space-y-0.5">
            {message.citations.map((cite, i) => (
              <p key={i} className="italic">Source: {cite}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

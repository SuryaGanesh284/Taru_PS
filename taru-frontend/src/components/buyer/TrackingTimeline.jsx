import { CheckCircle, Circle, Clock } from 'lucide-react'
import { formatDateTime } from '../../utils/formatters.jsx'

const STEPS = [
  { key: 'PENDING_PAYMENT', label: 'Order Placed' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'DELIVERED', label: 'Delivered' },
]

function getStepIndex(status) {
  const index = STEPS.findIndex((s) => s.key === status)
  return index === -1 ? 0 : index
}

export default function TrackingTimeline({ order, events = [] }) {
  const currentIndex = getStepIndex(order.status)
  const isCancelled = order.status === 'CANCELLED'
  const isPaymentFailed = order.status === 'PAYMENT_FAILED'

  if (isCancelled || isPaymentFailed) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
          <Clock className="h-4 w-4 text-red-500" />
        </div>
        <div>
          <p className="font-semibold text-red-700 text-sm">
            {isCancelled ? 'Order Cancelled' : 'Payment Failed'}
          </p>
          <p className="text-xs text-red-500 mt-0.5">
            {isCancelled
              ? 'This order has been cancelled.'
              : 'Payment could not be processed.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {STEPS.map((step, index) => {
        const isCompleted = index <= currentIndex
        const isCurrent = index === currentIndex

        // Find a matching event for this step
        const event = events.find((e) => e.status === step.key)

        return (
          <div key={step.key} className="flex gap-4">
            {/* Indicator column */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isCompleted
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-0.5 flex-1 min-h-[2rem] ${
                    index < currentIndex ? 'bg-primary-400' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className="pb-6">
              <p
                className={`text-sm font-semibold ${
                  isCurrent
                    ? 'text-primary-700'
                    : isCompleted
                    ? 'text-gray-800'
                    : 'text-gray-400'
                }`}
              >
                {step.label}
              </p>
              {event && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDateTime(event.timestamp)}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

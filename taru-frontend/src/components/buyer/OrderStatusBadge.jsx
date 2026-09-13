import { ORDER_STATUS_COLORS } from '../../utils/constants.jsx'
import { formatOrderStatus } from '../../utils/formatters.jsx'

export default function OrderStatusBadge({ status }) {
  const colorClass = ORDER_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'
  return (
    <span className={`badge ${colorClass}`}>
      {formatOrderStatus(status)}
    </span>
  )
}

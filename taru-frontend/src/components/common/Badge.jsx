const variantMap = {
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  gray: 'bg-gray-100 text-gray-800',
  indigo: 'bg-indigo-100 text-indigo-800',
  primary: 'bg-primary-100 text-primary-800',
}

export default function Badge({ children, variant = 'gray', className = '' }) {
  return (
    <span
      className={`badge ${variantMap[variant] || variantMap.gray} ${className}`}
    >
      {children}
    </span>
  )
}

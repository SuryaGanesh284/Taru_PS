const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-7 w-7 border-2',
  lg: 'h-12 w-12 border-4',
}

export default function Spinner({ size = 'md', className = '' }) {
  return (
    <div
      className={`
        inline-block rounded-full border-primary-200 border-t-primary-500
        animate-spin
        ${sizeMap[size] || sizeMap.md}
        ${className}
      `}
      role="status"
      aria-label="Loading"
    />
  )
}

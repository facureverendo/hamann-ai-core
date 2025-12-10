import { useEffect, useState } from 'react'

interface StatusOrbProps {
  status?: 'active' | 'idle' | 'processing' | 'error'
  size?: 'sm' | 'md' | 'lg'
}

export default function StatusOrb({ status = 'active', size = 'md' }: StatusOrbProps) {
  const [pulse, setPulse] = useState(true)

  useEffect(() => {
    if (status === 'active' || status === 'processing') {
      const interval = setInterval(() => {
        setPulse((prev) => !prev)
      }, 1500)
      return () => clearInterval(interval)
    }
  }, [status])

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }

  const statusColors = {
    active: 'bg-neon-cyan shadow-neon-cyan',
    idle: 'bg-gray-500',
    processing: 'bg-neon-blue shadow-neon-blue',
    error: 'bg-red-500',
  }

  return (
    <div className="relative flex items-center justify-center">
      <div
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          ${statusColors[status]}
          ${(status === 'active' || status === 'processing') && pulse ? 'animate-pulse' : ''}
        `}
      />
      {(status === 'active' || status === 'processing') && (
        <div
          className={`
            absolute ${sizeClasses[size]} 
            rounded-full 
            ${statusColors[status]}
            opacity-75
            animate-ping
          `}
        />
      )}
    </div>
  )
}


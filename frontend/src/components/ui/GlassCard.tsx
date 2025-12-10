import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export default function GlassCard({ children, className = '', hover = false, onClick }: GlassCardProps) {
  const baseClasses = 'glass-card animate-fade-in'
  const hoverClasses = hover ? 'glass-card-hover cursor-pointer' : ''
  
  return (
    <div 
      className={`${baseClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}


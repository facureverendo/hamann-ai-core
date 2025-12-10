import { ReactNode, ButtonHTMLAttributes } from 'react'

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'blue' | 'cyan' | 'purple'
  glow?: boolean
}

export default function NeonButton({ 
  children, 
  variant = 'blue', 
  glow = true,
  className = '',
  ...props 
}: NeonButtonProps) {
  const variantClasses = {
    blue: 'border-neon-blue text-neon-blue hover:bg-neon-blue/10',
    cyan: 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10',
    purple: 'border-neon-purple text-neon-purple hover:bg-neon-purple/10',
  }

  const glowClasses = glow ? {
    blue: 'shadow-neon-blue',
    cyan: 'shadow-neon-cyan',
    purple: 'shadow-neon-purple',
  }[variant] : ''

  return (
    <button
      className={`
        px-4 py-2 rounded-lg border-2 font-medium
        transition-all duration-300
        ${variantClasses[variant]}
        ${glowClasses}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}


interface FeatureStatusBadgeProps {
  status: string
  isIdea?: boolean
}

export default function FeatureStatusBadge({ status, isIdea = false }: FeatureStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'idea':
        return {
          label: 'Idea',
          className: 'bg-purple-500/20 text-purple-400 border-purple-500/50'
        }
      case 'backlog':
        return {
          label: 'Backlog',
          className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
        }
      case 'in_progress':
        return {
          label: 'En Proceso',
          className: 'bg-neon-blue/20 text-neon-blue border-neon-blue/50'
        }
      case 'completed':
        return {
          label: 'Completada',
          className: 'bg-green-500/20 text-green-400 border-green-500/50'
        }
      case 'discarded':
        return {
          label: 'Descartada',
          className: 'bg-gray-500/20 text-gray-400 border-gray-500/50'
        }
      default:
        return {
          label: status,
          className: 'bg-gray-500/20 text-gray-400 border-gray-500/50'
        }
    }
  }

  const config = getStatusConfig()

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${config.className}`}
    >
      {isIdea && status !== 'idea' && (
        <span className="mr-1">💡</span>
      )}
      {config.label}
    </span>
  )
}

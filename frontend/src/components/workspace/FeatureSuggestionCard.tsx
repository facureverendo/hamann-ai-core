import GlassCard from '../ui/GlassCard'
import NeonButton from '../ui/NeonButton'
import { CheckCircle, X, List, Sparkles, AlertCircle } from 'lucide-react'
import type { FeatureSuggestion } from '../../services/workspaceService'

interface FeatureSuggestionCardProps {
  suggestion: FeatureSuggestion
  onAccept: () => void
  onBacklog: () => void
  onDiscard: () => void
  onMarkCompleted: () => void
  loading?: boolean
}

export default function FeatureSuggestionCard({
  suggestion,
  onAccept,
  onBacklog,
  onDiscard,
  onMarkCompleted,
  loading = false
}: FeatureSuggestionCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-400 bg-red-500/20 border-red-500/50'
      case 'important':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50'
      case 'optional':
        return 'text-gray-400 bg-gray-500/20 border-gray-500/50'
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/50'
    }
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'identified_module':
        return 'Módulo Identificado'
      case 'suggested_module':
        return 'Módulo Sugerido'
      case 'ai_analysis':
        return 'Análisis AI'
      default:
        return source
    }
  }

  const priorityConfig = getPriorityColor(suggestion.priority)
  const isProcessed = suggestion.status !== 'pending'

  return (
    <GlassCard className={`p-6 ${isProcessed ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-white">{suggestion.name}</h3>
            <span className={`px-2 py-1 rounded text-xs font-medium border ${priorityConfig}`}>
              {suggestion.priority === 'critical' ? 'Crítica' : 
               suggestion.priority === 'important' ? 'Importante' : 'Opcional'}
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-2">{suggestion.description}</p>
          <div className="text-xs text-gray-500 mb-3">
            <span className="inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {getSourceLabel(suggestion.source)}
            </span>
          </div>
        </div>
        {isProcessed && (
          <div className="ml-4">
            {suggestion.status === 'accepted' && (
              <CheckCircle className="w-5 h-5 text-green-400" />
            )}
            {suggestion.status === 'discarded' && (
              <X className="w-5 h-5 text-gray-500" />
            )}
            {suggestion.status === 'backlog' && (
              <List className="w-5 h-5 text-yellow-400" />
            )}
            {suggestion.status === 'completed' && (
              <AlertCircle className="w-5 h-5 text-blue-400" />
            )}
          </div>
        )}
      </div>

      {suggestion.rationale && (
        <div className="mb-4 p-3 bg-white/5 rounded-lg">
          <p className="text-sm text-gray-300">{suggestion.rationale}</p>
        </div>
      )}

      {!isProcessed && (
        <div className="flex items-center gap-2 flex-wrap">
          <NeonButton
            size="sm"
            onClick={onAccept}
            disabled={loading}
            className="flex-1 min-w-[120px]"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Aceptar
          </NeonButton>
          <NeonButton
            size="sm"
            variant="purple"
            onClick={onBacklog}
            disabled={loading}
            className="flex-1 min-w-[120px]"
          >
            <List className="w-4 h-4 mr-2" />
            Backlog
          </NeonButton>
          <NeonButton
            size="sm"
            variant="gray"
            onClick={onDiscard}
            disabled={loading}
            className="flex-1 min-w-[120px]"
          >
            <X className="w-4 h-4 mr-2" />
            Descartar
          </NeonButton>
        </div>
      )}

      {isProcessed && (
        <div className="text-xs text-gray-500">
          Estado: {suggestion.status === 'accepted' ? 'Aceptada' :
                   suggestion.status === 'backlog' ? 'En Backlog' :
                   suggestion.status === 'discarded' ? 'Descartada' :
                   suggestion.status === 'completed' ? 'Completada' : suggestion.status}
        </div>
      )}
    </GlassCard>
  )
}

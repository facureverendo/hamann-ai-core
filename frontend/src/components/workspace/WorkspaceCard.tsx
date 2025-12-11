import { useNavigate } from 'react-router-dom'
import { FolderOpen, Calendar, TrendingUp } from 'lucide-react'
import GlassCard from '../ui/GlassCard'
import type { Workspace } from '../../services/workspaceService'

interface WorkspaceCardProps {
  workspace: Workspace
}

export default function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const navigate = useNavigate()

  const getProgressColor = (progress: number) => {
    if (progress >= 0.8) return 'bg-green-500'
    if (progress >= 0.5) return 'bg-neon-cyan'
    if (progress >= 0.2) return 'bg-yellow-500'
    return 'bg-gray-500'
  }

  return (
    <GlassCard
      className="p-6 hover:bg-white/5 transition cursor-pointer group"
      onClick={() => navigate(`/workspaces/${workspace.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-neon-blue transition">
            {workspace.name}
          </h3>
          <p className="text-sm text-gray-400 line-clamp-2">
            {workspace.description}
          </p>
        </div>
        <div className="ml-4">
          <FolderOpen className="w-6 h-6 text-neon-cyan" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-500 mb-1">Features</div>
          <div className="text-lg font-semibold text-white">
            {workspace.features_count}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Progreso</div>
          <div className="text-lg font-semibold text-white">
            {Math.round(workspace.progress * 100)}%
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-dark-secondary rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${getProgressColor(workspace.progress)}`}
            style={{ width: `${workspace.progress * 100}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{new Date(workspace.created_at).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          <span>{workspace.status}</span>
        </div>
      </div>
    </GlassCard>
  )
}

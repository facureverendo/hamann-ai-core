import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import GlassCard from '../components/ui/GlassCard'
import NeonButton from '../components/ui/NeonButton'
import { workspaceService, type Workspace } from '../services/workspaceService'
import { Plus, FolderOpen, Calendar, TrendingUp, Loader2 } from 'lucide-react'

export default function WorkspaceList() {
  const navigate = useNavigate()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkspaces()
  }, [])

  const loadWorkspaces = async () => {
    try {
      const data = await workspaceService.listWorkspaces()
      setWorkspaces(data)
    } catch (error) {
      console.error('Error loading workspaces:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 0.8) return 'bg-green-500'
    if (progress >= 0.5) return 'bg-neon-cyan'
    if (progress >= 0.2) return 'bg-yellow-500'
    return 'bg-gray-500'
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Proyectos</h1>
          <p className="text-gray-400">
            Gestiona tus proyectos completos desde cero
          </p>
        </div>
        <NeonButton onClick={() => navigate('/workspaces/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Proyecto
        </NeonButton>
      </div>

      {/* Loading State */}
      {loading && (
        <GlassCard className="p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-neon-blue animate-spin mb-4" />
          <p className="text-gray-400">Cargando proyectos...</p>
        </GlassCard>
      )}

      {/* Empty State */}
      {!loading && workspaces.length === 0 && (
        <GlassCard className="p-12 flex flex-col items-center justify-center">
          <FolderOpen className="w-16 h-16 text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            No hay proyectos
          </h2>
          <p className="text-gray-400 mb-6 text-center max-w-md">
            Comienza creando tu primer proyecto desde cero. Carga la documentación inicial
            y deja que la AI te ayude a estructurar todo.
          </p>
          <NeonButton onClick={() => navigate('/workspaces/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Primer Proyecto
          </NeonButton>
        </GlassCard>
      )}

      {/* Workspaces Grid */}
      {!loading && workspaces.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace) => (
            <GlassCard
              key={workspace.id}
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
          ))}
        </div>
      )}
    </div>
  )
}

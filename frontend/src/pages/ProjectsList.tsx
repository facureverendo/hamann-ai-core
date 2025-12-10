import { useNavigate } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import GlassCard from '../components/ui/GlassCard'
import NeonButton from '../components/ui/NeonButton'
import { Plus, FolderKanban, Clock, CheckCircle2, Loader2 } from 'lucide-react'

export default function ProjectsList() {
  const navigate = useNavigate()
  const { projects, loading, error } = useProjects()

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    } catch {
      return dateString
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 0.8) return 'bg-green-500'
    if (progress >= 0.5) return 'bg-neon-cyan'
    if (progress >= 0.2) return 'bg-yellow-500'
    return 'bg-gray-500'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Proyectos</h1>
          <p className="text-gray-400">Gestiona todos tus proyectos</p>
        </div>
        <NeonButton onClick={() => navigate('/projects/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Proyecto
        </NeonButton>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-neon-blue animate-spin" />
          <span className="ml-3 text-gray-400">Cargando proyectos...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <GlassCard className="p-6 border-red-500/30 bg-red-500/10">
          <p className="text-red-400">Error: {error}</p>
        </GlassCard>
      )}

      {/* Empty State */}
      {!loading && !error && projects.length === 0 && (
        <GlassCard className="p-12 text-center">
          <FolderKanban className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No hay proyectos</h3>
          <p className="text-gray-400 mb-6">Crea tu primer proyecto para comenzar</p>
          <NeonButton onClick={() => navigate('/projects/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Proyecto
          </NeonButton>
        </GlassCard>
      )}

      {/* Projects Grid */}
      {!loading && !error && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <GlassCard
              key={project.id}
              className="p-6 hover:bg-white/10 transition cursor-pointer"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-1 truncate">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>Creado: {formatDate(project.created_at)}</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {project.status === 'active' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-400" />
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Progreso</span>
                  <span className="text-xs text-gray-300">
                    {Math.round(project.progress * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-dark-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(project.progress)} transition-all`}
                    style={{ width: `${project.progress * 100}%` }}
                  />
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className="px-2 py-1 bg-neon-blue/20 text-neon-blue rounded text-xs">
                  {project.status}
                </span>
                <span className="text-xs text-gray-500">
                  ID: {project.id.slice(-8)}
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}


import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import { settingsService, type AppSettings } from '../services/settingsService'
import GlassCard from '../components/ui/GlassCard'
import NeonButton from '../components/ui/NeonButton'
import { Plus, FolderKanban, Clock, CheckCircle2, Loader2, FolderOpen, Link2 } from 'lucide-react'

export default function ProjectsList() {
  const navigate = useNavigate()
  const { projects, loading, error } = useProjects()
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const settings = await settingsService.getSettings()
      setAppSettings(settings)
    } catch (err) {
      console.error('Error loading settings:', err)
      // Usar valores por defecto si falla
      setAppSettings({
        show_software_factory_mode: true,
        show_product_mode: true,
        default_mode: 'product'
      })
    } finally {
      setLoadingSettings(false)
    }
  }

  // Filtrar features según la configuración
  const filteredProjects = projects.filter((project) => {
    if (!appSettings) return true // Mostrar todo mientras carga
    
    const hasWorkspace = project.workspace_id && project.workspace_name
    
    // Si tiene workspace, solo mostrar si software_factory_mode está activo
    if (hasWorkspace) {
      return appSettings.show_software_factory_mode
    }
    
    // Si es standalone, solo mostrar si product_mode está activo
    return appSettings.show_product_mode
  })

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
          <h1 className="text-2xl font-bold text-white mb-2">Features</h1>
          <p className="text-gray-400">Gestiona todas tus features y PRDs</p>
        </div>
        <NeonButton onClick={() => navigate('/projects/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Feature
        </NeonButton>
      </div>

      {/* Loading State */}
      {(loading || loadingSettings) && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-neon-blue animate-spin" />
          <span className="ml-3 text-gray-400">Cargando features...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <GlassCard className="p-6 border-red-500/30 bg-red-500/10">
          <p className="text-red-400">Error: {error}</p>
        </GlassCard>
      )}

      {/* Empty State */}
      {!loading && !loadingSettings && !error && filteredProjects.length === 0 && (
        <GlassCard className="p-12 text-center">
          <FolderKanban className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No hay features disponibles</h3>
          <p className="text-gray-400 mb-6">
            {projects.length === 0 
              ? 'Crea tu primera feature para comenzar'
              : 'No hay features visibles según tu configuración actual. Ajusta los modos en Configuración.'}
          </p>
          {projects.length === 0 && (
            <NeonButton onClick={() => navigate('/projects/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Feature
            </NeonButton>
          )}
        </GlassCard>
      )}

      {/* Projects Grid */}
      {!loading && !loadingSettings && !error && filteredProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <GlassCard
              key={project.id}
              className="p-6 hover:bg-white/10 transition cursor-pointer group"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              {/* Workspace Badge */}
              {project.workspace_id && project.workspace_name ? (
                <div 
                  className="mb-3 flex items-center gap-2 px-2 py-1 bg-neon-cyan/10 border border-neon-cyan/30 rounded text-xs text-neon-cyan hover:bg-neon-cyan/20 transition cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/workspaces/${project.workspace_id}`)
                  }}
                >
                  <FolderOpen className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate flex-1 font-medium">Workspace: {project.workspace_name}</span>
                  <Link2 className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition" />
                </div>
              ) : (
                <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
                  <FolderKanban className="w-3 h-3" />
                  <span>Feature Standalone</span>
                </div>
              )}

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
                  <span className="text-xs text-gray-300 font-medium">
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

              {/* Status Badge and ID */}
              <div className="flex items-center justify-between">
                <span className="px-2 py-1 bg-neon-blue/20 text-neon-blue rounded text-xs font-medium">
                  {project.status}
                </span>
                <span className="text-xs text-gray-500 font-mono">
                  {project.id.slice(-8)}
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}


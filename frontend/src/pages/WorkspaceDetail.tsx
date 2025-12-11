import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import GlassCard from '../components/ui/GlassCard'
import NeonButton from '../components/ui/NeonButton'
import MarkdownRenderer from '../components/ui/MarkdownRenderer'
import { workspaceService, type WorkspaceDetail } from '../services/workspaceService'
import {
  ArrowLeft,
  Plus,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  Sparkles,
  TrendingUp
} from 'lucide-react'

export default function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [features, setFeatures] = useState<any[]>([])
  const [showAnalysis, setShowAnalysis] = useState(false)

  useEffect(() => {
    if (id) {
      loadWorkspace()
      loadFeatures()
    }
  }, [id])

  const loadWorkspace = async () => {
    if (!id) return
    try {
      const data = await workspaceService.getWorkspace(id)
      setWorkspace(data)
    } catch (error) {
      console.error('Error loading workspace:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFeatures = async () => {
    if (!id) return
    try {
      const data = await workspaceService.getWorkspaceFeatures(id)
      setFeatures(data.features)
    } catch (error) {
      console.error('Error loading features:', error)
    }
  }

  const handleAnalyze = async () => {
    if (!id) return
    setAnalyzing(true)
    try {
      await workspaceService.analyzeWorkspace(id)
      await loadWorkspace()
      setShowAnalysis(true)
    } catch (error) {
      console.error('Error analyzing workspace:', error)
      alert('Error analizando el workspace. Por favor intenta de nuevo.')
    } finally {
      setAnalyzing(false)
    }
  }

  const getStatusIcon = (step: boolean) => {
    if (step) return <CheckCircle className="w-5 h-5 text-green-400" />
    return <Clock className="w-5 h-5 text-gray-500" />
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-neon-blue animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando proyecto...</p>
        </div>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="p-6 flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Proyecto no encontrado</h2>
          <NeonButton onClick={() => navigate('/workspaces')}>
            Volver a Proyectos
          </NeonButton>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/workspaces')}
            className="p-2 hover:bg-white/5 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">{workspace.name}</h1>
            <p className="text-gray-400">{workspace.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NeonButton
            variant="purple"
            onClick={() => navigate(`/workspaces/${id}/features/new`)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Feature
          </NeonButton>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Status & Actions */}
        <div className="col-span-1 space-y-6">
          {/* Processing Status */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Estado del Proyecto</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Documentos procesados</span>
                {getStatusIcon(workspace.status === 'active')}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Análisis completado</span>
                {getStatusIcon(workspace.analysis !== null)}
              </div>
            </div>

            {!workspace.analysis && (
              <div className="mt-6">
                <NeonButton
                  className="w-full"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analizar Proyecto
                    </>
                  )}
                </NeonButton>
              </div>
            )}
          </GlassCard>

          {/* Quick Stats */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Estadísticas</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Features</div>
                <div className="text-2xl font-bold text-white">{features.length}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Progreso</div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-white">
                    {Math.round(workspace.progress * 100)}%
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column - Content */}
        <div className="col-span-2 space-y-6">
          {/* Analysis Section */}
          {workspace.analysis && (
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Análisis del Proyecto</h3>
                <button
                  onClick={() => setShowAnalysis(!showAnalysis)}
                  className="text-sm text-neon-cyan hover:text-neon-blue transition"
                >
                  {showAnalysis ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              {showAnalysis && (
                <div className="prose prose-invert max-w-none">
                  <h4 className="text-md font-semibold text-white mb-2">Resumen Ejecutivo</h4>
                  <MarkdownRenderer content={workspace.analysis.executive_summary} />
                  
                  {workspace.analysis.architecture_overview && (
                    <>
                      <h4 className="text-md font-semibold text-white mb-2 mt-6">Arquitectura</h4>
                      <MarkdownRenderer content={workspace.analysis.architecture_overview} />
                    </>
                  )}
                </div>
              )}
            </GlassCard>
          )}

          {/* Features List */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Features / PRDs</h3>
              <span className="text-sm text-gray-400">{features.length} features</span>
            </div>

            {features.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No hay features aún</p>
                <NeonButton
                  size="sm"
                  onClick={() => navigate(`/workspaces/${id}/features/new`)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Feature
                </NeonButton>
              </div>
            ) : (
              <div className="space-y-3">
                {features.map((feature) => (
                  <div
                    key={feature.project_id}
                    onClick={() => navigate(`/projects/${feature.project_id}`)}
                    className="p-4 glass-card rounded-lg hover:bg-white/5 transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-md font-medium text-white group-hover:text-neon-blue transition">
                          {feature.project_name}
                        </h4>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Creado: {new Date(feature.created_at).toLocaleDateString()}</span>
                          {feature.prd_built && (
                            <span className="text-green-400">✓ PRD Generado</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-neon-blue transition" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

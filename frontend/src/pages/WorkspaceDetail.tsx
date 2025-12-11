import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import GlassCard from '../components/ui/GlassCard'
import NeonButton from '../components/ui/NeonButton'
import MarkdownRenderer from '../components/ui/MarkdownRenderer'
import AddDocumentsModal from '../components/workspace/AddDocumentsModal'
import FeatureStatusBadge from '../components/workspace/FeatureStatusBadge'
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
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  List as ListIcon
} from 'lucide-react'

export default function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [features, setFeatures] = useState<any[]>([])
  const [groupedFeatures, setGroupedFeatures] = useState<any>({})
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [showAddDocuments, setShowAddDocuments] = useState(false)

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
      setGroupedFeatures(data.grouped || {})
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

  const handleReAnalyze = async () => {
    if (!id) return
    setAnalyzing(true)
    try {
      await workspaceService.reAnalyzeWorkspace(id, true)
      await loadWorkspace()
      setShowAnalysis(true)
    } catch (error) {
      console.error('Error re-analyzing workspace:', error)
      alert('Error re-analizando el workspace. Por favor intenta de nuevo.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleDocumentsAdded = async () => {
    await loadWorkspace()
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
            Gestionar Features
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
          {/* Documents Section */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Documentos del Proyecto</h3>
              <NeonButton
                size="sm"
                onClick={() => setShowAddDocuments(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Añadir Documentos
              </NeonButton>
            </div>
            
            {/* Lista de documentos */}
            {workspace.document_history && workspace.document_history.length > 0 ? (
              <div className="space-y-2">
                {workspace.document_history.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-neon-cyan" />
                      <div>
                        <div className="text-sm text-white">{doc.filename}</div>
                        <div className="text-xs text-gray-500">
                          {doc.is_initial
                            ? 'Inicial'
                            : `Añadido ${new Date(doc.uploaded_at).toLocaleDateString()}`}
                          {doc.version > 1 && ` (v${doc.version})`}
                        </div>
                      </div>
                    </div>
                    {!doc.is_initial && (
                      <span className="text-xs text-neon-cyan bg-neon-cyan/20 px-2 py-1 rounded">
                        Nuevo
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No hay documentos cargados
              </div>
            )}
            
            {/* Indicador si necesita re-análisis */}
            {workspace.documents_processed === false && (
              <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-yellow-400 font-medium mb-2">
                      Hay documentos nuevos. Se recomienda re-analizar el proyecto.
                    </p>
                    <NeonButton
                      size="sm"
                      onClick={handleReAnalyze}
                      disabled={analyzing}
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Re-analizando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Re-analizar Proyecto
                        </>
                      )}
                    </NeonButton>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Analysis Section */}
          {workspace.analysis && (
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">Análisis del Proyecto</h3>
                  {workspace.analysis_version && workspace.analysis_version > 1 && (
                    <span className="text-xs text-neon-cyan bg-neon-cyan/20 px-2 py-1 rounded">
                      v{workspace.analysis_version}
                    </span>
                  )}
                  {workspace.last_analysis_at && (
                    <span className="text-xs text-gray-500">
                      {new Date(workspace.last_analysis_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAnalysis(!showAnalysis)}
                    className="text-sm text-neon-cyan hover:text-neon-blue transition"
                  >
                    {showAnalysis ? 'Ocultar' : 'Mostrar'}
                  </button>
                  {workspace.documents_processed === false && (
                    <NeonButton
                      size="sm"
                      variant="purple"
                      onClick={handleReAnalyze}
                      disabled={analyzing}
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Re-analizando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Re-analizar
                        </>
                      )}
                    </NeonButton>
                  )}
                </div>
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
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">{features.length} total</span>
                <NeonButton
                  size="sm"
                  onClick={() => navigate(`/workspaces/${id}/features/new`)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Gestionar
                </NeonButton>
              </div>
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
              <div className="space-y-6">
                {/* Ideas */}
                {groupedFeatures.ideas && groupedFeatures.ideas.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-purple-400" />
                      Ideas ({groupedFeatures.ideas.length})
                    </h4>
                    <div className="space-y-2">
                      {groupedFeatures.ideas.map((feature: any) => (
                        <div
                          key={feature.id}
                          className="p-3 glass-card rounded-lg hover:bg-white/5 transition group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="text-sm font-medium text-white group-hover:text-neon-blue transition">
                                  {feature.name}
                                </h5>
                                <FeatureStatusBadge status={feature.status} isIdea={feature.is_idea} />
                              </div>
                              <p className="text-xs text-gray-500">
                                {new Date(feature.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <NeonButton
                                size="xs"
                                variant="purple"
                                onClick={() => navigate(`/projects/${feature.id}/brief`)}
                              >
                                Brief iterativo
                              </NeonButton>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Backlog */}
                {groupedFeatures.backlog && groupedFeatures.backlog.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                      <ListIcon className="w-4 h-4 text-yellow-400" />
                      Backlog ({groupedFeatures.backlog.length})
                    </h4>
                    <div className="space-y-2">
                      {groupedFeatures.backlog.map((feature: any) => (
                        <div
                          key={feature.id}
                          className="p-3 glass-card rounded-lg hover:bg-white/5 transition group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="text-sm font-medium text-white group-hover:text-neon-blue transition">
                                  {feature.name}
                                </h5>
                                <FeatureStatusBadge status={feature.status} />
                              </div>
                              <p className="text-xs text-gray-500">
                                {new Date(feature.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <NeonButton
                                size="xs"
                                variant="purple"
                                onClick={() => navigate(`/projects/${feature.id}/brief`)}
                              >
                                Brief iterativo
                              </NeonButton>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* En Proceso */}
                {groupedFeatures.in_progress && groupedFeatures.in_progress.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-neon-blue" />
                      En Proceso ({groupedFeatures.in_progress.length})
                    </h4>
                    <div className="space-y-2">
                      {groupedFeatures.in_progress.map((feature: any) => (
                        <div
                          key={feature.id}
                          className="p-3 glass-card rounded-lg hover:bg-white/5 transition group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="text-sm font-medium text-white group-hover:text-neon-blue transition">
                                  {feature.name}
                                </h5>
                                <FeatureStatusBadge status={feature.status} />
                                {feature.prd_built && (
                                  <span className="text-xs text-green-400">✓ PRD</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">
                                {new Date(feature.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {!feature.prd_built ? (
                                <NeonButton
                                  size="xs"
                                  variant="purple"
                                  onClick={() => navigate(`/projects/${feature.id}/brief`)}
                                >
                                  Brief iterativo
                                </NeonButton>
                              ) : (
                                <NeonButton
                                  size="xs"
                                  variant="cyan"
                                  onClick={() => navigate(`/prd/${feature.id}`)}
                                >
                                  Ver PRD
                                </NeonButton>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completadas */}
                {groupedFeatures.completed && groupedFeatures.completed.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      Completadas ({groupedFeatures.completed.length})
                    </h4>
                    <div className="space-y-2">
                      {groupedFeatures.completed.map((feature: any) => (
                        <div
                          key={feature.id}
                          onClick={() => navigate(`/projects/${feature.id}`)}
                          className="p-3 glass-card rounded-lg hover:bg-white/5 transition cursor-pointer group opacity-75"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="text-sm font-medium text-white group-hover:text-neon-blue transition">
                                  {feature.name}
                                </h5>
                                <FeatureStatusBadge status={feature.status} />
                              </div>
                              <p className="text-xs text-gray-500">
                                {new Date(feature.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Add Documents Modal */}
      {id && (
        <AddDocumentsModal
          workspaceId={id}
          isOpen={showAddDocuments}
          onClose={() => setShowAddDocuments(false)}
          onSuccess={handleDocumentsAdded}
        />
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import GlassCard from '../components/ui/GlassCard'
import NeonButton from '../components/ui/NeonButton'
import FeatureSuggestionCard from '../components/workspace/FeatureSuggestionCard'
import FeatureStatusBadge from '../components/workspace/FeatureStatusBadge'
import { workspaceService, type FeatureSuggestion } from '../services/workspaceService'
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Plus,
  FileText,
  Lightbulb,
  List,
  CheckCircle,
  X,
  Upload
} from 'lucide-react'

type TabType = 'suggestions' | 'create' | 'all'

export default function CreateWorkspaceFeature() {
  const { id: workspaceId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('suggestions')
  const [suggestions, setSuggestions] = useState<FeatureSuggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [features, setFeatures] = useState<any[]>([])
  const [groupedFeatures, setGroupedFeatures] = useState<any>({})
  const [loadingFeatures, setLoadingFeatures] = useState(true)

  // Form state
  const [featureName, setFeatureName] = useState('')
  const [featureDescription, setFeatureDescription] = useState('')
  const [featureStatus, setFeatureStatus] = useState('idea')
  const [featureFiles, setFeatureFiles] = useState<File[]>([])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (workspaceId) {
      loadFeatures()
      loadSuggestions()
    }
  }, [workspaceId])

  const loadSuggestions = async () => {
    if (!workspaceId) return
    setLoadingSuggestions(true)
    try {
      const data = await workspaceService.getFeatureSuggestions(workspaceId)
      setSuggestions(data.suggestions)
    } catch (error) {
      console.error('Error loading suggestions:', error)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const loadFeatures = async () => {
    if (!workspaceId) return
    setLoadingFeatures(true)
    try {
      const data = await workspaceService.getWorkspaceFeatures(workspaceId)
      setFeatures(data.features)
      setGroupedFeatures(data.grouped)
    } catch (error) {
      console.error('Error loading features:', error)
    } finally {
      setLoadingFeatures(false)
    }
  }

  const handleSuggestionAction = async (suggestionId: string, action: 'accepted' | 'backlog' | 'discarded') => {
    if (!workspaceId) return

    try {
      const suggestion = suggestions.find(s => s.id === suggestionId)
      if (!suggestion) return

      // Si es "accepted", crear la feature primero
      if (action === 'accepted') {
        await workspaceService.createFeature(
          workspaceId,
          suggestion.name,
          'in_progress',
          suggestion.description
        )
      } else if (action === 'backlog') {
        // Si es backlog, crear como idea o backlog
        await workspaceService.createFeature(
          workspaceId,
          suggestion.name,
          'backlog',
          suggestion.description
        )
      }

      // Actualizar estado de la sugerencia
      await workspaceService.updateSuggestionStatus(workspaceId, suggestionId, action)

      // Recargar datos
      await loadSuggestions()
      await loadFeatures()
    } catch (error: any) {
      console.error('Error processing suggestion:', error)
      alert(error.response?.data?.detail || 'Error procesando la sugerencia')
    }
  }

  const handleCreateFeature = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceId || !featureName.trim()) return

    setCreating(true)
    try {
      await workspaceService.createFeature(
        workspaceId,
        featureName,
        featureStatus,
        featureDescription || undefined,
        featureFiles.length > 0 ? featureFiles : undefined
      )

      // Limpiar formulario
      setFeatureName('')
      setFeatureDescription('')
      setFeatureStatus('idea')
      setFeatureFiles([])

      // Recargar features
      await loadFeatures()

      // Si no es idea, redirigir a la feature
      if (featureStatus !== 'idea') {
        // Necesitaríamos el ID de la feature creada, por ahora solo recargamos
        alert('Feature creada exitosamente')
      } else {
        alert('Idea creada exitosamente')
      }
    } catch (error: any) {
      console.error('Error creating feature:', error)
      alert(error.response?.data?.detail || 'Error creando la feature')
    } finally {
      setCreating(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFeatureFiles(Array.from(e.target.files))
    }
  }

  const removeFile = (index: number) => {
    setFeatureFiles(prev => prev.filter((_, i) => i !== index))
  }

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending')

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/workspaces/${workspaceId}`)}
            className="p-2 hover:bg-white/5 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Gestionar Features</h1>
            <p className="text-gray-400">Crea y gestiona features del proyecto</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`px-4 py-2 rounded-t-lg transition ${
            activeTab === 'suggestions'
              ? 'bg-neon-purple/20 text-neon-purple border-b-2 border-neon-purple'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 inline mr-2" />
          Sugerencias AI
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 rounded-t-lg transition ${
            activeTab === 'create'
              ? 'bg-neon-cyan/20 text-neon-cyan border-b-2 border-neon-cyan'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Crear Manual
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-t-lg transition ${
            activeTab === 'all'
              ? 'bg-neon-blue/20 text-neon-blue border-b-2 border-neon-blue'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <List className="w-4 h-4 inline mr-2" />
          Ver Todas
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Tab: Sugerencias */}
        {activeTab === 'suggestions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Sugerencias de Features</h2>
              <NeonButton
                onClick={loadSuggestions}
                disabled={loadingSuggestions}
              >
                {loadingSuggestions ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generar Sugerencias
                  </>
                )}
              </NeonButton>
            </div>

            {loadingSuggestions && suggestions.length === 0 ? (
              <GlassCard className="p-12 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-neon-blue animate-spin mb-4" />
                <p className="text-gray-400">Generando sugerencias...</p>
              </GlassCard>
            ) : pendingSuggestions.length === 0 ? (
              <GlassCard className="p-12 flex flex-col items-center justify-center">
                <Sparkles className="w-12 h-12 text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  No hay sugerencias pendientes
                </h3>
                <p className="text-gray-400 mb-4">
                  {suggestions.length > 0
                    ? 'Todas las sugerencias han sido procesadas'
                    : 'Genera sugerencias basadas en el análisis del proyecto'}
                </p>
                <NeonButton onClick={loadSuggestions}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generar Sugerencias
                </NeonButton>
              </GlassCard>
            ) : (
              <div className="space-y-4">
                {pendingSuggestions.map((suggestion) => (
                  <FeatureSuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onAccept={() => handleSuggestionAction(suggestion.id, 'accepted')}
                    onBacklog={() => handleSuggestionAction(suggestion.id, 'backlog')}
                    onDiscard={() => handleSuggestionAction(suggestion.id, 'discarded')}
                    onMarkCompleted={() => handleSuggestionAction(suggestion.id, 'accepted')}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Crear Manual */}
        {activeTab === 'create' && (
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Crear Feature Manualmente</h2>
            <form onSubmit={handleCreateFeature} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Nombre de la Feature *
                </label>
                <input
                  type="text"
                  value={featureName}
                  onChange={(e) => setFeatureName(e.target.value)}
                  placeholder="Ej: Sistema de Autenticación"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-blue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={featureDescription}
                  onChange={(e) => setFeatureDescription(e.target.value)}
                  placeholder="Describe brevemente la feature..."
                  rows={3}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-blue resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Estado
                </label>
                <select
                  value={featureStatus}
                  onChange={(e) => setFeatureStatus(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-blue"
                >
                  <option value="idea">Idea (solo título, sin documentos)</option>
                  <option value="backlog">Backlog (para desarrollar después)</option>
                  <option value="in_progress">En Proceso (con documentos)</option>
                </select>
              </div>

              {featureStatus !== 'idea' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Archivos (opcional)
                  </label>
                  <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center hover:border-neon-blue/50 transition">
                    <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                    <label className="cursor-pointer">
                      <span className="text-neon-blue hover:text-neon-cyan transition">
                        Click para seleccionar archivos
                      </span>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.txt,.md,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {featureFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {featureFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-white/5 rounded"
                        >
                          <span className="text-sm text-white">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/workspaces/${workspaceId}`)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition"
                >
                  Cancelar
                </button>
                <NeonButton type="submit" disabled={creating || !featureName.trim()}>
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Crear Feature
                    </>
                  )}
                </NeonButton>
              </div>
            </form>
          </GlassCard>
        )}

        {/* Tab: Ver Todas */}
        {activeTab === 'all' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Todas las Features</h2>

            {loadingFeatures ? (
              <GlassCard className="p-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-neon-blue animate-spin" />
              </GlassCard>
            ) : (
              <>
                {/* Ideas */}
                {groupedFeatures.ideas && groupedFeatures.ideas.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-purple-400" />
                      Ideas ({groupedFeatures.ideas.length})
                    </h3>
                    <div className="space-y-3">
                      {groupedFeatures.ideas.map((feature: any) => (
                        <GlassCard
                          key={feature.id}
                          className="p-4 hover:bg-white/5 transition cursor-pointer"
                          onClick={() => navigate(`/projects/${feature.id}`)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-md font-medium text-white">{feature.name}</h4>
                                <FeatureStatusBadge status={feature.status} isIdea={feature.is_idea} />
                              </div>
                              <p className="text-xs text-gray-500">
                                Creada: {new Date(feature.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <FileText className="w-5 h-5 text-gray-400" />
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                  </div>
                )}

                {/* Backlog */}
                {groupedFeatures.backlog && groupedFeatures.backlog.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <List className="w-5 h-5 text-yellow-400" />
                      Backlog ({groupedFeatures.backlog.length})
                    </h3>
                    <div className="space-y-3">
                      {groupedFeatures.backlog.map((feature: any) => (
                        <GlassCard
                          key={feature.id}
                          className="p-4 hover:bg-white/5 transition cursor-pointer"
                          onClick={() => navigate(`/projects/${feature.id}`)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-md font-medium text-white">{feature.name}</h4>
                                <FeatureStatusBadge status={feature.status} />
                              </div>
                              <p className="text-xs text-gray-500">
                                Creada: {new Date(feature.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <FileText className="w-5 h-5 text-gray-400" />
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                  </div>
                )}

                {/* En Proceso */}
                {groupedFeatures.in_progress && groupedFeatures.in_progress.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-neon-blue" />
                      En Proceso ({groupedFeatures.in_progress.length})
                    </h3>
                    <div className="space-y-3">
                      {groupedFeatures.in_progress.map((feature: any) => (
                        <GlassCard
                          key={feature.id}
                          className="p-4 hover:bg-white/5 transition cursor-pointer"
                          onClick={() => navigate(`/projects/${feature.id}`)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-md font-medium text-white">{feature.name}</h4>
                                <FeatureStatusBadge status={feature.status} />
                                {feature.prd_built && (
                                  <span className="text-xs text-green-400">✓ PRD Generado</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">
                                Creada: {new Date(feature.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <FileText className="w-5 h-5 text-gray-400" />
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completadas */}
                {groupedFeatures.completed && groupedFeatures.completed.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      Completadas ({groupedFeatures.completed.length})
                    </h3>
                    <div className="space-y-3">
                      {groupedFeatures.completed.map((feature: any) => (
                        <GlassCard
                          key={feature.id}
                          className="p-4 hover:bg-white/5 transition cursor-pointer"
                          onClick={() => navigate(`/projects/${feature.id}`)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-md font-medium text-white">{feature.name}</h4>
                                <FeatureStatusBadge status={feature.status} />
                              </div>
                              <p className="text-xs text-gray-500">
                                Creada: {new Date(feature.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                  </div>
                )}

                {/* Descartadas */}
                {groupedFeatures.discarded && groupedFeatures.discarded.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <X className="w-5 h-5 text-gray-400" />
                      Descartadas ({groupedFeatures.discarded.length})
                    </h3>
                    <div className="space-y-3">
                      {groupedFeatures.discarded.map((feature: any) => (
                        <GlassCard
                          key={feature.id}
                          className="p-4 hover:bg-white/5 transition cursor-pointer opacity-60"
                          onClick={() => navigate(`/projects/${feature.id}`)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-md font-medium text-white">{feature.name}</h4>
                                <FeatureStatusBadge status={feature.status} />
                              </div>
                              <p className="text-xs text-gray-500">
                                Creada: {new Date(feature.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <X className="w-5 h-5 text-gray-500" />
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                  </div>
                )}

                {features.length === 0 && (
                  <GlassCard className="p-12 flex flex-col items-center justify-center">
                    <FileText className="w-12 h-12 text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No hay features aún</h3>
                    <p className="text-gray-400 mb-4">Crea tu primera feature desde las sugerencias o manualmente</p>
                    <NeonButton onClick={() => setActiveTab('suggestions')}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Ver Sugerencias
                    </NeonButton>
                  </GlassCard>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

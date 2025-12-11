import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import GlassCard from '../ui/GlassCard'
import NeonButton from '../ui/NeonButton'
import InteractiveQuestions from './InteractiveQuestions'
import { 
  FileText, 
  Search, 
  MessageSquare, 
  FileCheck, 
  GitBranch,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  X,
  AlertTriangle,
  Info,
  HelpCircle
} from 'lucide-react'
import { projectService } from '../../services/projectService'

interface ActionPanelProps {
  projectId: string
  projectState?: any
  onStateUpdate?: () => void
}

interface ActionStatus {
  id: string
  label: string
  icon: any
  endpoint: string
  status: 'available' | 'in_progress' | 'completed' | 'error'
  description: string
  requires?: string[]
}

export default function ActionPanel({ projectId, projectState, onStateUpdate }: ActionPanelProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState<string | null>(null)
  const [resultsData, setResultsData] = useState<any>(null)
  const [showInteractiveQuestions, setShowInteractiveQuestions] = useState(false)

  const actions: ActionStatus[] = [
    {
      id: 'process-inputs',
      label: 'Procesar Archivos',
      icon: FileText,
      endpoint: 'process-inputs',
      status: projectState?.inputs_processed ? 'completed' : 'available',
      description: 'Procesa los archivos cargados y genera el contexto unificado'
    },
    {
      id: 'analyze-gaps',
      label: 'Analizar Gaps',
      icon: Search,
      endpoint: 'analyze-gaps',
      status: projectState?.gaps_analyzed ? 'completed' : (projectState?.inputs_processed ? 'available' : 'available'),
      description: 'Analiza el contexto y detecta información faltante',
      requires: ['inputs_processed']
    },
    {
      id: 'generate-questions',
      label: 'Generar Preguntas',
      icon: MessageSquare,
      endpoint: 'generate-questions',
      status: projectState?.questions_generated ? 'completed' : (projectState?.gaps_analyzed ? 'available' : 'available'),
      description: 'Genera preguntas interactivas para completar información',
      requires: ['gaps_analyzed']
    },
    {
      id: 'build-prd',
      label: 'Construir PRD',
      icon: FileCheck,
      endpoint: 'build-prd',
      status: projectState?.prd_built ? 'completed' : (projectState?.gaps_analyzed ? 'available' : 'available'),
      description: 'Construye el PRD completo basado en el análisis y las respuestas del usuario',
      requires: ['gaps_analyzed']
    },
    {
      id: 'generate-backlog',
      label: 'Generar Backlog Jira',
      icon: GitBranch,
      endpoint: 'generate-backlog',
      status: projectState?.backlog_generated ? 'completed' : (projectState?.prd_built ? 'available' : 'available'),
      description: 'Genera el backlog de Jira desde el PRD',
      requires: ['prd_built']
    }
  ]

  const handleAction = async (action: ActionStatus) => {
    if (action.status !== 'available' || loading) return

    // Check requirements
    if (action.requires) {
      const missing = action.requires.filter(req => !projectState?.[req])
      if (missing.length > 0) {
        setError(`Primero debes completar: ${missing.join(', ')}`)
        return
      }
    }

    // Special handling for generate-questions: open interactive modal
    if (action.id === 'generate-questions') {
      setShowInteractiveQuestions(true)
      return
    }

    setLoading(action.id)
    setError(null)

    try {
      const result = await projectService.executeAction(projectId, action.endpoint)
      
      // Show success message for build-prd with user answers info
      if (action.id === 'build-prd' && result?.user_answers_count > 0) {
        console.log(`✅ PRD construido con ${result.user_answers_count} respuestas del usuario`)
        console.log(`   Secciones completadas: ${result.user_answers_used?.join(', ')}`)
      }
      
      if (onStateUpdate) {
        onStateUpdate()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Error ejecutando ${action.label}`)
    } finally {
      setLoading(null)
    }
  }

  const handleViewResult = async (action: ActionStatus) => {
    if (action.status !== 'completed') return

    setError(null)
    setLoading(action.id)

    try {
      switch (action.id) {
        case 'analyze-gaps':
          // Obtener gaps ya analizados
          const gapsData = await projectService.getGaps(projectId)
          setResultsData(gapsData)
          setShowResults('gaps')
          break
        
        case 'generate-questions':
          // Open interactive session
          setShowInteractiveQuestions(true)
          break
        
        case 'build-prd':
          // Navegar a PRD Viewer
          navigate(`/prd/${projectId}`)
          break
        
        case 'generate-backlog':
          // Mostrar backlog o descargar
          const backlog = await projectService.getBacklog(projectId)
          setResultsData(backlog)
          setShowResults('backlog')
          break
        
        case 'process-inputs':
          // Mostrar contexto
          const context = await projectService.getContext(projectId)
          setResultsData(context)
          setShowResults('context')
          break
        
        default:
          break
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Error cargando resultados'
      setError(errorMessage)
      console.error('Error viewing result:', err)
    } finally {
      setLoading(null)
    }
  }

  const getStatusIcon = (action: ActionStatus) => {
    if (loading === action.id) {
      return <Loader2 className="w-5 h-5 animate-spin text-neon-blue" />
    }
    
    switch (action.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-400" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      default:
        return <action.icon className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (action: ActionStatus) => {
    switch (action.status) {
      case 'completed':
        return 'border-green-500/30 bg-green-500/10'
      case 'in_progress':
        return 'border-yellow-500/30 bg-yellow-500/10'
      case 'error':
        return 'border-red-500/30 bg-red-500/10'
      default:
        return 'border-white/10'
    }
  }

  return (
    <GlassCard className="p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Acciones del Proyecto</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon
          const isDisabled = action.status !== 'available' || loading !== null
          const isActionLoading = loading === action.id

          return (
            <div
              key={action.id}
              className={`p-4 glass-card rounded-lg border-2 transition ${getStatusColor(action)}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(action)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white mb-1">{action.label}</h3>
                  <p className="text-xs text-gray-400 mb-3">{action.description}</p>
                  {action.status === 'completed' ? (
                    <NeonButton
                      onClick={() => handleViewResult(action)}
                      variant="cyan"
                      className="text-xs py-1 px-3"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Ver Resultado
                    </NeonButton>
                  ) : (
                    <NeonButton
                      onClick={() => handleAction(action)}
                      disabled={isDisabled}
                      variant="blue"
                      className="text-xs py-1 px-3"
                    >
                      {isActionLoading ? 'Procesando...' : 'Ejecutar'}
                    </NeonButton>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Results Modal */}
      {showResults && resultsData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <GlassCard className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 bg-dark-primary/95 border-2 border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                {showResults === 'gaps' && 'Gaps Detectados'}
                {showResults === 'questions' && 'Preguntas Generadas'}
                {showResults === 'backlog' && 'Backlog Jira'}
                {showResults === 'context' && 'Contexto Procesado'}
              </h3>
              <button
                onClick={() => {
                  setShowResults(null)
                  setResultsData(null)
                }}
                className="text-gray-400 hover:text-white transition p-1 hover:bg-white/10 rounded"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {showResults === 'gaps' && resultsData.gaps && (
              <div className="space-y-4">
                {/* Summary Header */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                  <div>
                    <p className="text-sm text-gray-400">
                      Se detectaron <span className="text-white font-semibold">{resultsData.gaps_count}</span> gaps en el análisis
                    </p>
                  </div>
                  <div className="flex gap-3 text-xs">
                    {(() => {
                      const critical = resultsData.gaps.filter((g: any) => g.priority === 'critical').length
                      const important = resultsData.gaps.filter((g: any) => g.priority === 'important').length
                      const optional = resultsData.gaps.filter((g: any) => g.priority === 'optional').length
                      return (
                        <>
                          {critical > 0 && (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded border border-red-500/30">
                              {critical} Crítico{critical !== 1 ? 's' : ''}
                            </span>
                          )}
                          {important > 0 && (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/30">
                              {important} Importante{important !== 1 ? 's' : ''}
                            </span>
                          )}
                          {optional > 0 && (
                            <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded border border-gray-500/30">
                              {optional} Opcional{optional !== 1 ? 'es' : ''}
                            </span>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* Gap Cards */}
                <div className="space-y-4">
                  {resultsData.gaps.map((gap: any, i: number) => {
                    const getPriorityConfig = (priority: string) => {
                      switch (priority) {
                        case 'critical':
                          return {
                            color: 'red',
                            borderColor: 'border-red-500/50',
                            bgColor: 'bg-red-500/10',
                            textColor: 'text-red-400',
                            badgeColor: 'bg-red-500/20 border-red-500/30 text-red-400',
                            icon: AlertTriangle
                          }
                        case 'important':
                          return {
                            color: 'yellow',
                            borderColor: 'border-yellow-500/50',
                            bgColor: 'bg-yellow-500/10',
                            textColor: 'text-yellow-400',
                            badgeColor: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
                            icon: Info
                          }
                        default:
                          return {
                            color: 'gray',
                            borderColor: 'border-gray-500/50',
                            bgColor: 'bg-gray-500/10',
                            textColor: 'text-gray-400',
                            badgeColor: 'bg-gray-500/20 border-gray-500/30 text-gray-400',
                            icon: HelpCircle
                          }
                      }
                    }
                    
                    const priorityConfig = getPriorityConfig(gap.priority)
                    const PriorityIcon = priorityConfig.icon

                    return (
                      <div
                        key={i}
                        className={`p-5 glass-card rounded-lg border-l-4 ${priorityConfig.borderColor} ${priorityConfig.bgColor} transition hover:bg-white/5`}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <PriorityIcon className={`w-5 h-5 ${priorityConfig.textColor} mt-0.5 flex-shrink-0`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-base font-semibold text-white">{gap.section_title}</h4>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityConfig.badgeColor}`}>
                                  {gap.priority_label}
                                </span>
                              </div>
                              {gap.description && (
                                <p className="text-sm text-gray-300 mb-2">{gap.description}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Context Information */}
                        {gap.context && (
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <p className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
                              <Info className="w-3 h-3" />
                              Contexto disponible:
                            </p>
                            <div className="text-xs text-gray-300 bg-white/5 p-3 rounded border border-white/10 whitespace-pre-line">
                              {gap.context}
                            </div>
                          </div>
                        )}

                        {/* Guiding Questions */}
                        {gap.guiding_questions && gap.guiding_questions.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <p className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
                              <HelpCircle className="w-3 h-3" />
                              Preguntas guía para completar esta sección:
                            </p>
                            <ul className="space-y-1.5">
                              {gap.guiding_questions.map((question: string, qIdx: number) => (
                                <li key={qIdx} className="text-xs text-gray-300 flex items-start gap-2">
                                  <span className="text-neon-cyan mt-1">•</span>
                                  <span>{question}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Question and Options (if available) */}
                        {gap.question && (
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <p className="text-xs font-medium text-gray-400 mb-2">Pregunta generada:</p>
                            <p className="text-sm text-gray-300">{gap.question}</p>
                            {gap.options && gap.options.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {gap.options.map((option: string, optIdx: number) => (
                                  <span
                                    key={optIdx}
                                    className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-300"
                                  >
                                    {option}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {showResults === 'questions' && resultsData.questions && (
              <div className="space-y-3">
                <p className="text-sm text-gray-400 mb-4">
                  {resultsData.questions.length} preguntas generadas
                </p>
                {resultsData.questions.map((q: any, i: number) => (
                  <div key={i} className="p-4 glass-card rounded-lg">
                    <h4 className="text-sm font-medium text-white mb-1">{q.section_title}</h4>
                    <p className="text-sm text-gray-300">{q.question}</p>
                  </div>
                ))}
              </div>
            )}

            {showResults === 'backlog' && resultsData.items && (
              <div className="space-y-3">
                <p className="text-sm text-gray-400 mb-4">
                  {resultsData.items.length} items en el backlog
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 px-3 text-gray-400">Tipo</th>
                        <th className="text-left py-2 px-3 text-gray-400">Resumen</th>
                        <th className="text-left py-2 px-3 text-gray-400">Prioridad</th>
                        <th className="text-left py-2 px-3 text-gray-400">Story Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultsData.items.slice(0, 10).map((item: any, i: number) => (
                        <tr key={i} className="border-b border-white/5">
                          <td className="py-2 px-3 text-white">{item.issue_type}</td>
                          <td className="py-2 px-3 text-gray-300">{item.summary}</td>
                          <td className="py-2 px-3 text-gray-300">{item.priority}</td>
                          <td className="py-2 px-3 text-gray-300">{item.story_points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {resultsData.items.length > 10 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Mostrando 10 de {resultsData.items.length} items
                  </p>
                )}
              </div>
            )}

            {showResults === 'context' && resultsData.context && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-400">
                    Contexto procesado ({resultsData.length} caracteres)
                  </p>
                  <span className="text-xs text-gray-500">
                    Idioma: {resultsData.language_code}
                  </span>
                </div>
                <div className="p-4 glass-card rounded-lg max-h-96 overflow-y-auto">
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                    {resultsData.context.substring(0, 2000)}
                    {resultsData.context.length > 2000 && '...'}
                  </pre>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* Interactive Questions Modal */}
      {showInteractiveQuestions && (
        <InteractiveQuestions
          projectId={projectId}
          onClose={() => setShowInteractiveQuestions(false)}
          onComplete={() => {
            setShowInteractiveQuestions(false)
            if (onStateUpdate) {
              onStateUpdate()
            }
          }}
        />
      )}
    </GlassCard>
  )
}


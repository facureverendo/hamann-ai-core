import { useState, useEffect } from 'react'
import GlassCard from '../ui/GlassCard'
import NeonButton from '../ui/NeonButton'
import {
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  HelpCircle,
  CheckCircle2,
  SkipForward,
  RefreshCw,
  Save,
  Loader2
} from 'lucide-react'
import { projectService } from '../../services/projectService'

interface InteractiveQuestionsProps {
  projectId: string
  onClose: () => void
  onComplete: () => void
}

interface Question {
  section_key: string
  section_title: string
  priority: 'critical' | 'important' | 'optional'
  question: string
  context: string
  options?: string[]
  answered?: boolean
  skipped?: boolean
  answer?: string
}

interface SessionState {
  questions_by_priority: {
    critical: Question[]
    important: Question[]
    optional: Question[]
  }
  answered_count: number
  skipped_count: number
  pending_count: number
  regeneration_count: number
  previous_answers?: Array<{
    section_key: string
    section_title: string
    question: string
    answer: string
    skipped: boolean
  }>
}

export default function InteractiveQuestions({ projectId, onClose, onComplete }: InteractiveQuestionsProps) {
  const [sessionState, setSessionState] = useState<SessionState | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [expandedPriority, setExpandedPriority] = useState<string | null>('critical')
  const [answers, setAnswers] = useState<{ [key: string]: string }>({})
  const [savingAnswer, setSavingAnswer] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load session on mount
  useEffect(() => {
    loadSession()
  }, [projectId])

  const loadSession = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await projectService.getInteractiveSession(projectId)
      console.log('Session loaded:', response)
      
      // Show message if using cached questions
      if (response.cached) {
        console.log('📦 Usando preguntas en caché (sin costo de API)')
      } else {
        console.log('🔄 Preguntas generadas con API')
      }
      
      setSessionState(response)
      
      // Pre-fill answers from previous session
      if (response.previous_answers) {
        const prevAnswers: { [key: string]: string } = {}
        response.previous_answers.forEach((ans: any) => {
          if (!ans.skipped) {
            prevAnswers[ans.section_key] = ans.answer
          }
        })
        setAnswers(prevAnswers)
      }
      
      // Auto-expand first non-empty priority
      if (response.questions_by_priority.critical.length > 0) {
        setExpandedPriority('critical')
      } else if (response.questions_by_priority.important.length > 0) {
        setExpandedPriority('important')
      } else if (response.questions_by_priority.optional.length > 0) {
        setExpandedPriority('optional')
      }
    } catch (err: any) {
      console.error('Error loading session:', err)
      setError(err?.response?.data?.detail || err?.message || 'Error cargando sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAnswer = async (question: Question) => {
    const answer = answers[question.section_key]
    if (!answer || answer.trim() === '') {
      setError('Por favor escribe una respuesta')
      return
    }

    setSavingAnswer(question.section_key)
    setError(null)
    try {
      await projectService.saveAnswer(projectId, {
        section_key: question.section_key,
        answer: answer.trim(),
        skipped: false,
        question: question.question,
        section_title: question.section_title
      })
      
      // Update session state with new answer
      if (sessionState) {
        const updatedState = { ...sessionState }
        updatedState.answered_count += 1
        
        // Add to previous_answers if not already there
        const existingAnswerIndex = updatedState.previous_answers?.findIndex(
          (ans) => ans.section_key === question.section_key
        )
        
        const newAnswer = {
          section_key: question.section_key,
          section_title: question.section_title,
          question: question.question,
          answer: answer.trim(),
          skipped: false
        }
        
        if (existingAnswerIndex !== undefined && existingAnswerIndex >= 0 && updatedState.previous_answers) {
          updatedState.previous_answers[existingAnswerIndex] = newAnswer
        } else {
          if (!updatedState.previous_answers) {
            updatedState.previous_answers = []
          }
          updatedState.previous_answers.push(newAnswer)
        }
        
        setSessionState(updatedState)
      }
      
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Error guardando respuesta')
    } finally {
      setSavingAnswer(null)
    }
  }

  const handleSkipQuestion = async (question: Question) => {
    setSavingAnswer(question.section_key)
    setError(null)
    try {
      await projectService.saveAnswer(projectId, {
        section_key: question.section_key,
        answer: '',
        skipped: true,
        question: question.question,
        section_title: question.section_title
      })
      
      // Update session state
      if (sessionState) {
        const updatedState = { ...sessionState }
        updatedState.skipped_count += 1
        
        // Add to previous_answers as skipped
        const existingAnswerIndex = updatedState.previous_answers?.findIndex(
          (ans) => ans.section_key === question.section_key
        )
        
        const newSkip = {
          section_key: question.section_key,
          section_title: question.section_title,
          question: question.question,
          answer: '',
          skipped: true
        }
        
        if (existingAnswerIndex !== undefined && existingAnswerIndex >= 0 && updatedState.previous_answers) {
          updatedState.previous_answers[existingAnswerIndex] = newSkip
        } else {
          if (!updatedState.previous_answers) {
            updatedState.previous_answers = []
          }
          updatedState.previous_answers.push(newSkip)
        }
        
        setSessionState(updatedState)
      }
      
      // Clear answer field
      const newAnswers = { ...answers }
      delete newAnswers[question.section_key]
      setAnswers(newAnswers)
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Error saltando pregunta')
    } finally {
      setSavingAnswer(null)
    }
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    setError(null)
    try {
      console.log('🔄 Regenerando preguntas (llamada a API)...')
      const response = await projectService.regenerateQuestions(projectId)
      setSessionState(response)
      
      // Auto-expand first non-empty priority
      if (response.questions_by_priority.critical.length > 0) {
        setExpandedPriority('critical')
      } else if (response.questions_by_priority.important.length > 0) {
        setExpandedPriority('important')
      } else if (response.questions_by_priority.optional.length > 0) {
        setExpandedPriority('optional')
      }
      
      // Show success message
      console.log('✅ Preguntas regeneradas exitosamente')
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Error regenerando preguntas')
    } finally {
      setRegenerating(false)
    }
  }

  const handleFinalize = async () => {
    setLoading(true)
    setError(null)
    try {
      await projectService.finalizeSession(projectId)
      onComplete()
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Error finalizando sesión')
      setLoading(false)
    }
  }

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'critical':
        return {
          label: 'Críticas',
          icon: AlertTriangle,
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/50',
          count: sessionState?.questions_by_priority.critical.length || 0
        }
      case 'important':
        return {
          label: 'Importantes',
          icon: Info,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/50',
          count: sessionState?.questions_by_priority.important.length || 0
        }
      case 'optional':
        return {
          label: 'Opcionales',
          icon: HelpCircle,
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/50',
          count: sessionState?.questions_by_priority.optional.length || 0
        }
      default:
        return {
          label: 'Desconocidas',
          icon: HelpCircle,
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/50',
          count: 0
        }
    }
  }

  const renderQuestionCard = (question: Question, index: number) => {
    const isAnswered = sessionState?.previous_answers?.some(
      (ans) => ans.section_key === question.section_key && !ans.skipped
    )
    const isSkipped = sessionState?.previous_answers?.some(
      (ans) => ans.section_key === question.section_key && ans.skipped
    )
    const isSaving = savingAnswer === question.section_key

    return (
      <div
        key={`${question.section_key}-${index}`}
        className={`p-5 glass-card rounded-lg border-l-4 transition-all ${
          isAnswered
            ? 'border-green-500 bg-green-500/10 opacity-90'
            : isSkipped
            ? 'border-gray-500 bg-gray-500/10 opacity-75'
            : 'border-blue-500/50 bg-white/5 opacity-100 hover:border-blue-500 hover:bg-white/10'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-base font-semibold text-white">{question.section_title}</h4>
              {isAnswered && <CheckCircle2 className="w-4 h-4 text-green-400" />}
              {isSkipped && <SkipForward className="w-4 h-4 text-gray-400" />}
            </div>
            <p className="text-sm text-gray-300 mb-3">{question.question}</p>
          </div>
        </div>

        {/* Context */}
        {question.context && (
          <div className="mb-3 p-3 bg-white/5 rounded border border-white/10">
            <p className="text-xs font-medium text-gray-400 mb-1">Contexto:</p>
            <p className="text-xs text-gray-300 whitespace-pre-line">{question.context}</p>
          </div>
        )}

        {/* Options */}
        {question.options && question.options.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-400 mb-2">Opciones sugeridas:</p>
            <div className="flex flex-wrap gap-2">
              {question.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setAnswers({ ...answers, [question.section_key]: option })
                  }}
                  className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-300 hover:bg-white/10 transition"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Show saved answer prominently */}
        {isAnswered && sessionState?.previous_answers && (
          <div className="mt-3 p-4 bg-green-500/20 rounded-lg border-2 border-green-500/50">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
              <p className="text-sm font-semibold text-green-400">Respuesta guardada</p>
            </div>
            <p className="text-sm text-white bg-black/20 p-3 rounded border border-green-500/20">
              {sessionState.previous_answers.find((ans) => ans.section_key === question.section_key)?.answer}
            </p>
          </div>
        )}

        {/* Show skipped status */}
        {isSkipped && !isAnswered && (
          <div className="mt-3 p-4 bg-gray-500/20 rounded-lg border-2 border-gray-500/50">
            <div className="flex items-center gap-2">
              <SkipForward className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <p className="text-sm font-semibold text-gray-400">Pregunta saltada</p>
            </div>
          </div>
        )}

        {/* Answer Input - only show if not answered or skipped */}
        {!isAnswered && !isSkipped && (
          <>
            <textarea
              value={answers[question.section_key] || ''}
              onChange={(e) => setAnswers({ ...answers, [question.section_key]: e.target.value })}
              placeholder="Escribe tu respuesta aquí..."
              className="w-full p-3 bg-dark-secondary border border-white/10 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue transition resize-none"
              rows={4}
              disabled={isSaving}
            />

            {/* Action Buttons */}
            <div className="flex gap-2 mt-3">
              <NeonButton
                onClick={() => handleSaveAnswer(question)}
                disabled={isSaving || !answers[question.section_key]?.trim()}
                variant="blue"
                className="text-xs py-2 px-4"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3 mr-1" />
                    Guardar Respuesta
                  </>
                )}
              </NeonButton>
              <NeonButton
                onClick={() => handleSkipQuestion(question)}
                disabled={isSaving}
                variant="cyan"
                className="text-xs py-2 px-4"
              >
                <SkipForward className="w-3 h-3 mr-1" />
                Saltar
              </NeonButton>
            </div>
          </>
        )}
      </div>
    )
  }

  const renderPrioritySection = (priority: 'critical' | 'important' | 'optional') => {
    const config = getPriorityConfig(priority)
    const questions = sessionState?.questions_by_priority[priority] || []
    const Icon = config.icon
    const isExpanded = expandedPriority === priority

    if (questions.length === 0) return null

    return (
      <div key={priority} className="mb-4">
        <button
          onClick={() => setExpandedPriority(isExpanded ? null : priority)}
          className={`w-full p-4 glass-card rounded-lg border-2 ${config.borderColor} ${config.bgColor} flex items-center justify-between hover:bg-white/5 transition`}
        >
          <div className="flex items-center gap-3">
            <Icon className={`w-5 h-5 ${config.color}`} />
            <span className={`font-semibold ${config.color}`}>{config.label}</span>
            <span className="text-sm text-gray-400">({config.count} preguntas)</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-3">
            {questions.map((question, idx) => renderQuestionCard(question, idx))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
        <GlassCard className="p-8 text-center bg-dark-primary/95 border-2 border-white/20">
          <Loader2 className="w-12 h-12 animate-spin text-neon-blue mx-auto mb-4" />
          <p className="text-white">Cargando sesión interactiva...</p>
        </GlassCard>
      </div>
    )
  }

  const totalQuestions =
    (sessionState?.questions_by_priority.critical.length || 0) +
    (sessionState?.questions_by_priority.important.length || 0) +
    (sessionState?.questions_by_priority.optional.length || 0)

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <GlassCard className="max-w-6xl w-full max-h-[95vh] overflow-y-auto p-6 my-4 bg-dark-primary/95 border-2 border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Sesión Interactiva de Preguntas</h2>
            <p className="text-sm text-gray-400">
              Responde las preguntas para completar la información del PRD. Puedes saltar preguntas y re-analizar en cualquier momento.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-2 hover:bg-white/10 rounded"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Progreso</span>
            <div className="flex gap-4 text-sm">
              <span className="text-green-400">✓ {sessionState?.answered_count || 0} respondidas</span>
              <span className="text-gray-400">⊘ {sessionState?.skipped_count || 0} saltadas</span>
              <span className="text-yellow-400">? {totalQuestions} pendientes</span>
            </div>
          </div>
          <div className="h-2 bg-dark-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-neon-blue to-neon-cyan transition-all duration-500"
              style={{
                width: `${
                  totalQuestions > 0 ? ((sessionState?.answered_count || 0) / totalQuestions) * 100 : 0
                }%`
              }}
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <NeonButton
            onClick={handleRegenerate}
            disabled={regenerating || (sessionState?.answered_count || 0) === 0}
            variant="cyan"
            className="text-sm py-2 px-4"
          >
            {regenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Re-analizando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Re-analizar ({sessionState?.regeneration_count || 0} veces)
              </>
            )}
          </NeonButton>
          <NeonButton onClick={handleFinalize} variant="blue" className="text-sm py-2 px-4">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Finalizar Sesión
          </NeonButton>
        </div>

        {/* Questions by Priority */}
        <div className="space-y-4">
          {totalQuestions === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">¡No hay preguntas pendientes!</h3>
              <p className="text-gray-400 mb-6">
                Todas las secciones están completas. Puedes finalizar la sesión o re-analizar si agregaste nueva información.
              </p>
              <NeonButton onClick={handleFinalize} variant="blue" className="text-sm py-2 px-6">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Finalizar Sesión
              </NeonButton>
            </div>
          ) : (
            <>
              {renderPrioritySection('critical')}
              {renderPrioritySection('important')}
              {renderPrioritySection('optional')}
            </>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-xs text-gray-500 text-center">
            💡 Tip: Puedes responder las preguntas en cualquier orden. Usa "Re-analizar" después de responder varias preguntas para generar nuevas preguntas basadas en tus respuestas.
          </p>
        </div>
      </GlassCard>
    </div>
  )
}

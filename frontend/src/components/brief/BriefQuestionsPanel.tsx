import { useState } from 'react'
import GlassCard from '../ui/GlassCard'
import NeonButton from '../ui/NeonButton'
import { Loader2, MessageSquare } from 'lucide-react'
import type { BriefQuestionsResponse } from '../../services/projectService'

interface Props {
  onGenerate: () => Promise<BriefQuestionsResponse>
  onAnswer: (questionId: string, answer: string) => Promise<void>
}

export default function BriefQuestionsPanel({ onGenerate, onAnswer }: Props) {
  const [questions, setQuestions] = useState<BriefQuestionsResponse['questions']>([])
  const [loading, setLoading] = useState(false)
  const [answering, setAnswering] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const data = await onGenerate()
      setQuestions(data.questions || [])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAnswer = async (id: string) => {
    const text = answers[id]?.trim()
    if (!text) return
    setAnswering(id)
    try {
      await onAnswer(id, text)
    } finally {
      setAnswering(null)
    }
  }

  return (
    <GlassCard className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-semibold">
          <MessageSquare className="w-4 h-4" /> Preguntas AI
        </div>
        <NeonButton size="sm" onClick={handleGenerate} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generar'}
        </NeonButton>
      </div>

      {questions.length === 0 && !loading && (
        <p className="text-sm text-gray-400">No hay preguntas generadas aún.</p>
      )}

      <div className="space-y-3">
        {questions.map((q, idx) => {
          const qid = `q${idx}`
          return (
            <div key={qid} className="p-3 bg-white/5 rounded-lg">
              <p className="text-white text-sm font-medium mb-2">{q.question}</p>
              {q.context && <p className="text-xs text-gray-400 mb-2">Contexto: {q.context}</p>}
              <textarea
                className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm text-white"
                rows={2}
                placeholder="Tu respuesta"
                value={answers[qid] || ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [qid]: e.target.value }))}
              />
              <div className="mt-2 flex justify-end">
                <NeonButton
                  size="sm"
                  onClick={() => handleSubmitAnswer(qid)}
                  disabled={answering === qid}
                >
                  {answering === qid ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar respuesta'}
                </NeonButton>
              </div>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}

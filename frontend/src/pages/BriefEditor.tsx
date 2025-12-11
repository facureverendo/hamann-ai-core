import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import GlassCard from '../components/ui/GlassCard'
import NeonButton from '../components/ui/NeonButton'
import MarkdownRenderer from '../components/ui/MarkdownRenderer'
import BriefQuestionsPanel from '../components/brief/BriefQuestionsPanel'
import BriefChat from '../components/brief/BriefChat'
import DeleteContentPanel from '../components/brief/DeleteContentPanel'
import { projectService, type BriefData } from '../services/projectService'
import { Loader2, Sparkles, CheckCircle, ArrowLeft } from 'lucide-react'

export default function BriefEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [brief, setBrief] = useState<BriefData | null>(null)
  const [briefText, setBriefText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [projectLoaded, setProjectLoaded] = useState(false)

  // Minimal inputs para generar brief inicial
  const [suggestionName, setSuggestionName] = useState('')
  const [suggestionDesc, setSuggestionDesc] = useState('')
  const [suggestionRationale, setSuggestionRationale] = useState('')
  const [workspaceDesc, setWorkspaceDesc] = useState('')

  useEffect(() => {
    if (id) {
      loadProjectDefaults()
      loadBrief()
    }
  }, [id])

  const loadProjectDefaults = async () => {
    if (!id) return
    try {
      const project = await projectService.getProject(id)
      // Precargar el nombre de sugerencia con el nombre de la feature
      if (!suggestionName) setSuggestionName(project.name || '')
      if (!suggestionDesc && project.description) setSuggestionDesc(project.description)
      setProjectLoaded(true)
    } catch (err) {
      console.error('Error loading project defaults', err)
      setProjectLoaded(true)
    }
  }

  const loadBrief = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await projectService.getBrief(id)
      setBrief(data)
      setBriefText(data.brief_content || '')
    } catch (err) {
      console.error('Error loading brief', err)
      setBrief(null)
      setBriefText('')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateBrief = async () => {
    if (!id) return
    setGenerating(true)
    try {
      const payload = {
        suggestion: {
          name: suggestionName,
          description: suggestionDesc,
          rationale: suggestionRationale,
        },
        workspace_context: {
          name: '',
          description: workspaceDesc,
          analysis: {},
        },
        language_code: 'es',
      }
      const data = await projectService.generateBrief(id, payload)
      setBrief(data)
      setBriefText(data.brief_content)
    } catch (err) {
      console.error('Error generating brief', err)
      alert('No se pudo generar el brief')
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateQuestions = async () => {
    if (!id) return { questions: [] }
    try {
      return await projectService.generateBriefQuestions(id)
    } catch (err) {
      console.error('Error generating questions', err)
      return { questions: [] }
    }
  }

  const handleAnswer = async (_qid: string, answer: string) => {
    if (!id) return
    setSaving(true)
    try {
      const res = await projectService.refineBrief(id, { answer, question_id: _qid })
      setBriefText(res.brief_content)
      setBrief((prev) => prev ? { ...prev, brief_content: res.brief_content, iterations: res.iterations } : prev)
    } catch (err) {
      console.error('Error answering question', err)
      alert('No se pudo actualizar el brief')
    } finally {
      setSaving(false)
    }
  }

  const handleAsk = async (question: string) => {
    if (!id) return
    setSaving(true)
    try {
      const res = await projectService.refineBrief(id, { question })
      setBriefText(res.brief_content)
      setBrief((prev) => prev ? { ...prev, brief_content: res.brief_content, iterations: res.iterations } : prev)
    } catch (err) {
      console.error('Error refining brief', err)
      alert('No se pudo refinar el brief')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (!id) return
    setSaving(true)
    try {
      const res = await projectService.deleteBriefSection(id, sectionId)
      setBriefText(res.brief_content)
      setBrief((prev) => prev ? { ...prev, brief_content: res.brief_content } : prev)
    } catch (err) {
      console.error('Error deleting section', err)
      alert('No se pudo eliminar la sección')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteBlock = async (payload: { section_id?: string; block_text: string }) => {
    if (!id) return
    setSaving(true)
    try {
      const res = await projectService.deleteBriefBlock(id, payload)
      setBriefText(res.brief_content)
      setBrief((prev) => prev ? { ...prev, brief_content: res.brief_content } : prev)
    } catch (err) {
      console.error('Error deleting block', err)
      alert('No se pudo eliminar el bloque')
    } finally {
      setSaving(false)
    }
  }

  const handleConvertToPRD = async () => {
    if (!id) return
    setSaving(true)
    try {
      const res = await projectService.convertBriefToPRD(id)
      alert('PRD generado')
      if (res?.prd_content) {
        setBriefText(res.prd_content)
      }
    } catch (err) {
      console.error('Error converting to PRD', err)
      alert('No se pudo generar el PRD')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-neon-blue animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Brief iterativo</h1>
            <p className="text-gray-400 text-sm">Genera y refina un brief para luego convertirlo en PRD</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {brief?.ready_for_prd && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Listo para PRD
            </span>
          )}
          <NeonButton size="sm" onClick={handleConvertToPRD} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generar PRD'}
          </NeonButton>
        </div>
      </div>

      {/* Generar brief inicial */}
      <GlassCard className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Sparkles className="w-4 h-4" /> Generar brief inicial
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400">Nombre sugerencia</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm text-white"
              value={suggestionName}
              onChange={(e) => setSuggestionName(e.target.value)}
              placeholder="Feature X"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">Rationale</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm text-white"
              value={suggestionRationale}
              onChange={(e) => setSuggestionRationale(e.target.value)}
              placeholder="Por qué es importante"
            />
          </div>
        </div>
        <textarea
          className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm text-white"
          rows={3}
          placeholder="Descripción de la sugerencia"
          value={suggestionDesc}
          onChange={(e) => setSuggestionDesc(e.target.value)}
        />
        <textarea
          className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm text-white"
          rows={2}
          placeholder="Descripción breve del workspace (opcional)"
          value={workspaceDesc}
          onChange={(e) => setWorkspaceDesc(e.target.value)}
        />
        <div className="flex flex-wrap justify-end gap-2">
          <NeonButton
            size="sm"
            variant="purple"
            onClick={handleGenerateBrief}
            disabled={generating}
            title="Pedir a la IA que complete el brief con los datos actuales"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Completar con IA'}
          </NeonButton>
        </div>
      </GlassCard>

      {/* Editor y preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="p-4 space-y-2">
          <div className="text-white font-semibold">Editor</div>
          <textarea
            className="w-full h-[360px] bg-white/5 border border-white/10 rounded p-3 text-sm text-white"
            value={briefText}
            onChange={(e) => setBriefText(e.target.value)}
          />
        </GlassCard>
        <GlassCard className="p-4 space-y-2">
          <div className="text-white font-semibold">Vista previa</div>
          <div className="max-h-[380px] overflow-y-auto prose prose-invert">
            <MarkdownRenderer content={briefText || '_Sin contenido_'} />
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <BriefQuestionsPanel onGenerate={handleGenerateQuestions} onAnswer={handleAnswer} />
        <BriefChat onAsk={handleAsk} />
        <DeleteContentPanel onDeleteSection={handleDeleteSection} onDeleteBlock={handleDeleteBlock} />
      </div>
    </div>
  )
}

import { useState } from 'react'
import GlassCard from '../ui/GlassCard'
import NeonButton from '../ui/NeonButton'
import { Trash2, Loader2 } from 'lucide-react'

interface Props {
  onDeleteSection: (sectionId: string) => Promise<void>
  onDeleteBlock: (payload: { section_id?: string; block_text: string }) => Promise<void>
}

export default function DeleteContentPanel({ onDeleteSection, onDeleteBlock }: Props) {
  const [sectionId, setSectionId] = useState('')
  const [blockText, setBlockText] = useState('')
  const [blockSection, setBlockSection] = useState('')
  const [loadingSection, setLoadingSection] = useState(false)
  const [loadingBlock, setLoadingBlock] = useState(false)

  const handleDeleteSection = async () => {
    if (!sectionId.trim()) return
    setLoadingSection(true)
    try {
      await onDeleteSection(sectionId.trim())
      setSectionId('')
    } finally {
      setLoadingSection(false)
    }
  }

  const handleDeleteBlock = async () => {
    if (!blockText.trim()) return
    setLoadingBlock(true)
    try {
      await onDeleteBlock({ section_id: blockSection || undefined, block_text: blockText })
      setBlockText('')
      setBlockSection('')
    } finally {
      setLoadingBlock(false)
    }
  }

  return (
    <GlassCard className="p-4 space-y-4">
      <div className="flex items-center gap-2 text-white font-semibold">
        <Trash2 className="w-4 h-4" /> Eliminar contenido
      </div>

      <div className="space-y-2">
        <label className="text-xs text-gray-400">ID de sección (header markdown)</label>
        <input
          className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm text-white"
          placeholder="ej: objetivos"
          value={sectionId}
          onChange={(e) => setSectionId(e.target.value)}
        />
        <NeonButton size="sm" onClick={handleDeleteSection} disabled={loadingSection}>
          {loadingSection ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Eliminar sección'}
        </NeonButton>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-gray-400">Texto a eliminar (primer match)</label>
        <textarea
          className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm text-white"
          rows={2}
          placeholder="Bloque exacto a eliminar"
          value={blockText}
          onChange={(e) => setBlockText(e.target.value)}
        />
        <input
          className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm text-white"
          placeholder="(opcional) sección donde buscar"
          value={blockSection}
          onChange={(e) => setBlockSection(e.target.value)}
        />
        <NeonButton size="sm" onClick={handleDeleteBlock} disabled={loadingBlock}>
          {loadingBlock ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Eliminar bloque'}
        </NeonButton>
      </div>
    </GlassCard>
  )
}

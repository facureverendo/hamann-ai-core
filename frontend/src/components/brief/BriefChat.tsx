import { useState } from 'react'
import GlassCard from '../ui/GlassCard'
import NeonButton from '../ui/NeonButton'
import { Send, MessageCircle, Loader2 } from 'lucide-react'

interface Props {
  onAsk: (question: string) => Promise<void>
}

export default function BriefChat({ onAsk }: Props) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    const text = message.trim()
    if (!text) return
    setLoading(true)
    try {
      await onAsk(text)
      setMessage('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <GlassCard className="p-4 space-y-3">
      <div className="flex items-center gap-2 text-white font-semibold">
        <MessageCircle className="w-4 h-4" /> Chat de Refinamiento
      </div>
      <textarea
        className="w-full bg-white/5 border border-white/10 rounded p-3 text-white text-sm"
        rows={3}
        placeholder="Haz una pregunta para refinar el brief..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <div className="flex justify-end">
        <NeonButton size="sm" onClick={handleSend} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
          Enviar
        </NeonButton>
      </div>
    </GlassCard>
  )
}

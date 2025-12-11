import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import GlassCard from '../components/ui/GlassCard'
import NeonButton from '../components/ui/NeonButton'
import MarkdownRenderer from '../components/ui/MarkdownRenderer'
import { Search, History, GitCompare, ChevronDown, ChevronRight, Send, Loader2 } from 'lucide-react'
import { prdService } from '../services/prdService'
import { projectService } from '../services/projectService'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function PRDViewer() {
  const { id } = useParams()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']))
  const [prd, setPrd] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [language, setLanguage] = useState('es')

  useEffect(() => {
    if (id) {
      prdService.getPRD(id).then((data) => {
        setPrd(data)
        setExpandedSections(new Set(data.sections.map((s: any) => s.id)))
        setLoading(false)
        
        // Load project state to get language
        projectService.getProjectStatus(id).then((state) => {
          setLanguage(state.language_code || 'es')
          
          // Set initial AI message in the correct language
          const welcomeMessages = {
            es: '¿Cómo puedo ayudarte a entender este PRD?',
            en: 'How can I help you understand this PRD?',
            pt: 'Como posso ajudá-lo a entender este PRD?'
          }
          setChatMessages([{
            role: 'assistant',
            content: welcomeMessages[state.language_code as keyof typeof welcomeMessages] || welcomeMessages.es
          }])
        }).catch(() => {
          // Default to Spanish
          setChatMessages([{
            role: 'assistant',
            content: '¿Cómo puedo ayudarte a entender este PRD?'
          }])
        })
      }).catch((err) => {
        console.error('Error loading PRD:', err)
        setLoading(false)
        setPrd({ error: err?.response?.data?.detail || 'Error loading PRD' })
      })
    }
  }, [id])
  
  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading || !id) return
    
    const userMessage = chatInput.trim()
    setChatInput('')
    
    // Add user message
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setChatLoading(true)
    
    try {
      const response = await prdService.chatAboutPRD(id, userMessage)
      
      // Add AI response
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.answer }])
    } catch (err: any) {
      console.error('Error chatting with AI:', err)
      const errorMessages = {
        es: 'Lo siento, hubo un error al procesar tu pregunta.',
        en: 'Sorry, there was an error processing your question.',
        pt: 'Desculpe, houve um erro ao processar sua pergunta.'
      }
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessages[language as keyof typeof errorMessages] || errorMessages.es
      }])
    } finally {
      setChatLoading(false)
    }
  }
  
  const handleExampleQuery = (query: string) => {
    setChatInput(query)
  }
  
  const getUIText = (key: string) => {
    const texts = {
      es: {
        exampleQueries: 'Preguntas de ejemplo:',
        askPlaceholder: 'Pregunta sobre el PRD...',
        aiAssistant: 'Asistente IA',
        examples: [
          'Explica la sección de arquitectura',
          '¿Cuáles son los requisitos clave?',
          'Resume el objetivo del proyecto'
        ]
      },
      en: {
        exampleQueries: 'Example queries:',
        askPlaceholder: 'Ask about the PRD...',
        aiAssistant: 'AI Assistant',
        examples: [
          'Explain the architecture section',
          'What are the key requirements?',
          'Summarize the project goal'
        ]
      },
      pt: {
        exampleQueries: 'Perguntas de exemplo:',
        askPlaceholder: 'Perguntar sobre o PRD...',
        aiAssistant: 'Assistente IA',
        examples: [
          'Explique a seção de arquitetura',
          'Quais são os requisitos principais?',
          'Resume o objetivo do projeto'
        ]
      }
    }
    
    return texts[language as keyof typeof texts]?.[key as keyof typeof texts['es']] || texts.es[key as keyof typeof texts['es']]
  }

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedSections(newExpanded)
  }

  return (
    <div className="p-6 h-full flex gap-6">
      {/* Main Document Reader */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search PRD..."
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue"
              />
            </div>
            <NeonButton variant="cyan">
              <History className="w-4 h-4 mr-2" />
              Version History
            </NeonButton>
            <NeonButton variant="purple">
              <GitCompare className="w-4 h-4 mr-2" />
              Compare Versions
            </NeonButton>
          </div>
        </div>

        {/* PRD Content */}
        <GlassCard className="flex-1 p-8 overflow-y-auto">
          {loading ? (
            <div className="text-center text-gray-400">Cargando PRD...</div>
          ) : prd?.error ? (
            <div className="text-center">
              <div className="text-red-400 mb-4">{prd.error}</div>
              <p className="text-gray-400 text-sm">
                El PRD aún no ha sido generado. Por favor, completa los pasos previos:
              </p>
              <ol className="text-gray-400 text-sm text-left mt-4 space-y-2 max-w-md mx-auto">
                <li>1. Procesar Archivos</li>
                <li>2. Analizar Gaps</li>
                <li>3. Generar Preguntas (opcional pero recomendado)</li>
                <li>4. Construir PRD</li>
              </ol>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-white mb-2">{prd?.title || 'PRD Document'}</h1>
              <div className="text-sm text-gray-400 mb-8">
                Última actualización: {prd?.updated_at || 'N/A'}
              </div>

              {/* Collapsible Sections */}
              <div className="space-y-4">
                {(prd?.sections || []).length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    No hay secciones para mostrar
                  </div>
                ) : (
                  (prd?.sections || []).map((section: any) => {
                    const isExpanded = expandedSections.has(section.id)
                    return (
                      <div key={section.id} className="border-b border-white/10 pb-4">
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="flex items-center gap-2 w-full text-left mb-2 hover:opacity-80 transition"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-neon-blue" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                          <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                        </button>
                        {isExpanded && (
                          <div className="pl-7 text-gray-300 leading-relaxed w-full">
                            <MarkdownRenderer content={section.content} />
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}
        </GlassCard>
      </div>

      {/* Right Panel - AI Assistant Chat */}
      <div className="w-96 flex flex-col">
        <GlassCard className="flex-1 p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-4">{getUIText('aiAssistant')}</h2>
          
          {/* Example Queries */}
          <div className="space-y-2 mb-4">
            <div className="text-xs text-gray-500 mb-2">{getUIText('exampleQueries')}</div>
            {(getUIText('examples') as string[]).map((example, idx) => (
              <button
                key={idx}
                onClick={() => handleExampleQuery(example)}
                className="w-full text-left text-sm text-gray-400 p-3 glass-card rounded hover:bg-white/5 transition"
              >
                {example}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <div className="text-xs text-gray-500">
                  {msg.role === 'user' ? 'Tú' : 'IA'}
                </div>
                <div className={`p-3 rounded-lg text-sm ${
                  msg.role === 'user' 
                    ? 'bg-neon-blue/20 text-white border border-neon-blue/30' 
                    : 'glass-card text-gray-300'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex flex-col gap-2">
                <div className="text-xs text-gray-500">IA</div>
                <div className="p-3 glass-card rounded-lg text-sm text-gray-300 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Pensando...
                </div>
              </div>
            )}
          </div>

          {/* Input Field */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={getUIText('askPlaceholder') as string}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={chatLoading}
              className="flex-1 px-4 py-2 bg-white/5 border border-neon-blue/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-neon-blue shadow-neon-blue disabled:opacity-50"
            />
            <NeonButton onClick={handleSendMessage} disabled={chatLoading || !chatInput.trim()}>
              <Send className="w-4 h-4" />
            </NeonButton>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}


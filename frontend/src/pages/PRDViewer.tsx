import { useParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import GlassCard from '../components/ui/GlassCard'
import NeonButton from '../components/ui/NeonButton'
import MarkdownRenderer from '../components/ui/MarkdownRenderer'
import { Search, History, GitCompare, ChevronDown, ChevronRight, Send, Loader2, Plus, Check } from 'lucide-react'
import { prdService } from '../services/prdService'
import type { ChatSummary, ChatMessage } from '../services/prdService'
import { projectService } from '../services/projectService'
import VersionComparator from '../components/prd/VersionComparator'

export default function PRDViewer() {
  const { id } = useParams()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']))
  const [prd, setPrd] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [language, setLanguage] = useState('es')
  const chatContainerRef = useRef<HTMLDivElement>(null)
  
  // New chat management state
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [loadingChats, setLoadingChats] = useState(false)
  
  // Version management state
  const [versions, setVersions] = useState<any[]>([])
  const [currentVersion, setCurrentVersion] = useState<number>(1)
  const [selectedVersion, setSelectedVersion] = useState<number>(1)
  const [loadingVersion, setLoadingVersion] = useState(false)
  const [showVersionComparator, setShowVersionComparator] = useState(false)

  useEffect(() => {
    if (id) {
      // Load version history first
      loadVersionHistory()
      
      // Load PRD
      prdService.getPRD(id).then((data) => {
        setPrd(data)
        setExpandedSections(new Set(data.sections.map((s: any) => s.id)))
        setLoading(false)
      }).catch((err) => {
        console.error('Error loading PRD:', err)
        setLoading(false)
        setPrd({ error: err?.response?.data?.detail || 'Error loading PRD' })
      })
      
      // Load language
      projectService.getProjectStatus(id).then((state) => {
        setLanguage(state.language_code || 'es')
        setCurrentVersion(state.current_version || 1)
        setSelectedVersion(state.current_version || 1)
      }).catch(() => {
        setLanguage('es')
      })
      
      // Load chat history
      loadChats()
    }
  }, [id])
  
  const loadVersionHistory = async () => {
    if (!id) return
    
    try {
      const history = await projectService.getVersionHistory(id)
      setVersions(history.versions)
      setCurrentVersion(history.current_version)
      setSelectedVersion(history.current_version)
    } catch (err) {
      console.error('Error loading version history:', err)
    }
  }
  
  const loadPRDVersion = async (version: number) => {
    if (!id) return
    
    setLoadingVersion(true)
    try {
      const versionData = await projectService.getPRDVersion(id, version)
      // Parse the markdown content to sections
      const sections = parseMarkdownToSections(versionData.content)
      setPrd({
        title: `PRD - Versión ${version}`,
        updated_at: versionData.metadata?.created_at || new Date().toISOString(),
        sections
      })
      setSelectedVersion(version)
    } catch (err) {
      console.error('Error loading PRD version:', err)
    } finally {
      setLoadingVersion(false)
    }
  }
  
  const parseMarkdownToSections = (markdown: string) => {
    const sections = []
    const lines = markdown.split('\n')
    let currentSection: any = null
    let currentContent: string[] = []
    
    for (const line of lines) {
      if (line.startsWith('## ')) {
        // Save previous section
        if (currentSection) {
          currentSection.content = currentContent.join('\n')
          sections.push(currentSection)
        }
        
        // Start new section
        const title = line.substring(3).trim()
        currentSection = {
          id: title.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, ''),
          title,
          content: ''
        }
        currentContent = []
      } else if (currentSection) {
        currentContent.push(line)
      }
    }
    
    // Save last section
    if (currentSection) {
      currentSection.content = currentContent.join('\n')
      sections.push(currentSection)
    }
    
    return sections
  }
  
  const loadChats = async () => {
    if (!id) return
    
    setLoadingChats(true)
    try {
      const { chats: chatList } = await prdService.listChats(id)
      setChats(chatList)
      
      // If there are chats, load the most recent one
      if (chatList.length > 0 && !currentChatId) {
        await loadChat(chatList[0].id)
      } else if (chatList.length === 0) {
        // No chats exist, create the first one
        await createNewChat()
      }
    } catch (err) {
      console.error('Error loading chats:', err)
      // If there's an error, create a new chat
      await createNewChat()
    } finally {
      setLoadingChats(false)
    }
  }
  
  const createNewChat = async () => {
    if (!id) return
    
    setLoadingChats(true)
    try {
      const newChat = await prdService.createChat(id)
      setChats(prev => [
        {
          id: newChat.id,
          title: newChat.title,
          created_at: newChat.created_at,
          updated_at: newChat.updated_at,
          message_count: newChat.message_count
        },
        ...prev
      ])
      await loadChat(newChat.id)
    } catch (err) {
      console.error('Error creating chat:', err)
    } finally {
      setLoadingChats(false)
    }
  }
  
  const loadChat = async (chatId: string) => {
    if (!id) return
    
    setLoadingChats(true)
    try {
      const chat = await prdService.getChat(id, chatId)
      setCurrentChatId(chatId)
      setChatMessages(chat.messages)
    } catch (err) {
      console.error('Error loading chat:', err)
    } finally {
      setLoadingChats(false)
    }
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages, chatLoading])
  
  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading || !id || !currentChatId) return
    
    const userMessage = chatInput.trim()
    setChatInput('')
    
    // Add user message optimistically
    const tempUserMsg: ChatMessage = { role: 'user', content: userMessage, timestamp: new Date().toISOString() }
    setChatMessages(prev => [...prev, tempUserMsg])
    setChatLoading(true)
    
    try {
      const response = await prdService.sendChatMessage(id, currentChatId, userMessage)
      
      // Replace temp message with server response and add assistant message
      setChatMessages(prev => {
        const withoutTemp = prev.slice(0, -1)
        return [
          ...withoutTemp,
          response.user_message,
          response.assistant_message
        ]
      })
      
      // Update chat summary in list
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, updated_at: response.assistant_message.timestamp, message_count: chat.message_count + 2 }
          : chat
      ))
    } catch (err: any) {
      console.error('Error chatting with AI:', err)
      const errorMessages = {
        es: 'Lo siento, hubo un error al procesar tu pregunta.',
        en: 'Sorry, there was an error processing your question.',
        pt: 'Desculpe, houve um erro ao processar sua pergunta.'
      }
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessages[language as keyof typeof errorMessages] || errorMessages.es,
        timestamp: new Date().toISOString()
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
        newChat: 'Nuevo chat',
        loadingChats: 'Cargando chats...',
        thinking: 'Pensando...',
        you: 'Tú',
        ai: 'IA',
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
        newChat: 'New chat',
        loadingChats: 'Loading chats...',
        thinking: 'Thinking...',
        you: 'You',
        ai: 'AI',
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
        newChat: 'Novo chat',
        loadingChats: 'Carregando chats...',
        thinking: 'Pensando...',
        you: 'Você',
        ai: 'IA',
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
    <div className="p-6 h-[calc(100vh-4rem)] flex gap-6 overflow-hidden">
      {/* Main Document Reader */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search PRD..."
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue"
              />
            </div>
            
            {/* Version Selector */}
            {versions.length > 0 && (
              <div className="relative">
                <select
                  value={selectedVersion}
                  onChange={(e) => loadPRDVersion(Number(e.target.value))}
                  disabled={loadingVersion}
                  className="pl-4 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-neon-blue disabled:opacity-50 appearance-none cursor-pointer"
                >
                  {versions.map((v) => (
                    <option key={v.version} value={v.version} className="bg-dark-primary">
                      Versión {v.version} {v.version === currentVersion ? '(actual)' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                {selectedVersion === currentVersion && (
                  <Check className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-green-400" />
                )}
              </div>
            )}
            
            <NeonButton 
              variant="purple" 
              onClick={() => setShowVersionComparator(true)}
              disabled={versions.length < 2}
            >
              <GitCompare className="w-4 h-4 mr-2" />
              Comparar Versiones
            </NeonButton>
          </div>
        </div>

        {/* PRD Content */}
        <GlassCard className="flex-1 p-8 overflow-y-auto min-h-0">
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
      <div className="w-96 flex flex-col min-h-0">
        <GlassCard className="flex-1 p-6 flex flex-col min-h-0">
          {/* Header with New Chat button */}
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h2 className="text-lg font-semibold text-white">{getUIText('aiAssistant')}</h2>
            <button
              onClick={createNewChat}
              disabled={loadingChats}
              className="p-2 bg-neon-blue/20 hover:bg-neon-blue/30 border border-neon-blue/50 rounded-lg transition disabled:opacity-50"
              title="Nuevo chat"
            >
              <Plus className="w-4 h-4 text-neon-blue" />
            </button>
          </div>
          
          {/* Chat History Dropdown */}
          {chats.length > 0 && (
            <div className="mb-4 flex-shrink-0">
              <select
                value={currentChatId || ''}
                onChange={(e) => loadChat(e.target.value)}
                disabled={loadingChats}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-neon-blue disabled:opacity-50"
              >
                {chats.map((chat) => (
                  <option key={chat.id} value={chat.id} className="bg-dark-primary">
                    {chat.title} ({chat.message_count} msgs)
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Example Queries - Only show for new/empty chats */}
          {chatMessages.length <= 1 && (
            <div className="space-y-2 mb-4 flex-shrink-0">
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
          )}

          {/* Chat Messages - Fixed height with scroll */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0 pr-2"
          >
            {loadingChats && chats.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-400 text-sm">{getUIText('loadingChats')}</div>
              </div>
            ) : (
              <>
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className="flex flex-col gap-2">
                    <div className="text-xs text-gray-500">
                      {msg.role === 'user' ? getUIText('you') : getUIText('ai')}
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
                    <div className="text-xs text-gray-500">{getUIText('ai')}</div>
                    <div className="p-3 glass-card rounded-lg text-sm text-gray-300 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {getUIText('thinking')}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Input Field - Fixed at bottom */}
          <div className="flex gap-2 flex-shrink-0">
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

      {/* Version Comparator Modal */}
      {showVersionComparator && versions.length >= 2 && (
        <VersionComparator
          projectId={id || ''}
          versions={versions}
          currentVersion={currentVersion}
          onClose={() => setShowVersionComparator(false)}
        />
      )}
    </div>
  )
}


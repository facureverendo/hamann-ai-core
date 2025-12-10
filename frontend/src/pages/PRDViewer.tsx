import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import GlassCard from '../components/ui/GlassCard'
import NeonButton from '../components/ui/NeonButton'
import { Search, History, GitCompare, ChevronDown, ChevronRight, Send } from 'lucide-react'
import { prdService } from '../services/prdService'

export default function PRDViewer() {
  const { id } = useParams()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']))
  const [prd, setPrd] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      prdService.getPRD(id).then((data) => {
        setPrd(data)
        setExpandedSections(new Set(data.sections.map((s: any) => s.id)))
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [id])

  const defaultSections = [
    { id: 'overview', title: 'Overview', content: 'Product overview and goals...' },
    { id: 'features', title: 'Features', content: 'Key features and functionality...' },
    { id: 'requirements', title: 'Requirements', content: 'Functional and non-functional requirements...' },
    { id: 'architecture', title: 'Architecture', content: 'System architecture and design...' },
  ]

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
            <div className="text-center text-gray-400">Loading PRD...</div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-white mb-2">{prd?.title || 'PRD Title'}</h1>
              <div className="text-sm text-gray-400 mb-8">Last updated: {prd?.updated_at || 'N/A'}</div>

              {/* Collapsible Sections */}
              <div className="space-y-4">
                {(prd?.sections || defaultSections).map((section: any) => {
                  const isExpanded = expandedSections.has(section.id)
                  return (
                    <div key={section.id} className="border-b border-white/10 pb-4">
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="flex items-center gap-2 w-full text-left mb-2"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-neon-blue" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                        <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                      </button>
                      {isExpanded && (
                        <div className="pl-7 text-gray-300 leading-relaxed">
                          <p>{section.content}</p>
                          <div className="mt-4 p-4 bg-dark-primary rounded-lg border border-white/5">
                            <p className="text-sm text-gray-400">Placeholder for diagrams and detailed content...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </GlassCard>
      </div>

      {/* Right Panel - AI Assistant Chat */}
      <div className="w-96 flex flex-col">
        <GlassCard className="flex-1 p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-4">AI Assistant</h2>
          
          {/* Example Queries */}
          <div className="space-y-2 mb-4">
            <div className="text-xs text-gray-500 mb-2">Example queries:</div>
            <button className="w-full text-left text-sm text-gray-400 p-3 glass-card rounded hover:bg-white/5 transition">
              Explain the architecture section
            </button>
            <button className="w-full text-left text-sm text-gray-400 p-3 glass-card rounded hover:bg-white/5 transition">
              What are the key requirements?
            </button>
            <button className="w-full text-left text-sm text-gray-400 p-3 glass-card rounded hover:bg-white/5 transition">
              Compare with previous version
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            <div className="flex flex-col gap-2">
              <div className="text-xs text-gray-500">AI Response</div>
              <div className="p-3 glass-card rounded-lg text-sm text-gray-300">
                How can I help you understand this PRD?
              </div>
            </div>
          </div>

          {/* Input Field */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask about the PRD..."
              className="flex-1 px-4 py-2 bg-white/5 border border-neon-blue/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-neon-blue shadow-neon-blue"
            />
            <NeonButton>
              <Send className="w-4 h-4" />
            </NeonButton>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}


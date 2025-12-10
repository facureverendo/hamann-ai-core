import { useState } from 'react'
import GlassCard from '../components/ui/GlassCard'
import NeonButton from '../components/ui/NeonButton'
import { Send, FileText, GitBranch, TestTube, Lightbulb } from 'lucide-react'
import { aiService } from '../services/aiService'

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: 'ai' as const, text: 'Hello! I can help you analyze PRDs, compare timelines, generate tests, and suggest improvements. What would you like to know?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const tools = [
    { icon: FileText, label: 'Analyze PRD', description: 'Deep analysis of product requirements' },
    { icon: GitBranch, label: 'Compare Timelines', description: 'Compare project timelines' },
    { icon: TestTube, label: 'Generate Tests', description: 'Create test cases' },
    { icon: Lightbulb, label: 'Suggest Improvements', description: 'Get AI recommendations' },
  ]

  const exampleQueries = [
    'What are the main delays in the project?',
    'Explain the impact of recent decisions',
    'Compare current timeline with baseline',
  ]

  const handleSend = async () => {
    if (!input.trim() || loading) return
    
    const userMessage = input
    setInput('')
    setMessages((prev) => [...prev, { role: 'user' as const, text: userMessage }])
    setLoading(true)

    try {
      const response = await aiService.chat({ message: userMessage })
      setMessages((prev) => [...prev, { role: 'ai' as const, text: response.response }])
    } catch (error) {
      setMessages((prev) => [...prev, { 
        role: 'ai' as const, 
        text: 'Sorry, I encountered an error. Please try again.' 
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 h-full flex gap-6">
      {/* Left Panel - Conversation History */}
      <div className="w-64">
        <GlassCard className="p-6 h-full">
          <h2 className="text-lg font-semibold text-white mb-4">History</h2>
          <div className="space-y-2">
            {['Project Analysis', 'Timeline Review', 'Risk Assessment'].map((title, i) => (
              <button
                key={i}
                className="w-full text-left p-3 glass-card rounded hover:bg-white/5 transition text-sm text-gray-300"
              >
                {title}
              </button>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Center - Chat */}
      <div className="flex-1 flex flex-col">
        <GlassCard className="flex-1 p-6 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-neon-blue/20 border border-neon-blue/30 text-white'
                      : 'glass-card text-gray-300'
                  }`}
                >
                  <div className="text-sm">{msg.text}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Example Queries */}
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-2">Example queries:</div>
            <div className="flex flex-wrap gap-2">
              {exampleQueries.map((query, i) => (
                <button
                  key={i}
                  onClick={() => setInput(query)}
                  className="text-xs px-3 py-1 glass-card rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>

          {/* Input Bar */}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about delays, decisions, impacts..."
              className="flex-1 px-4 py-3 bg-white/5 border border-neon-blue/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-neon-blue shadow-neon-blue"
            />
            <NeonButton onClick={handleSend}>
              <Send className="w-5 h-5" />
            </NeonButton>
          </div>
        </GlassCard>
      </div>

      {/* Right Panel - Tools */}
      <div className="w-80">
        <GlassCard className="p-6 h-full">
          <h2 className="text-lg font-semibold text-white mb-4">AI Tools</h2>
          <div className="space-y-3">
            {tools.map((tool, i) => {
              const Icon = tool.icon
              return (
                <button
                  key={i}
                  className="w-full p-4 glass-card rounded-lg hover:bg-white/5 transition text-left group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-neon-blue/20 rounded-lg group-hover:bg-neon-blue/30 transition">
                      <Icon className="w-5 h-5 text-neon-blue" />
                    </div>
                    <span className="text-sm font-medium text-white">{tool.label}</span>
                  </div>
                  <p className="text-xs text-gray-400">{tool.description}</p>
                </button>
              )
            })}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}


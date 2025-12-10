import { useParams } from 'react-router-dom'
import GlassCard from '../components/ui/GlassCard'
import { CheckCircle2, AlertTriangle, Link2, Bot, User } from 'lucide-react'

export default function MeetingSummary() {
  const { id } = useParams()

  return (
    <div className="p-6 h-full flex gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Sprint Planning Meeting</h1>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>Dec 10, 2024</span>
            <span>•</span>
            <span>2:00 PM - 3:30 PM</span>
            <span>•</span>
            <span>5 participants</span>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Key Decisions */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              Key Decisions
            </h2>
            <div className="space-y-3">
              <div className="p-3 glass-card rounded">
                <div className="text-sm text-white">Feature scope approved</div>
                <div className="text-xs text-gray-500 mt-1">All stakeholders agreed</div>
              </div>
              <div className="p-3 glass-card rounded">
                <div className="text-sm text-white">Timeline adjusted to Q1 2025</div>
                <div className="text-xs text-gray-500 mt-1">Based on resource availability</div>
              </div>
            </div>
          </GlassCard>

          {/* Action Items */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Action Items</h2>
            <div className="space-y-3">
              {[
                { task: 'Complete PRD review', owner: 'Alice', done: false },
                { task: 'Setup API endpoints', owner: 'Bob', done: true },
                { task: 'Design mockups', owner: 'Charlie', done: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 glass-card rounded">
                  <input
                    type="checkbox"
                    checked={item.done}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-neon-blue focus:ring-neon-blue"
                  />
                  <span className={`flex-1 text-sm ${item.done ? 'text-gray-500 line-through' : 'text-white'}`}>
                    {item.task}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neon-blue to-neon-cyan flex items-center justify-center text-xs text-white font-bold">
                    {item.owner[0]}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Risks Identified */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Risks Identified
            </h2>
            <div className="space-y-3">
              <div className="p-3 glass-card rounded border-l-2 border-yellow-400">
                <div className="text-sm text-white">Security review pending</div>
                <div className="text-xs text-gray-500 mt-1">May delay launch</div>
              </div>
              <div className="p-3 glass-card rounded border-l-2 border-red-400">
                <div className="text-sm text-white">API dependency risk</div>
                <div className="text-xs text-gray-500 mt-1">External team dependency</div>
              </div>
            </div>
          </GlassCard>

          {/* Dependencies */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-neon-cyan" />
              Dependencies
            </h2>
            <div className="space-y-3">
              <div className="text-sm">
                <div className="text-white">Design System → Frontend</div>
                <div className="text-gray-500 text-xs mt-1">Blocking</div>
              </div>
              <div className="text-sm">
                <div className="text-white">API Spec → Backend</div>
                <div className="text-gray-500 text-xs mt-1">Required</div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Right Panel - Transcript */}
      <div className="w-96">
        <GlassCard className="p-6 h-full overflow-y-auto">
          <h2 className="text-lg font-semibold text-white mb-4">Full Transcript</h2>
          <div className="space-y-4">
            {[
              { speaker: 'Alice', text: 'Let\'s start by reviewing the PRD...', time: '2:05 PM' },
              { speaker: 'Bob', text: 'I have concerns about the timeline...', time: '2:12 PM' },
              { speaker: 'Charlie', text: 'We can adjust the scope if needed...', time: '2:18 PM' },
            ].map((msg, i) => (
              <div key={i} className="p-3 glass-card rounded">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neon-blue to-neon-cyan flex items-center justify-center text-xs text-white font-bold">
                    {msg.speaker[0]}
                  </div>
                  <span className="text-sm font-medium text-white">{msg.speaker}</span>
                  <span className="text-xs text-gray-500">{msg.time}</span>
                </div>
                <p className="text-sm text-gray-300">{msg.text}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Floating AI Icon */}
      <div className="fixed bottom-6 right-6">
        <button className="w-14 h-14 rounded-full bg-gradient-to-br from-neon-blue to-neon-cyan flex items-center justify-center shadow-neon-blue hover:scale-110 transition-transform">
          <Bot className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  )
}


import { useNavigate } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import GlassCard from '../components/ui/GlassCard'
import NeonButton from '../components/ui/NeonButton'
import { TrendingUp, Calendar, AlertTriangle, MessageSquare, Send, Plus, FolderKanban, ArrowRight } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const { projects, loading } = useProjects()

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <NeonButton onClick={() => navigate('/projects/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Proyecto
        </NeonButton>
      </div>

      {/* Recent Projects Section */}
      {!loading && projects.length > 0 && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-neon-blue" />
              Proyectos Recientes
            </h2>
            <button
              onClick={() => navigate('/projects')}
              className="text-sm text-neon-cyan hover:text-neon-blue transition flex items-center gap-1"
            >
              Ver todos
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="p-4 glass-card rounded-lg hover:bg-white/5 transition cursor-pointer"
              >
                <h3 className="text-sm font-medium text-white mb-2 truncate">
                  {project.name}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="h-1.5 flex-1 bg-dark-secondary rounded-full overflow-hidden mr-2">
                    <div
                      className="h-full bg-neon-cyan transition-all"
                      style={{ width: `${project.progress * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">
                    {Math.round(project.progress * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Delayed Tasks</h3>
            <TrendingUp className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">12</div>
          <div className="text-xs text-gray-500">+3 from last week</div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Deliverables Due</h3>
            <Calendar className="w-5 h-5 text-neon-cyan" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">8</div>
          <div className="text-xs text-gray-500">Next 7 days</div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Risks Detected</h3>
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">5</div>
          <div className="text-xs text-gray-500">2 critical</div>
        </GlassCard>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-3 gap-6">
        {/* Timeline Heatmap - Center */}
        <div className="col-span-2">
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Timeline Heatmap</h2>
            <div className="h-64 bg-dark-primary rounded-lg p-4 flex items-center justify-center border border-white/5">
              <div className="text-center text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Timeline visualization</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* AI Assistant Panel - Right */}
        <div className="space-y-4">
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-neon-blue" />
              AI Assistant
            </h2>
            <div className="space-y-3 mb-4">
              <div className="text-sm text-gray-400 p-3 glass-card rounded cursor-pointer hover:bg-white/5 transition">
                Analyze project delays
              </div>
              <div className="text-sm text-gray-400 p-3 glass-card rounded cursor-pointer hover:bg-white/5 transition">
                Review PRD changes
              </div>
              <div className="text-sm text-gray-400 p-3 glass-card rounded cursor-pointer hover:bg-white/5 transition">
                Check team workload
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask Anything..."
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
              />
              <NeonButton>
                <Send className="w-4 h-4" />
              </NeonButton>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Widgets Row */}
      <div className="grid grid-cols-3 gap-4">
        <GlassCard className="p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Priorities of the Week</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-neon-blue"></div>
              <span className="text-sm text-gray-300">Complete PRD review</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-neon-cyan"></div>
              <span className="text-sm text-gray-300">Resolve blocker issues</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-neon-purple"></div>
              <span className="text-sm text-gray-300">Team sync meeting</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Cross-team Blockers</h3>
          <div className="space-y-3">
            <div className="text-sm text-gray-300">
              <span className="text-red-400">●</span> API dependency pending
            </div>
            <div className="text-sm text-gray-300">
              <span className="text-yellow-400">●</span> Design review needed
            </div>
            <div className="text-sm text-gray-300">
              <span className="text-neon-blue">●</span> Security approval
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Decisions</h3>
          <div className="space-y-3">
            <div className="text-sm">
              <div className="text-gray-300">Feature scope approved</div>
              <div className="text-gray-500 text-xs mt-1">2 hours ago</div>
            </div>
            <div className="text-sm">
              <div className="text-gray-300">Timeline adjusted</div>
              <div className="text-gray-500 text-xs mt-1">1 day ago</div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}


import { useParams } from 'react-router-dom'
import GlassCard from '../components/ui/GlassCard'
import { Filter, AlertCircle } from 'lucide-react'

export default function AITimeline() {
  const { id } = useParams()

  return (
    <div className="p-6 h-full flex gap-6">
      {/* Left Filters */}
      <div className="w-64 space-y-4">
        <GlassCard className="p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Teams</label>
              <div className="space-y-2">
                {['Engineering', 'Product', 'Design'].map((team) => (
                  <label key={team} className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" className="rounded border-white/20 bg-white/5" />
                    {team}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-2 block">Risk Levels</label>
              <div className="space-y-2">
                {['Critical', 'High', 'Medium', 'Low'].map((level) => (
                  <label key={level} className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" className="rounded border-white/20 bg-white/5" />
                    {level}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-2 block">Modules</label>
              <div className="space-y-2">
                {['Frontend', 'Backend', 'API', 'Database'].map((module) => (
                  <label key={module} className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" className="rounded border-white/20 bg-white/5" />
                    {module}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Center Timeline */}
      <div className="flex-1 flex flex-col">
        <GlassCard className="flex-1 p-6 overflow-x-auto">
          <h2 className="text-lg font-semibold text-white mb-6">Predictive Timeline</h2>
          
          {/* Timeline Visualization */}
          <div className="relative h-96">
            {/* Timeline Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-neon-blue via-neon-cyan to-neon-purple transform -translate-y-1/2"></div>
            
            {/* Milestone Nodes */}
            <div className="absolute top-1/2 left-[10%] transform -translate-y-1/2 -translate-x-1/2">
              <div className="w-4 h-4 rounded-full bg-neon-blue shadow-neon-blue"></div>
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap">
                Milestone 1
              </div>
            </div>
            
            <div className="absolute top-1/2 left-[50%] transform -translate-y-1/2 -translate-x-1/2">
              <div className="w-4 h-4 rounded-full bg-neon-cyan shadow-neon-cyan"></div>
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap">
                Milestone 2
              </div>
            </div>
            
            <div className="absolute top-1/2 left-[80%] transform -translate-y-1/2 -translate-x-1/2">
              <div className="w-4 h-4 rounded-full bg-neon-purple shadow-neon-purple"></div>
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap">
                Milestone 3
              </div>
            </div>

            {/* Delay Zone (Cyan Fog) */}
            <div className="absolute top-1/2 left-[40%] w-[20%] h-32 bg-neon-cyan/20 backdrop-blur-sm rounded-lg transform -translate-y-1/2 border border-neon-cyan/30">
              <div className="absolute top-2 left-2 text-xs text-neon-cyan font-medium">Predicted Delay Zone</div>
            </div>

            {/* Deliverable Cards */}
            <div className="absolute top-20 left-[15%]">
              <div className="p-3 glass-card rounded-lg w-48 border border-neon-blue/30">
                <div className="text-sm font-medium text-white mb-1">Deliverable A</div>
                <div className="text-xs text-gray-400">Due: Dec 15</div>
              </div>
            </div>

            <div className="absolute top-20 left-[55%]">
              <div className="p-3 glass-card rounded-lg w-48 border border-neon-cyan/30">
                <div className="text-sm font-medium text-white mb-1">Deliverable B</div>
                <div className="text-xs text-gray-400">Due: Dec 20</div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Right AI Insights Panel */}
      <div className="w-96">
        <GlassCard className="p-6 h-full overflow-y-auto">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            AI Insights
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 glass-card rounded-lg border-l-2 border-yellow-400">
              <div className="text-sm font-medium text-white mb-2">Delay Prediction</div>
              <div className="text-xs text-gray-300">
                Based on current velocity, Deliverable B may be delayed by 3-5 days due to resource constraints.
              </div>
            </div>

            <div className="p-4 glass-card rounded-lg border-l-2 border-neon-blue">
              <div className="text-sm font-medium text-white mb-2">Resource Issue</div>
              <div className="text-xs text-gray-300">
                Engineering team is at 85% capacity. Consider redistributing tasks or adding resources.
              </div>
            </div>

            <div className="p-4 glass-card rounded-lg border-l-2 border-neon-cyan">
              <div className="text-sm font-medium text-white mb-2">Recommendation</div>
              <div className="text-xs text-gray-300">
                Prioritize critical path items and defer non-essential features to next sprint.
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}


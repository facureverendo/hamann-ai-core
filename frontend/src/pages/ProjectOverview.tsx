import { useParams } from 'react-router-dom'
import GlassCard from '../components/ui/GlassCard'
import ActionPanel from '../components/project/ActionPanel'
import { CheckCircle2, Clock, AlertCircle, Users, FileText, Calendar } from 'lucide-react'
import { useProject } from '../hooks/useProject'
import { useEffect, useState } from 'react'
import { projectService } from '../services/projectService'

export default function ProjectOverview() {
  const { id } = useParams()
  const { project, loading, reload } = useProject(id)
  const [risks, setRisks] = useState<any[]>([])
  const [meetings, setMeetings] = useState<any[]>([])
  const [projectState, setProjectState] = useState<any>(null)

  const loadProjectState = async () => {
    if (id) {
      try {
        const state = await projectService.getProjectStatus(id)
        setProjectState(state)
      } catch (err) {
        console.error('Error loading project state:', err)
      }
    }
  }

  useEffect(() => {
    if (id) {
      projectService.getRisks(id).then((data) => setRisks(data.risks || []))
      projectService.getMeetings(id).then((data) => setMeetings(data.meetings || []))
      loadProjectState()
    }
  }, [id])

  const handleStateUpdate = () => {
    loadProjectState()
    reload()
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {loading ? 'Loading...' : project?.name || 'Project Name'}
          </h1>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm border border-green-500/30">
              {project?.status || 'Active'}
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{Math.round((project?.progress || 0) * 100)}% Complete</span>
            </div>
          </div>
        </div>
        <div className="h-2 w-64 bg-dark-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-neon-blue to-neon-cyan" 
            style={{ width: `${(project?.progress || 0) * 100}%` }} 
          />
        </div>
      </div>

      {/* Action Panel */}
      <ActionPanel 
        projectId={id || ''} 
        projectState={projectState}
        onStateUpdate={handleStateUpdate}
      />

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="col-span-2 space-y-6">
          {/* Deliverables Roadmap */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-neon-blue" />
              Deliverables Roadmap
            </h2>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 glass-card rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">Deliverable {i}</span>
                    <span className="text-xs text-gray-400">Due: Dec 20</span>
                  </div>
                  <div className="h-2 bg-dark-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-neon-cyan" style={{ width: `${60 + i * 10}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Latest PRD Decisions */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Latest PRD Decisions</h2>
            <div className="space-y-4">
              <div className="border-l-2 border-neon-blue pl-4">
                <div className="text-sm text-white">Feature scope finalized</div>
                <div className="text-xs text-gray-500 mt-1">Updated 2 hours ago</div>
              </div>
              <div className="border-l-2 border-neon-cyan pl-4">
                <div className="text-sm text-white">API endpoints approved</div>
                <div className="text-xs text-gray-500 mt-1">Updated 1 day ago</div>
              </div>
            </div>
          </GlassCard>

          {/* Weekly AI Summary */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Weekly AI Summary</h2>
            <p className="text-sm text-gray-300 leading-relaxed">
              Project is on track with 75% completion. Key milestones achieved this week include
              PRD finalization and API design approval. One blocker identified: pending security review.
            </p>
          </GlassCard>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Team Workload */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-neon-cyan" />
              Team Workload
            </h2>
            <div className="space-y-4">
              {['Alice', 'Bob', 'Charlie'].map((name, i) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">{name}</span>
                    <span className="text-xs text-gray-500">{70 + i * 10}%</span>
                  </div>
                  <div className="h-2 bg-dark-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neon-blue"
                      style={{ width: `${70 + i * 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Risks Panel */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              Risks
            </h2>
            <div className="space-y-3">
              {risks.length > 0 ? (
                risks.map((risk) => {
                  const severityColors: Record<string, string> = {
                    critical: 'bg-red-500',
                    high: 'bg-yellow-500',
                    medium: 'bg-neon-blue',
                    low: 'bg-neon-cyan',
                  }
                  return (
                    <div key={risk.id} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${severityColors[risk.severity] || 'bg-gray-500'} shadow-neon-blue`}></div>
                      <span className="text-sm text-gray-300">{risk.title}</span>
                    </div>
                  )
                })
              ) : (
                <div className="text-sm text-gray-500">No risks identified</div>
              )}
            </div>
          </GlassCard>

          {/* Meeting Recaps */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-neon-purple" />
              Meeting Recaps
            </h2>
            <div className="space-y-3">
              {meetings.length > 0 ? (
                meetings.map((meeting) => (
                  <div key={meeting.id} className="text-sm">
                    <div className="text-white">{meeting.title}</div>
                    <div className="text-gray-500 text-xs mt-1">{meeting.date}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">No meetings recorded</div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}


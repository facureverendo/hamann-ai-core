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
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [prdDecisions, setPrdDecisions] = useState<any[]>([])
  const [weeklySummary, setWeeklySummary] = useState<any>(null)
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

  const loadInsights = async () => {
    if (id) {
      try {
        // Load all insights in parallel
        const [risksData, meetingsData, deliverablesData, teamData, decisionsData, summaryData] = await Promise.all([
          projectService.getRisks(id),
          projectService.getMeetings(id),
          projectService.getDeliverables(id),
          projectService.getTeamMembers(id),
          projectService.getPRDDecisions(id, 5),
          projectService.getWeeklySummary(id).catch(() => null)
        ])
        
        setRisks(risksData.risks || [])
        setMeetings(meetingsData.meetings || [])
        setDeliverables(deliverablesData.deliverables || [])
        setTeamMembers(teamData.team_members || [])
        setPrdDecisions(decisionsData.decisions || [])
        setWeeklySummary(summaryData)
      } catch (err) {
        console.error('Error loading insights:', err)
      }
    }
  }

  useEffect(() => {
    if (id) {
      loadProjectState()
      loadInsights()
    }
  }, [id])

  const handleStateUpdate = () => {
    loadProjectState()
    loadInsights()
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
              {deliverables.length > 0 ? (
                deliverables.slice(0, 5).map((deliverable) => {
                  const progressPercent = (deliverable.progress * 100).toFixed(0)
                  return (
                    <div key={deliverable.id} className="p-4 glass-card rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">{deliverable.name}</span>
                        <span className="text-xs text-gray-400">Due: {new Date(deliverable.due_date).toLocaleDateString()}</span>
                      </div>
                      <div className="h-2 bg-dark-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-neon-cyan" style={{ width: `${progressPercent}%` }} />
                      </div>
                      {deliverable.description && (
                        <p className="text-xs text-gray-500 mt-2">{deliverable.description}</p>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="text-sm text-gray-500">No deliverables defined yet</div>
              )}
            </div>
          </GlassCard>

          {/* Latest PRD Decisions */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Latest PRD Decisions</h2>
            <div className="space-y-4">
              {prdDecisions.length > 0 ? (
                prdDecisions.map((decision) => {
                  const borderColor = decision.change_type === 'added' ? 'border-green-400' : 
                                     decision.change_type === 'removed' ? 'border-red-400' : 
                                     'border-neon-blue'
                  
                  const timeAgo = (timestamp: string) => {
                    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000)
                    if (seconds < 60) return 'just now'
                    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
                    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
                    return `${Math.floor(seconds / 86400)} days ago`
                  }
                  
                  return (
                    <div key={decision.id} className={`border-l-2 ${borderColor} pl-4`}>
                      <div className="text-sm text-white">{decision.description}</div>
                      {decision.section_affected && (
                        <div className="text-xs text-gray-400 mt-1">Section: {decision.section_affected}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">{timeAgo(decision.timestamp)}</div>
                    </div>
                  )
                })
              ) : (
                <div className="text-sm text-gray-500">No PRD changes tracked yet</div>
              )}
            </div>
          </GlassCard>

          {/* Weekly AI Summary */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Weekly AI Summary</h2>
            {weeklySummary ? (
              <div>
                <p className="text-sm text-gray-300 leading-relaxed mb-4">
                  {weeklySummary.summary}
                </p>
                {weeklySummary.highlights && weeklySummary.highlights.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-green-400 mb-1">Highlights:</div>
                    <ul className="text-xs text-gray-400 space-y-1">
                      {weeklySummary.highlights.map((highlight: string, idx: number) => (
                        <li key={idx}>• {highlight}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {weeklySummary.blockers && weeklySummary.blockers.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-yellow-400 mb-1">Blockers:</div>
                    <ul className="text-xs text-gray-400 space-y-1">
                      {weeklySummary.blockers.map((blocker: string, idx: number) => (
                        <li key={idx}>• {blocker}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">Generate PRD and backlog to see weekly summary</div>
            )}
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
              {teamMembers.length > 0 ? (
                teamMembers.map((member) => {
                  const workload = member.workload_percentage
                  const barColor = workload > 80 ? 'bg-red-400' : workload > 60 ? 'bg-yellow-400' : 'bg-neon-blue'
                  
                  return (
                    <div key={member.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-sm text-gray-300">{member.name}</span>
                          {member.role && (
                            <span className="text-xs text-gray-500 ml-2">({member.role})</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{workload.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-dark-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColor}`}
                          style={{ width: `${Math.min(workload, 100)}%` }}
                        />
                      </div>
                      {member.assigned_tasks_count > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {member.assigned_tasks_count} tasks ({member.total_story_points} pts)
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="text-sm text-gray-500">No team members assigned yet</div>
              )}
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


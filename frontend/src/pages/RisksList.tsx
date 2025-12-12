import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import { projectService } from '../services/projectService'
import GlassCard from '../components/ui/GlassCard'
import { AlertTriangle, Loader2, ArrowRight, FolderKanban } from 'lucide-react'
import type { Risk } from '../services/projectService'

interface ProjectWithRisks {
  id: string
  name: string
  risks: Risk[]
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
}

export default function RisksList() {
  const navigate = useNavigate()
  const { projects, loading: projectsLoading } = useProjects()
  const [projectsWithRisks, setProjectsWithRisks] = useState<ProjectWithRisks[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRisks()
  }, [projects])

  const loadRisks = async () => {
    if (projectsLoading) return
    
    setLoading(true)
    try {
      const risksPromises = projects.map(async (project) => {
        try {
          const risksData = await projectService.getRisks(project.id)
          const risks = risksData.risks || []
          
          const criticalCount = risks.filter(r => r.severity === 'critical').length
          const highCount = risks.filter(r => r.severity === 'high').length
          const mediumCount = risks.filter(r => r.severity === 'medium').length
          const lowCount = risks.filter(r => r.severity === 'low').length
          
          return {
            id: project.id,
            name: project.name,
            risks,
            criticalCount,
            highCount,
            mediumCount,
            lowCount
          }
        } catch (err) {
          console.error(`Error loading risks for project ${project.id}:`, err)
          return {
            id: project.id,
            name: project.name,
            risks: [],
            criticalCount: 0,
            highCount: 0,
            mediumCount: 0,
            lowCount: 0
          }
        }
      })
      
      const results = await Promise.all(risksPromises)
      const filtered = results.filter(p => p.risks.length > 0)
      setProjectsWithRisks(filtered)
    } catch (err) {
      console.error('Error loading risks:', err)
    } finally {
      setLoading(false)
    }
  }

  const severityColors: Record<string, string> = {
    critical: 'bg-red-500',
    high: 'bg-yellow-500',
    medium: 'bg-neon-blue',
    low: 'bg-neon-cyan',
  }

  const getTotalRisks = (project: ProjectWithRisks) => {
    return project.criticalCount + project.highCount + project.mediumCount + project.lowCount
  }

  if (loading || projectsLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-neon-blue animate-spin" />
        <span className="ml-3 text-gray-400">Cargando riesgos...</span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            Risk Management
          </h1>
          <p className="text-gray-400">Visualiza y gestiona los riesgos de todos tus proyectos</p>
        </div>
      </div>

      {/* Empty State */}
      {!loading && projectsWithRisks.length === 0 && (
        <GlassCard className="p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No hay riesgos identificados</h3>
          <p className="text-gray-400 mb-6">
            Los riesgos aparecerán aquí cuando se identifiquen en tus proyectos
          </p>
        </GlassCard>
      )}

      {/* Projects with Risks */}
      {!loading && projectsWithRisks.length > 0 && (
        <div className="space-y-4">
          {projectsWithRisks.map((project) => {
            const totalRisks = getTotalRisks(project)
            const criticalRisks = project.risks.filter(r => r.severity === 'critical')
            const highRisks = project.risks.filter(r => r.severity === 'high')
            
            return (
              <GlassCard
                key={project.id}
                className="p-6 hover:bg-white/5 transition cursor-pointer group"
                onClick={() => navigate(`/risks/${project.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      {project.name}
                      <ArrowRight className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition" />
                    </h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-400">
                        {totalRisks} {totalRisks === 1 ? 'riesgo' : 'riesgos'} total
                      </span>
                      {project.criticalCount > 0 && (
                        <span className="text-red-400 font-medium">
                          {project.criticalCount} crítico{project.criticalCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {project.highCount > 0 && (
                        <span className="text-yellow-400">
                          {project.highCount} alto{project.highCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {project.criticalCount > 0 && (
                      <div className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-400 font-medium">
                        Crítico
                      </div>
                    )}
                    {project.criticalCount === 0 && project.highCount > 0 && (
                      <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-400 font-medium">
                        Alto
                      </div>
                    )}
                  </div>
                </div>

                {/* Risk Preview */}
                <div className="space-y-2">
                  {criticalRisks.slice(0, 2).map((risk) => (
                    <div key={risk.id} className="flex items-center gap-3 p-2 glass-card rounded">
                      <div className={`w-3 h-3 rounded-full ${severityColors[risk.severity] || 'bg-gray-500'} shadow-neon-blue`}></div>
                      <span className="text-sm text-white flex-1">{risk.title}</span>
                      <span className="text-xs text-gray-400">{risk.sector}</span>
                    </div>
                  ))}
                  {highRisks.slice(0, 2).map((risk) => (
                    <div key={risk.id} className="flex items-center gap-3 p-2 glass-card rounded">
                      <div className={`w-3 h-3 rounded-full ${severityColors[risk.severity] || 'bg-gray-500'} shadow-neon-blue`}></div>
                      <span className="text-sm text-gray-300 flex-1">{risk.title}</span>
                      <span className="text-xs text-gray-400">{risk.sector}</span>
                    </div>
                  ))}
                  {totalRisks > 4 && (
                    <div className="text-xs text-gray-500 text-center pt-2">
                      +{totalRisks - 4} más...
                    </div>
                  )}
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}
    </div>
  )
}

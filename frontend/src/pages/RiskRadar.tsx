import { useParams, useNavigate } from 'react-router-dom'
import GlassCard from '../components/ui/GlassCard'
import { useState, useEffect } from 'react'
import { projectService } from '../services/projectService'
import { useProject } from '../hooks/useProject'
import type { Risk } from '../services/projectService'
import { Loader2, ArrowLeft } from 'lucide-react'

interface RiskPosition {
  risk: Risk
  sector: number
  angle: number
  severity: string
  label: string
}

export default function RiskRadar() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { project, loading: projectLoading } = useProject(id)
  const [viewMode, setViewMode] = useState<'team' | 'dependency' | 'decision'>('team')
  const [risks, setRisks] = useState<Risk[]>([])
  const [loading, setLoading] = useState(true)

  // Sectores comunes - se pueden extraer de los riesgos reales
  const defaultSectors = ['Engineering', 'Product', 'Compliance', 'Data', 'Integrations']
  const [sectors, setSectors] = useState<string[]>(defaultSectors)

  useEffect(() => {
    if (id) {
      loadRisks()
    }
  }, [id])

  const loadRisks = async () => {
    if (!id) return
    
    setLoading(true)
    try {
      const risksData = await projectService.getRisks(id)
      const loadedRisks = risksData.risks || []
      setRisks(loadedRisks)
      
      // Extraer sectores únicos de los riesgos
      const uniqueSectors = Array.from(new Set(loadedRisks.map(r => r.sector)))
      if (uniqueSectors.length > 0) {
        setSectors(uniqueSectors.length >= 5 ? uniqueSectors.slice(0, 5) : uniqueSectors)
      }
    } catch (err) {
      console.error('Error loading risks:', err)
    } finally {
      setLoading(false)
    }
  }

  const severityColors = {
    critical: 'bg-red-500 shadow-neon-blue',
    high: 'bg-yellow-500 shadow-neon-cyan',
    medium: 'bg-neon-blue shadow-neon-blue',
    low: 'bg-neon-cyan shadow-neon-cyan',
  }

  // Convertir riesgos a posiciones en el radar
  const getRiskPositions = (): RiskPosition[] => {
    return risks
      .filter(r => (r.status || 'active') !== 'resolved') // Solo mostrar riesgos activos
      .map((risk) => {
        const sectorIndex = sectors.findIndex(s => s === risk.sector)
        const sectorIdx = sectorIndex >= 0 ? sectorIndex : 0
        const baseAngle = (sectorIdx * 360) / sectors.length
        const angleVariation = (Math.random() - 0.5) * 30 // Variación aleatoria dentro del sector
        const angle = baseAngle + angleVariation
        
        return {
          risk,
          sector: sectorIdx,
          angle,
          severity: risk.severity,
          label: risk.title.length > 20 ? risk.title.substring(0, 20) + '...' : risk.title
        }
      })
  }

  const riskPositions = getRiskPositions()
  
  const criticalRisks = risks.filter(r => r.severity === 'critical' && (r.status || 'active') !== 'resolved')
  const highRisks = risks.filter(r => r.severity === 'high' && (r.status || 'active') !== 'resolved')
  const mediumRisks = risks.filter(r => r.severity === 'medium' && (r.status || 'active') !== 'resolved')
  const resolvedRisks = risks.filter(r => (r.status || 'active') === 'resolved')

  if (loading || projectLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-neon-blue animate-spin" />
        <span className="ml-3 text-gray-400">Cargando riesgos...</span>
      </div>
    )
  }

  return (
    <div className="p-6 h-full flex gap-6">
      {/* Left Panel - View Toggles */}
      <div className="w-64 space-y-4">
        <GlassCard className="p-6">
          <button
            onClick={() => navigate('/risks')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver a lista</span>
          </button>
          <h3 className="text-sm font-semibold text-white mb-4">View Mode</h3>
          
          <div className="space-y-3">
            <button
              onClick={() => setViewMode('team')}
              className={`w-full text-left p-3 rounded-lg transition ${
                viewMode === 'team'
                  ? 'bg-neon-blue/20 border border-neon-blue text-white'
                  : 'glass-card text-gray-400 hover:text-white'
              }`}
            >
              Team Impact
            </button>
            <button
              onClick={() => setViewMode('dependency')}
              className={`w-full text-left p-3 rounded-lg transition ${
                viewMode === 'dependency'
                  ? 'bg-neon-blue/20 border border-neon-blue text-white'
                  : 'glass-card text-gray-400 hover:text-white'
              }`}
            >
              Dependency Impact
            </button>
            <button
              onClick={() => setViewMode('decision')}
              className={`w-full text-left p-3 rounded-lg transition ${
                viewMode === 'decision'
                  ? 'bg-neon-blue/20 border border-neon-blue text-white'
                  : 'glass-card text-gray-400 hover:text-white'
              }`}
            >
              Decision Impact
            </button>
          </div>
        </GlassCard>
        
        <GlassCard className="p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Project Info</h3>
          <div className="space-y-2">
            <div className="text-xs text-gray-400">Proyecto</div>
            <div className="text-sm text-white font-medium">{project?.name || 'N/A'}</div>
            <div className="text-xs text-gray-400 mt-3">Total de Riesgos</div>
            <div className="text-lg text-neon-blue font-bold">{risks.length}</div>
          </div>
        </GlassCard>
      </div>

      {/* Center - Radar Grid */}
      <div className="flex-1 flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white">AI Risk Radar – Real-time Analysis</h1>
          {project && (
            <p className="text-gray-400 text-sm mt-1">{project.name}</p>
          )}
        </div>
        
        <GlassCard className="flex-1 p-8 flex items-center justify-center">
          {riskPositions.length === 0 ? (
            <div className="text-center">
              <div className="text-gray-500 text-lg mb-2">No hay riesgos activos</div>
              <div className="text-gray-600 text-sm">Los riesgos aparecerán aquí cuando se identifiquen</div>
            </div>
          ) : (
            <div className="relative w-96 h-96">
              {/* Circular Grid */}
              <svg className="w-full h-full" viewBox="0 0 400 400">
                {/* Concentric Circles */}
                {[1, 2, 3, 4].map((ring) => (
                  <circle
                    key={ring}
                    cx="200"
                    cy="200"
                    r={ring * 50}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1"
                  />
                ))}
                
                {/* Sector Lines */}
                {sectors.map((sector, i) => {
                  const angle = (i * 360) / sectors.length - 90
                  const rad = (angle * Math.PI) / 180
                  const x = 200 + 200 * Math.cos(rad)
                  const y = 200 + 200 * Math.sin(rad)
                  return (
                    <line
                      key={sector}
                      x1="200"
                      y1="200"
                      x2={x}
                      y2={y}
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="1"
                    />
                  )
                })}
                
                {/* Sector Labels */}
                {sectors.map((sector, i) => {
                  const angle = (i * 360) / sectors.length - 90
                  const rad = (angle * Math.PI) / 180
                  const x = 200 + 170 * Math.cos(rad)
                  const y = 200 + 170 * Math.sin(rad)
                  return (
                    <text
                      key={sector}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.6)"
                      fontSize="12"
                      className="font-medium"
                    >
                      {sector}
                    </text>
                  )
                })}
                
              {/* Risk Dots */}
              {riskPositions.map((riskPos) => {
                  const angleRad = (riskPos.angle * Math.PI) / 180
                  const distance = 100 + (riskPos.severity === 'critical' ? 80 : riskPos.severity === 'high' ? 60 : riskPos.severity === 'medium' ? 40 : 20)
                  const x = 200 + distance * Math.cos(angleRad)
                  const y = 200 + distance * Math.sin(angleRad)
                  return (
                    <g key={riskPos.risk.id}>
                      <circle
                        cx={x}
                        cy={y}
                        r="6"
                        className={severityColors[riskPos.severity as keyof typeof severityColors]}
                      />
                      <text
                        x={x}
                        y={y - 15}
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.8)"
                        fontSize="10"
                      >
                        {riskPos.label}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Right Panel - Risk Lists */}
      <div className="w-96 space-y-4">
        {criticalRisks.length > 0 && (
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Critical Risks</h2>
            <div className="space-y-3">
              {criticalRisks.map((risk) => (
                <div key={risk.id} className="p-3 glass-card rounded-lg border-l-2 border-red-500">
                  <div className="text-sm font-medium text-white">{risk.title}</div>
                  <div className="text-xs text-gray-400 mt-1">{risk.sector} • Critical</div>
                  {risk.description && (
                    <div className="text-xs text-gray-500 mt-2 line-clamp-2">{risk.description}</div>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {highRisks.length > 0 && (
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">High Priority Risks</h2>
            <div className="space-y-3">
              {highRisks.map((risk) => (
                <div key={risk.id} className="p-3 glass-card rounded-lg border-l-2 border-yellow-500">
                  <div className="text-sm font-medium text-white">{risk.title}</div>
                  <div className="text-xs text-gray-400 mt-1">{risk.sector} • High</div>
                  {risk.description && (
                    <div className="text-xs text-gray-500 mt-2 line-clamp-2">{risk.description}</div>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {mediumRisks.length > 0 && (
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Medium Risks</h2>
            <div className="space-y-3">
              {mediumRisks.slice(0, 3).map((risk) => (
                <div key={risk.id} className="p-3 glass-card rounded-lg border-l-2 border-neon-blue">
                  <div className="text-sm font-medium text-white">{risk.title}</div>
                  <div className="text-xs text-gray-400 mt-1">{risk.sector} • Medium</div>
                </div>
              ))}
              {mediumRisks.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  +{mediumRisks.length - 3} más...
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {resolvedRisks.length > 0 && (
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Resolved Items</h2>
            <div className="space-y-3">
              {resolvedRisks.slice(0, 5).map((risk) => (
                <div key={risk.id} className="p-3 glass-card rounded-lg border-l-2 border-green-500 opacity-60">
                  <div className="text-sm font-medium text-white line-through">{risk.title}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {risk.sector} • Resolved {risk.updated_at ? new Date(risk.updated_at).toLocaleDateString() : ''}
                  </div>
                </div>
              ))}
              {resolvedRisks.length > 5 && (
                <div className="text-xs text-gray-500 text-center">
                  +{resolvedRisks.length - 5} más...
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {risks.length === 0 && (
          <GlassCard className="p-6">
            <div className="text-center text-gray-500">
              <div className="text-sm">No hay riesgos para mostrar</div>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  )
}


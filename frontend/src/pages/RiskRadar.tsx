import { useParams } from 'react-router-dom'
import GlassCard from '../components/ui/GlassCard'
import { ToggleLeft, ToggleRight } from 'lucide-react'
import { useState } from 'react'

export default function RiskRadar() {
  const { id } = useParams()
  const [viewMode, setViewMode] = useState<'team' | 'dependency' | 'decision'>('team')

  const sectors = ['Engineering', 'Product', 'Compliance', 'Data', 'Integrations']
  const risks = [
    { sector: 0, angle: 45, severity: 'critical', label: 'API Security' },
    { sector: 1, angle: 90, severity: 'high', label: 'Scope Creep' },
    { sector: 2, angle: 135, severity: 'medium', label: 'GDPR Compliance' },
    { sector: 3, angle: 180, severity: 'low', label: 'Data Migration' },
    { sector: 4, angle: 225, severity: 'high', label: 'Third-party API' },
  ]

  const severityColors = {
    critical: 'bg-red-500 shadow-neon-blue',
    high: 'bg-yellow-500 shadow-neon-cyan',
    medium: 'bg-neon-blue shadow-neon-blue',
    low: 'bg-neon-cyan shadow-neon-cyan',
  }

  return (
    <div className="p-6 h-full flex gap-6">
      {/* Left Panel - View Toggles */}
      <div className="w-64 space-y-4">
        <GlassCard className="p-6">
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
      </div>

      {/* Center - Radar Grid */}
      <div className="flex-1 flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white">AI Risk Radar – Real-time Analysis</h1>
        </div>
        
        <GlassCard className="flex-1 p-8 flex items-center justify-center">
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
              {risks.map((risk, i) => {
                const angleRad = (risk.angle * Math.PI) / 180
                const distance = 100 + (risk.severity === 'critical' ? 80 : risk.severity === 'high' ? 60 : risk.severity === 'medium' ? 40 : 20)
                const x = 200 + distance * Math.cos(angleRad)
                const y = 200 + distance * Math.sin(angleRad)
                return (
                  <g key={i}>
                    <circle
                      cx={x}
                      cy={y}
                      r="6"
                      className={severityColors[risk.severity as keyof typeof severityColors]}
                    />
                    <text
                      x={x}
                      y={y - 15}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.8)"
                      fontSize="10"
                    >
                      {risk.label}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </GlassCard>
      </div>

      {/* Right Panel - Risk Lists */}
      <div className="w-96 space-y-4">
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Critical Risks</h2>
          <div className="space-y-3">
            <div className="p-3 glass-card rounded-lg border-l-2 border-red-500">
              <div className="text-sm font-medium text-white">API Security Vulnerability</div>
              <div className="text-xs text-gray-400 mt-1">Engineering • High Priority</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Emerging Risks</h2>
          <div className="space-y-3">
            <div className="p-3 glass-card rounded-lg border-l-2 border-yellow-500">
              <div className="text-sm font-medium text-white">Scope Creep Detected</div>
              <div className="text-xs text-gray-400 mt-1">Product • Monitor</div>
            </div>
            <div className="p-3 glass-card rounded-lg border-l-2 border-yellow-500">
              <div className="text-sm font-medium text-white">Third-party API Dependency</div>
              <div className="text-xs text-gray-400 mt-1">Integrations • Watch</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Resolved Items</h2>
          <div className="space-y-3">
            <div className="p-3 glass-card rounded-lg border-l-2 border-green-500 opacity-60">
              <div className="text-sm font-medium text-white line-through">Data Migration Risk</div>
              <div className="text-xs text-gray-400 mt-1">Resolved Dec 8</div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}


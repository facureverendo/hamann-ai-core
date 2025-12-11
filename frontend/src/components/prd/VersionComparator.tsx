import { useState, useEffect } from 'react'
import { X, Loader2, ChevronDown, ArrowRight } from 'lucide-react'
import GlassCard from '../ui/GlassCard'
import NeonButton from '../ui/NeonButton'
import { projectService } from '../../services/projectService'

interface VersionComparatorProps {
  projectId: string
  versions: Array<{ version: number; created_at: string }>
  currentVersion: number
  onClose: () => void
}

export default function VersionComparator({ 
  projectId, 
  versions, 
  currentVersion,
  onClose 
}: VersionComparatorProps) {
  const [version1, setVersion1] = useState<number>(currentVersion > 1 ? currentVersion - 1 : 1)
  const [version2, setVersion2] = useState<number>(currentVersion)
  const [comparison, setComparison] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (version1 !== version2) {
      loadComparison()
    }
  }, [version1, version2])

  const loadComparison = async () => {
    if (version1 === version2) {
      setError('Selecciona dos versiones diferentes para comparar')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await projectService.compareVersions(projectId, version1, version2)
      setComparison(result)
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Error al comparar versiones')
    } finally {
      setLoading(false)
    }
  }

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'added':
        return 'bg-green-500/20 border-green-500/50 text-green-400'
      case 'removed':
        return 'bg-red-500/20 border-red-500/50 text-red-400'
      case 'context':
        return 'bg-gray-500/20 border-gray-500/50 text-gray-400'
      default:
        return 'bg-white/5 border-white/10 text-white'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <GlassCard className="max-w-7xl w-full max-h-[90vh] overflow-y-auto p-6 bg-dark-primary/95 border-2 border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Comparar Versiones del PRD</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-1 hover:bg-white/10 rounded"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Version Selectors */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-2">Versión Base</label>
            <div className="relative">
              <select
                value={version1}
                onChange={(e) => setVersion1(Number(e.target.value))}
                className="w-full pl-4 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-blue appearance-none cursor-pointer"
              >
                {versions.map((v) => (
                  <option key={v.version} value={v.version} className="bg-dark-primary">
                    Versión {v.version} {v.version === currentVersion ? '(actual)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <ArrowRight className="w-6 h-6 text-neon-blue mt-6" />

          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-2">Versión Nueva</label>
            <div className="relative">
              <select
                value={version2}
                onChange={(e) => setVersion2(Number(e.target.value))}
                className="w-full pl-4 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-blue appearance-none cursor-pointer"
              >
                {versions.map((v) => (
                  <option key={v.version} value={v.version} className="bg-dark-primary">
                    Versión {v.version} {v.version === currentVersion ? '(actual)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <NeonButton
            variant="blue"
            onClick={loadComparison}
            disabled={loading || version1 === version2}
            className="mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Comparando...
              </>
            ) : (
              'Comparar'
            )}
          </NeonButton>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-neon-blue" />
          </div>
        )}

        {/* Comparison Results */}
        {!loading && comparison && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="p-4 glass-card rounded-lg border border-neon-blue/30">
              <h4 className="text-lg font-semibold text-white mb-3">Resumen de Cambios</h4>
              <p className="text-sm text-gray-300 mb-4">{comparison.summary}</p>
              
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 glass-card rounded">
                  <div className="text-2xl font-bold text-green-400">{comparison.sections_added}</div>
                  <div className="text-xs text-gray-400">Agregadas</div>
                </div>
                <div className="text-center p-3 glass-card rounded">
                  <div className="text-2xl font-bold text-red-400">{comparison.sections_removed}</div>
                  <div className="text-xs text-gray-400">Eliminadas</div>
                </div>
                <div className="text-center p-3 glass-card rounded">
                  <div className="text-2xl font-bold text-yellow-400">{comparison.sections_modified}</div>
                  <div className="text-xs text-gray-400">Modificadas</div>
                </div>
                <div className="text-center p-3 glass-card rounded">
                  <div className="text-2xl font-bold text-gray-400">{comparison.sections_unchanged}</div>
                  <div className="text-xs text-gray-400">Sin cambios</div>
                </div>
              </div>
            </div>

            {/* Gaps Comparison */}
            {comparison.gaps_comparison && (
              <div className="p-4 glass-card rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-3">Cambios en Gaps</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-green-500/10 border border-green-500/30 rounded">
                    <div className="text-xl font-bold text-green-400">
                      {comparison.gaps_comparison.new_gaps.length}
                    </div>
                    <div className="text-xs text-gray-400">Nuevos Gaps</div>
                  </div>
                  <div className="text-center p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                    <div className="text-xl font-bold text-blue-400">
                      {comparison.gaps_comparison.resolved_gaps.length}
                    </div>
                    <div className="text-xs text-gray-400">Gaps Resueltos</div>
                  </div>
                  <div className="text-center p-3 bg-gray-500/10 border border-gray-500/30 rounded">
                    <div className="text-xl font-bold text-gray-400">
                      {comparison.gaps_comparison.common_gaps.length}
                    </div>
                    <div className="text-xs text-gray-400">Gaps Comunes</div>
                  </div>
                </div>
              </div>
            )}

            {/* Added Sections */}
            {comparison.added && comparison.added.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-green-400 mb-3">
                  Secciones Agregadas ({comparison.added.length})
                </h4>
                <div className="space-y-3">
                  {comparison.added.map((section: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 glass-card rounded-lg border-l-4 border-green-500"
                    >
                      <h5 className="text-white font-medium mb-2">{section.title}</h5>
                      <p className="text-sm text-gray-400">{section.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Removed Sections */}
            {comparison.removed && comparison.removed.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-red-400 mb-3">
                  Secciones Eliminadas ({comparison.removed.length})
                </h4>
                <div className="space-y-3">
                  {comparison.removed.map((section: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 glass-card rounded-lg border-l-4 border-red-500"
                    >
                      <h5 className="text-white font-medium">{section.title}</h5>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modified Sections */}
            {comparison.modified && comparison.modified.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-yellow-400 mb-3">
                  Secciones Modificadas ({comparison.modified.length})
                </h4>
                <div className="space-y-3">
                  {comparison.modified.map((section: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 glass-card rounded-lg border-l-4 border-yellow-500"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-white font-medium">{section.title}</h5>
                        <span className="text-xs text-gray-400">
                          {(section.similarity * 100).toFixed(0)}% similar
                        </span>
                      </div>
                      
                      {/* Changes */}
                      {section.changes && section.changes.length > 0 && (
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {section.changes.slice(0, 20).map((change: any, cidx: number) => (
                            <div
                              key={cidx}
                              className={`px-3 py-1 rounded text-xs font-mono ${getChangeTypeColor(change.type)}`}
                            >
                              <span className="mr-2">
                                {change.type === 'added' ? '+' : change.type === 'removed' ? '-' : ' '}
                              </span>
                              {change.content}
                            </div>
                          ))}
                          {section.changes.length > 20 && (
                            <p className="text-xs text-gray-500 text-center py-2">
                              ... y {section.changes.length - 20} cambios más
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  )
}

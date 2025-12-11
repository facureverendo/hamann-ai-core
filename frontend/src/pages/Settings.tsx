import { useState, useEffect } from 'react'
import GlassCard from '../components/ui/GlassCard'
import NeonButton from '../components/ui/NeonButton'
import { Github, Slack, GitBranch, CheckCircle2, Save, Loader2 } from 'lucide-react'
import { settingsService, type AppSettings } from '../services/settingsService'

export default function Settings() {
  const [autoSummarization, setAutoSummarization] = useState(true)
  const [memoryDepth, setMemoryDepth] = useState(7)
  const [riskSensitivity, setRiskSensitivity] = useState(75)
  
  // App Settings
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    loadAppSettings()
  }, [])

  const loadAppSettings = async () => {
    try {
      const data = await settingsService.getSettings()
      setAppSettings(data)
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoadingSettings(false)
    }
  }

  const handleSaveAppSettings = async () => {
    if (!appSettings) return
    
    setSavingSettings(true)
    try {
      await settingsService.updateSettings(appSettings)
      alert('Configuración guardada exitosamente')
    } catch (error: any) {
      console.error('Error saving settings:', error)
      alert(error.response?.data?.detail || 'Error guardando configuración')
    } finally {
      setSavingSettings(false)
    }
  }

  const integrations = [
    { id: 'github', name: 'GitHub', icon: Github, enabled: true },
    { id: 'slack', name: 'Slack', icon: Slack, enabled: false },
    { id: 'linear', name: 'Linear', icon: GitBranch, enabled: true },
    { id: 'jira', name: 'Jira', icon: CheckCircle2, enabled: false },
  ]

  return (
    <div className="p-6 h-full flex gap-6">
      {/* Main Settings */}
      <div className="flex-1 space-y-6">
        <h1 className="text-2xl font-bold text-white">Project Intelligence Settings</h1>

        {/* App Modes Configuration */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Configuración de Modos</h3>
          <p className="text-sm text-gray-400 mb-6">
            Configura qué modos de trabajo están disponibles en la aplicación
          </p>
          
          {loadingSettings ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-neon-blue animate-spin" />
            </div>
          ) : appSettings && (
            <div className="space-y-6">
              {/* Software Factory Mode */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-md font-medium text-white mb-1">Modo Software Factory</h4>
                  <p className="text-sm text-gray-400">
                    Permite crear proyectos completos desde cero con análisis comprehensivo
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={appSettings.show_software_factory_mode}
                    onChange={(e) => setAppSettings({
                      ...appSettings,
                      show_software_factory_mode: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-purple"></div>
                </label>
              </div>

              {/* Product Mode */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-md font-medium text-white mb-1">Modo Producto</h4>
                  <p className="text-sm text-gray-400">
                    Permite añadir features/PRDs a proyectos existentes
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={appSettings.show_product_mode}
                    onChange={(e) => setAppSettings({
                      ...appSettings,
                      show_product_mode: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-cyan"></div>
                </label>
              </div>

              {/* Default Mode */}
              <div>
                <h4 className="text-md font-medium text-white mb-2">Modo por Defecto</h4>
                <select
                  value={appSettings.default_mode}
                  onChange={(e) => setAppSettings({
                    ...appSettings,
                    default_mode: e.target.value
                  })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-blue"
                >
                  <option value="product">Modo Producto</option>
                  <option value="software_factory">Modo Software Factory</option>
                </select>
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <NeonButton
                  onClick={handleSaveAppSettings}
                  disabled={savingSettings}
                  className="w-full"
                >
                  {savingSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Configuración
                    </>
                  )}
                </NeonButton>
              </div>
            </div>
          )}
        </GlassCard>

        {/* AI Auto-summarization */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">AI Auto-summarization</h3>
              <p className="text-sm text-gray-400">Automatically generate summaries for meetings and documents</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSummarization}
                onChange={(e) => setAutoSummarization(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue"></div>
            </label>
          </div>
        </GlassCard>

        {/* Memory Depth */}
        <GlassCard className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Memory Depth</h3>
              <span className="text-sm text-neon-blue">{memoryDepth} days</span>
            </div>
            <p className="text-sm text-gray-400">How far back should AI consider context</p>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            value={memoryDepth}
            onChange={(e) => setMemoryDepth(Number(e.target.value))}
            className="w-full h-2 bg-dark-secondary rounded-lg appearance-none cursor-pointer accent-neon-blue"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 day</span>
            <span>30 days</span>
          </div>
        </GlassCard>

        {/* Risk Sensitivity */}
        <GlassCard className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Risk Sensitivity</h3>
              <span className="text-sm text-neon-cyan">{riskSensitivity}%</span>
            </div>
            <p className="text-sm text-gray-400">Threshold for flagging potential risks</p>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={riskSensitivity}
            onChange={(e) => setRiskSensitivity(Number(e.target.value))}
            className="w-full h-2 bg-dark-secondary rounded-lg appearance-none cursor-pointer accent-neon-cyan"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Low</span>
            <span>High</span>
          </div>
        </GlassCard>

        {/* Integrations */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Integrations</h3>
          <div className="grid grid-cols-2 gap-4">
            {integrations.map((integration) => {
              const Icon = integration.icon
              return (
                <div
                  key={integration.id}
                  className={`p-4 glass-card rounded-lg border-2 transition ${
                    integration.enabled
                      ? 'border-neon-blue bg-neon-blue/10'
                      : 'border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        integration.enabled ? 'bg-neon-blue/20' : 'bg-white/5'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          integration.enabled ? 'text-neon-blue' : 'text-gray-500'
                        }`} />
                      </div>
                      <span className="text-sm font-medium text-white">{integration.name}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={integration.enabled}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neon-blue"></div>
                    </label>
                  </div>
                </div>
              )
            })}
          </div>
        </GlassCard>

        {/* Team Permissions */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Team Permissions</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Member</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Access</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Alice', role: 'Admin', access: 'Full' },
                  { name: 'Bob', role: 'Developer', access: 'Read/Write' },
                  { name: 'Charlie', role: 'Viewer', access: 'Read Only' },
                ].map((member, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-3 px-4 text-sm text-white">{member.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-400">{member.role}</td>
                    <td className="py-3 px-4 text-sm text-neon-cyan">{member.access}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      {/* Right Preview Box */}
      <div className="w-96">
        <GlassCard className="p-6 h-full">
          <h2 className="text-lg font-semibold text-white mb-4">AI Behavior Preview</h2>
          <div className="space-y-4">
            <div className="p-4 glass-card rounded-lg">
              <div className="text-sm font-medium text-white mb-2">Current Settings Impact:</div>
              <ul className="text-xs text-gray-300 space-y-2">
                <li>• Auto-summarization: {autoSummarization ? 'Enabled' : 'Disabled'}</li>
                <li>• Memory: {memoryDepth} days of context</li>
                <li>• Risk threshold: {riskSensitivity}%</li>
              </ul>
            </div>
            <div className="p-4 glass-card rounded-lg border-l-2 border-neon-blue">
              <div className="text-sm font-medium text-white mb-2">Expected Behavior:</div>
              <p className="text-xs text-gray-300">
                AI will automatically summarize meetings, consider {memoryDepth} days of project history,
                and flag risks above {riskSensitivity}% probability.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}


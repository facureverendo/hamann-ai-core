import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, FolderPlus, FilePlus, Sparkles } from 'lucide-react'
import GlassCard from './ui/GlassCard'
import NeonButton from './ui/NeonButton'
import { settingsService, type AppSettings } from '../services/settingsService'

interface CreateItemSelectorProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateItemSelector({ isOpen, onClose }: CreateItemSelectorProps) {
  const navigate = useNavigate()
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await settingsService.getSettings()
      setSettings(data)
      
      // Si solo hay un modo habilitado, redirigir directamente
      if (data.show_software_factory_mode && !data.show_product_mode) {
        navigate('/workspaces/new')
        onClose()
      } else if (!data.show_software_factory_mode && data.show_product_mode) {
        navigate('/projects/new')
        onClose()
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectWorkspace = () => {
    navigate('/workspaces/new')
    onClose()
  }

  const handleSelectProject = () => {
    navigate('/projects/new')
    onClose()
  }

  if (!isOpen || loading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <GlassCard className="max-w-2xl w-full p-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-lg transition"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neon-blue/20 mb-4">
            <Sparkles className="w-8 h-8 text-neon-blue" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">¿Qué deseas crear?</h2>
          <p className="text-gray-400">
            Selecciona el tipo de elemento que quieres crear
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Software Factory Option */}
          {settings?.show_software_factory_mode && (
            <button
              onClick={handleSelectWorkspace}
              className="p-6 glass-card rounded-lg hover:bg-white/10 transition text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-neon-purple/20 rounded-lg group-hover:bg-neon-purple/30 transition">
                  <FolderPlus className="w-6 h-6 text-neon-purple" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-neon-purple transition">
                    Proyecto desde 0
                  </h3>
                  <p className="text-sm text-gray-400">
                    Crea un proyecto completo con toda su documentación. Ideal para Software Factory.
                  </p>
                  <div className="mt-3 text-xs text-gray-500">
                    • Múltiples documentos iniciales<br />
                    • Análisis completo con AI<br />
                    • Múltiples features/PRDs dentro
                  </div>
                </div>
              </div>
            </button>
          )}

          {/* Product Mode Option */}
          {settings?.show_product_mode && (
            <button
              onClick={handleSelectProject}
              className="p-6 glass-card rounded-lg hover:bg-white/10 transition text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-neon-cyan/20 rounded-lg group-hover:bg-neon-cyan/30 transition">
                  <FilePlus className="w-6 h-6 text-neon-cyan" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-neon-cyan transition">
                    Feature / PRD
                  </h3>
                  <p className="text-sm text-gray-400">
                    Añade una nueva funcionalidad o mejora a un proyecto existente.
                  </p>
                  <div className="mt-3 text-xs text-gray-500">
                    • Feature específica<br />
                    • PRD detallado<br />
                    • Backlog y plan de trabajo
                  </div>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Cancelar
          </button>
        </div>
      </GlassCard>
    </div>
  )
}

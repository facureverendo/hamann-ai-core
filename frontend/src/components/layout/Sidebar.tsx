import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  FolderKanban,
  FolderOpen,
  Video, 
  FileText, 
  Brain, 
  AlertTriangle, 
  Settings 
} from 'lucide-react'
import { settingsService, type AppSettings } from '../../services/settingsService'

const allMenuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/workspaces', icon: FolderOpen, label: 'Workspaces', requiresSoftwareFactory: true },
  { path: '/projects', icon: FolderKanban, label: 'Features' },
  { path: '/meetings', icon: Video, label: 'Meetings' },
  { path: '/prd', icon: FileText, label: 'PRDs' },
  { path: '/assistant', icon: Brain, label: 'AI Insights' },
  { path: '/risks', icon: AlertTriangle, label: 'Risks' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    loadSettings()
    
    // Escuchar eventos de actualización de configuración
    const handleSettingsUpdate = () => {
      loadSettings()
    }
    
    window.addEventListener('settingsUpdated', handleSettingsUpdate)
    
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate)
    }
  }, [])

  const loadSettings = async () => {
    try {
      const settings = await settingsService.getSettings()
      setAppSettings(settings)
    } catch (err) {
      console.error('Error loading settings:', err)
      // Usar valores por defecto si falla
      setAppSettings({
        show_software_factory_mode: true,
        show_product_mode: true,
        default_mode: 'product'
      })
    }
  }

  // Filtrar items del menú según la configuración
  const menuItems = allMenuItems.filter((item) => {
    // Si el item requiere software factory mode, verificar que esté activo
    if (item.requiresSoftwareFactory) {
      return appSettings?.show_software_factory_mode ?? true
    }
    return true
  })

  return (
    <aside className="w-20 bg-dark-secondary border-r border-white/10 flex flex-col items-center py-6 relative z-50">
      <div className="mb-8">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-blue to-neon-cyan flex items-center justify-center">
          <span className="text-white font-bold text-lg">H</span>
        </div>
      </div>
      
      <nav className="flex-1 flex flex-col gap-4 w-full">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-3 transition-all duration-300 relative group transform hover:scale-110 ${
                  isActive
                    ? 'text-neon-blue'
                    : 'text-gray-400 hover:text-neon-cyan'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-6 h-6" />
                  <span className="text-xs mt-1 hidden group-hover:block absolute left-full ml-4 bg-dark-secondary px-2 py-1 rounded glass-card whitespace-nowrap z-[100] shadow-lg">
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-neon-blue rounded-r" />
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}


import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  FolderKanban, 
  Video, 
  FileText, 
  Brain, 
  AlertTriangle, 
  Settings 
} from 'lucide-react'

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/projects', icon: FolderKanban, label: 'Projects' },
  { path: '/meetings', icon: Video, label: 'Meetings' },
  { path: '/prd', icon: FileText, label: 'PRDs' },
  { path: '/assistant', icon: Brain, label: 'AI Insights' },
  { path: '/risks', icon: AlertTriangle, label: 'Risks' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  return (
    <aside className="w-20 bg-dark-secondary border-r border-white/10 flex flex-col items-center py-6">
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
                  <span className="text-xs mt-1 hidden group-hover:block absolute left-full ml-4 bg-dark-secondary px-2 py-1 rounded glass-card whitespace-nowrap z-50">
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


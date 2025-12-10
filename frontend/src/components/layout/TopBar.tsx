import StatusOrb from '../ui/StatusOrb'
import { User } from 'lucide-react'

export default function TopBar() {
  return (
    <header className="h-16 bg-dark-secondary border-b border-white/10 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-white">Hamann Projects AI</h1>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <StatusOrb status="active" size="sm" />
          <span>AI Active</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 glass-card rounded-lg">
          <StatusOrb status="active" size="sm" />
          <span className="text-sm text-gray-300">System Ready</span>
        </div>
        
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-blue to-neon-cyan flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
          <User className="w-5 h-5 text-white" />
        </div>
      </div>
    </header>
  )
}


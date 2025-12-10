import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GlassCard from '../components/ui/GlassCard'
import NeonButton from '../components/ui/NeonButton'
import FileUpload from '../components/project/FileUpload'
import { projectService } from '../services/projectService'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function CreateProject() {
  const navigate = useNavigate()
  const [projectName, setProjectName] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!projectName.trim()) {
      setError('El nombre del proyecto es requerido')
      return
    }

    if (files.length === 0) {
      setError('Debes cargar al menos un archivo')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await projectService.createProject(projectName, files)
      navigate(`/projects/${result.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el proyecto')
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </button>
        <h1 className="text-3xl font-bold text-white">Crear Nuevo Proyecto</h1>
        <p className="text-gray-400 mt-2">
          Crea un nuevo proyecto y carga los archivos necesarios para comenzar
        </p>
      </div>

      <GlassCard className="p-6 space-y-6">
        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nombre del Proyecto *
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Ej: Knowledge Discovery Feature"
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
            disabled={loading}
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Archivos del Proyecto *
          </label>
          <FileUpload
            onFilesChange={setFiles}
            acceptedTypes={['.pdf', '.txt', '.md', '.mp3', '.mp4', '.wav', '.m4a', '.ogg', '.flac']}
            maxFiles={20}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/10">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-gray-400 hover:text-white transition"
            disabled={loading}
          >
            Cancelar
          </button>
          <NeonButton
            onClick={handleCreate}
            disabled={loading || !projectName.trim() || files.length === 0}
            className="min-w-[120px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              'Crear Proyecto'
            )}
          </NeonButton>
        </div>
      </GlassCard>
    </div>
  )
}


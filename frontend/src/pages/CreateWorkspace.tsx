import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GlassCard from '../components/ui/GlassCard'
import NeonButton from '../components/ui/NeonButton'
import { workspaceService } from '../services/workspaceService'
import { ArrowLeft, Upload, X, FileText, Loader2, CheckCircle } from 'lucide-react'

export default function CreateWorkspace() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('software_factory')
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      alert('Por favor ingresa un nombre para el proyecto')
      return
    }

    if (!description.trim()) {
      alert('Por favor ingresa una descripción')
      return
    }

    if (files.length === 0) {
      alert('Por favor carga al menos un documento')
      return
    }

    setUploading(true)
    try {
      const result = await workspaceService.createWorkspace(name, description, type, files)
      // Navegar al workspace recién creado
      navigate(`/workspaces/${result.id}`)
    } catch (error: any) {
      console.error('Error creating workspace:', error)
      alert(error.response?.data?.detail || 'Error creando el proyecto')
    } finally {
      setUploading(false)
    }
  }

  const allowedExtensions = ['.pdf', '.txt', '.md', '.docx']
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2)

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/workspaces')}
          className="p-2 hover:bg-white/5 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Nuevo Proyecto</h1>
          <p className="text-gray-400">
            Crea un proyecto completo desde cero con toda su documentación
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Información Básica</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Nombre del Proyecto *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Sistema de Gestión de Inventario"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-blue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Descripción *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe brevemente el proyecto, sus objetivos y alcance..."
                rows={4}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-blue resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Tipo de Proyecto
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-blue"
              >
                <option value="software_factory">Software Factory (Proyecto desde 0)</option>
                <option value="product">Producto Existente</option>
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Documents Upload */}
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Documentación Inicial</h2>
          <p className="text-sm text-gray-400 mb-4">
            Carga documentos como brief del proyecto, especificaciones, referencias, etc.
            Formatos soportados: {allowedExtensions.join(', ')}
          </p>

          <div className="space-y-4">
            {/* File Input */}
            <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:border-neon-blue/50 transition">
              <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <label className="cursor-pointer">
                <span className="text-neon-blue hover:text-neon-cyan transition">
                  Click para seleccionar archivos
                </span>
                <input
                  type="file"
                  multiple
                  accept={allowedExtensions.join(',')}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">
                o arrastra y suelta aquí
              </p>
            </div>

            {/* Files List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-400">
                    Archivos seleccionados ({files.length})
                  </h3>
                  <span className="text-xs text-gray-500">{totalSizeMB} MB total</span>
                </div>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-neon-cyan" />
                      <div>
                        <div className="text-sm text-white">{file.name}</div>
                        <div className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(2)} KB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-red-500/20 rounded transition"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/workspaces')}
            className="px-4 py-2 text-gray-400 hover:text-white transition"
          >
            Cancelar
          </button>
          <NeonButton type="submit" disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Crear Proyecto
              </>
            )}
          </NeonButton>
        </div>
      </form>
    </div>
  )
}

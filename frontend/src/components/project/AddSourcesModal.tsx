import { useState, useCallback } from 'react'
import { X, Upload, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import GlassCard from '../ui/GlassCard'
import NeonButton from '../ui/NeonButton'

interface AddSourcesModalProps {
  projectId: string
  onClose: () => void
  onSuccess: (result: any) => void
}

export default function AddSourcesModal({ projectId, onClose, onSuccess }: AddSourcesModalProps) {
  const [files, setFiles] = useState<File[]>([])
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const allowedExtensions = ['.pdf', '.txt', '.md', '.mp3', '.mp4', '.wav', '.m4a', '.ogg', '.flac']

  const validateFile = (file: File): boolean => {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    return allowedExtensions.includes(ext)
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    setError(null)

    const droppedFiles = Array.from(e.dataTransfer.files)
    const validFiles = droppedFiles.filter(validateFile)
    
    if (validFiles.length !== droppedFiles.length) {
      setError(`Algunos archivos fueron rechazados. Solo se permiten: ${allowedExtensions.join(', ')}`)
    }
    
    setFiles(prev => [...prev, ...validFiles])
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      const validFiles = selectedFiles.filter(validateFile)
      
      if (validFiles.length !== selectedFiles.length) {
        setError(`Algunos archivos fueron rechazados. Solo se permiten: ${allowedExtensions.join(', ')}`)
      }
      
      setFiles(prev => [...prev, ...validFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Selecciona al menos un archivo')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const { projectService } = await import('../../services/projectService')
      const result = await projectService.addSources(projectId, files, notes)
      onSuccess(result)
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Error al agregar archivos')
    } finally {
      setUploading(false)
    }
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <GlassCard className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 bg-dark-primary/95 border-2 border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Agregar Nuevos Documentos</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-1 hover:bg-white/10 rounded"
            disabled={uploading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-400 mb-6">
          Agrega documentos complementarios al proyecto. Después de subirlos, deberás reprocesar el proyecto para generar una nueva versión del PRD.
        </p>

        {/* Drag & Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center transition ${
            dragActive
              ? 'border-neon-blue bg-neon-blue/10'
              : 'border-white/20 hover:border-white/40 hover:bg-white/5'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-neon-blue' : 'text-gray-400'}`} />
          <p className="text-white mb-2">Arrastra archivos aquí o</p>
          <label className="cursor-pointer">
            <span className="text-neon-blue hover:text-neon-cyan transition">selecciona archivos</span>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInput}
              accept={allowedExtensions.join(',')}
              disabled={uploading}
            />
          </label>
          <p className="text-xs text-gray-500 mt-3">
            Formatos permitidos: PDF, TXT, MD, MP3, MP4, WAV, M4A, OGG, FLAC
          </p>
        </div>

        {/* Files List */}
        {files.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-white mb-3">
              Archivos seleccionados ({files.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 glass-card rounded-lg border border-white/10"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-neon-blue flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-red-400 transition p-1 hover:bg-red-500/10 rounded"
                    disabled={uploading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Tamaño total: {formatFileSize(totalSize)}
            </p>
          </div>
        )}

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">
            Notas sobre estos documentos (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Documentación técnica del API, Especificaciones adicionales..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue resize-none"
            rows={3}
            disabled={uploading}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <NeonButton
            variant="gray"
            onClick={onClose}
            disabled={uploading}
          >
            Cancelar
          </NeonButton>
          <NeonButton
            variant="blue"
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Agregar Documentos
              </>
            )}
          </NeonButton>
        </div>
      </GlassCard>
    </div>
  )
}

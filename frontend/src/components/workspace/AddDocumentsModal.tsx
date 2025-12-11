import { useState } from 'react'
import { X, Upload, FileText, Loader2, CheckCircle } from 'lucide-react'
import GlassCard from '../ui/GlassCard'
import NeonButton from '../ui/NeonButton'
import { workspaceService } from '../../services/workspaceService'

interface AddDocumentsModalProps {
  workspaceId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddDocumentsModal({
  workspaceId,
  isOpen,
  onClose,
  onSuccess
}: AddDocumentsModalProps) {
  const [files, setFiles] = useState<File[]>([])
  const [notes, setNotes] = useState('')
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

    if (files.length === 0) {
      alert('Por favor selecciona al menos un archivo')
      return
    }

    setUploading(true)
    try {
      await workspaceService.addDocuments(workspaceId, files, notes)
      setFiles([])
      setNotes('')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error adding documents:', error)
      alert(error.response?.data?.detail || 'Error añadiendo documentos')
    } finally {
      setUploading(false)
    }
  }

  const allowedExtensions = ['.pdf', '.txt', '.md', '.docx']
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <GlassCard className="max-w-2xl w-full p-8 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-lg transition"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Añadir Documentos</h2>
          <p className="text-gray-400">
            Añade documentos adicionales al proyecto. Estos se incorporarán al análisis.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Documentos
            </label>
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
                Formatos: {allowedExtensions.join(', ')}
              </p>
            </div>

            {/* Files List */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
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

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe qué cambió o qué información nueva contienen estos documentos..."
              rows={3}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-blue resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition"
              disabled={uploading}
            >
              Cancelar
            </button>
            <NeonButton type="submit" disabled={uploading || files.length === 0}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Añadiendo...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Añadir Documentos
                </>
              )}
            </NeonButton>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}

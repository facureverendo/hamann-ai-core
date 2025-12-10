import { useCallback, useState } from 'react'
import { Upload, X, File as FileIcon } from 'lucide-react'
import GlassCard from '../ui/GlassCard'

interface UploadedFile {
  file: File
  id: string
}

interface FileUploadProps {
  onFilesChange: (files: File[]) => void
  acceptedTypes?: string[]
  maxFiles?: number
}

export default function FileUpload({ 
  onFilesChange, 
  acceptedTypes = ['.pdf', '.txt', '.md', '.mp3', '.mp4', '.wav', '.m4a', '.ogg', '.flac'],
  maxFiles = 20
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return

    const newFiles: UploadedFile[] = []
    const remainingSlots = maxFiles - uploadedFiles.length

    Array.from(files).slice(0, remainingSlots).forEach((file) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (acceptedTypes.includes(ext)) {
        newFiles.push({
          file,
          id: `${file.name}-${Date.now()}-${Math.random()}`
        })
      }
    })

    const updatedFiles = [...uploadedFiles, ...newFiles]
    setUploadedFiles(updatedFiles)
    onFilesChange(updatedFiles.map(f => f.file))
  }, [uploadedFiles, acceptedTypes, maxFiles, onFilesChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const removeFile = useCallback((id: string) => {
    const updated = uploadedFiles.filter(f => f.id !== id)
    setUploadedFiles(updated)
    onFilesChange(updated.map(f => f.file))
  }, [uploadedFiles, onFilesChange])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${isDragging 
            ? 'border-neon-blue bg-neon-blue/10' 
            : 'border-white/20 hover:border-neon-cyan/50'
          }
        `}
      >
        <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-neon-blue' : 'text-gray-400'}`} />
        <p className="text-gray-300 mb-2">
          Arrastra archivos aquí o{' '}
          <label className="text-neon-blue cursor-pointer hover:text-neon-cyan">
            haz clic para seleccionar
            <input
              type="file"
              multiple
              accept={acceptedTypes.join(',')}
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
          </label>
        </p>
        <p className="text-sm text-gray-500">
          Formatos permitidos: {acceptedTypes.join(', ')}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Máximo {maxFiles} archivos
        </p>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400">
            Archivos cargados ({uploadedFiles.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {uploadedFiles.map((uploadedFile) => (
              <GlassCard key={uploadedFile.id} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileIcon className="w-5 h-5 text-neon-cyan flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{uploadedFile.file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(uploadedFile.id)}
                  className="p-1 hover:bg-white/10 rounded transition text-gray-400 hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


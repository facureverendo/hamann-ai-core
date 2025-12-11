import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

interface DiagramModalProps {
  isOpen: boolean
  onClose: () => void
  svgContent: string
  title?: string
}

export default function DiagramModal({ isOpen, onClose, svgContent, title }: DiagramModalProps) {
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Reset zoom and position when modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1)
      setPosition({ x: 0, y: 0 })
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEsc)
      return () => window.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5))
  const handleResetZoom = () => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)))
  }

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div 
        className="relative w-[95vw] h-[95vh] bg-dark-primary border border-white/20 rounded-lg shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <h3 className="text-lg font-semibold text-white">
            {title || 'Diagrama'}
          </h3>
          
          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition"
              title="Alejar (Zoom Out)"
            >
              <ZoomOut className="w-5 h-5 text-gray-300" />
            </button>
            
            <span className="text-sm text-gray-400 min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            
            <button
              onClick={handleZoomIn}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition"
              title="Acercar (Zoom In)"
            >
              <ZoomIn className="w-5 h-5 text-gray-300" />
            </button>
            
            <button
              onClick={handleResetZoom}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition"
              title="Restablecer zoom"
            >
              <Maximize2 className="w-5 h-5 text-gray-300" />
            </button>

            <div className="w-px h-6 bg-white/10 mx-2" />
            
            <button
              onClick={onClose}
              className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition"
              title="Cerrar (ESC)"
            >
              <X className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>

        {/* Diagram Container */}
        <div 
          className="flex-1 overflow-hidden relative bg-white/5"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            <div 
              className="diagram-content p-8"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          </div>
        </div>

        {/* Instructions Footer */}
        <div className="px-6 py-3 border-t border-white/10 text-xs text-gray-400 flex-shrink-0 flex items-center justify-between">
          <span>💡 Arrastra para mover • Rueda del mouse para zoom • ESC para cerrar</span>
          <span>Zoom: {Math.round(zoom * 100)}%</span>
        </div>
      </div>
    </div>
  )

  // Render modal in a portal to document.body
  return createPortal(modalContent, document.body)
}

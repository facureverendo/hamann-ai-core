import { CheckCircle2 } from 'lucide-react'
import Modal from './Modal'

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
}

export default function SuccessModal({ isOpen, onClose, title = 'Éxito', message }: SuccessModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center py-4">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <p className="text-gray-300">{message}</p>
      </div>
    </Modal>
  )
}

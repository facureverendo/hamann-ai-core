import { useState } from 'react'
import Modal from '../ui/Modal'
import NeonButton from '../ui/NeonButton'
import { projectService, type Deliverable } from '../../services/projectService'

interface DeliverableEditorProps {
  projectId: string
  deliverable?: Deliverable
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export default function DeliverableEditor({ projectId, deliverable, isOpen, onClose, onSave }: DeliverableEditorProps) {
  const [name, setName] = useState(deliverable?.name || '')
  const [description, setDescription] = useState(deliverable?.description || '')
  const [dueDate, setDueDate] = useState(deliverable?.due_date || '')
  const [progress, setProgress] = useState((deliverable?.progress || 0) * 100)
  const [status, setStatus] = useState(deliverable?.status || 'planned')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        name,
        description,
        due_date: dueDate,
        progress: progress / 100,
        status
      }

      if (deliverable) {
        await projectService.updateDeliverable(projectId, deliverable.id, data)
      } else {
        await projectService.createDeliverable(projectId, data)
      }

      onSave()
      onClose()
    } catch (err) {
      console.error('Error saving deliverable:', err)
      alert('Error saving deliverable')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={deliverable ? 'Edit Deliverable' : 'New Deliverable'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-blue"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-blue"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-blue"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Progress: {progress}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-blue"
          >
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="at_risk">At Risk</option>
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <NeonButton type="submit" disabled={loading} className="flex-1">
            {loading ? 'Saving...' : 'Save'}
          </NeonButton>
          <NeonButton type="button" variant="purple" onClick={onClose}>
            Cancel
          </NeonButton>
        </div>
      </form>
    </Modal>
  )
}
